import { useState } from 'react';
import type { Workspace } from '../api/todo';
import './WorkspaceList.css';

interface Props {
  workspaces: Workspace[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
  onDelete: (id: number) => void;
}

export function WorkspaceList({ workspaces, activeId, onSelect, onCreate, onDelete }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
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
            <span className="workspace-name">{ws.name}</span>
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