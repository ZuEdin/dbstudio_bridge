
import React, { useState, useEffect } from 'react';
import { Table, Field, InsertQuery } from '../../../types/index';
import { X, ArrowRight, CopyPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface AppendQueryWizardProps {
  tables: Table[];
  onExecute: (sourceTable: Table, targetTable: Table, mapping: Record<string, string>) => void;
  onSave?: (query: InsertQuery) => void;
  onClose: () => void;
}

export const AppendQueryWizard: React.FC<AppendQueryWizardProps> = ({ tables, onExecute, onSave, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [queryName, setQueryName] = useState('Neue Anfügeabfrage');
  const [sourceTableId, setSourceTableId] = useState('');
  const [targetTableId, setTargetTableId] = useState('');
  
  // Mapping: TargetFieldId -> SourceFieldId
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  const sourceTable = tables.find(t => t.id === sourceTableId);
  const targetTable = tables.find(t => t.id === targetTableId);

  // Auto-Match fields by name on selection
  useEffect(() => {
      if (sourceTable && targetTable) {
          const initialMap: Record<string, string> = {};
          targetTable.fields.forEach(targetField => {
              if (targetField.isAutoIncrement) return; // Skip ID
              
              // Try exact match
              const match = sourceTable.fields.find(f => f.name.toLowerCase() === targetField.name.toLowerCase());
              if (match) {
                  // Check simple type compatibility
                  if (isCompatible(match.type, targetField.type)) {
                      initialMap[targetField.id] = match.id;
                  }
              }
          });
          setFieldMapping(initialMap);
      }
  }, [sourceTableId, targetTableId]);

  const isCompatible = (sourceType: string, targetType: string) => {
      if (sourceType === targetType) return true;
      if (targetType === 'VARCHAR' || targetType === 'TEXT') return true; // Can map anything to string
      return false;
  };

  const handleExecute = () => {
      if (!sourceTable || !targetTable) return;
      if (onSave) {
          onSave({
              id: crypto.randomUUID(),
              type: 'INSERT',
              name: queryName,
              sourceTableId: sourceTable.id,
              targetTableId: targetTable.id,
              fieldMapping
          });
      } else {
          onExecute(sourceTable, targetTable, fieldMapping);
      }
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-slate-300 flex flex-col h-[600px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-700 to-blue-600 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <CopyPlus className="text-blue-200"/> Anfügeabfrage Assistent
            </h2>
            <p className="text-blue-100 text-sm mt-1">Daten von einer Tabelle in eine andere kopieren.</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
            
            {step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Von (Quelle)</label>
                            <select 
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={sourceTableId}
                                onChange={e => setSourceTableId(e.target.value)}
                            >
                                <option value="">Bitte wählen...</option>
                                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {sourceTable && (
                                <div className="mt-2 text-xs text-slate-500">
                                    {sourceTable.fields.length} Felder, {sourceTable.data?.length || 0} Datensätze
                                </div>
                            )}
                        </div>

                        <div className="text-slate-400">
                            <ArrowRight size={32} />
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Nach (Ziel)</label>
                            <select 
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={targetTableId}
                                onChange={e => setTargetTableId(e.target.value)}
                            >
                                <option value="">Bitte wählen...</option>
                                {tables.filter(t => t.id !== sourceTableId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {targetTable && (
                                <div className="mt-2 text-xs text-slate-500">
                                    {targetTable.fields.length} Felder, {targetTable.data?.length || 0} Datensätze
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20}/>
                        <p className="text-sm text-blue-800 leading-relaxed">
                            <strong>Hinweis:</strong> Im nächsten Schritt können Sie definieren, welche Felder übertragen werden sollen. 
                            Felder mit gleichem Namen werden automatisch vorgeschlagen.
                        </p>
                    </div>
                </div>
            )}

            {step === 2 && sourceTable && targetTable && (
                <div className="animate-in slide-in-from-right-4 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Feld-Zuordnung (Mapping)</h3>
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">
                            Quelle: {sourceTable.name} &rarr; Ziel: {targetTable.name}
                        </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-500 font-semibold border-b">
                                <tr>
                                    <th className="p-3 text-left w-1/2 border-r">Ziel-Feld (in {targetTable.name})</th>
                                    <th className="p-3 text-left w-1/2">Quell-Feld (aus {sourceTable.name})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {targetTable.fields.map(targetField => {
                                    const selectedSourceId = fieldMapping[targetField.id] || '';
                                    const isMapped = !!selectedSourceId;
                                    const isPK = targetField.isPrimaryKey || targetField.isAutoIncrement;

                                    return (
                                        <tr key={targetField.id} className={isMapped ? 'bg-green-50/30' : 'bg-white'}>
                                            <td className="p-3 border-r border-slate-100 font-medium text-slate-700 flex items-center gap-2">
                                                {isPK && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">🔑 PK</span>}
                                                {targetField.name}
                                                <span className="text-[10px] text-slate-400 font-normal border px-1 rounded bg-slate-50">{targetField.type}</span>
                                                {targetField.allowNull === false && <span className="text-red-500 text-[10px] ml-auto">*Pflicht</span>}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <select 
                                                        className={`flex-1 border rounded p-1.5 outline-none transition-colors ${isMapped ? 'border-green-300 bg-white text-green-900 font-medium' : 'border-slate-300 text-slate-500'}`}
                                                        value={selectedSourceId.startsWith('CONST:') ? 'CUSTOM' : selectedSourceId}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (val === 'CUSTOM') {
                                                                setFieldMapping({...fieldMapping, [targetField.id]: 'CONST:'});
                                                            } else {
                                                                setFieldMapping({...fieldMapping, [targetField.id]: val});
                                                            }
                                                        }}
                                                    >
                                                        <option value="">(Ignorieren / Auto)</option>
                                                        <option value="CUSTOM">⚡ Manuelle Konstante / Wert</option>
                                                        {sourceTable.fields.map(sf => (
                                                            <option key={sf.id} value={sf.id}>
                                                                {sf.name} ({sf.type})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {selectedSourceId.startsWith('CONST:') && (
                                                        <input 
                                                            type="text"
                                                            placeholder="Konstanter Wert..."
                                                            value={selectedSourceId.substring(6)}
                                                            onChange={e => setFieldMapping({...fieldMapping, [targetField.id]: `CONST:${e.target.value}`})}
                                                            className="w-40 border border-blue-300 bg-blue-50/50 rounded px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-4 text-right text-xs text-slate-500">
                        Es werden <strong>{sourceTable.data?.length || 0}</strong> Datensätze angefügt.
                    </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex justify-between shrink-0">
            {step === 2 ? (
                <button onClick={() => setStep(1)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium border border-slate-300">
                    Zurück
                </button>
            ) : (
                <div></div>
            )}

            {step === 1 && (
                <button 
                    onClick={() => setStep(2)} 
                    disabled={!sourceTableId || !targetTableId || sourceTableId === targetTableId}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Weiter <ArrowRight size={18}/>
                </button>
            )}
            
            {step === 2 && (
                <button 
                    onClick={handleExecute} 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded font-bold shadow-md flex items-center gap-2"
                >
                    <CheckCircle2 size={18}/> Abfrage ausführen
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
