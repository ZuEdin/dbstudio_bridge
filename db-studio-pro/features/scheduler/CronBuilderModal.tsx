
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface CronBuilderModalProps {
  initialValue: string;
  onSave: (cron: string) => void;
  onClose: () => void;
}

export const CronBuilderModal: React.FC<CronBuilderModalProps> = ({ initialValue, onSave, onClose }) => {
  const [type, setType] = useState<'minutes' | 'hourly' | 'daily' | 'weekly'>('daily');
  const [minute, setMinute] = useState('0');
  const [hour, setHour] = useState('0');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // 1 = Monday
  const [intervalMinutes, setIntervalMinutes] = useState('15');

  const generateCron = () => {
      switch(type) {
          case 'minutes': return `*/${intervalMinutes} * * * *`;
          case 'hourly': return `${minute} * * * *`;
          case 'daily': return `${minute} ${hour} * * *`;
          case 'weekly': return `${minute} ${hour} * * ${dayOfWeek}`;
          default: return '* * * * *';
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-300 overflow-hidden">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
            <h3 className="font-bold">Zeitplan erstellen</h3>
            <button onClick={onClose}><X size={18}/></button>
        </div>
        
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Häufigkeit</label>
                <div className="flex bg-slate-100 p-1 rounded">
                    <button onClick={() => setType('minutes')} className={`flex-1 py-1 text-xs rounded ${type === 'minutes' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>Minütlich</button>
                    <button onClick={() => setType('hourly')} className={`flex-1 py-1 text-xs rounded ${type === 'hourly' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>Stündlich</button>
                    <button onClick={() => setType('daily')} className={`flex-1 py-1 text-xs rounded ${type === 'daily' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>Täglich</button>
                    <button onClick={() => setType('weekly')} className={`flex-1 py-1 text-xs rounded ${type === 'weekly' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>Wöchentlich</button>
                </div>
            </div>

            <div className="bg-slate-50 border p-4 rounded text-sm">
                {type === 'minutes' && (
                    <div className="flex items-center gap-2">
                        <span>Alle</span>
                        <input type="number" min="1" max="59" value={intervalMinutes} onChange={e => setIntervalMinutes(e.target.value)} className="w-16 border rounded p-1" />
                        <span>Minuten</span>
                    </div>
                )}
                {type === 'hourly' && (
                    <div className="flex items-center gap-2">
                        <span>Jede Stunde um</span>
                        <input type="number" min="0" max="59" value={minute} onChange={e => setMinute(e.target.value)} className="w-16 border rounded p-1" />
                        <span>Minuten nach voll</span>
                    </div>
                )}
                {type === 'daily' && (
                    <div className="flex items-center gap-2">
                        <span>Täglich um</span>
                        <input type="number" min="0" max="23" value={hour} onChange={e => setHour(e.target.value)} className="w-16 border rounded p-1" />
                        <span>:</span>
                        <input type="number" min="0" max="59" value={minute} onChange={e => setMinute(e.target.value)} className="w-16 border rounded p-1" />
                        <span>Uhr</span>
                    </div>
                )}
                {type === 'weekly' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span>Jeden</span>
                            <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className="border rounded p-1">
                                <option value="1">Montag</option>
                                <option value="2">Dienstag</option>
                                <option value="3">Mittwoch</option>
                                <option value="4">Donnerstag</option>
                                <option value="5">Freitag</option>
                                <option value="6">Samstag</option>
                                <option value="0">Sonntag</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>um</span>
                            <input type="number" min="0" max="23" value={hour} onChange={e => setHour(e.target.value)} className="w-16 border rounded p-1" />
                            <span>:</span>
                            <input type="number" min="0" max="59" value={minute} onChange={e => setMinute(e.target.value)} className="w-16 border rounded p-1" />
                            <span>Uhr</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center">
                <span className="text-xs text-slate-500 uppercase font-bold">Ergebnis (Cron Syntax)</span>
                <div className="font-mono text-lg bg-slate-100 p-2 rounded mt-1 border border-slate-300">
                    {generateCron()}
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Abbrechen</button>
            <button onClick={() => onSave(generateCron())} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-2">
                <Check size={16}/> Übernehmen
            </button>
        </div>
      </div>
    </div>
  );
};
