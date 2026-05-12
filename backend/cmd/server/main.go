package main

import (
	"log"

	"todo-backend/internal/config"
	"todo-backend/internal/handlers"
	"todo-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()
	config.InitDB(cfg)

	// Auto migrate
	err := config.DB.AutoMigrate(&models.Workspace{}, &models.Todo{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	// API routes
	api := r.Group("/api")
	{
		// Workspaces
		api.GET("/workspaces", handlers.GetWorkspaces)
		api.POST("/workspaces", handlers.CreateWorkspace)
		api.PUT("/workspaces/:id", handlers.UpdateWorkspace)
		api.DELETE("/workspaces/:id", handlers.DeleteWorkspace)

		// Todos
		api.GET("/todos", handlers.GetTodos)
		api.POST("/todos", handlers.CreateTodo)
		api.PUT("/todos/:id", handlers.UpdateTodo)
		api.PATCH("/todos/:id/status", handlers.UpdateTodoStatus)
		api.DELETE("/todos/:id", handlers.DeleteTodo)
	}

	log.Printf("Server starting on port %s...", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}