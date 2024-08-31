package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
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
	originsOk := handlers.AllowedOrigins([]string{"http://localhost:5173", "http://localhost:5174"})
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

func writeObject(db *sql.DB, object string) ([]map[string]interface{}, error) {
    // TODO: This is a bad practice, but an effecitve hack.
    queryText := fmt.Sprintf(`SELECT * FROM "%s"`, strings.ToLower(object))
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
            fmt.Printf("%T\n", v)
            if (v == nil) {
                continue
            }
            // TODO: Clean up
            if "int64" == fmt.Sprintf("%T", v) {
                data[columns[i]] = v
            } else if "time.Time" == fmt.Sprintf("%T", v) {
                data[columns[i]] = v
            } else {
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
	// Example of accessing claims from context
	// username := r.Context().Value("username").(string)
	// team := r.Context().Value("team").(string)

	db := getConn()
	defer db.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	// TODO: Think about schema changes. Probably is worth an RFD.
	// TODO: Filter this down for permissions. Also worth an RFD.
    finalArr := make([]map[string]interface{}, 0)

    objectsToBootstrap := []string{"Team", "User"}
    for _, object := range objectsToBootstrap {
        if dataArr, err := writeObject(db, object); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
        } else {
            finalArr = append(finalArr, dataArr...)
        }
    }

    if err := json.NewEncoder(w).Encode(finalArr); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
    }
}

func deleteObject(db *sql.DB, object string, id string) error {
    queryText := fmt.Sprintf(`DELETE FROM "%s" WHERE id = $1`, strings.ToLower(object))

    _, err := db.Exec(queryText, id)
    return err
}

func getVersion(db *sql.DB, object string, id string) (int, error) {
    queryText := fmt.Sprintf(`SELECT version FROM "%s" WHERE id = $1`, strings.ToLower(object))
    row := db.QueryRow(queryText, id)
    var version int
    err := row.Scan(&version)
    return version, err
}

func insertObject(db *sql.DB, object string, model map[string]interface{}) error {
    props := make([]string, 0, len(model))
    placeholders := make([]string, 0, len(model))
    values := make([]interface{}, 0, len(model))

    for prop, value := range model {
        if (prop == "__class") {
            continue
        }
        props = append(props, fmt.Sprintf(`"%s"`, prop))
        placeholders = append(placeholders, fmt.Sprintf("$%d", len(placeholders)+1))
        values = append(values, value)
    }

    queryText := fmt.Sprintf(`INSERT INTO "%s" (%s) VALUES (%s)`, strings.ToLower(object), strings.Join(props, ", "), strings.Join(placeholders, ", "))

    _, err := db.Exec(queryText, values...)
    return err
}

func updateObject(db *sql.DB, object string, id string, changes map[string]Change) error {
    serverVersion, err := getVersion(db, object, id)
    if err != nil {
        return err
    }
    incomingVersion, err := strconv.Atoi(changes["version"].Updated)
    if err != nil {
        return err
    }
    finalVersion := strconv.Itoa(incomingVersion)
    if (serverVersion < incomingVersion) {
        // We've had writes since this client has seen this change.
        // We're doing last write wins, so we're going to call this the latest version.
        finalVersion = strconv.Itoa(serverVersion + 1)
    }

    i := 1
    colQuery := ""
    updateVals := make([]interface{}, 0, len(changes))
    for prop, change := range changes {
        if (i > 1) {
            colQuery += ", "
        }
        colQuery += fmt.Sprintf(`"%s" = $%d`, prop, i)
        if (prop == "version") {
            updateVals = append(updateVals, finalVersion)
        } else {
            updateVals = append(updateVals, change.Updated)
        }
        i++
    }
    lastModifiedDate := time.Now().Format(time.RFC3339)
    colQuery += fmt.Sprintf(`, "%s" = $%d`, "lastModifiedDate", i)
    i++
    
    queryText := fmt.Sprintf(`UPDATE "%s" SET %s WHERE id = $%d`, strings.ToLower(object), colQuery, i)
    _, err = db.Exec(queryText, append(updateVals, lastModifiedDate, id)...)
    return err;
}

type Schema map[string]interface{}

