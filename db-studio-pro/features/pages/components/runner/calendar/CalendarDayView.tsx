import React from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { CalendarEvent } from './types';
import { isSameDay } from './utils';

interface CalendarDayViewProps {
  currentDate: Date;
  getEventsForDay: (day: Date) => CalendarEvent[];
  linkedTable: any;
  onOpenAddModal: (day?: Date, timeString?: string) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  currentDate,
  getEventsForDay,
  linkedTable,
  onOpenAddModal,
  onEventClick
}) => {
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const dayEvents = getEventsForDay(currentDate);
  const allDayEvents = dayEvents.filter(ev => !ev.hasSpecificTime);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 select-none">
      {/* Day Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-indigo-600" size={18} />
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tagesansicht</span>
        </div>
        {linkedTable && (
          <button 
            onClick={() => onOpenAddModal(currentDate)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus size={13} /> Neuer Termin
          </button>
        )}
      </div>

      {/* All-Day Row */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-amber-50/10 dark:bg-amber-950/10 shrink-0 p-2">
          <div className="w-16 flex items-center justify-center text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider shrink-0">
            Ganztägig
          </div>
          <div className="flex-1 flex flex-wrap gap-2 px-2">
            {allDayEvents.map(ev => (
              <div
                key={ev.id}
                onClick={(e) => onEventClick(ev, e)}
                style={{ borderLeftColor: ev.color, backgroundColor: `${ev.color}15` }}
                className="text-xs px-2.5 py-1 border-l-3 rounded-lg text-slate-850 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                title={ev.title}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }}></span>
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable Hourly Day Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex min-h-[400px]">
        {/* Hour Labels */}
        <div className="w-16 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/15 text-center text-[10px] font-bold text-slate-400 shrink-0">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] flex items-center justify-center border-b border-slate-150 dark:border-slate-800/20 font-mono">
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day column container (Single wide) */}
        <div className="flex-1 relative h-[960px]">
          {/* Interactive Hour Slots */}
          {hours.map((hour) => (
            <div
              key={hour}
              onClick={() => linkedTable && onOpenAddModal(currentDate, `${String(hour).padStart(2, '0')}:00`)}
              className="h-[60px] border-b border-slate-100 dark:border-slate-850/20 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 cursor-pointer transition-colors group relative flex items-center px-4"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-bold transition-opacity">
                + Neuer Termin für {hour}:00 Uhr eintragen
              </span>
            </div>
          ))}

          {/* Today red line */}
          {isSameDay(currentDate, new Date()) && (
            <div 
              className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none flex items-center"
              style={{ 
                top: `${Math.max(0, ((new Date().getHours() + new Date().getMinutes() / 60) - 7) * 60)}px` 
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
            </div>
          )}

          {/* Event Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {dayEvents.map((ev) => {
              if (!ev.hasSpecificTime || !ev.start) return null;

              const startHour = ev.start.getHours() + ev.start.getMinutes() / 60;
              let endHour = ev.end ? (ev.end.getHours() + ev.end.getMinutes() / 60) : (startHour + 1);
              if (endHour <= startHour) endHour = startHour + 1;

              const gridStart = 7;
              const gridEnd = 23;
              if (startHour >= gridEnd || endHour <= gridStart) return null;

              const top = Math.max(0, (startHour - gridStart) * 60);
              const height = Math.max(32, (Math.min(gridEnd, endHour) - Math.max(gridStart, startHour)) * 60);

              return (
                <div
                  key={ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(ev, e);
                  }}
                  style={{ 
                    top: `${top}px`, 
                    height: `${height}px`,
                    borderLeftColor: ev.color,
                  }}
                  className="absolute left-2 right-2 p-2.5 px-4 border-l-4 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.005] cursor-pointer transition-all pointer-events-auto overflow-hidden flex flex-col justify-between hover:z-10 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-4 min-w-0">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm truncate flex items-center gap-1.5" style={{ color: ev.color }}>
                        {ev.title}
                      </h4>
                      {ev.raw.ort && (
                        <p className="text-xs text-slate-450 dark:text-slate-550 truncate mt-0.5">
                          📍 {ev.raw.ort}
                        </p>
                      )}
                      {ev.raw.beschreibung && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {ev.raw.beschreibung}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono">
                        {String(ev.start.getHours()).padStart(2, '0')}:{String(ev.start.getMinutes()).padStart(2, '0')} - {ev.end ? `${String(ev.end.getHours()).padStart(2, '0')}:${String(ev.end.getMinutes()).padStart(2, '0')}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Render custom metadata fields if available */}
                  <div className="flex flex-wrap gap-2 mt-2 select-none">
                    {Object.keys(ev.raw).map((k) => {
                      if (['id', 'ID', 'name', 'title', 'date', 'datum', 'color', 'farbe', 'uhrzeit', 'erstellt_am', 'ort', 'beschreibung'].includes(k.toLowerCase())) return null;
                      const val = ev.raw[k];
                      if (!val || typeof val === 'object') return null;
                      return (
                        <span key={k} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                          <span className="font-semibold text-slate-400">{k}:</span> {String(val)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

    </div>
  );
};
