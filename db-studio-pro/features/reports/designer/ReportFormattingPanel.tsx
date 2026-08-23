
import React from 'react';
import { ReportColumn, FormattingRule } from '../../../types/index';
import { Palette, Trash2, Plus } from 'lucide-react';

interface ReportFormattingPanelProps {
  column: ReportColumn;
  onUpdateColumn: (updates: Partial<ReportColumn>) => void;
  onClose: () => void;
}

export const ReportFormattingPanel: React.FC<ReportFormattingPanelProps> = ({ column, onUpdateColumn, onClose }) => {
  
  const addRule = () => {
      const newRules = [...(column.formattingRules || [])];
      newRules.push({
          operator: 'lt',
          value: '0',
          style: { color: '#ef4444', bold: true } 
      });
      onUpdateColumn({ formattingRules: newRules });
  };

  const updateRule = (index: number, updates: Partial<FormattingRule>) => {
      const newRules = [...(column.formattingRules || [])];
      newRules[index] = { ...newRules[index], ...updates };
      onUpdateColumn({ formattingRules: newRules });
  };

  const removeRule = (index: number) => {
      const newRules = (column.formattingRules || []).filter((_, i) => i !== index);
      onUpdateColumn({ formattingRules: newRules });
  };

  return (
      <div className="flex flex-col h-full bg-white border-l border-slate-300 w-80">
          <div className="p-4 border-b border-slate-200 bg-purple-50 flex justify-between items-center">
              <h3 className="font-bold text-purple-800 flex items-center gap-2">
                  <Palette size={16} /> Bedingte Formatierung
              </h3>
              <button onClick={onClose} className="text-purple-400 hover:text-purple-700 text-sm">Schließen</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-4">
                  Spalte: <strong>{column.label}</strong>
              </p>
              
              <div className="space-y-4">
                  {column.formattingRules?.map((rule, rIdx) => (
                      <div key={rIdx} className="border border-slate-200 rounded p-3 bg-white shadow-sm text-sm">
                          <div className="flex gap-2 mb-2">
                              <select 
                                className="border rounded p-1 flex-1 text-xs"
                                value={rule.operator}
                                onChange={e => updateRule(rIdx, { operator: e.target.value as any })}
                              >
                                  <option value="eq">Gleich (=)</option>
                                  <option value="neq">Ungleich (!=)</option>
                                  <option value="lt">Kleiner (&lt;)</option>
                                  <option value="gt">Größer (&gt;)</option>
                                  <option value="lte">Kleiner gleich (&lt;=)</option>
                                  <option value="gte">Größer gleich (&gt;=)</option>
                                  <option value="contains">Enthält</option>
                              </select>
                              <input 
                                type="text" 
                                className="border rounded p-1 w-20 text-xs"
                                value={rule.value}
                                onChange={e => updateRule(rIdx, { value: e.target.value })}
                                placeholder="Wert"
                              />
                          </div>
                          <div className="flex gap-2 items-center">
                              <span className="text-xs text-slate-400">Dann:</span>
                              <input 
                                type="color" 
                                value={rule.style.color || '#000000'}
                                onChange={e => updateRule(rIdx, { style: { ...rule.style, color: e.target.value } })}
                                className="h-6 w-8 p-0 border-0"
                                title="Textfarbe"
                              />
                              <label className="flex items-center gap-1 text-xs">
                                  <input 
                                    type="checkbox" 
                                    checked={rule.style.bold === true}
                                    onChange={e => updateRule(rIdx, { style: { ...rule.style, bold: e.target.checked } })}
                                  /> Fett
                              </label>
                              <button onClick={() => removeRule(rIdx)} className="ml-auto text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                      </div>
                  ))}
                  
                  <button onClick={addRule} className="w-full py-2 border border-dashed border-purple-300 text-purple-600 rounded hover:bg-purple-50 flex items-center justify-center gap-2 text-sm">
                      <Plus size={14}/> Regel hinzufügen
                  </button>
              </div>
          </div>
      </div>
  );
};
