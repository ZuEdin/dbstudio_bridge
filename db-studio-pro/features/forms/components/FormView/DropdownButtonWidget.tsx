import React, { useState, useEffect, useRef } from 'react';
import { Form, Table, FormElement, Query, getWidthClasses } from '../../../../types/index';
import { ChevronDown, Zap } from 'lucide-react';
import { executeMacro, getSavedMacros } from '../../../logic/MacroEngine';
import { useProjectStore } from '../../../../stores/useProjectStore';

interface DropdownButtonWidgetProps {
  el: FormElement;
  allForms: Form[];
  allTables: Table[];
  queries?: Query[];
  currentRecord?: Record<string, any>;
  onTableChange?: (table: Table) => void;
  setSubformModal: React.Dispatch<React.SetStateAction<any>>;
}

export const DropdownButtonWidget: React.FC<DropdownButtonWidgetProps> = ({
  el,
  allForms,
  allTables,
  queries,
  currentRecord,
  onTableChange,
  setSubformModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubItemClick = async (item: any) => {
    setIsOpen(false);
    if (!item.actions || item.actions.length === 0) return;

    for (const act of item.actions) {
      if (act.actionType === 'RunMacro' && act.macroId) {
        const macros = getSavedMacros();
        const macro = macros.find((m) => m.id === act.macroId);
        if (macro) {
          const store = (useProjectStore as any)?.getState ? (useProjectStore as any).getState() : {};
          executeMacro(macro, {
            tables: allTables,
            queries: queries && queries.length > 0 ? queries : (store.queries || []),
            reports: store.reports || [],
            relationships: store.relationships || [],
            currentRecord,
            onTableChange,
            onShowToast: (msg, type) => {
              alert(`[${type?.toUpperCase() || 'INFO'}] ${msg}`);
            },
          });
        } else {
          alert(`Makro mit ID "${act.macroId}" nicht gefunden.`);
        }
      } else if (act.actionType === 'ShowToast') {
        alert(act.toastMessage || 'Aktion ausgeführt!');
      } else if (act.actionType === 'OpenModal' && act.modalId) {
        const targetForm = allForms.find((f) => f.id === act.modalId);
        if (targetForm) {
          setSubformModal({
            isOpen: true,
            formId: targetForm.id,
            parentField: '',
            childField: '',
            linkValue: null,
          });
        }
      } else if (act.actionType === 'Navigate' && act.routeUrl) {
        window.location.hash = act.routeUrl;
      }
    }
  };

  const items = el.dropdownItems || [];

  return (
    <div ref={dropdownRef} className={`relative inline-block my-2 text-left ${getWidthClasses(el.width)}`.trim()} id={`dropdown-btn-${el.id}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          el.className ||
          'bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2'
        }
      >
        <span>{el.label || 'Aktionen'}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-1.5 w-56 rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-[150] animate-in fade-in zoom-in-95 duration-100">
          {items.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">Keine Optionen vorhanden</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSubItemClick(item)}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-none"
              >
                <span className="flex items-center gap-2">
                  <Zap size={13} className="text-indigo-500 fill-indigo-400 shrink-0" />
                  {item.label}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
