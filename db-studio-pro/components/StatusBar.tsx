
import React, { useState } from 'react';
import { ViewType, Table, Query, Report, Form, Chart, Workflow } from '../types/index';
import { PencilRuler, Eye, Database, Layout, FileText, Table as TableIcon, Keyboard, X } from 'lucide-react';

interface StatusBarProps {
  currentView: ViewType;
  activeObject: Table | Query | Report | Form | Chart | Workflow | null;
  onSetView: (view: ViewType) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ currentView, activeObject, onSetView }) => {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  const getStatusText = () => {
    if (!activeObject) return "Bereit";
    if (currentView.type === 'table_edit') return `Entwurf: Tabelle "${activeObject.name}"`;
    if (currentView.type === 'table_data') return `Datenblatt: Tabelle "${activeObject.name}"`;
    if (currentView.type === 'query_designer') return `Entwurf: Abfrage "${activeObject.name}"`;
    if (currentView.type === 'query_results') return `Datenblatt: Abfrage "${activeObject.name}"`;
    if (currentView.type === 'form_designer') return `Entwurf: Formular "${activeObject.name}"`;
    if (currentView.type === 'form_view') return `Formularansicht: "${activeObject.name}"`;
    if (currentView.type === 'report_view') return `Berichtsansicht: "${activeObject.name}"`;
    if (currentView.type === 'report_designer') return `Entwurf: Bericht "${activeObject.name}"`;
    if (currentView.type === 'chart_view') return `Diagramm: "${activeObject.name}"`;
    if (currentView.type === 'workflow_designer') return `Workflow: "${activeObject.name}"`;
    return "Bereit";
  };

  const handleSwitchView = (mode: 'design' | 'view') => {
    if (!activeObject) return;

    if ('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
        // Table
        onSetView({ type: mode === 'design' ? 'table_edit' : 'table_data', tableId: activeObject.id });
    } else if ('nodes' in activeObject && 'columns' in activeObject) { // Query has columns
        // Query
        onSetView({ type: mode === 'design' ? 'query_designer' : 'query_results', queryId: activeObject.id });
    } else if ('layout' in activeObject) {
        // Form
        onSetView({ type: mode === 'design' ? 'form_designer' : 'form_view', formId: activeObject.id });
    } else if ('summaries' in activeObject) {
        // Report
        onSetView({ type: mode === 'design' ? 'report_designer' : 'report_view', reportId: activeObject.id });
    }
  };

  const isDesignActive = ['table_edit', 'query_designer', 'form_designer', 'report_designer'].includes(currentView.type);
  const isViewActive = ['table_data', 'query_results', 'form_view', 'report_view'].includes(currentView.type);
  const canSwitch = activeObject !== null 
    && currentView.type !== 'relationships' 
    && currentView.type !== 'welcome' 
    && currentView.type !== 'table_create'
    && !currentView.type.includes('chart')
    && !currentView.type.includes('workflow');

  return (
    <div className="bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 h-6 px-2 flex justify-between items-center text-xs select-none print:hidden transition-colors duration-300">
      <div className="text-slate-600 dark:text-slate-400 font-medium">
        {getStatusText()}
      </div>
      
      <div className="flex items-center gap-2">
        {canSwitch && (
          <div className="flex gap-1">
            <button 
              onClick={() => handleSwitchView('design')}
              title="Entwurfsansicht"
              className={`p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 ${isDesignActive ? 'bg-slate-300 dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-inner' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <PencilRuler size={14} />
            </button>
            <button 
              onClick={() => handleSwitchView('view')}
              title="Datenblatt-/Formularansicht"
              className={`p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 ${isViewActive ? 'bg-slate-300 dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-inner' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {currentView.type.includes('form') ? <Layout size={14}/> : currentView.type.includes('report') ? <FileText size={14}/> : <TableIcon size={14} />}
            </button>
          </div>
        )}

        <button 
          onClick={() => setShowShortcutsModal(true)}
          title="Tastatur-Shortcuts einsehen"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-300/60 hover:bg-slate-300 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
        >
          <Keyboard size={13} />
          <span>Hotkeys</span>
        </button>
      </div>

      {showShortcutsModal && (
        <div 
          className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Keyboard size={18} className="text-indigo-500" />
                <span>⌨️ Tastatur-Shortcuts (Hotkeys)</span>
              </div>
              <button 
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="p-4 space-y-2.5 text-xs">
              <p className="text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Nutze diese Tastenkombinationen, um deine Workflows im DB Studio Pro extrem zu beschleunigen:
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Speichern</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-xs font-mono font-bold">Strg + S</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Befehlspalette / Suche</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-xs font-mono font-bold">Strg + K</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850/40">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Suchen & Ersetzen</span>
                    <span className="text-[10px] text-slate-400">Toggelt Filter & Spaltensuche</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-xs font-mono font-bold">Strg + F</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850/40">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Objekt duplizieren</span>
                    <span className="text-[10px] text-slate-400">Dupliziert aktive Tabelle / Abfrage</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-xs font-mono font-bold">Alt + D</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850/40">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Schnelle neue Tabelle</span>
                    <span className="text-[10px] text-slate-400">Erstellt eine leere Tabelle</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-xs font-mono font-bold">Alt + N</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850/40">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Aktives Objekt löschen</span>
                    <span className="text-[10px] text-slate-400">Mit Sicherheitsabfrage</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-xs font-mono font-bold">Entf / Del</kbd>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-850 text-right">
              <button 
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-all text-xs"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
