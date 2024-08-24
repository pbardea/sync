package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"

	_ "github.com/lib/pq"
)

var jwtKey = []byte("my_secret_key")

// Claims defines the structure for JWT claims
type Claims struct {
	Username string `json:"username"`
	Team     string `json:"team"`
	jwt.RegisteredClaims
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var connections = make(map[*websocket.Conn]bool)
var connLock = sync.Mutex{}

func getConn() *sql.DB {
	db, err := sql.Open("postgres", "postgres://postgres:postgres@localhost/sync?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	return db
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/login", handleLogin).Methods("POST")

	// Authenticated endpoints
	// r.Use(authMiddleware)
	r.HandleFunc("/bootstrap", handleBootstrap).Methods("GET")
	r.HandleFunc("/change", handleChange).Methods("POST")
	r.HandleFunc("/sync", handleSync)

	http.Handle("/", r)
	fmt.Println("Server started on :8080")

	// CORS middleware
	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
	originsOk := handlers.AllowedOrigins([]string{"http://localhost:5173"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})

	http.ListenAndServe(":8080", handlers.CORS(headersOk, originsOk, methodsOk)(r))
}

// Middleware to authenticate JWT tokens
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/login" {
			next.ServeHTTP(w, r)
			return
		}

		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		// Store claims in context if you need them later
		ctx := r.Context()
		ctx = context.WithValue(ctx, "username", claims.Username)
		ctx = context.WithValue(ctx, "team", claims.Team)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Handle the login and generate JWT
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var username, team string
	username = r.FormValue("username")
	team = r.FormValue("team")

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: username,
		Team:     team,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(fmt.Sprintf(`{"token": "%s"}`, tokenString)))
}

func writeObject(db *sql.DB, object string, cols []string) ([]map[string]interface{}, error) {
    escapedCols := make([]string, len(cols))
    for i, x := range cols {
        escapedCols[i] = "\"" + x + "\""
    }

    queryText := fmt.Sprintf(`SELECT %s FROM "%s"`, strings.Join(escapedCols, ", "), object)
    rows, err := db.Query(queryText)
    if err != nil {
        return nil, err
    }
    columns, err := rows.Columns()
    if err != nil {
        return nil, err
    }

    count := len(columns)
    values := make([]interface{}, count)
    scanArgs := make([]interface{}, count)
    for i := range values {
        scanArgs[i] = &values[i]
    }

    dataArr := make([]map[string]interface{}, 0)

    for rows.Next() {
        err := rows.Scan(scanArgs...)
        if err != nil {
            return nil, err
        }
        data := make(map[string]interface{})
        data["__class"] = strings.ToUpper(object[:1]) + object[1:]
        for i, v := range values {
            x := v.(string)

            if nx, ok := strconv.ParseFloat(string(x), 64); ok == nil {
                data[columns[i]] = nx
            } else if b, ok := strconv.ParseBool(string(x)); ok == nil {
                data[columns[i]] = b
            } else if "string" == fmt.Sprintf("%T", string(x)) {
                data[columns[i]] = string(x)
            } else {
                fmt.Printf("Failed on if for type %T of %v\n", x, x)
            }
        }
        // if err := json.NewEncoder(w).Encode(data); err != nil {
        //     return nil, err;
        // }
        dataArr = append(dataArr, data)
    }

    return dataArr, nil
}


// Sample handler for bootstrap
func handleBootstrap(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Handling bootstrap")
	// Example of accessing claims from context
	// username := r.Context().Value("username").(string)
	// team := r.Context().Value("team").(string)

	// fmt.Printf("User %s from team %s requested bootstrap\n", username, team)

	db := getConn()
	defer db.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	// TODO: Think about schema changes. Probably is worth an RFD.
	// TODO: Filter this down for permissions. Also worth an RFD.
    finalArr := make([]map[string]interface{}, 0)
    if dataArr, err := writeObject(db, "team", []string{"id", "name"}); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
    } else {
        finalArr = append(finalArr, dataArr...)
    }
    if dataArr, err := writeObject(db, "user", []string{"id", "name", "email", "teamId"}); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
    } else {
        finalArr = append(finalArr, dataArr...)
    }

    if err := json.NewEncoder(w).Encode(finalArr); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
    }
}

func updateEmail(db *sql.DB, newEmail string, id string) error {
    // currentTime := time.Now()
    queryText := `UPDATE "user" SET email = $1 WHERE id = $2`
    _, err := db.Exec(queryText, newEmail, id)
    return err;
}

func getUserAsJson(db *sql.DB, id string) (string, error) {
    queryText := `SELECT id, name, email, "teamId" FROM "user" WHERE id = $1`
    row := db.QueryRow(queryText, id)
    var idVal string
    var name string
    var email string
    var teamId string
    lastModifiedDate := time.Now().Format(time.RFC3339)
    err := row.Scan(&idVal, &name, &email, &teamId)
    if err != nil {
        return "", err
    }
    res := fmt.Sprintf(`{"id":"%s", "name": "%s","email":"%s","teamId": "%s", "__class": "User", "lastModifiedDate": "%s"}`, idVal, name, email, teamId, lastModifiedDate)
    return res, nil
}

// Sample handler for changes
func handleChange(w http.ResponseWriter, r *http.Request) {
	// Parse the JSON body from the request
	var requestBody map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Extract the new email address from the JSON body
    id := requestBody["modelId"].(string)
	changeSnapshot := requestBody["changeSnapshot"].(map[string]interface{})
	changes := changeSnapshot["changes"].(map[string]interface{})
	emailChanges := changes["email"].(map[string]interface{})
	newEmail := emailChanges["updated"].(string)
    changeType := requestBody["type"].(string)

	db := getConn()
	defer db.Close()

    // Update the value in the DB.
    if err := updateEmail(db, newEmail, id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
    }
    updatedUser, err := getUserAsJson(db, id)
    if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
    }

	// Implement logic to apply a change to the data model
    broadcastChange(fmt.Sprintf(`{"type": "%s", "jsonObject": %s}`, changeType, updatedUser))

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(updatedUser))
}

// Sample handler for syncing
func handleSync(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Could not open websocket connection because %v", err), http.StatusBadRequest)
		return
	}

	connLock.Lock()
	connections[conn] = true
	connLock.Unlock()

	defer func() {
		connLock.Lock()
		delete(connections, conn)
		connLock.Unlock()
		conn.Close()
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func broadcastChange(message string) {
	connLock.Lock()
	defer connLock.Unlock()

	for conn := range connections {
		err := conn.WriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			conn.Close()
			delete(connections, conn)
		}
	}
}
