import React from 'react';
import { Clock, Info } from 'lucide-react';
import { CalendarEvent } from './types';

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onEventClick
}) => {
  const sortedEvents = [...events].sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));

  return (
    <div className="p-4 bg-white dark:bg-slate-900 h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        {sortedEvents.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed dark:border-slate-800 rounded-xl space-y-2">
            <Info size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-slate-500 dark:text-slate-400 italic text-sm">Keine zukünftigen oder vergangenen Termine gefunden.</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-2 space-y-6">
            {sortedEvents.map((ev) => {
              const dateStr = ev.start?.toLocaleDateString('de-DE', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              return (
                <div key={ev.id} className="relative group">
                  {/* Dot marker */}
                  <div 
                    className="absolute -left-[24px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: ev.color }}
                  ></div>
                  
                  <div 
                    onClick={(e) => onEventClick(ev, e)}
                    className="p-3 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wide">{dateStr}</span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">{ev.title}</h4>
                    
                    {/* Detailed Info pills */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ev.hasSpecificTime && ev.start && (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                          <Clock size={10} /> 
                          {String(ev.start.getHours()).padStart(2, '0')}:{String(ev.start.getMinutes()).padStart(2, '0')} 
                          {ev.end ? ` - ${String(ev.end.getHours()).padStart(2, '0')}:${String(ev.end.getMinutes()).padStart(2, '0')}` : ''}
                        </span>
                      )}
                      {Object.keys(ev.raw).map((k) => {
                        if (['id', 'ID', 'name', 'title', 'date', 'datum', 'vondatum', 'von_datum', 'bisdatum', 'bis_datum', 'enddatum', 'end_datum', 'color', 'farbe', 'uhrzeit', 'vonuhrzeit', 'von_uhrzeit', 'bisuhrzeit', 'bis_uhrzeit', 'erstellt_am', 'created_at'].includes(k.toLowerCase())) return null;
                        const val = ev.raw[k];
                        if (!val || typeof val === 'object') return null;
                        return (
                          <span key={k} className="bg-slate-55/60 dark:bg-slate-800/40 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">
                            <span className="font-semibold text-slate-400">{k}:</span> {String(val)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
