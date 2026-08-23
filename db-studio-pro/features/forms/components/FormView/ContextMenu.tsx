import React from 'react';
import { createPortal } from 'react-dom';
import { Filter, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  fieldName: string;
  value: any;
  onClose: () => void;
  setActiveFilters: React.Dispatch<React.SetStateAction<any[]>>;
  setFilterEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveSort: React.Dispatch<React.SetStateAction<{ fieldName: string; direction: 'asc' | 'desc' } | null>>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  fieldName,
  value,
  onClose,
  setActiveFilters,
  setFilterEnabled,
  setActiveSort,
}) => {
  return createPortal(
    <div
      style={{ top: y, left: x }}
      className="fixed z-[1000] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xl rounded-md py-1 min-w-[220px] text-xs text-slate-700 dark:text-slate-200 font-sans"
      onClick={(e) => e.stopPropagation()}
      id="form-context-menu"
    >
      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
        Filter & Sortieren
      </div>
      <button
        onClick={() => {
          setActiveFilters((prev) => [
            ...prev.filter((f) => f.fieldName !== fieldName),
            { fieldName, value, operator: 'equals' },
          ]);
          setFilterEnabled(true);
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
      >
        <Filter size={14} className="text-indigo-600" />
        <span>Filtern nach Auswahl (="{value !== null && value !== undefined ? String(value) : ''}")</span>
      </button>
      <button
        onClick={() => {
          setActiveFilters((prev) => [
            ...prev.filter((f) => f.fieldName !== fieldName),
            { fieldName, value, operator: 'not_equals' },
          ]);
          setFilterEnabled(true);
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
      >
        <Filter size={14} className="text-rose-600" />
        <span>Filter ausschließen (&ne; "{value !== null && value !== undefined ? String(value) : ''}")</span>
      </button>
      <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
      <button
        onClick={() => {
          setActiveSort({ fieldName, direction: 'asc' });
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
      >
        <ArrowUp size={14} className="text-emerald-600" />
        <span>Aufsteigend sortieren ({fieldName})</span>
      </button>
      <button
        onClick={() => {
          setActiveSort({ fieldName, direction: 'desc' });
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
      >
        <ArrowDown size={14} className="text-amber-600" />
        <span>Absteigend sortieren ({fieldName})</span>
      </button>
      <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
      <button
        onClick={() => {
          setActiveFilters((prev) => prev.filter((f) => f.fieldName !== fieldName));
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
      >
        <RotateCcw size={14} className="text-slate-500" />
        <span>Filter für {fieldName} entfernen</span>
      </button>
      <button
        onClick={() => {
          setActiveFilters([]);
          setActiveSort(null);
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
      >
        <RotateCcw size={14} />
        <span>Alle Filter & Sortierungen löschen</span>
      </button>
    </div>,
    document.body
  );
};