func getObjectAsJson(db *sql.DB, objectName string, id string) (string, error) {
    query := fmt.Sprintf(`SELECT * FROM "%s" WHERE id = $1`, strings.ToLower(objectName))
    rows, err := db.Query(query, id)
    if err != nil {
        return "", err
    }
    defer rows.Close()

    // Fetch column names
    columns, err := rows.Columns()
    if err != nil {
        return "", err
    }

    // Create a slice of interfaces to hold the column values
    values := make([]interface{}, len(columns))
    valuePtrs := make([]interface{}, len(columns))
    for i := range values {
        valuePtrs[i] = &values[i]
    }

    // Initialize a map to store the schema
    schema := Schema{}

    // Iterate over the result set (in this case, there should be only one row)
    if rows.Next() {
        // Scan the row into the value pointers
        if err := rows.Scan(valuePtrs...); err != nil {
            return "", err
        }

        // Populate the schema map with column names and their corresponding values
        for i, column := range columns {
            schema[column] = values[i]
        }
    } else {
        return "", fmt.Errorf("no results found for ID %s", id)
    }
    schema["__class"] = objectName

    // Convert the schema map to JSON
    jsonData, err := json.Marshal(schema)
    if err != nil {
        return "", err
    }

    return string(jsonData), nil
}

type ChangeRequest struct {
    id *string;
    changeType *string;
    modelId *string;
    modelType *string;
    changeSnapshot *ChangeSnapshot;

}

type Change struct {
    Original string `json:"original"`
    Updated  string `json:"updated"`
}

type ChangeSnapshot struct {
    Changes map[string]Change `json:"changes"`
}

type RequestBody struct {
    ID            string                    `json:"id"`
    ChangeType    string                    `json:"changeType"`
    ModelType     string                    `json:"modelType"`
    ModelID       string                    `json:"modelId"`
    Model         map[string]interface{}    `json:"model"`
    ChangeSnapshot ChangeSnapshot           `json:"changeSnapshot"`
}

func parseJSONFromBody(r *http.Request) (RequestBody, error) {
    var reqBody RequestBody
    body, err := io.ReadAll(r.Body)
    if err != nil {
        return reqBody, err
    }
    err = json.Unmarshal(body, &reqBody)
    if err != nil {
        return reqBody, err
    }
    return reqBody, nil
}

// Sample handler for changes
func handleChange(w http.ResponseWriter, r *http.Request) {
    // Parse the JSON body from the request
    requestBody, err := parseJSONFromBody(r)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    w.Header().Set("Content-Type", "application/json")

    db := getConn()
    defer db.Close()

    // Extract the new email address from the JSON body
    id := requestBody.ModelID;
    modelType := requestBody.ModelType;
    changeType := requestBody.ChangeType;
    switch (changeType) {
    case "update":
        changes := requestBody.ChangeSnapshot.Changes;

        if err := updateObject(db, modelType, id, changes); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return;
        }

        updatedUser, err := getObjectAsJson(db, "User", id)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return;
        }
        changeToBroadcast := fmt.Sprintf(`{"type": "%s", "jsonObject": %s}`, changeType, updatedUser)

        // Implement logic to apply a change to the data model
        broadcastChange(changeToBroadcast)
        w.Write([]byte(updatedUser))
        break
    case "create":
        // Insert into database.
        model := requestBody.Model;
        if err := insertObject(db, modelType, model); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return;
        }
        jsonData, err := json.Marshal(model)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return;
        }
        changeToBroadcast := fmt.Sprintf(`{"type": "%s", "jsonObject": %s}`, changeType, jsonData)

        broadcastChange(changeToBroadcast)
        w.Write([]byte(jsonData))
        break
    case "delete":
        if err := deleteObject(db, modelType, id); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return;
        }
        changeToBroadcast := fmt.Sprintf(`{"type": "%s", "jsonObject": {"id": "%s"}}`, changeType, id)
        broadcastChange(changeToBroadcast)
        w.Write([]byte(fmt.Sprintf(`{"id": "%s"}`, id)))
        // Handle delete
        break
    default:
        http.Error(w, "Invalid change type", http.StatusBadRequest)
    }
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
