import React from 'react';
import { Sliders, HelpCircle } from 'lucide-react';

interface MetricCardViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  tables: any[];
  fields: any[];
}

export const MetricCardViewDesigner: React.FC<MetricCardViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  tables,
  fields,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Metric-Card konfigurieren
      </h4>
      
      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Titel der Kennzahl</label>
        <input 
          type="text"
          value={configObj.title || ''}
          onChange={(e) => updateVisualConfig({ title: e.target.value })}
          placeholder="z.B. Gesamtumsatz oder Kundenanzahl"
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white font-medium"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Datenquelle (Tabelle)</label>
          <select
            value={configObj.dataSourceId || ''}
            onChange={(e) => updateVisualConfig({ dataSourceId: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs dark:text-white"
          >
            <option value="">-- Keine Datenbindung --</option>
            {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Berechnungstyp</label>
          <select
            value={configObj.aggType || 'count'}
            onChange={(e) => updateVisualConfig({ aggType: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs dark:text-white font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="count">Anzahl (COUNT)</option>
            <option value="sum">Summe (SUM)</option>
            <option value="avg">Mittelwert (AVG)</option>
            <option value="min">Minimalwert (MIN)</option>
            <option value="max">Maximalwert (MAX)</option>
            <option value="custom">Statisch / Custom Wert</option>
          </select>
        </div>
      </div>

      {configObj.aggType !== 'count' && configObj.aggType !== 'custom' && (
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Aggregations-Feld</label>
          <select
            value={configObj.aggField || ''}
            onChange={(e) => updateVisualConfig({ aggField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld wählen --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name} ({f.type})</option>)}
          </select>
        </div>
      )}

      {configObj.aggType === 'custom' && (
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Statischer Wert</label>
          <input 
            type="text"
            value={configObj.customValue || ''}
            onChange={(e) => updateVisualConfig({ customValue: e.target.value })}
            placeholder="z.B. 24.500"
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Präfix (vorne)</label>
          <input 
            type="text"
            value={configObj.prefix || ''}
            onChange={(e) => updateVisualConfig({ prefix: e.target.value })}
            placeholder="z.B. €"
            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Suffix (hinten)</label>
          <input 
            type="text"
            value={configObj.suffix || ''}
            onChange={(e) => updateVisualConfig({ suffix: e.target.value })}
            placeholder="z.B. € oder Stk."
            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Subtext / Untertitel</label>
        <input 
          type="text"
          value={configObj.subtext || ''}
          onChange={(e) => updateVisualConfig({ subtext: e.target.value })}
          placeholder="z.B. +12% im Vergleich zum Vormonat"
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Farbthema</label>
          <select
            value={configObj.themeColor || 'indigo'}
            onChange={(e) => updateVisualConfig({ themeColor: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="indigo">Indigo (Standard)</option>
            <option value="emerald">Smaragdgrün (Spezial)</option>
            <option value="rose">Rosarot (Kritisch)</option>
            <option value="sky">Himmelblau (Info)</option>
            <option value="amber">Bernstein (Warnung)</option>
            <option value="slate">Schiefergrau (Neutral)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Icon Typ</label>
          <select
            value={configObj.iconName || 'TrendingUp'}
            onChange={(e) => updateVisualConfig({ iconName: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="TrendingUp">Trend Steigend</option>
            <option value="Users">Benutzer / Kunden</option>
            <option value="DollarSign">Währung / Umsatz</option>
            <option value="Activity">Aktivität / Puls</option>
            <option value="Calendar">Kalender / Termine</option>
            <option value="Percent">Prozent / Quote</option>
            <option value="Award">Auszeichnung</option>
            <option value="ShoppingCart">Einkaufswagen</option>
          </select>
        </div>
      </div>
    </div>
  );
};
