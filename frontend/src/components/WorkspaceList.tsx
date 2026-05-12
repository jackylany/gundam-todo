import { useState } from 'react';
import type { Workspace } from '../api/todo';
import './WorkspaceList.css';

interface Props {
  workspaces: Workspace[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
  onUpdate: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export function WorkspaceList({ workspaces, activeId, onSelect, onCreate, onUpdate, onDelete }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleEdit = (ws: Workspace) => {
    if (editName.trim() && editName !== ws.name) {
      onUpdate(ws.id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="workspace-list">
      <div className="workspace-header">
        <h2>WORKSPACES</h2>
        <button
          className="add-workspace-btn"
          onClick={() => setIsCreating(true)}
          title="新建工作区"
        >
          +
        </button>
      </div>

      {isCreating && (
        <form className="new-workspace-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="工作区名称..."
            autoFocus
            onBlur={() => {
              if (!newName.trim()) setIsCreating(false);
            }}
          />
          <button type="submit">确认</button>
        </form>
      )}

      <div className="workspace-items">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`workspace-item ${activeId === ws.id ? 'active' : ''}`}
            onClick={() => onSelect(ws.id)}
          >
            <div
              className="workspace-color"
              style={{ background: ws.color || '#3B82F6' }}
            />
            {editingId === ws.id ? (
              <input
                className="edit-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleEdit(ws)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit(ws);
                  if (e.key === 'Escape') {
                    setEditingId(null);
                    setEditName('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span
                className="workspace-name"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(ws.id);
                  setEditName(ws.name);
                }}
              >
                {ws.name}
              </span>
            )}
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ws.id);
              }}
              title="删除"
            >
              ×
            </button>
          </div>
        ))}

        {workspaces.length === 0 && !isCreating && (
          <div className="empty-hint">点击 + 创建工作区</div>
        )}
      </div>
    </div>
  );
}