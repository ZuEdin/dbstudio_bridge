import React from 'react';
import { Database } from 'lucide-react';
import { PageComponent, Query, Table, SelectQuery } from '../../../../types';

interface DropdownPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  queries: Query[];
  tables: Table[];
}

export const DropdownProperties: React.FC<DropdownPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  queries,
  tables,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Platzhalter Text</label>
        <input
          type="text"
          value={selectedNode.props.placeholder || ''}
          onChange={(e) => updateSelectedNodeProps({ placeholder: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
        />
      </div>
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-indigo-600 mb-2">Datenbindung (Query)</h4>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Datenquelle (Abfrage)</label>
        <select 
          value={selectedNode.props.queryId || ''} 
          onChange={(e: any) => updateSelectedNodeProps({ queryId: e.target.value, valueField: '', labelField: '' })}
          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
        >
          <option value="">-- Keine Abfrage --</option>
          {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>

        {selectedNode.props.queryId && (() => {
          const selectedQuery = queries.find(q => q.id === selectedNode.props.queryId);
          if (!selectedQuery) return null;
          const cols = selectedQuery.type === 'SELECT' ? (selectedQuery as SelectQuery).columns : [];
          return (
            <>
              <label className="block text-xs font-semibold text-slate-600 mb-1 mt-2">Wert-Spalte (Value ID)</label>
              <select 
                value={selectedNode.props.valueField || ''} 
                onChange={(e: any) => updateSelectedNodeProps({ valueField: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-2"
              >
                <option value="">-- Spalte wählen --</option>
                {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
              </select>

              <label className="block text-xs font-semibold text-slate-600 mb-1 mt-2">Anzeige-Spalte (Label)</label>
              <select 
                value={selectedNode.props.labelField || ''} 
                onChange={(e: any) => updateSelectedNodeProps({ labelField: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-2"
              >
                <option value="">-- Spalte wählen --</option>
                {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
              </select>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <h5 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                  <Database size={12} /> Daten filtern über Parameter
                </h5>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Spalte (z.B. id)</label>
                  <select
                    value={selectedNode.props.filterParamField || ''}
                    onChange={(e) => updateSelectedNodeProps({ filterParamField: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 font-medium"
                  >
                    <option value="">-- Kein Filter --</option>
                    {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
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
                    Filtert das Dropdown, sodass der Wert in der ausgewählten Filter-Spalte dem Wert des Parameters entspricht.
                  </p>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};
