import React from 'react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  newProjName: string;
  setNewProjName: (name: string) => void;
  newProjDesc: string;
  setNewProjDesc: (desc: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  newProjName,
  setNewProjName,
  newProjDesc,
  setNewProjDesc,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-6 bg-slate-800/85 border-b border-slate-700/80">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Neues Team-Projekt starten</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">Erstellt ein neues, zentralisiertes DB-Schema für Ihr Entwickler-Team.</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold font-sans">Projektname</label>
            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="z.B. Abrechnungssystem V3"
              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold font-sans">Projektbeschreibung</label>
            <textarea
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
              placeholder="Welches Schema soll hier entworfen werden?"
              rows={3}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Projekt anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
