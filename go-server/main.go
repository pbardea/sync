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
	Home     string `json:"home"`
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
	r.HandleFunc("/delta-bootstrap", handleDeltaBootstrap).Methods("GET")
	r.HandleFunc("/change", handleChange).Methods("POST")
	r.HandleFunc("/sync", handleSync)

	http.Handle("/", r)
	fmt.Println("Server started on :8080")

	// CORS middleware
	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
	originsOk := handlers.AllowedOrigins([]string{"https://localhost:5172", "http://localhost:5173", "http://localhost:5174", "https://wolf.tail5a14.ts.net"})
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
		ctx = context.WithValue(ctx, "home", claims.Home)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Handle the login and generate JWT
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var username, home string
	username = r.FormValue("username")
	home = r.FormValue("home")

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: username,
		Home:     home,
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
	return writeObjectDelta(db, object, nil)
}

func getTombstones(db *sql.DB, start *time.Time) ([]tombstone, error) {
	queryText := fmt.Sprintf(`SELECT id, "deletedTime", "model" FROM "tombstone" WHERE "deletedTime" > $1`)
	rows, err := db.Query(queryText, start)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dataArr := make([]tombstone, 0)
	for rows.Next() {
		var id string
		var deletedTime time.Time
		var modelName string
		err := rows.Scan(&id, &deletedTime, &modelName)
		if err != nil {
			return nil, err
		}
		dataArr = append(dataArr, tombstone{id, deletedTime, modelName})
	}
	return dataArr, nil
}

func getRowsAsJson(rows *sql.Rows, object string) ([]map[string]interface{}, error) {
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
			if v == nil {
				continue
			}

			switch v := v.(type) {
			case int64, float64, time.Time:
				data[columns[i]] = v
			case []uint8:
				var jsonValue interface{}
				if err := json.Unmarshal(v, &jsonValue); err == nil {
					data[columns[i]] = jsonValue
				} else {
					data[columns[i]] = string(v)
				}
			case string:
				if f, err := strconv.ParseFloat(v, 64); err == nil {
					data[columns[i]] = f
				} else if b, err := strconv.ParseBool(v); err == nil {
					data[columns[i]] = b
				} else {
					data[columns[i]] = v
				}
			default:
				log.Printf("Unexpected type for column %s: %T", columns[i], v)
				data[columns[i]] = fmt.Sprintf("%v", v)
			}
		}
		dataArr = append(dataArr, data)
	}

	return dataArr, nil
}

func writeObjectDelta(db *sql.DB, object string, start *time.Time) ([]map[string]interface{}, error) {
	// TODO: This is a bad practice, but an effecitve hack.
	queryText := fmt.Sprintf(`SELECT * FROM "%s"`, strings.ToLower(object))
	args := make([]any, 0)
	if start != nil {
		queryText += fmt.Sprintf(` WHERE "lastModifiedDate" > $1`)
		args = append(args, start)
	}

	rows, err := db.Query(queryText, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return getRowsAsJson(rows, object)
}

type tombstone struct {
	Id        string
	Time      time.Time
	ModelName string
}

type bootstrapResponse struct {
	Objects    []map[string]interface{}
	Tombstones []tombstone
	LatestTS   string
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

	objectsToBootstrap := []string{"Home", "User", "Trip", "TripCity", "FactAttraction", "UserAttraction"}
	for _, object := range objectsToBootstrap {
		if dataArr, err := writeObject(db, object); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			finalArr = append(finalArr, dataArr...)
		}
	}

	now := time.Now().UTC().Format("2006-01-02T15:04:05Z")
	resp := bootstrapResponse{Objects: finalArr, Tombstones: []tombstone{}, LatestTS: now}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
}

func handleDeltaBootstrap(w http.ResponseWriter, r *http.Request) {
	// Example of accessing claims from context
	// username := r.Context().Value("username").(string)
	// team := r.Context().Value("team").(string)

	startTime, err := strconv.ParseInt(r.URL.Query().Get("start_time"), 10, 64)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	start := time.UnixMilli(startTime)

	db := getConn()
	defer db.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	tombstones, err := getTombstones(db, &start)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// TODO: Think about schema changes. Probably is worth an RFD.
	// TODO: Filter this down for permissions. Also worth an RFD.
	finalArr := make([]map[string]interface{}, 0)

	objectsToBootstrap := []string{"Home", "User", "Trip", "TripCity", "FactAttraction", "UserAttraction"}
	for _, object := range objectsToBootstrap {
		if dataArr, err := writeObjectDelta(db, object, &start); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			finalArr = append(finalArr, dataArr...)
		}
	}

	now := time.Now().UTC().Format("2006-01-02T15:04:05Z")
	resp := bootstrapResponse{Objects: finalArr, Tombstones: tombstones, LatestTS: now}
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
}

