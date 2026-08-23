import React from 'react';
import { Plus, Edit3, X, CheckCircle2 } from 'lucide-react';

interface CalendarFormModalProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  linkedTable: any;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CalendarFormModal: React.FC<CalendarFormModalProps> = ({
  mode,
  isOpen,
  linkedTable,
  formData,
  setFormData,
  onClose,
  onSubmit
}) => {
  if (!isOpen || !linkedTable) return null;

  const isAdd = mode === 'add';

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
        <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            {isAdd ? (
              <Plus className="text-indigo-600" size={16} />
            ) : (
              <Edit3 className="text-indigo-600" size={16} />
            )}
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              {isAdd ? `Neuer Eintrag in "${linkedTable.name}"` : 'Eintrag bearbeiten'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {linkedTable.fields.map((field: any) => {
            if (field.isPrimaryKey || field.isAutoIncrement) return null;

            const isDate = ['DATE', 'DATETIME', 'TIMESTAMP'].includes(field.type);
            const isBoolean = field.type === 'BOOLEAN';
            const isNumber = ['INTEGER', 'DECIMAL', 'DOUBLE'].includes(field.type);
            const inputId = isAdd ? `checkbox-${field.id}` : `edit-checkbox-${field.id}`;

            return (
              <div key={field.id} className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {field.name} {field.allowNull === false && <span className="text-red-500">*</span>}
                </label>
                
                {isBoolean ? (
                  <div className="flex items-center gap-2 py-1">
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={!!formData[field.name]}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor={inputId} className="text-xs text-slate-600 dark:text-slate-350">Aktivieren / Ja</label>
                  </div>
                ) : isDate ? (
                  <input
                    type="date"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.allowNull === false}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                  />
                ) : isNumber ? (
                  <input
                    type="number"
                    value={formData[field.name] ?? ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value === '' ? '' : Number(e.target.value) })}
                    required={field.allowNull === false}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                    placeholder={isAdd ? "Zahl eingeben..." : "Zahl..."}
                  />
                ) : field.type === 'TEXT' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.allowNull === false}
                    rows={3}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                    placeholder={isAdd ? "Text eingeben..." : undefined}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.allowNull === false}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                    placeholder={isAdd ? `${field.name} eingeben...` : undefined}
                  />
                )}
              </div>
            );
          })}

          <div className="pt-4 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl py-2 px-4 text-xs font-bold text-slate-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
            >
              {isAdd ? (
                <>
                  <CheckCircle2 size={13} /> Speichern
                </>
              ) : (
                'Änderungen speichern'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
