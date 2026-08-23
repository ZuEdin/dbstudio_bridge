import React from 'react';
import { Sliders } from 'lucide-react';

interface DropdownViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  tables: any[];
  fields: any[];
}

export const DropdownViewDesigner: React.FC<DropdownViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  tables,
  fields,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Auswahlmenü konfigurieren
      </h4>
      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Datenquelle (Tabelle)</label>
        <select
          value={configObj.dataSourceId || ''}
          onChange={(e) => updateVisualConfig({ dataSourceId: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
        >
          <option value="">-- Keine Datenbindung --</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Wert Feld (id)</label>
          <select
            value={configObj.valueField || ''}
            onChange={(e) => updateVisualConfig({ valueField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Label Feld (Display)</label>
          <select
            value={configObj.displayField || ''}
            onChange={(e) => updateVisualConfig({ displayField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Placeholder Text</label>
          <input 
            type="text"
            value={configObj.placeholder || ''}
            onChange={(e) => updateVisualConfig({ placeholder: e.target.value })}
            placeholder="z.B. -- Bitte wählen --"
            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Feld-Beschriftung</label>
          <input 
            type="text"
            value={configObj.label || ''}
            onChange={(e) => updateVisualConfig({ label: e.target.value })}
            placeholder="z.B. Status wählen"
            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};
