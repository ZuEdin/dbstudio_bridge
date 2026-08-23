import React from 'react';
import { Calendar, LayoutTemplate, Plus, Sliders } from 'lucide-react';

interface CalendarViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  tables: any[];
  queries: any[];
  fields: any[];
}

export const CalendarViewDesigner: React.FC<CalendarViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  tables,
  queries,
  fields,
}) => {
  return (
    <div className="space-y-6">
      {/* Datenquelle */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
          <Sliders size={13} /> Datenquelle & Setup
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Startdatum Feld</label>
            <select
              value={configObj.startDateField || ''}
              onChange={(e) => updateVisualConfig({ startDateField: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value="">-- Automatisch / Wählen --</option>
              {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Enddatum Feld (Optional)</label>
            <select
              value={configObj.endDateField || ''}
              onChange={(e) => updateVisualConfig({ endDateField: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value="">-- Kein Enddatum --</option>
              {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Startzeit Feld (Optional)</label>
            <select
              value={configObj.startTimeField || ''}
              onChange={(e) => updateVisualConfig({ startTimeField: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value="">-- Keine separate Startzeit --</option>
              {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Endzeit Feld (Optional)</label>
            <select
              value={configObj.endTimeField || ''}
              onChange={(e) => updateVisualConfig({ endTimeField: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value="">-- Keine separate Endzeit --</option>
              {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Titel Feld</label>
            <select
              value={configObj.titleField || ''}
              onChange={(e) => updateVisualConfig({ titleField: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value="">-- Automatisch / Wählen --</option>
              {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Farb-Feld (Optional)</label>
            <select
              value={configObj.colorField || ''}
              onChange={(e) => updateVisualConfig({ colorField: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value="">-- Keine Farbe --</option>
              {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
          <LayoutTemplate size={13} /> Kalender Stil
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Standardansicht</label>
            <select
              value={configObj.defaultView || 'month'}
              onChange={(e) => updateVisualConfig({ defaultView: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value="month">Monat</option>
              <option value="week">Woche</option>
              <option value="work_week">Arbeitswoche</option>
              <option value="day">Tag</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Verfügbare Ansichten (Kommasepariert)</label>
            <input
              type="text"
              value={configObj.views ? configObj.views.join(', ') : 'month, week, work_week, day, agenda'}
              onChange={(e) => updateVisualConfig({ views: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
              placeholder="month, week, day"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
