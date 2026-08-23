
import React from 'react';
import { AlertTriangle, XCircle, Info, CheckCircle, X } from 'lucide-react';

export type MessageType = 'info' | 'warning' | 'error' | 'success';

interface MessageModalProps {
  type: MessageType;
  title: string;
  message: string;
  onClose: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({ type, title, message, onClose }) => {
  
  // Icon und Farb-Konfiguration basierend auf dem Typ
  const getConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: <XCircle size={48} className="text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          btnColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={48} className="text-orange-500" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-900',
          btnColor: 'bg-orange-500 hover:bg-orange-600'
        };
      case 'success':
        return {
          icon: <CheckCircle size={48} className="text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          btnColor: 'bg-green-600 hover:bg-green-700'
        };
      default: // info
        return {
          icon: <Info size={48} className="text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          btnColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-300 overflow-hidden transform transition-all scale-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header styling mimics classic OS dialogs slightly but modern */}
        <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50">
          <span className="font-semibold text-sm text-slate-600">{title}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex gap-6 items-start">
          <div className="shrink-0">
            {config.icon}
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose} 
            className={`${config.btnColor} text-white px-6 py-2 rounded shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400`}
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
