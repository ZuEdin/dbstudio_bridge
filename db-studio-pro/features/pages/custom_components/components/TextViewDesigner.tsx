import React from 'react';
import { Sliders } from 'lucide-react';

interface TextViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
}

export const TextViewDesigner: React.FC<TextViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Text &amp; Label konfigurieren
      </h4>
      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Textinhalt (Unterstützt {"{platzhalter}"})</label>
        <textarea
          value={configObj.text || ''}
          onChange={(e) => updateVisualConfig({ text: e.target.value })}
          placeholder="z.B. Willkommen zurück, {Name}!"
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded min-h-[80px] focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
        />
        <p className="text-[9px] text-slate-400 mt-1 leading-normal">
          Verwenden Sie geschweifte Klammern, um Tabellenspalten oder Parameter dynamisch einzubinden (z.B. {"{Email}"} oder {"{selectedId}"}).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Schriftgröße</label>
          <select
            value={configObj.fontSize || 'text-base'}
            onChange={(e) => updateVisualConfig({ fontSize: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="text-xs">Sehr klein (xs)</option>
            <option value="text-sm">Klein (sm)</option>
            <option value="text-base">Normal (base)</option>
            <option value="text-lg">Mittelgroß (lg)</option>
            <option value="text-xl">Groß (xl)</option>
            <option value="text-2xl">Sehr Groß (2xl)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Schriftgewicht</label>
          <select
            value={configObj.fontWeight || 'font-normal'}
            onChange={(e) => updateVisualConfig({ fontWeight: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="font-normal">Normal</option>
            <option value="font-medium">Medium</option>
            <option value="font-semibold">Semibold</option>
            <option value="font-bold">Fett (Bold)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Text-Ausrichtung</label>
          <select
            value={configObj.alignment || 'text-left'}
            onChange={(e) => updateVisualConfig({ alignment: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="text-left">Links (Left)</option>
            <option value="text-center">Zentriert (Center)</option>
            <option value="text-right">Rechts (Right)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Farbe (Text-Klasse)</label>
          <select
            value={configObj.colorClass || 'text-slate-700'}
            onChange={(e) => updateVisualConfig({ colorClass: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="text-slate-800 dark:text-slate-200">Dunkelgrau</option>
            <option value="text-slate-500 dark:text-slate-400">Mittelgrau</option>
            <option value="text-indigo-700 dark:text-indigo-400">Indigo Blau</option>
            <option value="text-emerald-700 dark:text-emerald-400">Smaragd Grün</option>
            <option value="text-amber-700 dark:text-amber-400">Amber Gelb</option>
            <option value="text-red-700 dark:text-red-400">Feuer Rot</option>
          </select>
        </div>
      </div>
    </div>
  );
};