func deleteObject(db *sql.DB, object string, id string) error {
	checkIfDeleted := fmt.Sprintf(`SELECT COUNT(id) FROM "%s" WHERE id = $1`, strings.ToLower(object))
	row := db.QueryRow(checkIfDeleted, id)
	var count int
	if err := row.Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		return nil
	}

	// TODO(#10): The client is assuming that they've seen an entire state of the world based on their
	// latest timestamp. How do we not know that they might have dropped a ws update in the meantime.

	// TODO(#15): Make transactional
	_, err := db.Exec(`INSERT INTO tombstone (id, model) VALUES ($1, $2)`, id, object)
	if err != nil {
		return err
	}

	deleteQuery := fmt.Sprintf(`DELETE FROM "%s" WHERE id = $1`, strings.ToLower(object))
	_, err = db.Exec(deleteQuery, id)
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
		if prop == "__class" {
			continue
		}
		props = append(props, fmt.Sprintf(`"%s"`, prop))
		placeholders = append(placeholders, fmt.Sprintf("$%d", len(placeholders)+1))
		if arr, ok := value.([]interface{}); ok {
			// If value is []interface{}, JSON stringify it
			jsonValue, err := json.Marshal(arr)
			if err != nil {
				return err
			}
			values = append(values, string(jsonValue))
		} else {
			values = append(values, value)
		}
	}

	queryText := fmt.Sprintf(`INSERT INTO "%s" (%s) VALUES (%s)`, strings.ToLower(object), strings.Join(props, ", "), strings.Join(placeholders, ", "))
	if _, err := db.Exec(queryText, values...); err != nil {
		return err
	}

	queryText = fmt.Sprintf(`UPDATE "%s" SET "lastModifiedDate" = now() WHERE id = $1`, strings.ToLower(object))
	_, err := db.Exec(queryText, model["id"])
	return err
}

func updateObject(db *sql.DB, object string, id string, changes map[string]Change) error {
	serverVersion, err := getVersion(db, object, id)
	if err != nil {
		return err
	}
	incomingVersion := int(changes["version"].Updated.(float64))
	finalVersion := strconv.Itoa(incomingVersion + 1)
	if serverVersion > incomingVersion {
		// We've had writes since this client has seen this change.
		// We're doing last write wins, so we're going to call this the latest version.
		finalVersion = strconv.Itoa(serverVersion + 1)
	}

	i := 1
	colQuery := ""
	updateVals := make([]interface{}, 0, len(changes))
	for prop, change := range changes {
		if i > 1 {
			colQuery += ", "
		}
		colQuery += fmt.Sprintf(`"%s" = $%d`, prop, i)
		if prop == "version" {
			updateVals = append(updateVals, finalVersion)
		} else {
			value := change.Updated
			if arr, ok := value.([]interface{}); ok {
				// If value is []interface{}, JSON stringify it
				jsonValue, err := json.Marshal(arr)
				if err != nil {
					return err
				}
				updateVals = append(updateVals, string(jsonValue))
			} else {
				updateVals = append(updateVals, value)
			}
		}
		i++
	}

	queryText := fmt.Sprintf(`UPDATE "%s" SET %s, %s WHERE id = $%d`, strings.ToLower(object), colQuery, `"lastModifiedDate" = now()`, i)
	_, err = db.Exec(queryText, append(updateVals, id)...)
	return err
}

type Schema map[string]interface{}

func getObjectAsJson(db *sql.DB, objectName string, id string) (map[string]interface{}, error) {
	query := fmt.Sprintf(`SELECT * FROM "%s" WHERE id = $1`, strings.ToLower(objectName))
	rows, err := db.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	jsonRows, err := getRowsAsJson(rows, objectName)
	if err != nil {
		return nil, err
	}
	return jsonRows[0], nil
}

type ChangeRequest struct {
	id             *string
	changeType     *string
	modelId        *string
	modelType      *string
	changeSnapshot *ChangeSnapshot
}

type Change struct {
	Original interface{} `json:"original"`
	Updated  interface{} `json:"updated"`
}

type ChangeSnapshot struct {
	Changes map[string]Change `json:"changes"`
}

type RequestBody struct {
	ID             string                 `json:"id"`
	ChangeType     string                 `json:"changeType"`
	ModelType      string                 `json:"modelType"`
	ModelID        string                 `json:"modelId"`
	Model          map[string]interface{} `json:"model"`
	ChangeSnapshot ChangeSnapshot         `json:"changeSnapshot"`
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
	id := requestBody.ModelID
	modelType := requestBody.ModelType
	changeType := requestBody.ChangeType
	switch changeType {
	case "update":
		changes := requestBody.ChangeSnapshot.Changes

		if err := updateObject(db, modelType, id, changes); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		updatedObj, err := getObjectAsJson(db, modelType, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		jsonStr, err := json.Marshal(updatedObj)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		changeObj := map[string]interface{}{
			"type":       changeType,
			"jsonObject": updatedObj,
		}
		changeObjStr, err := json.Marshal(changeObj)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Implement logic to apply a change to the data model
		broadcastChange(string(changeObjStr))
		w.Write([]byte(jsonStr))
	case "create":
		// Insert into database.
		model := requestBody.Model
		if err := insertObject(db, modelType, model); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		obj, err := getObjectAsJson(db, modelType, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		jsonStr, err := json.Marshal(obj)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		changeObj := map[string]interface{}{
			"type":       changeType,
			"jsonObject": obj,
		}
		changeObjStr, err := json.Marshal(changeObj)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Implement logic to apply a change to the data model
		broadcastChange(string(changeObjStr))
		w.Write([]byte(jsonStr))
	case "delete":
		if err := deleteObject(db, modelType, id); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		changeToBroadcast := fmt.Sprintf(`{"type": "%s", "jsonObject": {"id": "%s", "__class": "%s"}}`, changeType, id, modelType)
		broadcastChange(changeToBroadcast)
		w.Write([]byte(fmt.Sprintf(`{"id": "%s"}`, id)))
		// Handle delete
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
