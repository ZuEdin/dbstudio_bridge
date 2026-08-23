import React, { useState, useEffect } from 'react';

interface InputModalProps {
  title: string;
  label: string;
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputModal: React.FC<InputModalProps> = ({ title, label, initialValue, onConfirm, onCancel }) => {
  const [value, setValue] = useState(initialValue);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [value]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-slate-200" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">
            Abbrechen
          </button>
          <button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
