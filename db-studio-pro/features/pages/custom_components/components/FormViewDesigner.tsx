import React from 'react';
import { Sliders } from 'lucide-react';

interface FormViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  forms: any[];
}

export const FormViewDesigner: React.FC<FormViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  forms,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Formular einbetten
      </h4>
      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Formular auswählen</label>
        <select
          value={configObj.formId || ''}
          onChange={(e) => updateVisualConfig({ formId: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
        >
          <option value="">-- Formular wählen --</option>
          {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Formular-Modus</label>
        <select
          value={configObj.formMode || 'create'}
          onChange={(e) => updateVisualConfig({ formMode: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
        >
          <option value="create">Neu (Anlegen - INSERT)</option>
          <option value="edit">Bearbeiten (UPDATE - benötigt ID-Parameter)</option>
        </select>
      </div>
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input 
            type="checkbox"
            checked={!!configObj.hideHeader}
            onChange={(e) => updateVisualConfig({ hideHeader: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          Formular-Kopfzeile ausblenden
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input 
            type="checkbox"
            checked={!!configObj.hideActions}
            onChange={(e) => updateVisualConfig({ hideActions: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          Aktions-Buttons ausblenden (Speichern/Abbrechen)
        </label>
      </div>
    </div>
  );
};
