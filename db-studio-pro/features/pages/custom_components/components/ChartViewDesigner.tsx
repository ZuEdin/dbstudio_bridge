import React from 'react';
import { Sliders } from 'lucide-react';

interface ChartViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  fields: any[];
  tables?: any[];
  queries?: any[];
}

export const ChartViewDesigner: React.FC<ChartViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  fields,
  tables = [],
  queries = [],
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Diagramm konfigurieren
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Datenquelle-Typ</label>
          <select
            value={configObj.dataSourceType || 'table'}
            onChange={(e) => updateVisualConfig({ dataSourceType: e.target.value, dataSourceId: '' })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
          >
            <option value="table">Tabelle</option>
            <option value="query">Abfrage (Query)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Datenquelle</label>
          <select
            value={configObj.dataSourceId || ''}
            onChange={(e) => updateVisualConfig({ dataSourceId: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
          >
            <option value="">-- Bitte wählen --</option>
            {configObj.dataSourceType === 'query' 
              ? queries.filter(q => q.type === 'SELECT').map(q => <option key={q.id} value={q.id}>{q.name}</option>)
              : tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
            }
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Diagramm-Typ</label>
        <select
          value={configObj.chartType || 'bar'}
          onChange={(e) => updateVisualConfig({ chartType: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
        >
          <option value="bar">Balkendiagramm (Bar Chart)</option>
          <option value="line">Liniendiagramm (Line Chart)</option>
          <option value="area">Flächendiagramm (Area Chart)</option>
          <option value="pie">Kreisdiagramm (Pie Chart)</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Diagramm-Titel</label>
        <input 
          type="text"
          value={configObj.title || ''}
          onChange={(e) => updateVisualConfig({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
        />
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">X-Achsen Feld</label>
        <select
          value={configObj.xAxisKey || ''}
          onChange={(e) => updateVisualConfig({ xAxisKey: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
        >
          <option value="">-- Feld wählen --</option>
          {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          {fields.length === 0 && (
            <>
              <option value="Month">Month (Monat)</option>
              <option value="Datum">Datum</option>
              <option value="Name">Name</option>
            </>
          )}
        </select>
      </div>
      
      {/* Series Config */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <label className="block text-[10px] text-slate-500 font-bold uppercase">Y-Achsen Datenreihe</label>
        </div>
        {(!configObj.series || configObj.series.length === 0) ? (
          <button 
            type="button"
            onClick={() => updateVisualConfig({ series: [{ key: 'Revenue', label: 'Wert', color: '#4f46e5' }] })}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
          >
            + Reihe hinzufügen
          </button>
        ) : (
          <div className="space-y-2">
            {configObj.series.map((ser: any, sIdx: number) => (
              <div key={sIdx} className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500">Datenfeld (Spalte)</label>
                    <select
                      value={ser.key}
                      onChange={(e) => {
                        const nextSer = [...configObj.series];
                        nextSer[sIdx] = { ...nextSer[sIdx], key: e.target.value };
                        updateVisualConfig({ series: nextSer });
                      }}
                      className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] p-1 rounded dark:text-white"
                    >
                      {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                      {fields.length === 0 && (
                        <>
                          <option value="Revenue">Revenue (Umsatz)</option>
                          <option value="Umsatz">Umsatz</option>
                          <option value="Wert">Wert</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Beschriftung</label>
                    <input 
                      type="text"
                      value={ser.label}
                      onChange={(e) => {
                        const nextSer = [...configObj.series];
                        nextSer[sIdx] = { ...nextSer[sIdx], label: e.target.value };
                        updateVisualConfig({ series: nextSer });
                      }}
                      className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] p-1 rounded dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500">Linien/Balkenfarbe:</label>
                  <input 
                    type="color" 
                    value={ser.color || '#4f46e5'}
                    onChange={(e) => {
                      const nextSer = [...configObj.series];
                      nextSer[sIdx] = { ...nextSer[sIdx], color: e.target.value };
                      updateVisualConfig({ series: nextSer });
                    }}
                    className="h-5 w-8 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{ser.color || '#4f46e5'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
