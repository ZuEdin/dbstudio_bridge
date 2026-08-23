import React, { useState } from 'react';
import { X, SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { Field } from '../../../../types/index';

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  fields: Field[];
  activeFilters: any[];
  setActiveFilters: React.Dispatch<React.SetStateAction<any[]>>;
  filterEnabled: boolean;
  setFilterEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  formName,
  fields,
  activeFilters,
  setActiveFilters,
  filterEnabled,
  setFilterEnabled,
}) => {
  const [newFilterField, setNewFilterField] = useState<string>('');
  const [newFilterOperator, setNewFilterOperator] = useState<
    'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between'
  >('equals');
  const [newFilterValue, setNewFilterValue] = useState<string>('');
  const [newFilterValueMax, setNewFilterValueMax] = useState<string>('');

  if (!isOpen) return null;

  const addFilter = () => {
    if (!newFilterField) return;
    const filterVal =
      newFilterOperator === 'between' ? { min: newFilterValue, max: newFilterValueMax } : newFilterValue;
    setActiveFilters((prev) => [
      ...prev.filter((f) => f.fieldName !== newFilterField),
      { fieldName: newFilterField, value: filterVal, operator: newFilterOperator },
    ]);
    setFilterEnabled(true);
    setNewFilterValue('');
    setNewFilterValueMax('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[200] p-4" id="form-advanced-filter-modal">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full overflow-hidden animate-in zoom-in-95">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center font-bold">
          <div className="flex items-center gap-2 text-sm">
            <SlidersHorizontal size={16} className="text-indigo-400" />
            <span>Filter verwalten ({formName})</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Form to add a new filter */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Neuen Filter hinzufügen
            </label>
            <div className="grid grid-cols-12 gap-2 items-center">
              <select
                value={newFilterField}
                onChange={(e) => setNewFilterField(e.target.value)}
                className="col-span-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="">Feld wählen...</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select
                value={newFilterOperator}
                onChange={(e) => setNewFilterOperator(e.target.value as any)}
                className="col-span-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="equals">Gleich (=)</option>
                <option value="not_equals">Ungleich (≠)</option>
                <option value="contains">Enthält</option>
                <option value="starts_with">Beginnt mit</option>
                <option value="greater_than">Größer (&gt;)</option>
                <option value="less_than">Kleiner (&lt;)</option>
                <option value="between">Zwischen</option>
              </select>

              {newFilterOperator === 'between' ? (
                <div className="col-span-3 flex gap-1">
                  <input
                    type="text"
                    value={newFilterValue}
                    onChange={(e) => setNewFilterValue(e.target.value)}
                    placeholder="Von..."
                    className="w-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                  <input
                    type="text"
                    value={newFilterValueMax}
                    onChange={(e) => setNewFilterValueMax(e.target.value)}
                    placeholder="Bis..."
                    className="w-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={newFilterValue}
                  onChange={(e) => setNewFilterValue(e.target.value)}
                  placeholder="Wert..."
                  className="col-span-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              )}

              <button
                onClick={addFilter}
                disabled={!newFilterField}
                className="col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded text-xs py-1.5 transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* List of active filters */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Aktive Filter ({activeFilters.length})
              </span>
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setActiveFilters([])}
                  className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                >
                  Alle löschen
                </button>
              )}
            </div>
            {activeFilters.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center border border-dashed border-slate-200 rounded">
                Keine aktiven Filter gesetzt.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {activeFilters.map((f, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white">{f.fieldName}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {f.operator === 'equals'
                          ? '='
                          : f.operator === 'not_equals'
                          ? '≠'
                          : f.operator === 'contains'
                          ? 'enthält'
                          : f.operator === 'starts_with'
                          ? 'beginnt mit'
                          : f.operator === 'greater_than'
                          ? '>'
                          : f.operator === 'less_than'
                          ? '<'
                          : 'zwischen'}
                      </span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                        {f.operator === 'between' && typeof f.value === 'object'
                          ? `"${f.value.min}" und "${f.value.max}"`
                          : `"${String(f.value)}"`}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveFilters((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.checked)}
              className="rounded text-indigo-600"
            />
            Filter anwenden
          </label>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
