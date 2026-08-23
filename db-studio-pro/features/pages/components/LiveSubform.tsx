import React, { useState, useEffect } from 'react';
import { PageComponent, Table } from '../../../types';
import { useProjectStore } from '../../../stores/useProjectStore';
import { Plus, Trash2, Edit2, Check, X, Layers, AlertCircle, DollarSign } from 'lucide-react';

interface LiveSubformProps {
  node: PageComponent;
  context?: Record<string, any>;
}

export const LiveSubform: React.FC<LiveSubformProps> = ({ node, context }) => {
  const { tables, updateTable } = useProjectStore();
  const props = node.props || {};
  const table = tables.find(t => t.id === props.subTableId);

  const foreignKeyField = props.foreignKeyField || 'parent_id';
  const parentKeyField = props.parentKeyField || 'id';
  const parentValue = context ? (context[parentKeyField] || context.id || context.Id || '1') : '1';

  // Filter items matching the foreign key
  const [items, setItems] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (table && table.data) {
      const filtered = table.data.filter((row: any) => {
        if (!row) return false;
        const rowFk = row[foreignKeyField] || row[foreignKeyField.toLowerCase()] || row.parent_id;
        return String(rowFk) === String(parentValue) || (!rowFk && parentValue === '1');
      });
      setItems(filtered.length > 0 ? filtered : (table.data.slice(0, 5) || []));
    } else {
      // Mock default sample rows for visual preview
      setItems([
        { id: 'pos_1', position: 1, bezeichnung: 'Materiallieferung Standard A', menge: 5, einzelpreis: 140.00, gesamtpreis: 700.00 },
        { id: 'pos_2', position: 2, bezeichnung: 'Montage- und Installationsarbeiten', menge: 12, einzelpreis: 85.00, gesamtpreis: 1020.00 },
        { id: 'pos_3', position: 3, bezeichnung: 'Qualitätsprüfung & Abnahmeprotokoll', menge: 1, einzelpreis: 250.00, gesamtpreis: 250.00 }
      ]);
    }
  }, [table, foreignKeyField, parentValue]);

  const fields = table ? table.fields : [
    { name: 'position', type: 'number' },
    { name: 'bezeichnung', type: 'text' },
    { name: 'menge', type: 'number' },
    { name: 'einzelpreis', type: 'currency' },
    { name: 'gesamtpreis', type: 'currency' }
  ];

  const visibleColumns = props.selectedColumns && props.selectedColumns.length > 0
    ? props.selectedColumns
    : fields.map(f => f.name);

  const handleAddRow = () => {
    const created: Record<string, any> = {
      id: `row_${Date.now()}`,
      [foreignKeyField]: parentValue,
      ...newRow
    };
    // Calculate total if quantity and price exist
    if (created.menge && created.einzelpreis && !created.gesamtpreis) {
      created.gesamtpreis = parseFloat(created.menge) * parseFloat(created.einzelpreis);
    }
    const next = [...items, created];
    setItems(next);
    setIsAdding(false);
    setNewRow({});

    // Persist to store if table exists
    if (table) {
      const nextTableData = [...(table.data || []), created];
      updateTable({ ...table, data: nextTableData });
    }
  };

  const handleDeleteRow = (idx: number) => {
    const rowToDelete = items[idx];
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    if (table && rowToDelete) {
      const nextTableData = (table.data || []).filter((r: any) => r.id !== rowToDelete.id);
      updateTable({ ...table, data: nextTableData });
    }
  };

  const handleSaveEdit = (idx: number) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...editRowData };
    if (next[idx].menge && next[idx].einzelpreis) {
      next[idx].gesamtpreis = parseFloat(next[idx].menge) * parseFloat(next[idx].einzelpreis);
    }
    setItems(next);
    setEditingIndex(null);
    setEditRowData({});

    if (table) {
      const updatedItem = next[idx];
      const nextTableData = (table.data || []).map((r: any) => r.id === updatedItem.id ? updatedItem : r);
      updateTable({ ...table, data: nextTableData });
    }
  };

  // Calculate total sum
  const totalSum = items.reduce((acc, row) => {
    const val = parseFloat(row[props.totalField || 'gesamtpreis'] || row.gesamtpreis || row.total || row.betrag || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${props.className || ''}`}>
      {/* Subform Header */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {props.title || 'Subformular / Untergeordnete Positionen'}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}
              </span>
            </h3>
            {props.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{props.subtitle}</p>
            )}
          </div>
        </div>

        {props.allowAdd !== false && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus size={14} /> Neue Zeile
          </button>
        )}
      </div>

      {/* Subform Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              {visibleColumns.map((col: string) => (
                <th key={col} className="px-4 py-2.5 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right w-24">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row, idx) => {
              const isEditingThis = editingIndex === idx;
              return (
                <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                  {visibleColumns.map((col: string) => (
                    <td key={col} className="px-4 py-2.5 text-slate-700 font-medium">
                      {isEditingThis ? (
                        <input
                          type="text"
                          value={editRowData[col] !== undefined ? editRowData[col] : (row[col] || '')}
                          onChange={(e) => setEditRowData({ ...editRowData, [col]: e.target.value })}
                          className="w-full px-2 py-1 border border-indigo-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        typeof row[col] === 'number' && (col.includes('preis') || col.includes('betrag') || col.includes('summe') || col.includes('total'))
                          ? `${Number(row[col]).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`
                          : String(row[col] ?? '-')
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {isEditingThis ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Speichern"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingIndex(null); setEditRowData({}); }}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="Abbrechen"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        {props.allowEdit !== false && (
                          <button
                            type="button"
                            onClick={() => { setEditingIndex(idx); setEditRowData(row); }}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Bearbeiten"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {props.allowDelete !== false && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Löschen"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Inline Add Row Form */}
            {isAdding && (
              <tr className="bg-indigo-50/40 border-t-2 border-indigo-200">
                {visibleColumns.map((col: string) => (
                  <td key={col} className="px-4 py-2">
                    <input
                      type="text"
                      placeholder={`Wert für ${col}`}
                      value={newRow[col] || ''}
                      onChange={(e) => setNewRow({ ...newRow, [col]: e.target.value })}
                      className="w-full px-2 py-1 border border-indigo-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
                    >
                      Hinzufügen
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAdding(false); setNewRow({}); }}
                      className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {items.length === 0 && !isAdding && (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-slate-400 italic">
                  {props.emptyText || 'Keine Daten vorhanden.'}
                </td>
              </tr>
            )}
          </tbody>

          {/* Aggregate / Total Sum Footer */}
          {(props.showTotalRow || props.totalField) && items.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
              <tr>
                <td colSpan={Math.max(1, visibleColumns.length - 1)} className="px-4 py-3 text-right">
                  Gesamtsumme:
                </td>
                <td className="px-4 py-3 text-indigo-700 font-bold text-sm">
                  {totalSum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
