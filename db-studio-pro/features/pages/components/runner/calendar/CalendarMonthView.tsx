import React from 'react';
import { CalendarEvent } from './types';
import { MonthDay, isSameDay } from './utils';

interface CalendarMonthViewProps {
  monthDays: MonthDay[];
  getEventsForDay: (day: Date) => CalendarEvent[];
  linkedTable: any;
  onOpenAddModal: (day?: Date) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  monthDays,
  getEventsForDay,
  linkedTable,
  onOpenAddModal,
  onEventClick
}) => {
  return (
    <div className="h-full min-w-[650px] flex flex-col">
      {/* Weekdays header */}
      <div className="grid grid-cols-7 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-500 py-2 shrink-0">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-slate-200/40 dark:bg-slate-800/20 gap-[1px]">
        {monthDays.map(({ date, isCurrentMonth }, idx) => {
          const dayEvents = getEventsForDay(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <div 
              key={idx} 
              onClick={() => linkedTable && onOpenAddModal(date)}
              className={`bg-white dark:bg-slate-900 p-1.5 flex flex-col h-full min-h-[70px] group transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40 cursor-pointer ${
                !isCurrentMonth ? 'text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-950/10' : ''
              }`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  isToday 
                    ? 'bg-indigo-600 text-white font-black' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {date.getDate()}
                </span>
                {linkedTable && (
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-bold hover:scale-115 transition-all">
                    +
                  </span>
                )}
              </div>

              {/* Day events */}
              <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => onEventClick(ev, e)}
                    style={{ borderLeftColor: ev.color }}
                    className="text-[10px] px-1.5 py-0.5 border-l-2 bg-slate-100/80 dark:bg-slate-850/80 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium truncate flex items-center gap-1 select-none cursor-pointer transition-colors"
                    title={ev.title}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color }}></span>
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
