import { useState, useEffect, useCallback } from 'react';
import { workspacesApi, todosApi } from './api/todo';
import type { Workspace, Todo } from './api/todo';
import { useTheme, ThemeProvider } from './hooks/useTheme';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { WorkspaceList } from './components/WorkspaceList';
import { TodoList } from './components/TodoList';
import './themes/gundam.css';
import './App.css';

function AppContent() {
  const { themeNames, theme } = useTheme();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<number | null>(null);

  const loadWorkspaces = useCallback(async () => {
    const data = await workspacesApi.getAll();
    setWorkspaces(data);
    if (data.length > 0 && !activeWorkspace) {
      setActiveWorkspace(data[0].id);
    }
  }, [activeWorkspace]);

  const loadTodos = useCallback(async () => {
    const data = await todosApi.getAll();
    setTodos(data);
  }, []);

  useEffect(() => {
    loadWorkspaces();
    loadTodos();
  }, [loadWorkspaces, loadTodos]);

  const handleCreateWorkspace = async (name: string) => {
    await workspacesApi.create({ name });
    await loadWorkspaces();
  };

  const handleUpdateWorkspace = async (id: number, name: string) => {
    await workspacesApi.update(id, { name });
    await loadWorkspaces();
  };

  const handleDeleteWorkspace = async (id: number) => {
    await workspacesApi.delete(id);
    if (activeWorkspace === id) {
      const remaining = workspaces.filter((w) => w.id !== id);
      setActiveWorkspace(remaining.length > 0 ? remaining[0].id : null);
    }
    await loadWorkspaces();
    await loadTodos();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">◇</div>
          <div className="brand-title">
            <h1>GUNDAM TODO</h1>
            <span className="theme-name">{themeNames[theme]}</span>
          </div>
        </div>
        <ThemeSwitcher />
      </header>

      <main className="app-main">
        <WorkspaceList
          workspaces={workspaces}
          activeId={activeWorkspace}
          onSelect={setActiveWorkspace}
          onCreate={handleCreateWorkspace}
          onUpdate={handleUpdateWorkspace}
          onDelete={handleDeleteWorkspace}
        />
        <TodoList
          workspaceId={activeWorkspace}
          todos={todos}
          onRefresh={loadTodos}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;