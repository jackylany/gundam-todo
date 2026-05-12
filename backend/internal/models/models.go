package models

import (
	"time"

	"gorm.io/gorm"
)

type Workspace struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"size:100;not null"`
	Color     string         `json:"color" gorm:"size:20;default:'#ffffff'"`
	SortOrder int            `json:"sort_order" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type TodoStatus string

const (
	StatusPending    TodoStatus = "pending"
	StatusInProgress TodoStatus = "in_progress"
	StatusCompleted  TodoStatus = "completed"
)

type TodoPriority string

const (
	PriorityLow    TodoPriority = "low"
	PriorityMedium TodoPriority = "medium"
	PriorityHigh   TodoPriority = "high"
)

type Todo struct {
	ID          uint         `json:"id" gorm:"primaryKey"`
	WorkspaceID uint         `json:"workspace_id" gorm:"not null;index"`
	Title       string       `json:"title" gorm:"size:255;not null"`
	Description string       `json:"description" gorm:"type:text"`
	Status      TodoStatus   `json:"status" gorm:"type:enum('pending','in_progress','completed');default:'pending'"`
	Priority    TodoPriority `json:"priority" gorm:"type:enum('low','medium','high');default:'medium'"`
	DueDate     *time.Time   `json:"due_date"`
	SortOrder   int          `json:"sort_order" gorm:"default:0"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type CreateWorkspaceInput struct {
	Name  string `json:"name" binding:"required"`
	Color string `json:"color"`
}

type UpdateWorkspaceInput struct {
	Name      string `json:"name"`
	Color     string `json:"color"`
	SortOrder *int   `json:"sort_order"`
}

type CreateTodoInput struct {
	WorkspaceID uint         `json:"workspace_id" binding:"required"`
	Title       string       `json:"title" binding:"required"`
	Description string       `json:"description"`
	Status      TodoStatus   `json:"status"`
	Priority    TodoPriority `json:"priority"`
	DueDate     *time.Time   `json:"due_date"`
}

type UpdateTodoInput struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Status      TodoStatus   `json:"status"`
	Priority    TodoPriority `json:"priority"`
	DueDate     *time.Time   `json:"due_date"`
	SortOrder   *int         `json:"sort_order"`
}

type UpdateTodoStatusInput struct {
	Status TodoStatus `json:"status" binding:"required"`
}