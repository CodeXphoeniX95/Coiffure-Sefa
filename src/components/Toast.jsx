import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastInternal } from '../context/ToastContext';
import './Toast.css';

const ICONS = {
  success: <CheckCircle  size={18} />,
  error:   <XCircle     size={18} />,
  warning: <AlertCircle size={18} />,
  info:    <Info        size={18} />,
};

function ToastItem({ id, message, type, duration, onRemove }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  // Entrée
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timerRef.current);
  }, [duration]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300); // attendre la transition out
  };

  return (
    <div
      className={`toast toast--${type} ${visible ? 'toast--visible' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast__icon">{ICONS[type]}</span>
      <span className="toast__msg">{message}</span>
      <button className="toast__close" onClick={dismiss} aria-label="Fermer">
        <X size={15} />
      </button>
      {/* Barre de progression */}
      <div
        className="toast__bar"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

export default function ToastContainer() {
  const ctx = useToastInternal();
  if (!ctx) return null;
  const { toasts, remove } = ctx;

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onRemove={remove} />
      ))}
    </div>
  );
}
