import React, { useState } from 'react';
import { QueryColumn, Table, AggregateFunction } from '../../types/index';
import { Trash2, GripVertical, Plus } from 'lucide-react';

interface QueryGridProps {
  columns: QueryColumn[];
  tables: Table[];
  onUpdateColumns: (cols: QueryColumn[]) => void;
  showTotals: boolean;
}

export const QueryGrid: React.FC<QueryGridProps> = ({ columns, tables, onUpdateColumns, showTotals }) => {
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
        // Auto-add new empty criteria row if typing in the last one
        if (criteriaIndex === col.criteria.length - 1 && value.trim() !== '') {
          newCriteria.push('');
        }
        return { ...col, criteria: newCriteria };
      }
      return col;
    });
    onUpdateColumns(newColumns);
  };

  // Column Reordering (Drag and Drop)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    // Setting dummy data is required for Drag & Drop to work correctly in some browsers (e.g. Firefox)
    // and prevents "Unexpected end of JSON input" if drop handlers try to parse empty data.
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === index) return;
    
    // Reorder array
    const newCols = [...columns];
    const draggedItem = newCols[draggedColIndex];
    newCols.splice(draggedColIndex, 1);
    newCols.splice(index, 0, draggedItem);
    
    onUpdateColumns(newCols);
    setDraggedColIndex(index);
  };

  const maxCriteriaRows = Math.max(1, ...columns.map(c => c.criteria.length));

  return (
    <div className="flex-1 p-2 overflow-auto bg-white">
      <table className="w-full text-xs border-collapse table-fixed min-w-max">
        <tbody>
          {/* Header Actions (Delete / Drag) */}
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

          {/* Field Name / Expression */}
          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Feld:</th>
            {columns.map(col => (
              <td key={col.id} className="border border-slate-300 p-0">
                {col.isCalculated ? (
                   <input 
                    type="text" 
                    className="w-full h-full p-1 border-none bg-blue-50 font-mono text-blue-900" 
                    value={col.expression || ''} 
                    placeholder="Berechnung..."
                    title="Beispiel: {{Tabelle.Feld}} & ' ' & {{Tabelle.Feld}}"
                    onChange={e => updateColumn(col.id, { expression: e.target.value })} 
                  />
                ) : (
                  <div className="p-1 truncate" title={col.fieldName}>{col.fieldName}</div>
                )}
              </td>
            ))}
          </tr>

          {/* Table Name */}
          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Tabelle:</th>
            {columns.map(col => (
              <td key={col.id} className="border border-slate-300 p-1 text-slate-500 truncate">
                {col.isCalculated ? 'Berechnet' : col.tableName}
              </td>
            ))}
          </tr>

          {/* Alias */}
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

          {/* Totals / Grouping */}
          {showTotals && (
             <tr>
                <th className="border border-slate-300 p-1 font-semibold text-left">Funktion:</th>
                {columns.map(col => (
                  <td key={col.id} className="border border-slate-300 p-0">
                    <select 
                      className="w-full h-full p-1 border-none bg-transparent"
                      value={col.aggregate || 'GROUP_BY'}
                      onChange={e => updateColumn(col.id, { aggregate: e.target.value as AggregateFunction })}
                    >
                      <option value="GROUP_BY">Gruppierung</option>
                      <option value="SUM">Summe</option>
                      <option value="COUNT">Anzahl</option>
                      <option value="AVG">Mittelwert</option>
                      <option value="MIN">Min</option>
                      <option value="MAX">Max</option>
                      <option value="EXPRESSION">Ausdruck</option>
                    </select>
                  </td>
                ))}
             </tr>
          )}

          {/* Sort */}
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

          {/* Show Checkbox */}
          <tr>
            <th className="border border-slate-300 p-1 font-semibold text-left">Anzeigen:</th>
            {columns.map(col => (
              <td key={col.id} className="border border-slate-300 p-1 text-center">
                <input type="checkbox" checked={col.show} onChange={e => updateColumn(col.id, { show: e.target.checked })}/>
              </td>
            ))}
          </tr>

          {/* Criteria Rows */}
          {Array.from({ length: maxCriteriaRows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <th className="border border-slate-300 p-1 font-semibold text-left text-slate-500">
                {rowIndex === 0 ? 'Kriterien:' : 'oder:'}
              </th>
              {columns.map((col) => (
                <td key={col.id} className="border border-slate-300 p-0">
                  <input 
                    type="text" 
                    className="w-full h-full p-1 border-none bg-transparent" 
                    value={col.criteria[rowIndex] ?? ''} 
                    onChange={e => handleCriteriaChange(col.id, rowIndex, e.target.value)}
                    placeholder={rowIndex === 0 ? 'z.B. >10' : ''}
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