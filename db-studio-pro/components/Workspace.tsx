
import React, { useState, useEffect } from 'react';
import { ViewType, Table, Query, Form } from '../types/index';
import { X, Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { ViewRouter } from './ViewRouter';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';

interface WorkspaceProps {
  onSetView: (view: any) => void;
  onActiveObjectChange: (obj: any) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ onSetView, onActiveObjectChange }) => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const { 
    tables, queries, reports, forms, workflows, pages, relationships, 
    setRelationships, executeQuery, addTable, updateTable, setLayout: onUpdateRelationshipNodes,
    backendConfig, setBackendConfig, saveProject, snapshot, lastSnapshot, layout: canvasNodes
  } = store;
  
  const { 
    currentView, activeObject, 
    isDirty, setIsDirty, formActionTrigger,
    setConfirmationModal, showMessage, activeWizard, setActiveWizard, addToast
  } = ui;

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [exportTrigger, setExportTrigger] = useState(0);
  const [generateTrigger, setGenerateTrigger] = useState(0);

  // Keyboard shortcut for Command Palette (handled via global event)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    const handleToggleEvent = () => {
      setShowCommandPalette(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-command-palette', handleToggleEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-command-palette', handleToggleEvent);
    };
  }, []);

  useEffect(() => {
      if (formActionTrigger?.action === 'backend_export') {
          setExportTrigger(formActionTrigger.timestamp || Date.now());
          ui.setFormActionTrigger(undefined);
      } else if (formActionTrigger?.action === 'backend_generate') {
          setGenerateTrigger(formActionTrigger.timestamp || Date.now());
          ui.setFormActionTrigger(undefined);
      }
  }, [formActionTrigger, ui]);

  const handleCommandNavigate = (type: string, id: string) => {
      if (type === 'table_data') onSetView({ type: 'table_data', tableId: id });
      if (type === 'query_results') onSetView({ type: 'query_results', queryId: id });
      if (type === 'form_view') onSetView({ type: 'form_view', formId: id });
      if (type === 'report_view') onSetView({ type: 'report_view', reportId: id });
  };

  const getTabTitle = () => {
    if (!activeObject) {
      switch (currentView.type) {
         case 'relationships': return 'Beziehungen';
         case 'backend_generator': return 'Codegenerierung & App Generator';
         case 'navigation_designer': return 'Navigations-Designer';
         case 'scheduler': return 'Zeitplaner';
         case 'api_import': return 'API Import';
         case 'live_sync': return 'Live Datenbank-Sync (Introspection)';
         case 'api_routing_designer': return 'API Routing Designer';
         case 'lifecycle_designer': return 'Lifecycle Designer';
         case 'multi_tenancy_wizard': return 'SaaS Multi-Tenant Wizard';
         case 'data_seeder_view': return 'Data Seeder';
         default: return '';
      }
    }
    return `${activeObject.name}${isDirty ? '*' : ''}`;
  }

  const saveTable = (table: Table, mode: 'create' | 'edit') => {
      if (mode === 'create') addTable(table);
      else updateTable(table);
  };

  const onDeleteRelationship = (id: string) => store.setRelationships(relationships.filter(r => r.id !== id));
  const onUpdateRelationship = (rel: any) => store.setRelationships(relationships.map(r => r.id === rel.id ? rel : r));
  const onMoveRelationshipNode = (id: string, x: number, y: number) => {
      const nodes = (canvasNodes || []).map(n => n.id === id ? { ...n, x, y } : n);
      onUpdateRelationshipNodes(nodes);
  };

  return (
    <div className="flex-1 relative bg-slate-200 dark:bg-slate-950 overflow-hidden flex flex-col transition-colors duration-300">
      <div className="print:hidden">
        <CommandPalette 
            isOpen={showCommandPalette} 
            onClose={() => setShowCommandPalette(false)}
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            onNavigate={handleCommandNavigate}
            onCreateTable={(name) => {
                const newId = crypto.randomUUID();
                saveTable({
                    id: newId,
                    name,
                    fields: [{ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }]
                }, 'create');
                onSetView({ type: 'table_edit', tableId: newId });
            }}
        />
      </div>
      
      <div className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 px-2 flex items-center h-8 justify-between print:hidden transition-colors duration-300">
         {currentView.type !== 'welcome' ? (
           <div className="bg-sky-100 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 px-3 py-1 text-xs font-bold border-t-2 border-sky-600 dark:border-sky-500 flex items-center gap-2">
             <span>{getTabTitle()}</span>
             <button onClick={() => onSetView({ type: 'welcome' })} className="hover:text-red-500 dark:hover:text-red-400"><X size={12}/></button>
           </div>
         ) : (
             <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">Dashboard</div>
         )}
         
         <button 
            onClick={() => setShowCommandPalette(true)}
            className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 mr-2 transition-colors"
            title="Befehlspalette öffnen (Strg+K)"
         >
             <Command size={12} /> <span className="hidden sm:inline">Suche (Strg+K)</span>
         </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 print:overflow-visible">
        <ViewRouter 
            currentView={currentView}
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            workflows={workflows}
            pages={pages}
            canvasNodes={canvasNodes}
            relationships={relationships}
            activeObject={activeObject}
            onSetView={onSetView}
            onActiveObjectChange={onActiveObjectChange}
            onDeleteRelationship={onDeleteRelationship}
            onUpdateRelationship={onUpdateRelationship}
            onMoveRelationshipNode={onMoveRelationshipNode}
            onUpdateRelationshipNodes={onUpdateRelationshipNodes}
            setRelationships={setRelationships}
            executeQuery={executeQuery}
            saveTable={saveTable}
            showConfirmation={(t, m, c, ct, cc) => setConfirmationModal({ title: t, message: m, onConfirm: c, confirmText: ct, confirmClass: cc })}
            formActionTrigger={formActionTrigger}
            backendConfig={backendConfig}
            onUpdateBackendConfig={setBackendConfig}
            exportTrigger={exportTrigger}
            generateTrigger={generateTrigger}
            showMessage={showMessage}
            onOpenDeployment={() => {}}
            onUpdateWorkflow={(wf) => store.setWorkflows(store.workflows.map(w => w.id === wf.id ? wf : w))}
            activeLock={null}
        />
      </div>
    </div>
  );
};
