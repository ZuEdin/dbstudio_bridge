import React, { useState } from 'react';
import { SlidersHorizontal, Plus, Trash2, Filter, X, Check, RotateCcw } from 'lucide-react';
import { Field } from '../../../types/index';
import { AdvancedFilterRule, MatchMode, FilterOperator } from '../../../hooks/useDataFilter';

interface AdvancedFilterModalProps {
  fields: Field[];
  totalRecordsCount: number;
  filteredRecordsCount: number;
  rules: AdvancedFilterRule[];
  matchMode: MatchMode;
  onApply: (rules: AdvancedFilterRule[], mode: MatchMode) => void;
  onClose: () => void;
  onReset: () => void;
}

const OPERATOR_OPTIONS: { label: string; value: FilterOperator; needsValue: boolean }[] = [
  { label: 'Enthält (contains)', value: 'contains', needsValue: true },
  { label: 'Gleicht (=)', value: 'equals', needsValue: true },
  { label: 'Ungleich (!=)', value: 'not_equals', needsValue: true },
  { label: 'Beginnt mit', value: 'starts_with', needsValue: true },
  { label: 'Endet mit', value: 'ends_with', needsValue: true },
  { label: 'Größer als (>)', value: 'greater_than', needsValue: true },
  { label: 'Größer gleich (>=)', value: 'greater_equal', needsValue: true },
  { label: 'Kleiner als (<)', value: 'less_than', needsValue: true },
  { label: 'Kleiner gleich (<=)', value: 'less_equal', needsValue: true },
  { label: 'Ist Leer / NULL', value: 'is_empty', needsValue: false },
  { label: 'Ist NICHT Leer', value: 'is_not_empty', needsValue: false },
];

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  fields,
  totalRecordsCount,
  filteredRecordsCount,
  rules: initialRules,
  matchMode: initialMatchMode,
  onApply,
  onClose,
  onReset
}) => {
  const [localRules, setLocalRules] = useState<AdvancedFilterRule[]>(
    initialRules.length > 0 
      ? initialRules 
      : [{ id: crypto.randomUUID(), field: fields[0]?.name || '', operator: 'contains', value: '' }]
  );
  const [localMatchMode, setLocalMatchMode] = useState<MatchMode>(initialMatchMode);

  const handleAddRule = () => {
    setLocalRules(prev => [
      ...prev,
      { id: crypto.randomUUID(), field: fields[0]?.name || '', operator: 'contains', value: '' }
    ]);
  };

  const handleRemoveRule = (id: string) => {
    setLocalRules(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateRule = (id: string, updates: Partial<AdvancedFilterRule>) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSave = () => {
    // Filter out rules with empty values unless operator doesn't need value
    const validRules = localRules.filter(r => {
      const opConfig = OPERATOR_OPTIONS.find(o => o.value === r.operator);
      if (!opConfig?.needsValue) return true;
      return r.field && r.value.trim() !== '';
    });
    onApply(validRules, localMatchMode);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-25">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-400/30">
              <SlidersHorizontal className="text-indigo-400" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base">Erweiterter Filter & Kriterien</h2>
              <p className="text-xs text-slate-400">Kombinieren Sie mehrere Bedingungen für präzise Abfragen</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          
          {/* Match Mode Toggle */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verknüpfungs-Modus:</span>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setLocalMatchMode('AND')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  localMatchMode === 'AND'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                UND (Alle Bedingungen)
              </button>
              <button
                type="button"
                onClick={() => setLocalMatchMode('OR')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  localMatchMode === 'OR'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ODER (Mindestens eine)
              </button>
            </div>
          </div>

          {/* Filter Rules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              <span>Filter-Bedingungen</span>
              <span>{localRules.length} Regel(n)</span>
            </div>

            {localRules.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm">
                Keine Filter-Regeln definiert. Klicken Sie unten auf "Bedingung hinzufügen".
              </div>
            ) : (
              localRules.map((rule, idx) => {
                const opConfig = OPERATOR_OPTIONS.find(o => o.value === rule.operator);
                const needsValue = opConfig ? opConfig.needsValue : true;

                return (
                  <div key={rule.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2 shadow-xs group animate-in fade-in-25">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6 text-center">{idx + 1}.</span>
                    
                    {/* Spalte */}
                    <select
                      value={rule.field}
                      onChange={(e) => handleUpdateRule(rule.id, { field: e.target.value })}
                      className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                    >
                      {fields.map(f => (
                        <option key={f.id || f.name} value={f.name}>
                          {f.name} ({f.type})
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={rule.operator}
                      onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as FilterOperator })}
                      className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                    >
                      {OPERATOR_OPTIONS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>

                    {/* Wert Input */}
                    {needsValue ? (
                      <input
                        type="text"
                        value={rule.value}
                        placeholder="Wert eingeben..."
                        onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                        className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                      />
                    ) : (
                      <div className="flex-1 text-xs text-slate-400 italic px-2 py-1 bg-slate-100 rounded border border-slate-200">
                        (Kein Wert erforderlich)
                      </div>
                    )}

                    {/* Delete Rule */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Regel entfernen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}

            <button
              type="button"
              onClick={handleAddRule}
              className="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-500 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={14} /> Weitere Bedingung hinzufügen
            </button>
          </div>

          {/* Wildcard Info Tip */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-950">
              <span>💡 Platzhalter-Unterstützung (Wildcards):</span>
            </div>
            <p className="text-2xs text-indigo-800 leading-relaxed">
              Verwenden Sie <strong>*</strong> als Platzhalter für beliebige Zeichenfolgen (z. B. <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-indigo-900">*GmbH</code> für Endet mit, <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-indigo-900">Herr*</code> für Beginnt mit, <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-indigo-900">*text*</code> für Enthält) oder <strong>?</strong> für genau ein Zeichen.
            </p>
          </div>

          {/* Summary Preview */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-amber-600" />
              <span>
                Aktuelle Datenbasis: <strong>{totalRecordsCount}</strong> Datensätze.
              </span>
            </div>
            <span className="font-semibold text-indigo-900">
              {localRules.length} Kriterium/Kriterien bereit
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={14} /> Filter zurücksetzen
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md flex items-center gap-2 transition-colors"
            >
              <Check size={14} /> Filter anwenden
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
