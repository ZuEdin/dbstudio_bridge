
import React, { useState, useMemo } from 'react';
import { Table } from '../../../types/index';
import { Settings2, Plus, Trash2, CheckCircle, HelpCircle, Play, Sparkles } from 'lucide-react';

interface KanbanBoardProps {
  table: Table;
  onUpdateRow: (row: any, fieldNameOrUpdates: any, newValue?: any) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ table, onUpdateRow }) => {
  const [groupBy, setGroupBy] = useState<string>('');
  const [titleField, setTitleField] = useState<string>('');
  
  // Auto-Select defaults on init
  useMemo(() => {
      const statusField = table.fields.find(f => f.name.toLowerCase().includes('status') || f.name.toLowerCase().includes('state') || f.name.toLowerCase().includes('kategorie'));
      const labelField = table.fields.find(f => f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('titel') || f.name.toLowerCase().includes('bez'));
      
      if (statusField && !groupBy) setGroupBy(statusField.name);
      else if (!groupBy && table.fields.length > 1) setGroupBy(table.fields[1].name);

      if (labelField && !titleField) setTitleField(labelField.name);
      else if (!titleField && table.fields.length > 0) setTitleField(table.fields[0].name);
  }, [table]);

  const columns = useMemo(() => {
      if (!groupBy) return [];
      const distinct = new Set<string>();
      (table.data || []).forEach(row => {
          const val = row[groupBy];
          if (val !== undefined && val !== null) distinct.add(String(val));
      });
      return Array.from(distinct).sort();
  }, [table.data, groupBy]);

  // Kanban Drag & Drop Updates Configuration
  const [pendingDrop, setPendingDrop] = useState<{ row: any; fromCol: string; toCol: string } | null>(null);
  const [additionalUpdates, setAdditionalUpdates] = useState<Array<{ fieldName: string; value: string }>>([]);
  const [rememberKanbanRule, setRememberKanbanRule] = useState(false);

  const handleDragStart = (e: React.DragEvent, row: any) => {
      // Find PK to identify row
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const id = row[pkField.name];
      e.dataTransfer.setData('text/plain', JSON.stringify({ id, pkName: pkField.name }));
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColValue: string) => {
      e.preventDefault();
      try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const row = table.data?.find(r => String(r[data.pkName]) === String(data.id));
          
          if (row && String(row[groupBy]) !== targetColValue) {
              const fromVal = String(row[groupBy]);
              
              // Check for saved rule
              const ruleKey = `kanban_rule_${table.id}_${groupBy}`;
              const savedRuleStr = localStorage.getItem(ruleKey);
              if (savedRuleStr) {
                  try {
                      const rule = JSON.parse(savedRuleStr);
                      executeDrop(row, targetColValue, rule.additionalUpdates);
                      return;
                  } catch (err) {
                      console.error("Failed to parse saved Kanban rule", err);
                  }
              }

              // Pre-populate suggestions for dates/timestamps
              const suggestedUpdates: Array<{ fieldName: string; value: string }> = [];
              table.fields.forEach(f => {
                  const nameLower = f.name.toLowerCase();
                  if (nameLower !== groupBy.toLowerCase() && !f.isPrimaryKey && !f.isAutoIncrement) {
                      if (nameLower.includes('date') || nameLower.includes('time') || nameLower.includes('modified') || nameLower.includes('update') || nameLower.includes('changed') || nameLower.includes('timestamp') || nameLower.includes('geaendert') || nameLower.includes('datum')) {
                          suggestedUpdates.push({ fieldName: f.name, value: 'NOW' });
                      }
                  }
              });

              setAdditionalUpdates(suggestedUpdates);
              setPendingDrop({ row, fromCol: fromVal, toCol: targetColValue });
          }
      } catch (err) {
          console.error(err);
      }
  };

  const executeDrop = (row: any, targetColValue: string, updates: Array<{ fieldName: string; value: string }>) => {
      const updatesObj: Record<string, any> = {
          [groupBy]: targetColValue
      };

      updates.forEach(u => {
          const field = table.fields.find(f => f.name === u.fieldName);
          if (!field) return;

          let finalVal: any = u.value;
          if (u.value === 'NOW') {
              if (field.type === 'DATE') {
                  finalVal = new Date().toISOString().split('T')[0];
              } else if (field.type === 'TIME') {
                  finalVal = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else {
                  finalVal = new Date().toISOString();
              }
          } else if (field.type === 'BOOLEAN') {
              finalVal = u.value === 'true' || u.value === '1';
          } else if (field.type === 'INTEGER' || field.type === 'DECIMAL' || field.type === 'REAL') {
              const parsed = Number(u.value);
              finalVal = isNaN(parsed) ? 0 : parsed;
          }

          updatesObj[u.fieldName] = finalVal;
      });

      // Execute bulk update
      onUpdateRow(row, updatesObj);

      // Save rule if checked
      if (rememberKanbanRule) {
          const ruleKey = `kanban_rule_${table.id}_${groupBy}`;
          localStorage.setItem(ruleKey, JSON.stringify({
              additionalUpdates: updates
          }));
      }

      setPendingDrop(null);
  };

  if (!groupBy || !titleField) {
      return <div className="p-8 text-center text-slate-400">Bitte wählen Sie Spalten für die Gruppierung aus.</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <div className="flex gap-4 p-2 bg-slate-100 border-b border-slate-200 items-center text-sm">
            <div className="flex items-center gap-2">
                <Settings2 size={14} className="text-slate-500"/>
                <span className="font-bold text-slate-600">Board Config:</span>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 uppercase font-bold">Spalten (Status):</label>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                    {table.fields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 uppercase font-bold">Karten-Titel:</label>
                <select value={titleField} onChange={e => setTitleField(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                    {table.fields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
            </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-slate-200">
            <div className="flex h-full gap-4">
                {columns.map(colVal => (
                    <div 
                        key={colVal} 
                        className="w-72 flex flex-col bg-slate-100 rounded-lg shadow-sm border border-slate-300 max-h-full"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => handleDrop(e, colVal)}
                    >
                        <div className="p-3 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-lg">
                            <span className="truncate">{colVal || 'Ohne Wert'}</span>
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                {table.data?.filter(r => String(r[groupBy]) === colVal).length}
                            </span>
                        </div>
                        <div className="p-2 flex-1 overflow-y-auto space-y-2">
                            {table.data?.filter(r => String(r[groupBy]) === colVal).map((row, idx) => (
                                <div 
                                    key={idx} 
                                    draggable
                                    onDragStart={e => handleDragStart(e, row)}
                                    className="bg-white p-3 rounded border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all group"
                                >
                                    <div className="font-bold text-sm text-slate-800 mb-1">
                                        {row[titleField]}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                        {Object.keys(row).filter(k => k !== groupBy && k !== titleField && k !== 'Id').slice(0, 2).map(k => `${k}: ${row[k]}`).join(' | ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {columns.length === 0 && (
                    <div className="m-auto text-slate-400">Keine Gruppen gefunden. Prüfen Sie die Daten.</div>
                )}
            </div>
        </div>

        {pendingDrop && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in-30">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bg-indigo-600 text-white p-5 flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                            <Sparkles size={20} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold">Drag & Drop-Regel anwenden</h3>
                            <p className="text-xs text-indigo-100 mt-0.5">Zusätzliche Updates für dieses Board festlegen</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[60vh]">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Verschiebung</p>
                            <p className="text-sm text-slate-800 leading-normal">
                                Karte <span className="font-bold text-slate-900">"{pendingDrop.row[titleField]}"</span> wechselt von <span className="line-through text-red-500 font-medium">{pendingDrop.fromCol || 'unbekannt'}</span> nach <span className="text-emerald-600 font-bold">{pendingDrop.toCol}</span>.
                            </p>
                        </div>

                        {/* Main Group Update */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Primäres Feld (Wird aktualisiert)</label>
                            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 text-xs text-indigo-800">
                                <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                                <span>Spalte <span className="font-bold">"{groupBy}"</span> wird auf <span className="font-bold">"{pendingDrop.toCol}"</span> gesetzt.</span>
                            </div>
                        </div>

                        {/* Additional Fields Update */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">2. Zusatzfelder anpassen</label>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const remainingField = table.fields.find(f => f.name !== groupBy && !f.isPrimaryKey && !f.isAutoIncrement && !additionalUpdates.some(u => u.fieldName === f.name));
                                        if (remainingField) {
                                            setAdditionalUpdates([...additionalUpdates, { fieldName: remainingField.name, value: '' }]);
                                        } else if (table.fields.length > 0) {
                                            setAdditionalUpdates([...additionalUpdates, { fieldName: table.fields[0].name, value: '' }]);
                                        }
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                                >
                                    + Zusatzfeld hinzufügen
                                </button>
                            </div>

                            {additionalUpdates.length === 0 ? (
                                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 border border-dashed rounded-xl text-center">
                                    Keine Zusatzfelder konfiguriert. Nur das Haupt-Gruppenfeld wird aktualisiert.
                                </p>
                            ) : (
                                <div className="space-y-2.5">
                                    {additionalUpdates.map((update, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                            <select 
                                                value={update.fieldName}
                                                onChange={e => {
                                                    const newUpdates = [...additionalUpdates];
                                                    const n = e.target.value.toLowerCase();
                                                    let newVal = newUpdates[idx].value;
                                                    if (n.includes('date') || n.includes('time') || n.includes('modified') || n.includes('update') || n.includes('timestamp')) {
                                                        newVal = 'NOW';
                                                    }
                                                    newUpdates[idx] = { ...newUpdates[idx], fieldName: e.target.value, value: newVal };
                                                    setAdditionalUpdates(newUpdates);
                                                }}
                                                className="border border-slate-200 bg-white rounded-lg text-xs py-1 px-2 focus:ring-1 focus:ring-indigo-500"
                                            >
                                                {table.fields.filter(f => !f.isPrimaryKey && !f.isAutoIncrement).map(f => (
                                                    <option key={f.id} value={f.name}>{f.name}</option>
                                                ))}
                                            </select>

                                            <span className="text-xs font-bold text-slate-400">=</span>

                                            {update.value === 'NOW' ? (
                                                <div className="flex-1 flex gap-2 items-center">
                                                    <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-lg font-mono">Uhrzeit (NOW)</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            const newUpdates = [...additionalUpdates];
                                                            newUpdates[idx] = { ...newUpdates[idx], value: '' };
                                                            setAdditionalUpdates(newUpdates);
                                                        }}
                                                        className="text-[10px] text-indigo-600 underline font-medium"
                                                    >
                                                        Eigener Wert
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex gap-2 items-center">
                                                    <input 
                                                        type="text" 
                                                        value={update.value} 
                                                        onChange={e => {
                                                            const newUpdates = [...additionalUpdates];
                                                            newUpdates[idx] = { ...newUpdates[idx], value: e.target.value };
                                                            setAdditionalUpdates(newUpdates);
                                                        }}
                                                        placeholder="Wert..."
                                                        className="flex-1 border border-slate-200 bg-white rounded-lg text-xs py-1 px-2"
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            const newUpdates = [...additionalUpdates];
                                                            newUpdates[idx] = { ...newUpdates[idx], value: 'NOW' };
                                                            setAdditionalUpdates(newUpdates);
                                                        }}
                                                        className="text-[10px] text-indigo-600 underline font-medium"
                                                    >
                                                        Uhrzeit (NOW)
                                                    </button>
                                                </div>
                                            )}

                                            <button 
                                                type="button" 
                                                onClick={() => setAdditionalUpdates(additionalUpdates.filter((_, i) => i !== idx))}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Rule toggle */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="remember_kanban" 
                                checked={rememberKanbanRule}
                                onChange={e => setRememberKanbanRule(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <label htmlFor="remember_kanban" className="text-xs text-slate-600 font-medium select-none cursor-pointer">
                                Als Standard-Automatisierungsregel für dieses Board speichern
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100 shrink-0">
                        {localStorage.getItem(`kanban_rule_${table.id}_${groupBy}`) && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    localStorage.removeItem(`kanban_rule_${table.id}_${groupBy}`);
                                    alert("Automatisierungsregeln gelöscht.");
                                }}
                                className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                            >
                                Regel löschen
                            </button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button 
                                type="button" 
                                onClick={() => setPendingDrop(null)} 
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button 
                                type="button" 
                                onClick={() => executeDrop(pendingDrop.row, pendingDrop.toCol, additionalUpdates)} 
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                            >
                                Ausführen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
