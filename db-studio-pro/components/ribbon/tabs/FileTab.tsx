
import React from 'react';
import { Database, Save, Undo, Redo, Info } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useTranslation } from 'react-i18next';

interface FileTabProps {
  onAction: (action: string) => void;
  currentDbType: string;
}

export const FileTab: React.FC<FileTabProps> = ({ onAction, currentDbType }) => {
  const undo = useProjectStore(state => state.undo);
  const redo = useProjectStore(state => state.redo);
  const history = useProjectStore(state => (state as any).history);
  const { t } = useTranslation();

  return (
    <div className="flex gap-4 h-full items-center">
      <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded" onClick={() => onAction('new_db')}>
        <Database className="w-8 h-8 text-blue-600 mb-1" />
        <span className="text-xs">{t('ribbon.actions.new_db')}</span>
      </div>
      <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded" onClick={() => onAction('save')}>
        <Save className="w-8 h-8 text-green-600 mb-1" />
        <span className="text-xs">{t('ribbon.actions.save')}</span>
      </div>
      <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded text-red-600 hover:text-red-700" onClick={() => onAction('close_project')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        <span className="text-xs">Projekt schließen</span>
      </div>

      <div className="flex gap-1 border-l border-r border-slate-300 px-2 h-12 items-center">
          <button 
            onClick={undo} 
            disabled={history?.past.length === 0}
            className="p-2 hover:bg-slate-200 rounded disabled:text-slate-300 text-slate-700" 
            title="Undo (Ctrl+Z)"
          >
              <Undo size={20} />
          </button>
          <button 
            onClick={redo} 
            disabled={history?.future.length === 0}
            className="p-2 hover:bg-slate-200 rounded disabled:text-slate-300 text-slate-700" 
            title="Redo (Ctrl+Y)"
          >
              <Redo size={20} />
          </button>
      </div>

      <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded" onClick={() => onAction('open_app_info')}>
        <Info className="w-8 h-8 text-slate-500 mb-1" />
        <span className="text-xs">Info / Über</span>
      </div>

      <div className="flex flex-col justify-center text-sm text-slate-600 ml-2 border-l border-slate-300 pl-4">
        <span className="font-bold">Engine:</span>
        <span className="flex items-center gap-1">
            {currentDbType} 
            <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">WASM</span>
        </span>
      </div>
    </div>
  );
};
