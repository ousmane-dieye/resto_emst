import { useToast } from '../context/ToastContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-999 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`bg-card border rounded-sm p-3 text-sm flex items-center gap-2.5 shadow-lg animate-slide-in cursor-pointer ${
            toast.type === 'success' ? 'border-l-4 border-green' :
            toast.type === 'error' ? 'border-l-4 border-red' :
            toast.type === 'warning' ? 'border-l-4 border-orange' :
            'border-l-4 border-blue'
          }`}
        >
          <span className={
            toast.type === 'success' ? 'text-green' :
            toast.type === 'error' ? 'text-red' :
            toast.type === 'warning' ? 'text-orange' :
            'text-blue'
          }>
            {icons[toast.type]}
          </span>
          <span className="text-text">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;