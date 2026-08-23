import React from 'react';
import { Clock } from 'lucide-react';
import { CalendarEvent } from './types';
import { isSameDay } from './utils';

interface CalendarWeekViewProps {
  weekDays: Date[];
  getEventsForDay: (day: Date) => CalendarEvent[];
  linkedTable: any;
  onOpenAddModal: (day?: Date, timeString?: string) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  weekDays,
  getEventsForDay,
  linkedTable,
  onOpenAddModal,
  onEventClick
}) => {
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  return (
    <div className="h-full min-w-[750px] flex flex-col bg-white dark:bg-slate-900 select-none">
      {/* Week Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0 pl-16">
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div 
              key={idx} 
              className={`p-2.5 text-center border-r border-slate-200 dark:border-slate-800/50 flex flex-col items-center justify-center ${
                isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/15' : ''
              }`}
            >
              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][idx]}
              </span>
              <span className={`text-xs font-extrabold mt-0.5 px-2 py-0.5 rounded-full ${
                isToday ? 'bg-indigo-600 text-white shadow-sm font-black' : 'text-slate-750 dark:text-slate-300'
              }`}>
                {day.getDate()}.{day.getMonth() + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-Day Row */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 shrink-0">
        <div className="w-16 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">
          Ganztägig
        </div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const allDayEvents = dayEvents.filter(ev => !ev.hasSpecificTime);

            return (
              <div key={idx} className="p-1 border-r border-slate-200/50 dark:border-slate-800/30 min-h-[38px] space-y-1">
                {allDayEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => onEventClick(ev, e)}
                    style={{ borderLeftColor: ev.color }}
                    className="text-[10px] px-1.5 py-0.5 border-l-2 bg-slate-100/70 dark:bg-slate-800/60 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold truncate cursor-pointer transition-colors"
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Hourly Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex min-h-[400px]">
        {/* Hour Labels */}
        <div className="w-16 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/15 text-center text-[10px] font-bold text-slate-400 shrink-0">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] flex items-center justify-center border-b border-slate-150 dark:border-slate-800/20 font-mono">
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day Columns */}
        <div className="flex-1 grid grid-cols-7 relative">
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={idx}
                className={`relative border-r border-slate-150 dark:border-slate-800/30 h-[960px] ${
                  isToday ? 'bg-indigo-50/10 dark:bg-indigo-950/5' : ''
                }`}
              >
                {/* Interactive Hour slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => linkedTable && onOpenAddModal(day, `${String(hour).padStart(2, '0')}:00`)}
                    className="h-[60px] border-b border-slate-100 dark:border-slate-850/20 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 cursor-pointer transition-colors group relative flex items-start p-1"
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[9px] text-indigo-500 font-bold transition-opacity">
                      + {hour}:00
                    </span>
                  </div>
                ))}

                {/* Today indicator line */}
                {isToday && (
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none flex items-center"
                    style={{ 
                      top: `${Math.max(0, ((new Date().getHours() + new Date().getMinutes() / 60) - 7) * 60)}px` 
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-[4px]"></div>
                  </div>
                )}

                {/* Absolute Event Overlays */}
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
                    const height = Math.max(26, (Math.min(gridEnd, endHour) - Math.max(gridStart, startHour)) * 60);

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
                        className="absolute left-1 right-1 p-1 px-1.5 border-l-3 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.01] text-[11px] text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-all pointer-events-auto overflow-hidden flex flex-col justify-between hover:z-10"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-bold flex items-center gap-1" style={{ color: ev.color }}>
                            {ev.title}
                          </div>
                          {ev.raw.ort && (
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                              📍 {ev.raw.ort}
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-450 dark:text-slate-550 font-mono flex items-center gap-0.5 select-none shrink-0">
                          <Clock size={9} />
                          {String(ev.start.getHours()).padStart(2, '0')}:{String(ev.start.getMinutes()).padStart(2, '0')}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
