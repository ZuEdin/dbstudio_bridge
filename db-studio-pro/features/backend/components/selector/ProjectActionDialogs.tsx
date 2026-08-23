import React from 'react';
import { Project } from '../../../../types/index';

interface ProjectActionDialogsProps {
  dialog: { 
    isOpen: boolean; 
    type: 'confirm' | 'alert'; 
    title: string; 
    message: string; 
    onConfirm?: () => void; 
  } | null;
  onCloseDialog: () => void;
  copyingProject: Project | null;
  onCloseCopyDialog: () => void;
  renamingProject: Project | null;
  onCloseRenameDialog: () => void;
  renameValue: string;
  setRenameValue: (val: string) => void;
  onConfirmCopy: () => void;
  onConfirmRename: () => void;
}

export const ProjectActionDialogs: React.FC<ProjectActionDialogsProps> = ({
  dialog,
  onCloseDialog,
  copyingProject,
  onCloseCopyDialog,
  renamingProject,
  onCloseRenameDialog,
  renameValue,
  setRenameValue,
  onConfirmCopy,
  onConfirmRename
}) => {
  return (
    <>
      {/* Local Dialog for Confirm/Alert */}
      {dialog && (
        <div id="general-confirm-dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2 text-slate-800">{dialog.title}</h3>
            <p className="mb-6 text-slate-600 text-sm">{dialog.message}</p>
            <div className="flex justify-end gap-2">
              {dialog.type === 'confirm' && (
                <button 
                  onClick={onCloseDialog} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm transition-colors"
                >
                  Abbrechen
                </button>
              )}
              <button 
                onClick={() => { if (dialog.onConfirm) dialog.onConfirm(); else onCloseDialog(); }} 
                className={`px-4 py-2 text-white rounded font-bold text-sm shadow-sm transition-colors ${dialog.type === 'confirm' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {dialog.type === 'confirm' ? 'Ja, fortfahren' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog for Copying Project */}
      {copyingProject && (
        <div id="copy-project-dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2 text-slate-800">Projekt kopieren</h3>
            <p className="mb-4 text-xs text-slate-500">Geben Sie einen Namen für das kopierte Projekt ein:</p>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold mb-6 text-slate-800"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  onConfirmCopy();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={onCloseCopyDialog} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={onConfirmCopy} 
                disabled={!renameValue.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm shadow-sm disabled:opacity-50 transition-all"
              >
                Kopieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog for Renaming Project */}
      {renamingProject && (
        <div id="rename-project-dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2 text-slate-800">Projekt umbenennen</h3>
            <p className="mb-4 text-xs text-slate-500">Geben Sie den neuen Namen für das Projekt ein:</p>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold mb-6 text-slate-800"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  onConfirmRename();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={onCloseRenameDialog} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={onConfirmRename} 
                disabled={!renameValue.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm shadow-sm disabled:opacity-50 transition-all"
              >
                Umbenennen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
