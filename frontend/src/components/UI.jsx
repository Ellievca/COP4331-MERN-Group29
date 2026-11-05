import { useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  X,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Brand({ compact = false }) {
  return (
    <Link className="brand" to="/" aria-label="StudySync home">
      <span className="brand-icon">
        <BookOpen size={23} strokeWidth={1.8} />
        <Sparkles size={11} className="brand-spark" />
      </span>
      <span>
        Study<span className="brand-light">Sync</span>
        {!compact && <small>A LITTLE MORE IN SYNC.</small>}
      </span>
    </Link>
  );
}
export function Spinner({ label = 'Loading your study space…' }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={26} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorMessage({ children }) {
  return children ? (
    <div className="form-error" role="alert">
      <AlertCircle size={17} />
      <span>{children}</span>
    </div>
  ) : null;
}
export function EmptyState({ icon: Icon = BookOpen, title, children, action, to }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {to ? (
        <Link className="button primary" to={to}>
          {action}
          <ArrowRight size={16} />
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
export function Modal({ title, subtitle, children, onClose }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    dialog.querySelector('input, textarea, select')?.focus();
    const cancel = (event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', cancel);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onClick={(event) => {
        const rect = ref.current.getBoundingClientRect();
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (event.target === ref.current && outside) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <span className="modal-mark">
          <Plus size={23} />
        </span>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={21} />
        </button>
      </div>
      <h2 id="modal-title">{title}</h2>
      {subtitle && <p className="muted">{subtitle}</p>}
      {children}
    </dialog>
  );
}
export function Toast({ message, onClose }) {
  return (
    <div className={`toast ${message ? 'visible' : ''}`} role="status" aria-live="polite">
      {message && (
        <>
          <CheckCircle2 size={19} />
          <span>{message}</span>
          <button className="icon-button" onClick={onClose} aria-label="Dismiss notification">
            <X size={17} />
          </button>
        </>
      )}
    </div>
  );
}
