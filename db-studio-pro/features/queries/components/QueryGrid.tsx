
import React, { useState, useEffect, useRef } from 'react';
import { QueryColumn, Table, AggregateFunction, Form, Query } from '../../../types/index';
import { Trash2, GripVertical, Plus, Wand2 } from 'lucide-react';

const CalculatedFieldEditor: React.FC<{
  column: QueryColumn;
  tables: Table[];
  onUpdate: (expr: string) => void;
}> = ({ column, tables, onUpdate }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full h-full">
      <input 
        type="text" 
        className="w-full h-full p-1 border-none bg-blue-50 font-mono text-blue-900 outline-none focus:ring-1 focus:ring-blue-400" 
        value={column.expression || ''} 
        placeholder='"Tabelle"."Preis" * 1.2'
        onChange={e => onUpdate(e.target.value)} 
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />
      {isFocused && (
        <div className="absolute top-full left-0 mt-1 w-72 max-h-64 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded z-50 text-xs p-2 whitespace-normal flex flex-col gap-2">
            <div className="text-slate-500 font-semibold mb-1 border-b pb-1">SQL Berechnungsvorschläge</div>
            
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <p className="font-semibold text-slate-700 mb-1">Syntax Beispiele:</p>
                <div className="font-mono text-[10px] text-blue-700 space-y-1">
                    <div>"Tabelle"."Menge" * "Tabelle"."Preis"</div>
                    <div>"Kunden"."Vorname" || ' ' || "Kunden"."Nachname"</div>
                </div>
                <p className="text-slate-500 mt-1">Klicken Sie auf ein Feld unten, um es einzufügen.</p>
            </div>

            <div className="font-semibold text-slate-700 mt-1">Verfügbare Felder:</div>
            {tables.map(t => (
                <div key={t.id} className="mb-2">
                    <div className="font-bold text-slate-600 border-b border-slate-100">{t.name}</div>
                    <div className="flex flex-col gap-0.5 mt-1">
                        {t.fields.map(f => {
                            const fieldStr = `"${t.name}"."${f.name}"`;
                            return (
                                <button 
                                    key={f.id} 
                                    className="text-left font-mono text-[10px] bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 p-1 rounded" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        const prefix = column.expression?.trim() ? column.expression + ' ' : '';
                                        onUpdate(prefix + fieldStr); 
                                    }}
                                >
                                    + {fieldStr}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

interface QueryGridProps {
  columns: QueryColumn[];
  tables: Table[];
  forms?: Form[];
  queries?: Query[];
  onUpdateColumns: (cols: QueryColumn[]) => void;
  showTotals: boolean;
}

const CriteriaInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  forms: Form[];
  tables: Table[];
}> = ({ value, onChange, placeholder, forms, tables }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setShowSuggestions(false);
      return;
    }
    
    const lowerVal = value.toLowerCase();
    let newSuggestions: string[] = [];
    let shouldShow = false;

    if (lowerVal.match(/\[forms\]!\[[^\]]+\]!\[$/i)) {
       const match = lowerVal.match(/\[forms\]!\[([^\]]+)\]!\[$/i);
       if (match && match[1]) {
           const formName = match[1];
           const form = forms.find(f => f.name.toLowerCase() === formName);
           if (form) {
               const table = tables.find(t => t.id === form.sourceId);
               if (table) {
                   newSuggestions = table.fields.map(f => f.name);
                   shouldShow = true;
               }
           }
       }
    } else if (lowerVal.endsWith('[forms]![')) {
       newSuggestions = forms.map(f => f.name);
       shouldShow = true;
    } else if (lowerVal.endsWith('[')) {
       newSuggestions = ['Forms'];
       shouldShow = true;
    }

    setSuggestions(newSuggestions);
    setShowSuggestions(shouldShow);
  }, [value, isFocused, forms, tables]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = (suggestion: string) => {
    let newVal = value;
    const lowerVal = value.toLowerCase();
    if (lowerVal.match(/\[forms\]!\[[^\]]+\]!\[$/i)) {
       newVal = value + suggestion + ']';
    } else if (lowerVal.endsWith('[forms]![')) {
       newVal = value + suggestion + ']![';
    } else if (lowerVal.endsWith('[')) {
       newVal = value + suggestion + ']![';
    }
    onChange(newVal);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full h-full flex items-center group ${showSuggestions || isFocused ? 'z-50' : ''}`}>
       <input
         ref={inputRef}
         type="text"
         className="w-full h-full p-1 border-none bg-transparent outline-none focus:ring-1 focus:ring-blue-400"
         value={value}
         onChange={handleChange}
         placeholder={placeholder}
         onFocus={() => setIsFocused(true)}
         onBlur={() => setTimeout(() => setIsFocused(false), 200)}
       />
       {/* Expression Builder Button Stub */}
       <button 
         title="Ausdrucks-Generator"
         className="absolute right-1 opacity-0 group-hover:opacity-100 hover:text-blue-600 text-slate-400 p-1 bg-white"
         onClick={() => {
             // In a full implementation, this would open a dialog.
             // For now, we simulate a click to just focus or alert.
             if (!value) onChange('[Forms]![');
             inputRef.current?.focus();
         }}
       >
         <Wand2 size={12} />
       </button>
       
       {showSuggestions && suggestions.length > 0 && (
         <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 shadow-2xl rounded z-[9999] text-xs py-1">
           <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 mb-1">
               Vorschläge
           </div>
           {suggestions.map(s => (
             <div 
               key={s} 
               className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer text-slate-700 font-medium"
               onMouseDown={(e) => {
                   e.preventDefault(); // Keep focus
                   handleSelect(s);
               }}
             >
               {s}
             </div>
           ))}
         </div>
       )}
    </div>
  );
};

export const QueryGrid: React.FC<QueryGridProps> = ({ columns, tables, forms = [], queries = [], onUpdateColumns, showTotals }) => {
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);

  const updateColumn = (id: string, updates: Partial<QueryColumn>) => {
    onUpdateColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeColumn = (id: string) => {
    onUpdateColumns(columns.filter(c => c.id !== id));
  };

  const handleCriteriaChange = (columnId: string, criteriaIndex: number, value: string) => {
    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        const newCriteria = [...col.criteria];
        newCriteria[criteriaIndex] = value;
        if (criteriaIndex === col.criteria.length - 1 && value.trim() !== '') {
          newCriteria.push('');
        }
        return { ...col, criteria: newCriteria };
      }
      return col;
    });
    onUpdateColumns(newColumns);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === index) return;
    
    const newCols = [...columns];
    const draggedItem = newCols[draggedColIndex];
    newCols.splice(draggedColIndex, 1);
    newCols.splice(index, 0, draggedItem);
    
    onUpdateColumns(newCols);
    setDraggedColIndex(index);
  };

  const maxCriteriaRows = Math.max(1, ...columns.map(c => c.criteria.length));

  return (
    <div className="flex-1 p-2 pb-48 overflow-auto bg-white">
      <table className="w-full text-xs border-collapse table-fixed min-w-max">
        <tbody>
          <tr className="bg-slate-50">
            <th className="border border-slate-300 p-1 w-24 bg-slate-100"></th>
            {columns.map((col, idx) => (
              <td 
                key={col.id} 
                className="border border-slate-300 p-1 text-center bg-slate-100 relative group w-40"
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
              >
                <div className="flex justify-between items-center px-1">
                   <GripVertical size={12} className="text-slate-400 cursor-move" />
                   <button onClick={() => removeColumn(col.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                </div>
              </td>
            ))}
          </tr>

          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Feld:</th>
            {columns.map(col => (
              <td key={col.id} className="border border-slate-300 p-0 !overflow-visible">
                {col.isCalculated ? (
                   <CalculatedFieldEditor 
                      column={col} 
                      tables={tables} 
                      onUpdate={(expr) => updateColumn(col.id, { expression: expr })} 
                   />
                ) : (
                  <div className="p-1 truncate" title={col.fieldName}>{col.fieldName}</div>
                )}
              </td>
            ))}
          </tr>

          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Tabelle:</th>
            {columns.map(col => (
              <td key={col.id} className="border border-slate-300 p-1 text-slate-500 truncate">
                {col.isCalculated ? 'Berechnet' : col.tableName}
              </td>
            ))}
          </tr>

          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Alias:</th>
            {columns.map(col => (
               <td key={col.id} className="border border-slate-300 p-0">
                 <input 
                    type="text" 
                    className="w-full h-full p-1 border-none bg-transparent placeholder-slate-300" 
                    value={col.alias || ''} 
                    placeholder={col.fieldName}
                    onChange={e => updateColumn(col.id, { alias: e.target.value })} 
                  />
               </td>
            ))}
          </tr>

          {showTotals && (
             <tr>
                <th className="border border-slate-300 p-1 font-semibold text-left bg-yellow-50/50">Funktion:</th>
                {columns.map(col => (
                  <td key={col.id} className="border border-slate-300 p-0 bg-yellow-50/30">
                    <select 
                      className="w-full h-full p-1 border-none bg-transparent font-semibold text-slate-700"
                      value={col.aggregate || 'GROUP_BY'}
                      onChange={e => updateColumn(col.id, { aggregate: e.target.value as AggregateFunction })}
                    >
                      <option value="GROUP_BY">Gruppierung</option>
                      <option value="SUM">Summe</option>
                      <option value="COUNT">Anzahl</option>
                      <option value="AVG">Mittelwert</option>
                      <option value="MIN">Minimum</option>
                      <option value="MAX">Maximum</option>
                      <option value="FIRST">Erster Wert</option>
                      <option value="LAST">Letzter Wert</option>
                      <option value="EXPRESSION">Ausdruck</option>
                    </select>
                  </td>
                ))}
             </tr>
          )}

          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Sortierung:</th>
            {columns.map(col => (
               <td key={col.id} className="border border-slate-300 p-0">
                 <select 
                    className="w-full h-full p-1 border-none bg-transparent"
                    value={col.sort}
                    onChange={e => updateColumn(col.id, { sort: e.target.value as any })}
                  >
                    <option value="">(keine)</option>
                    <option value="ASC">Aufsteigend</option>
                    <option value="DESC">Absteigend</option>
                  </select>
               </td>
            ))}
          </tr>

          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Anzeigen:</th>
            {columns.map(col => (
              <td key={col.id} className="border border-slate-300 p-1 text-center">
                <input type="checkbox" checked={col.show} onChange={e => updateColumn(col.id, { show: e.target.checked })}/>
              </td>
            ))}
          </tr>

          {Array.from({ length: maxCriteriaRows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <th className="border border-slate-300 p-1 font-semibold text-left text-slate-500">
                {rowIndex === 0 ? 'Kriterien:' : 'oder:'}
              </th>
              {columns.map((col) => (
                <td key={col.id} className="border border-slate-300 p-0 relative focus-within:z-50">
                  <CriteriaInput
                    value={col.criteria[rowIndex] ?? ''}
                    onChange={(val) => handleCriteriaChange(col.id, rowIndex, val)}
                    placeholder={rowIndex === 0 ? 'z.B. >10' : ''}
                    forms={forms}
                    tables={tables}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {columns.length === 0 && (
        <div className="text-center text-slate-400 py-8 border border-dashed border-slate-300 mt-2 rounded">
          Ziehen Sie Felder aus den obigen Tabellen hierher.
        </div>
      )}
    </div>
  );
};
