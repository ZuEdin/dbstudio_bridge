import React, { useState } from 'react';
import { HelpCircle, Play, X } from 'lucide-react';

interface QueryParameterModalProps {
  parameters: string[];
  queryName: string;
  onConfirm: (paramValues: Record<string, string>) => void;
  onCancel: () => void;
}

export const QueryParameterModal: React.FC<QueryParameterModalProps> = ({
  parameters,
  queryName,
  onConfirm,
  onCancel
}) => {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    parameters.forEach(p => {
      initial[p] = '';
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(values);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 text-slate-900 rounded font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-400">Parameterwert eingeben</h3>
              <p className="text-[11px] text-slate-400 font-mono">Abfrage: {queryName}</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded border border-amber-200">
            Diese Abfrage erfordert Benutzereingaben für die Filterkriterien:
          </p>

          <div className="space-y-3">
            {parameters.map((param, idx) => {
              const label = param.replace(/^\[|\]$/g, '');
              return (
                <div key={idx} className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {label}:
                  </label>
                  <input
                    type="text"
                    autoFocus={idx === 0}
                    value={values[param] || ''}
                    onChange={e => setValues({ ...values, [param]: e.target.value })}
                    placeholder={`Wert für ${param}...`}
                    className="w-full text-sm p-2 border border-slate-300 rounded focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Play size={14} /> Abfrage Ausführen
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
