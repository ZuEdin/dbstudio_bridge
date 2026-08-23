
import React, { useState, useMemo } from 'react';
import { Table, DeleteQuery, Criterion } from '../../../types/index';
import { X, Trash2, AlertTriangle, Plus, Filter } from 'lucide-react';

interface DeleteQueryWizardProps {
  tables: Table[];
  onExecute: (table: Table, criteria: Criterion[]) => void;
  onSave?: (query: DeleteQuery) => void;
  onClose: () => void;
}

export const DeleteQueryWizard: React.FC<DeleteQueryWizardProps> = ({ tables, onExecute, onSave, onClose }) => {
  const [queryName, setQueryName] = useState('Neue Löschabfrage');
  const [tableId, setTableId] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const selectedTable = tables.find(t => t.id === tableId);

  const addCriterion = () => {
      if (!selectedTable) return;
      setCriteria([...criteria, {
          id: crypto.randomUUID(),
          fieldId: selectedTable.fields[0].id,
          operator: '=',
          value: ''
      }]);
  };

  const removeCriterion = (id: string) => {
      setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, key: keyof Criterion, val: string) => {
      setCriteria(criteria.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const handleExecute = () => {
      if (!selectedTable) return;
      if (onSave) {
          onSave({
              id: crypto.randomUUID(),
              type: 'DELETE',
              name: queryName,
              targetTableId: selectedTable.id,
              criteria
          });
      } else {
          onExecute(selectedTable, criteria);
      }
      onClose();
  };

  // Calculate Impact Preview
  const previewCount = useMemo(() => {
      if (!selectedTable || !selectedTable.data) return 0;
      if (criteria.length === 0) return selectedTable.data.length; // Warning: Delete all

      return selectedTable.data.filter(row => {
          return criteria.every(crit => {
              const field = selectedTable.fields.find(f => f.id === crit.fieldId);
              if (!field) return false;
              
              const rowVal = row[field.name];
              const critVal = crit.value;
              
              // Simple conversion for comparison
              const v1 = isNaN(Number(rowVal)) ? String(rowVal).toLowerCase() : Number(rowVal);
              const v2 = isNaN(Number(critVal)) ? String(critVal).toLowerCase() : Number(critVal);

              switch (crit.operator) {
                  case '=': return v1 == v2;
                  case '!=': return v1 != v2;
                  case '>': return v1 > v2;
                  case '<': return v1 < v2;
                  case '>=': return v1 >= v2;
                  case '<=': return v1 <= v2;
                  case 'contains': return String(v1).includes(String(v2));
                  case 'between': {
                      const parts = String(critVal).split(/\s+(?:und|and)\s+/i);
                      if (parts.length === 2) {
                          const min = isNaN(Number(parts[0])) ? parts[0].toLowerCase() : Number(parts[0]);
                          const max = isNaN(Number(parts[1])) ? parts[1].toLowerCase() : Number(parts[1]);
                          return v1 >= min && v1 <= max;
                      }
                      return false;
                  }
                  default: return false;
              }
          });
      }).length;
  }, [selectedTable, criteria]);


  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300 flex flex-col h-[600px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-red-700 to-red-600 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Trash2 className="text-red-200"/> Löschabfrage Assistent
            </h2>
            <p className="text-red-100 text-sm mt-1">Datensätze basierend auf Kriterien unwiderruflich entfernen.</p>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
            
            <div className="space-y-6">
                {/* Table Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Zieltabelle</label>
                    <select 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        value={tableId}
                        onChange={e => { setTableId(e.target.value); setCriteria([]); }}
                    >
                        <option value="">Bitte wählen...</option>
                        {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.data?.length || 0} Zeilen)</option>)}
                    </select>
                </div>

                {selectedTable && (
                    <div className="animate-in slide-in-from-right-2 space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                                <Filter size={14}/> Kriterien (WHERE)
                            </label>
                            <button onClick={addCriterion} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 flex items-center gap-1">
                                <Plus size={12}/> Kriterium hinzufügen
                            </button>
                        </div>

                        <div className="space-y-2 bg-white p-4 rounded border border-slate-200 shadow-sm min-h-[100px]">
                            {criteria.length === 0 && (
                                <p className="text-sm text-slate-400 italic text-center py-4">Keine Einschränkungen. Alle Datensätze werden gelöscht.</p>
                            )}
                            
                            {criteria.map((crit, idx) => (
                                <div key={crit.id} className="flex gap-2 items-center">
                                    <span className="text-xs font-bold text-slate-400 w-6 text-right">{idx === 0 ? 'WO' : 'UND'}</span>
                                    <select 
                                        className="border rounded p-1.5 text-sm w-1/3"
                                        value={crit.fieldId}
                                        onChange={e => updateCriterion(crit.id, 'fieldId', e.target.value)}
                                    >
                                        {selectedTable.fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                    <select 
                                        className="border rounded p-1.5 text-sm w-28"
                                        value={crit.operator}
                                        onChange={e => updateCriterion(crit.id, 'operator', e.target.value)}
                                    >
                                        <option value="=">=</option>
                                        <option value="!=">!=</option>
                                        <option value=">">&gt;</option>
                                        <option value="<">&lt;</option>
                                        <option value=">=">&ge;</option>
                                        <option value="<=">&le;</option>
                                        <option value="contains">enthält</option>
                                        <option value="between">zwischen</option>
                                    </select>
                                    <input 
                                        type="text" 
                                        className="border rounded p-1.5 text-sm flex-1"
                                        placeholder={crit.operator === 'between' ? '10 und 50' : 'Wert'}
                                        value={crit.value}
                                        onChange={e => updateCriterion(crit.id, 'value', e.target.value)}
                                    />
                                    <button onClick={() => removeCriterion(crit.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>

                        {/* Impact Warning */}
                        <div className={`p-4 rounded border flex items-start gap-3 ${criteria.length === 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                            <AlertTriangle className="shrink-0 mt-0.5" size={20}/>
                            <div>
                                <p className="font-bold text-sm">Vorschau:</p>
                                <p className="text-sm">
                                    Es werden <strong>{previewCount}</strong> von <strong>{selectedTable.data?.length || 0}</strong> Datensätzen gelöscht.
                                </p>
                                {previewCount === 0 && <p className="text-xs mt-1 opacity-70">Die aktuellen Kriterien treffen auf keine Datensätze zu.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex justify-between shrink-0">
            <button onClick={onClose} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium border border-slate-300">
                Abbrechen
            </button>
            
            <button 
                onClick={handleExecute} 
                disabled={!selectedTable || previewCount === 0}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Trash2 size={18}/> Löschen ausführen
            </button>
        </div>
      </div>
    </div>
  );
};
