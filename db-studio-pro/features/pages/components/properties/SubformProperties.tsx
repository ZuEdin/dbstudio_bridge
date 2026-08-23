import React from 'react';
import { PageComponent, Table } from '../../../../types';
import { Layers, Plus, Trash2, Database, DollarSign } from 'lucide-react';

interface SubformPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  tables: Table[];
}

export const SubformProperties: React.FC<SubformPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  tables,
}) => {
  const props = selectedNode.props || {};
  const currentTable = tables.find(t => t.id === props.subTableId);
  const fields = currentTable ? currentTable.fields || [] : [];

  const handleToggleColumn = (fieldName: string) => {
    const currentCols: string[] = props.selectedColumns || fields.map(f => f.name);
    let nextCols: string[];
    if (currentCols.includes(fieldName)) {
      nextCols = currentCols.filter(c => c !== fieldName);
    } else {
      nextCols = [...currentCols, fieldName];
    }
    updateSelectedNodeProps({ selectedColumns: nextCols });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1.5">
          <Layers size={14} /> Subformular & Master-Detail
        </h4>
        <p className="text-[10px] text-slate-500 mb-3">
          Verknüpft eine untergeordnete Datentabelle (z. B. Auftragspositionen) automatisch mit dem Hauptdatensatz.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Titel des Subformulars</label>
        <input 
          type="text"
          value={props.title || ''}
          onChange={(e) => updateSelectedNodeProps({ title: e.target.value })}
          placeholder="z. B. Auftragspositionen"
          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Untertitel / Beschreibung</label>
        <input 
          type="text"
          value={props.subtitle || ''}
          onChange={(e) => updateSelectedNodeProps({ subtitle: e.target.value })}
          placeholder="z. B. Positionen hinzufügen und bearbeiten"
          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="pt-3 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
          <Database size={12} className="text-indigo-600"/> Untergeordnete Tabelle (Child Table)
        </label>
        <select
          value={props.subTableId || ''}
          onChange={(e) => {
            const tableId = e.target.value;
            const t = tables.find(tbl => tbl.id === tableId);
            updateSelectedNodeProps({ 
              subTableId: tableId,
              selectedColumns: t ? t.fields.map(f => f.name) : []
            });
          }}
          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs mb-2"
        >
          <option value="">-- Untertabelle wählen --</option>
          {tables.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {currentTable && (
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Fremdschlüssel-Feld</label>
              <select
                value={props.foreignKeyField || ''}
                onChange={(e) => updateSelectedNodeProps({ foreignKeyField: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono"
              >
                <option value="">Feld wählen</option>
                {fields.map(f => (
                  <option key={f.id || f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Hauptschlüssel (Parent)</label>
              <input
                type="text"
                value={props.parentKeyField || 'id'}
                onChange={(e) => updateSelectedNodeProps({ parentKeyField: e.target.value })}
                placeholder="id"
                className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sichtbare Spalten</label>
            <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded p-1.5 bg-slate-50">
              {fields.map(f => {
                const isChecked = (props.selectedColumns || fields.map(x => x.name)).includes(f.name);
                return (
                  <label key={f.id || f.name} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer hover:bg-white p-1 rounded">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleColumn(f.name)}
                      className="rounded text-indigo-600 border-slate-300 h-3.5 w-3.5"
                    />
                    <span className="font-mono text-[11px]">{f.name}</span>
                    <span className="text-[9px] text-slate-400 font-sans">({f.type})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Aktionen & Berechtigungen</div>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={props.allowAdd !== false}
                onChange={(e) => updateSelectedNodeProps({ allowAdd: e.target.checked })}
                className="rounded text-indigo-600 border-slate-300"
              />
              Inline-Hinzufügen erlauben (+ Neue Zeile)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={props.allowDelete !== false}
                onChange={(e) => updateSelectedNodeProps({ allowDelete: e.target.checked })}
                className="rounded text-indigo-600 border-slate-300"
              />
              Zeilen löschen erlauben
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={props.allowEdit !== false}
                onChange={(e) => updateSelectedNodeProps({ allowEdit: e.target.checked })}
                className="rounded text-indigo-600 border-slate-300"
              />
              Direktes Inline-Bearbeiten aktivieren
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-600"/> Summenzeile / Aggregation
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={!!props.showTotalRow}
                onChange={(e) => updateSelectedNodeProps({ showTotalRow: e.target.checked })}
                className="rounded text-indigo-600 border-slate-300"
              />
              Automatische Summenzeile am Tabellenende
            </label>
            {props.showTotalRow && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Zu summierendes Zahlenfeld</label>
                <select
                  value={props.totalField || ''}
                  onChange={(e) => updateSelectedNodeProps({ totalField: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono"
                >
                  <option value="">Feld wählen...</option>
                  {fields.filter(f => ['number', 'decimal', 'float', 'integer', 'currency'].includes(f.type.toLowerCase()) || f.name.includes('preis') || f.name.includes('betrag') || f.name.includes('summe') || f.name.includes('amount') || f.name.includes('total')).map(f => (
                    <option key={f.id || f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
