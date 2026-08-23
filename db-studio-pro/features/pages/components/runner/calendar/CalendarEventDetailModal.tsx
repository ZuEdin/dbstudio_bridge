import React from 'react';
import { Calendar as CalendarIcon, X, CalendarDays, Clock, Edit3, Trash2, Info } from 'lucide-react';
import { CalendarEvent } from './types';

interface CalendarEventDetailModalProps {
  selectedEvent: CalendarEvent | null;
  linkedTable: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CalendarEventDetailModal: React.FC<CalendarEventDetailModalProps> = ({
  selectedEvent,
  linkedTable,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!selectedEvent) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
        
        {/* Header banner with color */}
        <div className="p-4 text-white flex items-center justify-between" style={{ backgroundColor: selectedEvent.color }}>
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Termindetails</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:scale-110 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold">TITEL / BEZEICHNUNG</span>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{selectedEvent.title}</h3>
          </div>

          {/* Date & Time pill */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350">
              <CalendarDays size={14} className="text-indigo-500" />
              <span className="font-semibold">Datum:</span>
              <span>{selectedEvent.start?.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            {selectedEvent.hasSpecificTime && selectedEvent.start && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350 font-semibold">
                <Clock size={14} className="text-indigo-500" />
                <span>Uhrzeit:</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {String(selectedEvent.start.getHours()).padStart(2, '0')}:{String(selectedEvent.start.getMinutes()).padStart(2, '0')} 
                  {selectedEvent.end ? ` - ${String(selectedEvent.end.getHours()).padStart(2, '0')}:${String(selectedEvent.end.getMinutes()).padStart(2, '0')}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* List of other parameters inside row */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] text-slate-400 font-mono tracking-wider font-bold border-b dark:border-slate-800 pb-1 uppercase">Zusatzdatenfelder</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.keys(selectedEvent.raw).map((key) => {
                // Skip technical or already-rendered fields
                if (['id', 'ID', 'name', 'title', 'date', 'datum', 'vondatum', 'von_datum', 'bisdatum', 'bis_datum', 'enddatum', 'end_datum', 'color', 'farbe', 'uhrzeit', 'vonuhrzeit', 'von_uhrzeit', 'bisuhrzeit', 'bis_uhrzeit', 'erstellt_am', 'created_at'].includes(key.toLowerCase())) return null;
                const val = selectedEvent.raw[key];
                if (val === undefined || val === null || val === '') return null;
                
                return (
                  <div key={key} className="flex justify-between items-start text-xs border-b border-slate-50 dark:border-slate-850/50 pb-1.5">
                    <span className="text-slate-450 dark:text-slate-500 font-semibold">{key}:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono break-all text-right max-w-[200px]">
                      {typeof val === 'boolean' ? (val ? '✔️ Ja' : '❌ Nein') : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
          {linkedTable ? (
            <>
              <button 
                onClick={onEdit}
                className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              >
                <Edit3 size={13} />
                Bearbeiten
              </button>
              <button 
                onClick={onDelete}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                title="Eintrag löschen"
              >
                <Trash2 size={13} />
                Löschen
              </button>
            </>
          ) : (
            <div className="text-[11px] text-slate-400 italic flex items-center gap-1 w-full justify-center">
              <Info size={12} /> Datenquellen im SQL Query-Modus sind schreibgeschützt
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
