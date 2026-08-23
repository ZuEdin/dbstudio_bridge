import React from 'react';
import { Code } from 'lucide-react';

interface VersionControlJsonModalProps {
  showJsonModal: string;
  onClose: () => void;
}

export const VersionControlJsonModal: React.FC<VersionControlJsonModalProps> = ({
  showJsonModal,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-lg">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Code size={16} className="text-amber-500" />
            <span>JSON Schema-Snapshot</span>
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Schließen
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed rounded-b-lg">
          <pre className="whitespace-pre-wrap">{showJsonModal}</pre>
        </div>
      </div>
    </div>
  );
};
