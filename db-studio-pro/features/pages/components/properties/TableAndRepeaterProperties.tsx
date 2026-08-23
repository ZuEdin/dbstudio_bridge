import React from 'react';
import { Database } from 'lucide-react';
import { PageComponent, Query, Table, CustomPage, Form, SelectQuery } from '../../../../types';

interface TableAndRepeaterPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  queries: Query[];
  tables: Table[];
  pages: CustomPage[];
  forms: Form[];
}

export const TableAndRepeaterProperties: React.FC<TableAndRepeaterPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  queries,
  tables,
  pages,
  forms,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-emerald-600 mb-2">Datenquelle</h4>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Typ</label>
        <select 
          value={selectedNode.props.dataSourceType || ''}
          onChange={(e: any) => updateSelectedNodeProps({ dataSourceType: e.target.value, dataSourceId: '' })}
          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
        >
          <option value="">-- Wählen --</option>
          <option value="table">Tabelle</option>
          <option value="query">Abfrage</option>
        </select>

        {selectedNode.props.dataSourceType === 'table' && (
          <>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tabelle</label>
            <select 
              value={selectedNode.props.dataSourceId || ''}
              onChange={(e: any) => {
                const val = e.target.value;
                const table = tables.find(t => t.id === val);
                const cols = table ? table.fields.map(f => f.name).join(',') : '';
                updateSelectedNodeProps({ dataSourceId: val, columns: cols });
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
            >
              <option value="">-- Tabelle wählen --</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </>
        )}

        {selectedNode.props.dataSourceType === 'query' && (
          <>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Abfrage</label>
            <select 
              value={selectedNode.props.dataSourceId || ''}
              onChange={(e: any) => {
                const val = e.target.value;
                const q = queries.find(qi => qi.id === val);
                const cols = (q && q.type === 'SELECT') ? (q as SelectQuery).columns.map(c => c.alias || c.fieldName).join(',') : '';
                updateSelectedNodeProps({ dataSourceId: val, columns: cols });
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
            >
              <option value="">-- Abfrage wählen --</option>
              {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </>
        )}

        {selectedNode.props.dataSourceId && (() => {
          let availableCols: {id: string, label: string, name: string}[] = [];
          if (selectedNode.props.dataSourceType === 'table') {
            const t = tables.find(tb => tb.id === selectedNode.props.dataSourceId);
            if (t) {
              availableCols = t.fields.map(f => ({ id: f.name, label: f.name, name: f.name }));
            }
          } else if (selectedNode.props.dataSourceType === 'query') {
            const q = queries.find(qi => qi.id === selectedNode.props.dataSourceId);
            if (q) {
              availableCols = (q as any).columns.map((c: any) => {
                const lbl = c.alias || c.fieldName;
                return { id: lbl, label: lbl, name: lbl };
              });
            }
          }
          
          const selectedCols: string[] = selectedNode.props.columns ? selectedNode.props.columns.split(',').map((c:string) => c.trim()).filter(Boolean) : [];

          const toggleCol = (colName: string) => {
            const set = new Set(selectedCols);
            if (set.has(colName)) set.delete(colName);
            else set.add(colName);
            updateSelectedNodeProps({ columns: Array.from(set).join(',') });
          };

          return (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Spalten auswählen</label>
              {availableCols.length === 0 ? (
                <div className="text-xs text-slate-400">Keine Spalten gefunden</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded p-2">
                  {availableCols.map(col => (
                    <label key={col.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={selectedCols.includes(col.name)}
                        onChange={() => toggleCol(col.name)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}

              {/* Table Data Filtering with Parameters */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <h5 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                  <Database size={12} /> Daten filtern über Parameter
                </h5>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Spalte (z.B. id oder standort_id)</label>
                  <select
                    value={selectedNode.props.filterParamField || ''}
                    onChange={(e) => updateSelectedNodeProps({ filterParamField: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 font-medium"
                  >
                    <option value="">-- Kein Filter --</option>
                    {availableCols.map(col => (
                      <option key={col.id} value={col.name}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Parameter Name (z.B. selectedId)</label>
                  <input 
                    type="text"
                    value={selectedNode.props.filterParamName || ''}
                    onChange={(e) => updateSelectedNodeProps({ filterParamName: e.target.value })}
                    placeholder="z.B. selectedId"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">
                    Filtert die Zeilen dieser Tabelle, sodass der Wert in der ausgewählten Filter-Spalte dem aktuellen Wert des angegebenen Parameters entspricht.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Actions and Interactions for table view */}
      {selectedNode.type === 'table_view' && (
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <h4 className="text-xs font-bold text-emerald-600 mb-2">Aktionen & Interaktionen</h4>
          
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input 
              type="checkbox"
              checked={!!selectedNode.props.enableCrudActions}
              onChange={(e) => updateSelectedNodeProps({ enableCrudActions: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            CRUD-Aktionen aktivieren (Details, Bearbeiten, Löschen)
          </label>

          {selectedNode.props.enableCrudActions && (
            <div className="space-y-3 pl-3 border-l-2 border-indigo-200">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular für "Neu" (Erstellen)</label>
                <select
                  value={selectedNode.props.createFormId || ''}
                  onChange={(e) => updateSelectedNodeProps({ createFormId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  <option value="">-- Kein Formular (Deaktiviert) --</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular für "Bearbeiten"</label>
                <select
                  value={selectedNode.props.editFormId || ''}
                  onChange={(e) => updateSelectedNodeProps({ editFormId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  <option value="">-- Kein Formular (Deaktiviert) --</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input 
                type="checkbox"
                checked={!!selectedNode.props.enableSelection}
                onChange={(e) => updateSelectedNodeProps({ enableSelection: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Zeilen-Klick aktivieren (Parameter setzen)
            </label>
            
            {(selectedNode.props.enableSelection || selectedNode.props.enableCrudActions) && (
              <div className="space-y-3 mt-3 pl-3 border-l-2 border-indigo-200">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ziel-Parameter Name</label>
                  <input 
                    type="text"
                    value={selectedNode.props.selectionParamName || 'selectedId'}
                    onChange={(e) => updateSelectedNodeProps({ selectionParamName: e.target.value })}
                    placeholder="z.B. selectedId"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bei "Details"-Klick auf Seite navigieren</label>
                  <select
                    value={selectedNode.props.detailsPageId || ''}
                    onChange={(e) => updateSelectedNodeProps({ detailsPageId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="">-- Kein Seitenwechsel (nur Parameter setzen) --</option>
                    {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ereignis-Trigger für Details</label>
                  <select
                    value={selectedNode.props.rowClickTrigger || 'click'}
                    onChange={(e) => updateSelectedNodeProps({ rowClickTrigger: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="click">Einfacher Klick (Standard)</option>
                    <option value="dblclick">Doppelklick (Sicherer, markiert bei Klick)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
