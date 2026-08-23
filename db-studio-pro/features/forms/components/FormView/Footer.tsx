import React from 'react';
import {
  XCircle,
  CheckCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Plus,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';

interface FooterProps {
  isUnbound: boolean;
  isCreating: boolean;
  finalHideNavigation: boolean;
  hideActions: boolean;
  onClose?: () => void;
  cancelCreate: () => void;
  saveNewRecord: () => void;
  processedData: Record<string, any>[];
  data: Record<string, any>[];
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  isReadOnly: boolean;
  startCreate: () => void;
  globalSearchText: string;
  setGlobalSearchText: (val: string) => void;
  filterEnabled: boolean;
  setFilterEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilters: any[];
  deleteCurrentRecord: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  isUnbound,
  isCreating,
  finalHideNavigation,
  hideActions,
  onClose,
  cancelCreate,
  saveNewRecord,
  processedData,
  data,
  currentIndex,
  setCurrentIndex,
  isReadOnly,
  startCreate,
  globalSearchText,
  setGlobalSearchText,
  filterEnabled,
  setFilterEnabled,
  activeFilters,
  deleteCurrentRecord,
}) => {
  if (isUnbound || (!isCreating && finalHideNavigation && hideActions && !onClose)) return null;

  return (
    <div
      className={`p-2 border-t border-slate-300 flex flex-wrap gap-y-2 justify-between shrink-0 rounded-b-lg items-center ${
        isCreating ? 'bg-emerald-50/80' : 'bg-[#f1f5fa] dark:bg-slate-800'
      } text-xs font-sans border-slate-300 dark:border-slate-700 select-none`}
      id="form-view-footer"
    >
      {isCreating ? (
        <div className="flex justify-end gap-2 w-full">
          <button
            onClick={cancelCreate}
            className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <XCircle size={14} /> Abbrechen
          </button>
          <button
            onClick={saveNewRecord}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <CheckCircle size={14} /> Speichern
          </button>
        </div>
      ) : (
        <>
          {/* Left: Navigation Buttons (Classic Access Layout) */}
          {!finalHideNavigation ? (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 shadow-xs">
              <button
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors"
                onClick={() => setCurrentIndex(0)}
                disabled={currentIndex === 0 || processedData.length === 0}
                title="Erster Datensatz"
              >
                <ChevronsLeft size={14} strokeWidth={2.5} />
              </button>
              <button
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0 || processedData.length === 0}
                title="Vorheriger Datensatz"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
              </button>

              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium px-1.5 flex items-center gap-1">
                Datensatz:
                <input
                  type="text"
                  value={processedData.length > 0 ? currentIndex + 1 : 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= processedData.length) {
                      setCurrentIndex(val - 1);
                    }
                  }}
                  className="w-10 text-center border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 py-0.5 text-[11px]"
                />
                von <span className="font-bold">{processedData.length}</span>
                {processedData.length < data.length && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-1 rounded">
                    (Gefiltert aus {data.length})
                  </span>
                )}
              </span>

              <button
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors"
                onClick={() => setCurrentIndex(Math.min(processedData.length - 1, currentIndex + 1))}
                disabled={currentIndex >= processedData.length - 1 || processedData.length === 0}
                title="Nächster Datensatz"
              >
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
              <button
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors"
                onClick={() => setCurrentIndex(processedData.length - 1)}
                disabled={currentIndex >= processedData.length - 1 || processedData.length === 0}
                title="Letzter Datensatz"
              >
                <ChevronsRight size={14} strokeWidth={2.5} />
              </button>

              {!isReadOnly && !hideActions && (
                <button
                  className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded transition-colors border-l border-slate-200 dark:border-slate-700 pl-1.5 ml-0.5"
                  onClick={startCreate}
                  title="Neuer leerer Datensatz"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Middle: Live Search Bar */}
          {!finalHideNavigation && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Suchen:</span>
              <div className="relative">
                <input
                  type="text"
                  value={globalSearchText}
                  onChange={(e) => setGlobalSearchText(e.target.value)}
                  placeholder="Ganzen Datensatz durchsuchen..."
                  className="w-48 pl-7 pr-2 py-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
                {globalSearchText && (
                  <button
                    onClick={() => setGlobalSearchText('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-[9px] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right: Filter Status and Record Controls */}
          <div className="flex items-center gap-2">
            {!finalHideNavigation && (
              <button
                onClick={() => setFilterEnabled(!filterEnabled)}
                disabled={activeFilters.length === 0}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                  activeFilters.length === 0
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : filterEnabled
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-300'
                }`}
                title={activeFilters.length === 0 ? 'Keine aktiven Filter' : 'Filter umschalten'}
              >
                <Filter size={11} />
                <span>{activeFilters.length === 0 ? 'Kein Filter' : filterEnabled ? 'Gefiltert' : 'Ungefiltert'}</span>
              </button>
            )}

            {!isReadOnly && !hideActions && (
              <button
                className="p-1.5 bg-white hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 rounded transition-colors flex items-center justify-center"
                onClick={deleteCurrentRecord}
                disabled={processedData.length === 0}
                title="Datensatz löschen"
              >
                <Trash2 size={13} />
              </button>
            )}

            {!!onClose && (
              <button
                onClick={onClose}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold shadow-xs"
              >
                Schließen
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
