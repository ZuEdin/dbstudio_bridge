import React, { useState } from 'react';
import { Table, UpdateQuery, Criterion } from '../../../types/index';
import { X, RefreshCw, AlertTriangle, Plus, Filter, Database, Trash2 } from 'lucide-react';

interface UpdateQueryWizardProps {
  tables: Table[];
  onSave: (query: UpdateQuery) => void;
  onClose: () => void;
}

export const UpdateQueryWizard: React.FC<UpdateQueryWizardProps> = ({ tables, onSave, onClose }) => {
  const [queryName, setQueryName] = useState('Neue Aktualisierungsabfrage');
  const [tableId, setTableId] = useState('');
  
  // Mapping: fieldId -> newValueExpression
  const [updateMap, setUpdateMap] = useState<Record<string, string>>({});
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

  const handleUpdateMapChange = (fieldId: string, val: string) => {
      setUpdateMap(prev => {
          const next = { ...prev };
          if (!val) {
              delete next[fieldId];
          } else {
              next[fieldId] = val;
          }
          return next;
      });
  };

  const handleExecute = () => {
      if (!selectedTable) return;
      
      onSave({
          id: crypto.randomUUID(),
          type: 'UPDATE',
          name: queryName,
          targetTableId: selectedTable.id,
          updateMap,
          criteria
      });
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-slate-300 flex flex-col h-[700px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-700 to-blue-600 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"> 
              <RefreshCw className="text-blue-200"/> Aktualisierungsabfrage Assistent
            </h2>
            <p className="text-blue-100 text-sm mt-1">Datensätze in einer Tabelle ändern.</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
            <div className="space-y-6">
                
                {/* Abfrage Name */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Abfrage Name</label>
                    <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={queryName}
                        onChange={e => setQueryName(e.target.value)}
                        placeholder="Z.B. Preise erhöhen"
                    />
                </div>

                {/* Table Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Zieltabelle</label>
                    <select 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={tableId}
                        onChange={e => { 
                            setTableId(e.target.value); 
                            setCriteria([]); 
                            setUpdateMap({}); 
                        }}
                    >
                        <option value="">Bitte wählen...</option>
                        {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.data?.length || 0} Zeilen)</option>)}
                    </select>
                </div>

                {selectedTable && (
                    <div className="animate-in slide-in-from-right-2 space-y-8">
                        {/* Update Fields (SET) */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-2">
                                <Database size={14}/> Aktualisieren auf (SET)
                            </label>
                            <div className="bg-white p-4 rounded border border-slate-200 shadow-sm max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-slate-500 border-b">
                                            <th className="pb-2 font-semibold">Feld</th>
                                            <th className="pb-2 font-semibold">Neuer Wert / Ausdruck</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedTable.fields.map(f => {
                                            const isPK = f.isPrimaryKey || f.isAutoIncrement;
                                            return (
                                                <tr key={f.id}>
                                                    <td className="py-2 pr-4 font-medium text-slate-700 flex items-center gap-1.5">
                                                        {isPK && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">🔑 PK</span>}
                                                        {f.name}
                                                    </td>
                                                    <td className="py-2">
                                                        <input 
                                                            type="text" 
                                                            className="w-full border border-slate-300 rounded p-1.5 focus:border-blue-500 outline-none"
                                                            placeholder="Z.B. 'Neuer Wert' oder FeldName * 1.1"
                                                            value={updateMap[f.id] || ''}
                                                            onChange={e => handleUpdateMapChange(f.id, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Criteria (WHERE) */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                                    <Filter size={14}/> Kriterien (WHERE)
                                </label>
                                <button onClick={addCriterion} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 flex items-center gap-1">
                                    <Plus size={12}/> Kriterium hinzufügen
                                </button>
                            </div>
                            <div className="space-y-2 bg-white p-4 rounded border border-slate-200 shadow-sm min-h-[100px]">
                                {criteria.length === 0 && (
                                    <p className="text-sm text-slate-400 italic text-center py-4">Keine Einschränkungen. Alle Datensätze werden aktualisiert.</p>
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
                disabled={!selectedTable || Object.keys(updateMap).length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshCw size={18}/> Abfrage Speichern
            </button>
        </div>
      </div>
    </div>
  );
};
