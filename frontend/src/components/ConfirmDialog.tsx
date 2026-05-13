import './ConfirmDialog.css';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'EXECUTE',
  cancelText = 'CANCEL',
  onConfirm,
  onCancel,
  danger = false
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <div className="confirm-icon">{danger ? '⚠' : '◈'}</div>
          <h3 className="confirm-title">{title}</h3>
          <div className="confirm-label">[ CONFIRMATION REQUIRED ]</div>
        </div>

        <div className="confirm-body">
          <p>{message}</p>
        </div>

        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`confirm-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>

        <div className="confirm-corner tl"></div>
        <div className="confirm-corner tr"></div>
        <div className="confirm-corner bl"></div>
        <div className="confirm-corner br"></div>
      </div>
    </div>
  );
}