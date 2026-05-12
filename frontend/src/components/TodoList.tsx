import { useState } from 'react';
import type { Todo } from '../api/todo';
import { todosApi } from '../api/todo';
import './TodoList.css';

interface Props {
  workspaceId: number | null;
  todos: Todo[];
  onRefresh: () => void;
}

export function TodoList({ workspaceId, todos, onRefresh }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newTitle.trim()) return;

    await todosApi.create({
      workspace_id: workspaceId,
      title: newTitle.trim(),
    });
    setNewTitle('');
    setIsCreating(false);
    onRefresh();
  };

  const handleStatusChange = async (todo: Todo) => {
    const nextStatus = todo.status === 'pending'
      ? 'in_progress'
      : todo.status === 'in_progress'
        ? 'completed'
        : 'pending';

    await todosApi.updateStatus(todo.id, nextStatus);
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    await todosApi.delete(id);
    onRefresh();
  };

  const handleEdit = async (todo: Todo) => {
    if (editTitle.trim() && editTitle !== todo.title) {
      await todosApi.update(todo.id, { title: editTitle.trim() });
      onRefresh();
    }
    setEditingId(null);
    setEditTitle('');
  };

  const filteredTodos = workspaceId
    ? todos.filter((t) => t.workspace_id === workspaceId)
    : todos;

  const pendingTodos = filteredTodos.filter((t) => t.status === 'pending');
  const inProgressTodos = filteredTodos.filter((t) => t.status === 'in_progress');
  const completedTodos = filteredTodos.filter((t) => t.status === 'completed');

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const renderTodoItem = (todo: Todo) => (
    <div key={todo.id} className={`todo-item ${todo.status} ${getPriorityClass(todo.priority)}`}>
      <button
        className={`status-btn ${todo.status}`}
        onClick={() => handleStatusChange(todo)}
        title="切换状态"
      >
        {todo.status === 'completed' && '✓'}
        {todo.status === 'in_progress' && '►'}
      </button>

      {editingId === todo.id ? (
        <input
          className="edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => handleEdit(todo)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEdit(todo);
            if (e.key === 'Escape') {
              setEditingId(null);
              setEditTitle('');
            }
          }}
          autoFocus
        />
      ) : (
        <span
          className={`todo-title ${todo.status === 'completed' ? 'done' : ''}`}
          onClick={() => {
            setEditingId(todo.id);
            setEditTitle(todo.title);
          }}
        >
          {todo.title}
        </span>
      )}

      <button className="delete-btn" onClick={() => handleDelete(todo.id)}>
        ×
      </button>
    </div>
  );

  if (!workspaceId) {
    return (
      <div className="todo-list empty">
        <div className="empty-state">
          <div className="empty-icon">◇</div>
          <p>选择工作区开始管理待办事项</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list">
      <div className="todo-header">
        <h3>TASKS</h3>
        <button className="add-btn" onClick={() => setIsCreating(true)}>
          + NEW
        </button>
      </div>

      {isCreating && (
        <form className="create-form" onSubmit={handleCreate}>
          <input
            placeholder="输入待办事项..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            onBlur={() => {
              if (!newTitle.trim()) setIsCreating(false);
            }}
          />
        </form>
      )}

      <div className="todo-sections">
        {inProgressTodos.length > 0 && (
          <div className="todo-section">
            <div className="section-header in-progress">
              <span className="section-icon">►</span>
              <span>IN PROGRESS</span>
              <span className="count">{inProgressTodos.length}</span>
            </div>
            <div className="section-items">
              {inProgressTodos.map(renderTodoItem)}
            </div>
          </div>
        )}

        {pendingTodos.length > 0 && (
          <div className="todo-section">
            <div className="section-header pending">
              <span className="section-icon">○</span>
              <span>PENDING</span>
              <span className="count">{pendingTodos.length}</span>
            </div>
            <div className="section-items">
              {pendingTodos.map(renderTodoItem)}
            </div>
          </div>
        )}

        {completedTodos.length > 0 && (
          <div className="todo-section">
            <div className="section-header completed">
              <span className="section-icon">✓</span>
              <span>COMPLETED</span>
              <span className="count">{completedTodos.length}</span>
            </div>
            <div className="section-items">
              {completedTodos.map(renderTodoItem)}
            </div>
          </div>
        )}

        {filteredTodos.length === 0 && !isCreating && (
          <div className="no-todos">
            <p>暂无待办事项</p>
          </div>
        )}
      </div>
    </div>
  );
}