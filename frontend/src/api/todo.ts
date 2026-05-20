const API_BASE = 'http://localhost:8080/api';

export interface Workspace {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  workspace_id: number;
  parent_id: number | null;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Workspaces
export const workspacesApi = {
  getAll: () => request<Workspace[]>(`${API_BASE}/workspaces`),

  create: (data: { name: string; color?: string }) =>
    request<Workspace>(`${API_BASE}/workspaces`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { name?: string; color?: string; sort_order?: number }) =>
    request<Workspace>(`${API_BASE}/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`${API_BASE}/workspaces/${id}`, {
      method: 'DELETE',
    }),
};

// Todos
export const todosApi = {
  getAll: (workspaceId?: number) => {
    const url = workspaceId
      ? `${API_BASE}/todos?workspace_id=${workspaceId}&parent_id=null`
      : `${API_BASE}/todos?parent_id=null`;
    return request<Todo[]>(url);
  },

  getSubTodos: (parentId: number) =>
    request<Todo[]>(`${API_BASE}/todos/${parentId}/subtodos`),

  create: (data: {
    workspace_id: number;
    title: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
  }) =>
    request<Todo>(`${API_BASE}/todos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createSubTodo: (data: {
    parent_id: number;
    title: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
  }) =>
    request<Todo>(`${API_BASE}/todos/sub`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    title?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
    sort_order?: number;
  }) =>
    request<Todo>(`${API_BASE}/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: 'pending' | 'in_progress' | 'completed') =>
    request<Todo>(`${API_BASE}/todos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`${API_BASE}/todos/${id}`, {
      method: 'DELETE',
    }),
};