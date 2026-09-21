import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'success', duration = 3500) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur)  => push(msg, 'success', dur),
    error:   (msg, dur)  => push(msg, 'error',   dur),
    info:    (msg, dur)  => push(msg, 'info',     dur),
    warning: (msg, dur)  => push(msg, 'warning',  dur),
  };

  return (
    <ToastContext.Provider value={{ toasts, remove, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx.toast;
}

export function useToastInternal() {
  return useContext(ToastContext);
}
