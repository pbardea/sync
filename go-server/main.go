package main

import (
	"context"
	"fmt"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"net/http"
	"sync"
	"time"
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

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/login", handleLogin).Methods("POST")

	// Authenticated endpoints
	r.Use(authMiddleware)
	r.HandleFunc("/bootstrap", handleBootstrap).Methods("GET")
	r.HandleFunc("/change", handleChange).Methods("POST")
	r.HandleFunc("/sync", handleSync)

	http.Handle("/", r)
	fmt.Println("Server started on :8080")
	http.ListenAndServe(":8080", nil)
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

// Sample handler for bootstrap
func handleBootstrap(w http.ResponseWriter, r *http.Request) {
	// Example of accessing claims from context
	username := r.Context().Value("username").(string)
	team := r.Context().Value("team").(string)

	fmt.Printf("User %s from team %s requested bootstrap\n", username, team)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`[{"id":1, "name":"element1"},{"id":2, "name":"element2"}]`))
}

// Sample handler for changes
func handleChange(w http.ResponseWriter, r *http.Request) {
	// Implement logic to apply a change to the data model
	w.WriteHeader(http.StatusOK)
	broadcastChange(`{"id":1, "change":"updated value"}`)
}

// Sample handler for syncing
func handleSync(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
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
