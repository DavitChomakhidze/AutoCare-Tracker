import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const styles = {
    success: 'bg-success-50 text-success-700 border-success-500',
    error: 'bg-danger-50 text-danger-700 border-danger-500',
    warning: 'bg-warning-50 text-warning-700 border-warning-500',
    info: 'bg-info-50 text-info-700 border-info-500'
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-[2000] min-w-[320px] max-w-[min(92vw,520px)]
        flex items-start gap-3 px-4 py-3 rounded-[var(--radius-card)] border shadow-2xl
        ${styles[type]}
        transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium leading-5">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
