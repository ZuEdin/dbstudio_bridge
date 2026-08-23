import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarViewType } from './types';
import { formatMonthYear, getStartOfWeek } from './utils';

interface CalendarNavBarProps {
  currentDate: Date;
  currentView: CalendarViewType;
  prevPeriod: () => void;
  nextPeriod: () => void;
  setToday: () => void;
  setCurrentView: (v: CalendarViewType) => void;
}

export const CalendarNavBar: React.FC<CalendarNavBarProps> = ({
  currentDate,
  currentView,
  prevPeriod,
  nextPeriod,
  setToday,
  setCurrentView,
}) => {
  return (
    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
      {/* Left Side: Period selector */}
      <div className="flex items-center gap-1.5">
        <button 
          onClick={prevPeriod}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Zurück"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          onClick={setToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Heute
        </button>
        <button 
          onClick={nextPeriod}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Vor"
        >
          <ChevronRight size={16} />
        </button>
        
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 ml-2">
          {currentView === 'month' && formatMonthYear(currentDate)}
          {currentView === 'week' && `Woche vom ${getStartOfWeek(currentDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`}
          {currentView === 'day' && currentDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {currentView === 'agenda' && 'Terminübersicht (Agenda)'}
        </h2>
      </div>

      {/* Right Side: View selector switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
        {(['month', 'week', 'day', 'agenda'] as const).map((v) => {
          const isSelected = currentView === v;
          return (
            <button
              key={v}
              onClick={() => setCurrentView(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all uppercase tracking-wide text-[10px] ${
                isSelected 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {v === 'month' ? 'Monat' : v === 'week' ? 'Woche' : v === 'day' ? 'Tag' : 'Agenda'}
            </button>
          );
        })}
      </div>
    </div>
  );
};
