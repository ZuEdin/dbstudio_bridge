import React from 'react';

interface FormViewPreviewProps {
  configObj: any;
  forms: any[];
}

export const FormViewPreview: React.FC<FormViewPreviewProps> = ({
  configObj,
  forms
}) => {
  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
      <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Eingebettetes Formular</span>
        <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-bold uppercase dark:text-indigo-400">
          Form ID: {configObj.formId ? 'Konfiguriert' : 'Unbesetzt'}
        </span>
      </div>
      <div className="bg-white dark:bg-slate-850 p-5 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 shadow-inner">
        {!configObj.formId ? (
          <div className="text-center p-8 text-slate-400 text-xs italic">
            Bitte wählen Sie links ein Formular aus, das hier eingebettet werden soll.
          </div>
        ) : (
          <>
            {!configObj.hideHeader && (
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b dark:border-slate-800 pb-1.5">
                Formular: {forms.find(f => f.id === configObj.formId)?.name || 'Geladen'} ({configObj.formMode})
              </div>
            )}
            <div className="space-y-2 opacity-50 select-none">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Vorname / Bezeichnung</label>
                <input type="text" disabled className="w-full border dark:border-slate-700 p-1 text-xs rounded bg-slate-50 dark:bg-slate-800 dark:text-white" defaultValue="Max" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">E-Mail Adresse</label>
                <input type="text" disabled className="w-full border dark:border-slate-700 p-1 text-xs rounded bg-slate-50 dark:bg-slate-800 dark:text-white" defaultValue="max@beispiel.de" />
              </div>
            </div>
            {!configObj.hideActions && (
              <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button disabled className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-[10px] font-bold rounded dark:text-slate-300">Abbrechen</button>
                <button disabled className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded">Speichern ({configObj.formMode === 'create' ? 'Anlegen' : 'Update'})</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
