import { useState } from 'react';
import type { Todo } from '../api/todo';
import { todosApi } from '../api/todo';
import { ConfirmDialog } from './ConfirmDialog';
import './TodoList.css';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());
  const [subTodos, setSubTodos] = useState<Map<number, Todo[]>>(new Map());
  const [creatingSubTodoFor, setCreatingSubTodoFor] = useState<number | null>(null);
  const [subTodoTitle, setSubTodoTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    todo: Todo | null;
    subTodoCount: number;
  }>({ isOpen: false, todo: null, subTodoCount: 0 });

  // 加载子待办
  const loadSubTodos = async (parentId: number) => {
    const subs = await todosApi.getSubTodos(parentId);
    setSubTodos(prev => new Map(prev).set(parentId, subs));
  };

  // 展开/折叠
  const toggleExpand = async (todoId: number) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
      // 懒加载子待办
      if (!subTodos.has(todoId)) {
        await loadSubTodos(todoId);
      }
    }
    setExpandedTodos(newExpanded);
  };

  // 创建子待办
  const handleCreateSubTodo = async (parentId: number) => {
    if (!subTodoTitle.trim()) return;
    await todosApi.createSubTodo({ parent_id: parentId, title: subTodoTitle.trim() });
    setSubTodoTitle('');
    setCreatingSubTodoFor(null);
    await loadSubTodos(parentId);
    onRefresh(); // 刷新父待办状态
  };

  // 点击添加子待办按钮 - 自动展开并显示创建表单
  const handleAddSubTodoClick = async (todoId: number) => {
    // 先展开
    const newExpanded = new Set(expandedTodos);
    if (!newExpanded.has(todoId)) {
      newExpanded.add(todoId);
      // 懒加载子待办
      if (!subTodos.has(todoId)) {
        await loadSubTodos(todoId);
      }
      setExpandedTodos(newExpanded);
    }
    // 显示创建表单
    setCreatingSubTodoFor(todoId);
  };

  // 子待办进度
  const getSubTodoProgress = (parentId: number) => {
    const subs = subTodos.get(parentId) || [];
    if (subs.length === 0) return null;
    const completed = subs.filter(s => s.status === 'completed').length;
    return { completed, total: subs.length };
  };

  // 统计子待办数量（用于显示展开按钮）
  const getSubTodoCount = (parentId: number) => {
    const subs = subTodos.get(parentId) || [];
    return subs.length;
  };

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
    // 如果有父待办，刷新子待办列表
    if (todo.parent_id) {
      await loadSubTodos(todo.parent_id);
    }
    onRefresh();
  };

  const handleDelete = (todo: Todo) => {
    // 获取子待办数量
    const subCount = todo.parent_id ? 0 : (subTodos.get(todo.id)?.length || 0);
    setDeleteConfirm({
      isOpen: true,
      todo: todo,
      subTodoCount: subCount
    });
  };

  const handleConfirmDelete = async () => {
    const todo = deleteConfirm.todo;
    if (!todo) return;

    await todosApi.delete(todo.id);
    // 如果是子待办，刷新父待办的子待办列表
    if (todo.parent_id) {
      await loadSubTodos(todo.parent_id);
    }
    // 如果是父待办，从缓存中移除
    if (expandedTodos.has(todo.id)) {
      const newExpanded = new Set(expandedTodos);
      newExpanded.delete(todo.id);
      setExpandedTodos(newExpanded);
      setSubTodos(prev => {
        const newMap = new Map(prev);
        newMap.delete(todo.id);
        return newMap;
      });
    }
    setDeleteConfirm({ isOpen: false, todo: null, subTodoCount: 0 });
    onRefresh();
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, todo: null, subTodoCount: 0 });
  };

  const handleEdit = async (todo: Todo) => {
    if (editTitle.trim() && editTitle !== todo.title) {
      await todosApi.update(todo.id, { title: editTitle.trim() });
      onRefresh();
    }
    setEditingId(null);
    setEditTitle('');
  };

  // 只显示根待办（parent_id 为 null）
  const rootTodos = workspaceId
    ? todos.filter((t) => t.workspace_id === workspaceId && t.parent_id === null)
    : todos.filter((t) => t.parent_id === null);

  const pendingTodos = rootTodos.filter((t) => t.status === 'pending');
  const inProgressTodos = rootTodos.filter((t) => t.status === 'in_progress');
  const completedTodos = rootTodos.filter((t) => t.status === 'completed');

  const displayTodos = statusFilter === 'all'
    ? rootTodos
    : rootTodos.filter((t) => t.status === statusFilter);

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const renderTodoItem = (todo: Todo, isSubTodo: boolean = false) => {
    const isExpanded = expandedTodos.has(todo.id);
    const hasSubTodos = isSubTodo ? false : (getSubTodoCount(todo.id) > 0);
    const progress = getSubTodoProgress(todo.id);
    const subs = subTodos.get(todo.id) || [];

    return (
      <div key={todo.id} className={`todo-item ${todo.status} ${getPriorityClass(todo.priority)} ${isSubTodo ? 'sub-todo' : ''}`}>
        {/* 展开/折叠按钮（仅父待办） */}
        {!isSubTodo && (
          <button
            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleExpand(todo.id)}
            title={isExpanded ? '折叠' : '展开子待办'}
          >
            {isExpanded ? '▼' : hasSubTodos ? '▶' : '○'}
          </button>
        )}

        {/* 状态按钮 */}
        <button
          className={`status-btn ${todo.status}`}
          onClick={() => handleStatusChange(todo)}
          title="切换状态"
        >
          {todo.status === 'completed' && '✓'}
          {todo.status === 'in_progress' && '►'}
        </button>

        {/* 标题 */}
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
            onDoubleClick={() => {
              setEditingId(todo.id);
              setEditTitle(todo.title);
            }}
          >
            {todo.title}
            {progress && (
              <span className="sub-progress">[{progress.completed}/{progress.total}]</span>
            )}
          </span>
        )}

        {/* 添加子待办按钮（仅父待办） */}
        {!isSubTodo && todo.status !== 'completed' && (
          <button
            className="add-sub-btn"
            onClick={() => handleAddSubTodoClick(todo.id)}
            title="添加子待办"
          >
            +
          </button>
        )}

        {/* 删除按钮 */}
        <button className="delete-btn" onClick={() => handleDelete(todo)}>
          ×
        </button>

        {/* 子待办容器 */}
        {isExpanded && (
          <div className="sub-todos-container">
            {/* 创建子待办表单 */}
            {creatingSubTodoFor === todo.id && (
              <form className="sub-todo-form" onSubmit={(e) => {
                e.preventDefault();
                handleCreateSubTodo(todo.id);
              }}>
                <input
                  placeholder="输入子待办..."
                  value={subTodoTitle}
                  onChange={(e) => setSubTodoTitle(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    if (!subTodoTitle.trim()) setCreatingSubTodoFor(null);
                  }}
                />
                <button type="submit">确认</button>
              </form>
            )}

            {/* 子待办列表 */}
            {subs.map(sub => renderTodoItem(sub, true))}
          </div>
        )}
      </div>
    );
  };

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

      <div className="status-filters">
        <button
          className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          全部
          <span className="filter-count">{rootTodos.length}</span>
        </button>
        <button
          className={`filter-btn pending ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          待办
          <span className="filter-count">{pendingTodos.length}</span>
        </button>
        <button
          className={`filter-btn in-progress ${statusFilter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setStatusFilter('in_progress')}
        >
          进行中
          <span className="filter-count">{inProgressTodos.length}</span>
        </button>
        <button
          className={`filter-btn completed ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('completed')}
        >
          已完成
          <span className="filter-count">{completedTodos.length}</span>
        </button>
      </div>

      <div className="todo-sections">
        {displayTodos.length > 0 ? (
          displayTodos.map(todo => renderTodoItem(todo, false))
        ) : (
          <div className="no-todos">
            <p>{statusFilter === 'all' ? '暂无待办事项' : '该状态下暂无任务'}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="DELETE TASK"
        message={
          deleteConfirm.subTodoCount > 0
            ? `确定要删除待办「${deleteConfirm.todo?.title || ''}」吗？此操作将同时删除 ${deleteConfirm.subTodoCount} 个子待办，且无法撤销。`
            : `确定要删除待办「${deleteConfirm.todo?.title || ''}」吗？此操作无法撤销。`
        }
        confirmText="DELETE"
        cancelText="CANCEL"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        danger={true}
      />
    </div>
  );
}