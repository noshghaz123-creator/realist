import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

function toastTypeFromMessage(message) {
  const m = String(message || '').toLowerCase();
  if (m.includes('fail') || m.includes('error') || m.includes('invalid') || m.includes('cannot') || m.includes('no leads remaining')) {
    return 'error';
  }
  if (m.includes('removed')) return 'info';
  return 'success';
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = 'success', duration = 3200) => {
    if (!message) return;
    const id = ++toastId;
    setToasts((list) => [...list.slice(-4), { id, message, type }]);
    window.setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const showToast = useCallback((message, type) => {
    push(message, type ?? toastTypeFromMessage(message));
  }, [push]);

  const success = useCallback((message) => push(message, 'success'), [push]);
  const error = useCallback((message) => push(message, 'error', 4500), [push]);
  const info = useCallback((message) => push(message, 'info'), [push]);

  const value = useMemo(
    () => ({ showToast, success, error, info }),
    [showToast, success, error, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-[min(100vw-2rem,22rem)] pointer-events-none"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: {
      wrap: 'bg-white border-green-200 shadow-green-100',
      icon: 'text-green-600 bg-green-50',
      Icon: CheckCircle,
    },
    error: {
      wrap: 'bg-white border-red-200 shadow-red-100',
      icon: 'text-red-600 bg-red-50',
      Icon: AlertCircle,
    },
    info: {
      wrap: 'bg-white border-sky-200 shadow-sky-100',
      icon: 'text-sky-600 bg-sky-50',
      Icon: Info,
    },
  }[toast.type] || styles.success;

  const Icon = styles.Icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg animate-toast-in ${styles.wrap}`}
      role="status"
    >
      <span className={`shrink-0 mt-0.5 p-1.5 rounded-full ${styles.icon}`}>
        <Icon size={18} />
      </span>
      <p className="flex-1 text-sm font-medium text-gray-900 leading-snug pt-0.5">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
