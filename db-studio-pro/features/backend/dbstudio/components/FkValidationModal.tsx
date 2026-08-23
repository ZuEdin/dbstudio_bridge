import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { FkError } from '../types';

interface FkValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fkErrors: FkError[];
  onFixFkError: (toTableId: string) => void;
  onFixAllFkErrors: () => void;
  onConfirmUploadAnyway: () => void;
}

export const FkValidationModal: React.FC<FkValidationModalProps> = ({
  isOpen,
  onClose,
  fkErrors,
  onFixFkError,
  onFixAllFkErrors,
  onConfirmUploadAnyway,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-slate-800/85 border-b border-slate-700/80 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0 animate-bounce">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Referenzielle Integritätsprüfung</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">DB Studio Pro hat potenzielle Konflikte in Ihren Fremdschlüsselbeziehungen erkannt.</p>
          </div>
        </div>

        {/* Error List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 max-h-[50vh]">
          {fkErrors.map((err, idx) => (
            <div key={idx} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-semibold uppercase tracking-wider font-mono">
                    {err.type === 'missing_table' ? 'Fehlende Tabelle' : err.type === 'type_mismatch' ? 'Typ-Konflikt' : 'Fehlendes Feld'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium font-sans">{err.message}</p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{err.fromTable}.{err.fromField}</span>
                  <ArrowRight size={10} className="text-indigo-400" />
                  <span>{err.toTable}.{err.toField}</span>
                </div>
              </div>

              {err.fixable && err.toTableId && (
                <button
                  onClick={() => onFixFkError(err.toTableId!)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  Tabelle auswählen
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-2">
            {fkErrors.some(e => e.fixable) && (
              <button
                onClick={onFixAllFkErrors}
                className="w-full sm:w-auto bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
              >
                Alle referenzierten Tabellen auswählen
              </button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirmUploadAnyway}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Trotzdem hochladen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
