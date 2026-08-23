import React from 'react';
import { Sliders } from 'lucide-react';

interface ButtonViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  pages: any[];
}

export const ButtonViewDesigner: React.FC<ButtonViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  pages,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Aktions-Button konfigurieren
      </h4>
      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Button-Label</label>
        <input 
          type="text"
          value={configObj.label || ''}
          onChange={(e) => updateVisualConfig({ label: e.target.value })}
          placeholder="Button Text"
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Stil-Variante</label>
          <select
            value={configObj.variant || 'primary'}
            onChange={(e) => updateVisualConfig({ variant: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="primary">Primär (Indigo)</option>
            <option value="secondary">Sekundär (Grau)</option>
            <option value="danger">Gefahr (Rot)</option>
            <option value="outline">Rahmen (Outline)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Aktions-Typ</label>
          <select
            value={configObj.actionType || 'submit'}
            onChange={(e) => updateVisualConfig({ actionType: e.target.value, targetPageId: '', targetParamKey: '', targetParamVal: '' })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
          >
            <option value="submit">Formular absenden (Submit)</option>
            <option value="navigate">Auf Seite navigieren</option>
            <option value="setParam">Zustands-Parameter setzen</option>
          </select>
        </div>
      </div>

      {configObj.actionType === 'navigate' && (
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Zielseite auswählen</label>
          <select
            value={configObj.targetPageId || ''}
            onChange={(e) => updateVisualConfig({ targetPageId: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Zielseite --</option>
            {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {configObj.actionType === 'setParam' && (
        <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg">
          <div>
            <label className="block text-[9px] text-slate-500">Parameter Key</label>
            <input 
              type="text"
              value={configObj.targetParamKey || ''}
              onChange={(e) => updateVisualConfig({ targetParamKey: e.target.value })}
              placeholder="z.B. tab"
              className="w-full p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 text-xs dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[9px] text-slate-500">Parameter Wert</label>
            <input 
              type="text"
              value={configObj.targetParamVal || ''}
              onChange={(e) => updateVisualConfig({ targetParamVal: e.target.value })}
              placeholder="z.B. active"
              className="w-full p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 text-xs dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
