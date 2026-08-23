import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  alternateText?: string;
  onAlternate?: () => void;
  confirmClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Löschen',
  cancelText = 'Abbrechen',
  alternateText,
  onAlternate,
  confirmClass = 'bg-red-600 hover:bg-red-700 text-white'
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-slate-600">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 mt-6">
          <button onClick={onCancel} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm transition-colors">
            {cancelText}
          </button>
          {onAlternate && alternateText && (
            <button onClick={onAlternate} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors">
              {alternateText}
            </button>
          )}
          <button onClick={onConfirm} className={`${confirmClass} px-4 py-2 rounded text-sm font-semibold transition-colors`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
