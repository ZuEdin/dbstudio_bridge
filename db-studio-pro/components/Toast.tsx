
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastProps {
  toast: ToastInfo;
  onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast, onDismiss]);

  const getStyle = () => {
      switch (toast.type) {
          case 'success': return { bg: 'bg-green-600', icon: CheckCircle };
          case 'error': return { bg: 'bg-red-600', icon: XCircle };
          case 'warning': return { bg: 'bg-orange-500', icon: AlertTriangle };
          case 'info': return { bg: 'bg-indigo-600', icon: Info };
          default: return { bg: 'bg-blue-600', icon: Info };
      }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div 
      className={`flex items-center gap-4 text-white p-4 rounded-md shadow-lg animate-in fade-in-5 slide-in-from-bottom-5 ${style.bg}`}
    >
      <Icon size={20} />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastInfo[];
  onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
