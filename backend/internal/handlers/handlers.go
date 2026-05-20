package handlers

import (
	"net/http"
	"strconv"

	"todo-backend/internal/config"
	"todo-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func GetWorkspaces(c *gin.Context) {
	var workspaces []models.Workspace
	config.DB.Order("sort_order asc, created_at asc").Find(&workspaces)
	c.JSON(http.StatusOK, workspaces)
}

func CreateWorkspace(c *gin.Context) {
	var input models.CreateWorkspaceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workspace := models.Workspace{
		Name:  input.Name,
		Color: input.Color,
	}
	if workspace.Color == "" {
		workspace.Color = "#3B82F6"
	}

	config.DB.Create(&workspace)
	c.JSON(http.StatusCreated, workspace)
}

func UpdateWorkspace(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var workspace models.Workspace
	if err := config.DB.First(&workspace, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workspace not found"})
		return
	}

	var input models.UpdateWorkspaceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != "" {
		workspace.Name = input.Name
	}
	if input.Color != "" {
		workspace.Color = input.Color
	}
	if input.SortOrder != nil {
		workspace.SortOrder = *input.SortOrder
	}

	config.DB.Save(&workspace)
	c.JSON(http.StatusOK, workspace)
}

func DeleteWorkspace(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// 先删除该工作区下的所有待办事项
	config.DB.Where("workspace_id = ?", id).Delete(&models.Todo{})

	// 再删除工作区
	result := config.DB.Delete(&models.Workspace{}, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workspace not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Workspace deleted"})
}

func GetTodos(c *gin.Context) {
	workspaceID := c.Query("workspace_id")
	parentID := c.Query("parent_id")
	var todos []models.Todo

	query := config.DB.Order("sort_order asc, created_at desc")
	if workspaceID != "" {
		query = query.Where("workspace_id = ?", workspaceID)
	}

	// 支持 parent_id 过滤：null 表示根待办，具体值表示子待办
	if parentID == "null" || parentID == "" {
		query = query.Where("parent_id IS NULL")
	} else if parentID != "all" {
		query = query.Where("parent_id = ?", parentID)
	}

	query.Find(&todos)
	c.JSON(http.StatusOK, todos)
}

func CreateTodo(c *gin.Context) {
	var input models.CreateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	todo := models.Todo{
		WorkspaceID: input.WorkspaceID,
		Title:       input.Title,
		Description: input.Description,
		Status:      input.Status,
		Priority:    input.Priority,
		DueDate:     input.DueDate,
	}

	if todo.Status == "" {
		todo.Status = models.StatusPending
	}
	if todo.Priority == "" {
		todo.Priority = models.PriorityMedium
	}

	config.DB.Create(&todo)
	c.JSON(http.StatusCreated, todo)
}

func CreateSubTodo(c *gin.Context) {
	var input models.CreateSubTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证父待办存在
	var parent models.Todo
	if err := config.DB.First(&parent, input.ParentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Parent todo not found"})
		return
	}

	subTodo := models.Todo{
		WorkspaceID: parent.WorkspaceID, // 继承父待办的 workspace_id
		ParentID:    &input.ParentID,
		Title:       input.Title,
		Description: input.Description,
		Status:      input.Status,
		Priority:    input.Priority,
		DueDate:     input.DueDate,
	}

	if subTodo.Status == "" {
		subTodo.Status = models.StatusPending
	}
	if subTodo.Priority == "" {
		subTodo.Priority = models.PriorityMedium
	}

	config.DB.Create(&subTodo)

	// 创建子待办时，父待办自动设为 in_progress
	if parent.Status == models.StatusPending {
		parent.Status = models.StatusInProgress
		config.DB.Save(&parent)
	}

	c.JSON(http.StatusCreated, subTodo)
}

func GetSubTodos(c *gin.Context) {
	parentID := c.Param("parent_id")
	var subTodos []models.Todo

	config.DB.Where("parent_id = ?", parentID).Order("sort_order asc, created_at asc").Find(&subTodos)
	c.JSON(http.StatusOK, subTodos)
}

func UpdateTodo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var todo models.Todo
	if err := config.DB.First(&todo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	var input models.UpdateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Title != "" {
		todo.Title = input.Title
	}
	if input.Description != "" {
		todo.Description = input.Description
	}
	if input.Status != "" {
		todo.Status = input.Status
	}
	if input.Priority != "" {
		todo.Priority = input.Priority
	}
	if input.DueDate != nil {
		todo.DueDate = input.DueDate
	}
	if input.SortOrder != nil {
		todo.SortOrder = *input.SortOrder
	}

	config.DB.Save(&todo)
	c.JSON(http.StatusOK, todo)
}

func UpdateTodoStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var todo models.Todo
	if err := config.DB.First(&todo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	var input models.UpdateTodoStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 使用事务保证原子性
	tx := config.DB.Begin()

	todo.Status = input.Status
	if err := tx.Save(&todo).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// 如果是子待办，检查所有兄弟待办的完成情况
	if todo.ParentID != nil {
		var siblings []models.Todo
		tx.Where("parent_id = ?", todo.ParentID).Find(&siblings)

		allCompleted := len(siblings) > 0
		for _, sibling := range siblings {
			if sibling.Status != models.StatusCompleted {
				allCompleted = false
				break
			}
		}

		// 所有子待办完成则自动完成父待办
		if allCompleted {
			tx.Model(&models.Todo{}).Where("id = ?", todo.ParentID).
				Update("status", models.StatusCompleted)
		} else {
			// 有未完成的子待办，确保父待办不是 completed
			var parent models.Todo
			tx.First(&parent, todo.ParentID)
			if parent.Status == models.StatusCompleted {
				tx.Model(&models.Todo{}).Where("id = ?", todo.ParentID).
					Update("status", models.StatusInProgress)
			}
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, todo)
}

func DeleteTodo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// 先级联删除所有子待办
	config.DB.Where("parent_id = ?", id).Delete(&models.Todo{})

	// 再删除父待办
	result := config.DB.Delete(&models.Todo{}, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todo and all sub-todos deleted"})
}