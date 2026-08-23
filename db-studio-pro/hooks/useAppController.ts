
import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';
import { ViewType, Table, Query, Report, Form, Chart, Workflow, LockInfo, IntegrationsConfig, Project, BackendConfig, Relationship } from '../types/index';
import { saveProjectToStorage, getProjectById } from '../services/storageService';
import { sanitizeProjectName } from '../utils/nameUtils';
import { cloudService } from '../services/cloudService'; 
import { createTableFromTemplate } from '../services/tableTemplateService';
import { WorkflowExecutionEngine } from '../features/logic/WorkflowEngine';
import { generateBackendCode } from '../utils/backendGenerators';
import { generateDeploymentScripts } from '../utils/generators/deploymentGenerator';
import { getSavedMacros } from '../features/logic/MacroEngine';
import { useBridgeStore } from '../stores/useBridgeStore';
import * as XLSX from 'xlsx';

// Import Sub-Hooks
import { useChatState } from './useChatState';

export const useAppController = () => {
  const store = useProjectStore();
  const ui = useUIStore();
  const chat = useChatState();
  
  const { 
    currentView, setCurrentView, 
    activeTab, setActiveTab, 
    activeObject, setActiveObject,
    isDirty, setIsDirty,
    savePrompt, setSavePrompt
  } = ui;
  
  // Locking State
  const [activeLock, setActiveLock] = useState<LockInfo | null>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // --- Schema change notification system ---
  const [prevTables, setPrevTables] = useState<Table[]>([]);
  const [prevRelationships, setPrevRelationships] = useState<Relationship[]>([]);
  const [isSchemaTrackingReady, setIsSchemaTrackingReady] = useState(false);

  useEffect(() => {
    if (store.projectId && !isSchemaTrackingReady) {
      setPrevTables(store.tables || []);
      setPrevRelationships(store.relationships || []);
      setIsSchemaTrackingReady(true);
    }
  }, [store.projectId, store.tables, store.relationships, isSchemaTrackingReady]);

  useEffect(() => {
    if (!isSchemaTrackingReady || !store.projectId) return;

    // 1. Check for added tables
    if (store.tables.length > prevTables.length) {
      const added = store.tables.filter(t => !prevTables.some(pt => pt.id === t.id));
      added.forEach(t => {
        const msg = `📢 [System] Tabelle '${t.name}' wurde von 'Me' erstellt.`;
        chat.sendSystemMessage('c1', msg, 'system', 'System');
        
        setTimeout(() => {
          const names = ['Sarah Müller', 'Tom Schmidt'];
          const selectedName = names[Math.floor(Math.random() * names.length)];
          const senderId = selectedName === 'Sarah Müller' ? 'u2' : 'u3';
          const replies = [
            `Sieht hervorragend aus! Ich passe mein Frontend direkt an die Tabelle '${t.name}' an.`,
            `Klasse, danke für das Schema von '${t.name}'. Ich werde direkt die API-Endpunkte dafür prüfen.`,
            `Gute Arbeit! Sind für '${t.name}' auch schon Fremdschlüssel definiert?`
          ];
          const reply = replies[Math.floor(Math.random() * replies.length)];
          chat.sendSystemMessage('c1', reply, senderId, selectedName);
        }, 3000);
      });
    }

    // 2. Check for deleted tables
    else if (store.tables.length < prevTables.length) {
      const deleted = prevTables.filter(pt => !store.tables.some(t => t.id === pt.id));
      deleted.forEach(t => {
        const msg = `⚠️ [System] Tabelle '${t.name}' wurde von 'Me' gelöscht.`;
        chat.sendSystemMessage('c1', msg, 'system', 'System');
        
        setTimeout(() => {
          const names = ['Sarah Müller', 'Tom Schmidt'];
          const selectedName = names[Math.floor(Math.random() * names.length)];
          const senderId = selectedName === 'Sarah Müller' ? 'u2' : 'u3';
          const replies = [
            `Oh, wir haben '${t.name}' gelöscht? Stimmt, das alte Schema war obsolet.`,
            `Ok, ich entferne die entsprechenden Code-Referenzen für '${t.name}'.`,
            `Gut zu wissen, dann brauche ich dafür keine Testdaten mehr generieren.`
          ];
          const reply = replies[Math.floor(Math.random() * replies.length)];
          chat.sendSystemMessage('c1', reply, senderId, selectedName);
        }, 3000);
      });
    }

    // 3. Check for modified tables (field additions or renames)
    else if (store.tables.length === prevTables.length) {
      store.tables.forEach(t => {
        const prevT = prevTables.find(pt => pt.id === t.id);
        if (prevT) {
          // Check for rename
          if (prevT.name !== t.name) {
            const msg = `🔄 [System] Tabelle '${prevT.name}' wurde in '${t.name}' umbenannt.`;
            chat.sendSystemMessage('c1', msg, 'system', 'System');
            
            setTimeout(() => {
              chat.sendSystemMessage('c1', `Verstanden. Ich benenne das Modell in unserem Backend ebenfalls um.`, 'u3', 'Tom Schmidt');
            }, 3000);
          }
          // Check for field added
          else if (t.fields.length > prevT.fields.length) {
            const addedFields = t.fields.filter(f => !prevT.fields.some(pf => pf.id === f.id));
            addedFields.forEach(f => {
              const msg = `➕ [System] Spalte '${f.name}' (${f.type}) wurde zur Tabelle '${t.name}' hinzugefügt.`;
              chat.sendSystemMessage('c1', msg, 'system', 'System');
              
              setTimeout(() => {
                chat.sendSystemMessage('c1', `Perfekt, '${f.name}' ist genau das, was wir für die Suche benötigt haben!`, 'u2', 'Sarah Müller');
              }, 3000);
            });
          }
          // Check for field deleted
          else if (t.fields.length < prevT.fields.length) {
            const deletedFields = prevT.fields.filter(pf => !t.fields.some(f => f.id === pf.id));
            deletedFields.forEach(pf => {
              const msg = `➖ [System] Spalte '${pf.name}' wurde aus Tabelle '${t.name}' entfernt.`;
              chat.sendSystemMessage('c1', msg, 'system', 'System');
            });
          }
        }
      });
    }

    setPrevTables(store.tables);
  }, [store.tables, isSchemaTrackingReady, store.projectId]);

  useEffect(() => {
    if (!isSchemaTrackingReady || !store.projectId) return;

    // Check for added relationship
    if (store.relationships.length > prevRelationships.length) {
      const added = store.relationships.filter(r => !prevRelationships.some(pr => pr.id === r.id));
      added.forEach(r => {
        const fromTab = store.tables.find(t => t.id === r.fromTableId);
        const toTab = store.tables.find(t => t.id === r.toTableId);
        if (fromTab && toTab) {
          const fromFld = fromTab.fields.find(f => f.id === r.fromFieldId);
          const toFld = toTab.fields.find(f => f.id === r.toFieldId);
          
          const msg = `🔗 [System] Neue Fremdschlüsselbeziehung definiert: '${fromTab.name}.${fromFld?.name || '?'}' verweist auf '${toTab.name}.${toFld?.name || '?'}'`;
          chat.sendSystemMessage('c1', msg, 'system', 'System');
          
          setTimeout(() => {
            chat.sendSystemMessage('c1', `Hervorragend, das sichert die referenzielle Integrität zwischen '${fromTab.name}' und '${toTab.name}'!`, 'u2', 'Sarah Müller');
          }, 3500);
        }
      });
    }

    setPrevRelationships(store.relationships || []);
  }, [store.relationships, isSchemaTrackingReady, store.projectId]);

  useEffect(() => {
    const autoLoad = async () => {
      await store.init();
      try {
        const lastProjectId = localStorage.getItem('lastProjectId');
        if (lastProjectId && !store.projectId) {
           const proj = await getProjectById(lastProjectId);
           if (proj) {
              store.loadProject(proj);
              // Also restore last view if saved
              const lastViewStr = localStorage.getItem(`lastView_${lastProjectId}`);
              if (lastViewStr) {
                 try {
                    const lastView = JSON.parse(lastViewStr);
                    setCurrentView(lastView);
                    
                    // If there was an active object associated, fetch/resolve it
                    if (lastView.tableId) {
                       const tbl = proj.data.tables.find(t => t.id === lastView.tableId);
                       if (tbl) setActiveObject(tbl);
                    } else if (lastView.queryId) {
                       const q = proj.data.queries.find(x => x.id === lastView.queryId);
                       if (q) setActiveObject(q);
                    } else if (lastView.formId) {
                       const f = proj.data.forms.find(x => x.id === lastView.formId);
                       if (f) setActiveObject(f);
                    } else if (lastView.reportId) {
                       const r = proj.data.reports.find(x => x.id === lastView.reportId);
                       if (r) setActiveObject(r);
                    } else if (lastView.chartId) {
                       const c = proj.data.charts?.find(x => x.id === lastView.chartId);
                       if (c) setActiveObject(c);
                    } else if (lastView.pageId) {
                       const p = proj.data.pages?.find(x => x.id === lastView.pageId);
                       if (p) setActiveObject(p);
                    } else if (lastView.workflowId) {
                       const w = proj.data.workflows?.find(x => x.id === lastView.workflowId);
                       if (w) setActiveObject(w);
                    }
                 } catch (e) {
                    console.error("Failed to restore last view", e);
                 }
              }
           }
        }
      } catch (e) {
        console.error("Startup autoload failed", e);
      }
    };
    autoLoad();
  }, []);

  // --- Projekt-Auto-Save (IndexedDB Wrapper Fallback) ---
  useEffect(() => {
    if (!store.projectId) return;

    const interval = setInterval(async () => {
      if (ui.isDirty) {
        try {
          await store.saveProject();
          ui.setIsDirty(false);
          console.log("Projekt-Auto-Save: Daten erfolgreich in IndexedDB gesichert.");
          ui.addToast("Projekt automatisch gesichert.", 'info');
        } catch (err) {
          console.error("Auto-Save in IndexedDB fehlgeschlagen", err);
        }
      }
    }, 15000); // Check and auto-save every 15 seconds if there are changes

    return () => clearInterval(interval);
  }, [store.projectId, ui.isDirty]);

  // --- Auto-Sync Tables to Layout Nodes ---
  useEffect(() => {
      if (!store.tables || store.tables.length === 0) return;

      const currentTableIds = store.tables.map(t => t.id);
      const currentNodes = store.layout || [];
      const layoutTableIds = new Set(currentNodes.map(n => n.tableId));
      
      let hasChanges = false;
      let newLayout = [...currentNodes];

      // Remove nodes for deleted tables
      const nodesToRemove = newLayout.filter(n => !store.tables.find(t => t.id === n.tableId));
      if (nodesToRemove.length > 0) {
          newLayout = newLayout.filter(n => store.tables.find(t => t.id === n.tableId));
          hasChanges = true;
      }

      // Add nodes for new tables
      const tablesToAdd = store.tables.filter(t => !layoutTableIds.has(t.id));
      if (tablesToAdd.length > 0) {
          tablesToAdd.forEach((t, i) => {
              newLayout.push({
                  id: `node_${t.id}`,
                  tableId: t.id,
                  x: 50 + (i * 250) % 1000, 
                  y: 50 + (Math.floor(i / 4) * 200)
              });
          });
          hasChanges = true;
      }

      if (hasChanges) {
          store.setLayout(newLayout);
      }
  }, [store.tables.length, store.layout.length]); // Check on length changes

  const releaseCurrentLock = async () => {
      if (activeObject && 'id' in activeObject) {
          await cloudService.releaseLock(activeObject.id, 'u1'); // Mock user u1
          setActiveLock(null);
      }
  };

  const handleSetView = async (view: ViewType) => {
    if (activeObject) {
        await releaseCurrentLock();
    }

    if (isDirty) { 
        setSavePrompt({ show: true, targetView: view }); 
        return; 
    }

    setCurrentView(view);
    
    // Use fresh state
    const freshState = useProjectStore.getState();
    if (freshState.projectId) {
        try {
            localStorage.setItem(`lastView_${freshState.projectId}`, JSON.stringify(view));
        } catch (e) {
            console.warn("localStorage not available", e);
        }
    }
    
    let foundObject = null;

    if (view.type === 'table_data' || view.type === 'table_edit') {
        foundObject = freshState.tables.find(t => t.id === view.tableId) || null;
    } else if (view.type === 'query_results' || view.type === 'query_designer') {
        foundObject = freshState.queries.find(q => q.id === view.queryId) || null;
    } else if (view.type === 'form_view' || view.type === 'form_designer') {
        foundObject = freshState.forms.find(f => f.id === view.formId) || null;
    } else if (view.type === 'report_view' || view.type === 'report_designer') {
        foundObject = freshState.reports.find(r => r.id === view.reportId) || null;
    } else if (view.type === 'chart_view') {
        foundObject = freshState.charts.find(c => c.id === view.chartId) || null;
    } else if (view.type === 'page_designer' || view.type === 'page_view') {
        foundObject = freshState.pages?.find(p => p.id === view.pageId) || null;
    } else if (view.type === 'workflow_designer') {
        foundObject = freshState.workflows.find(w => w.id === view.workflowId) || null;
    }

    if (foundObject) {
        setActiveObject(foundObject);
    } else if (view.type === 'table_create') {
        setActiveObject({
            id: 'new_table_' + Date.now(),
            name: 'NeueTabelle',
            fields: [{ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }],
            data: []
        });
        setReadOnlyMode(false);
    } else if (view.type === 'query_designer' && !view.queryId) {
        setActiveObject({
            id: 'new_query_' + Date.now(),
            type: 'SELECT',
            name: 'NeueAbfrage',
            nodes: [],
            columns: []
        });
        setReadOnlyMode(false);
    } else if (
        view.type === 'welcome' || 
        view.type === 'relationships' || 
        view.type === 'backend_generator' || 
        view.type === 'scheduler' || 
        view.type === 'api_import' || 
        view.type === 'live_sync' || 
        view.type === 'app_info' ||
        view.type === 'tickets_board' ||
        view.type === 'ai_swarm'
    ) {
        setActiveObject(null);
        setReadOnlyMode(false);
    }
  };

  const handleActiveObjectChange = (newObjectState: any) => {
    if (readOnlyMode) { 
        ui.addToast("Schreibgeschützt.", 'error'); 
        return; 
    }
    setActiveObject(newObjectState);
    if (!isDirty) setIsDirty(true);
  };

  const handleSave = async () => { 
      if (activeObject) {
          const nameClean = (activeObject.name || '').trim();
          if (!nameClean) {
              ui.addToast("Name darf nicht leer sein.", 'error');
              return;
          }

          if ('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
              // Table
              const hasConflict = store.tables.some(t => t.id !== activeObject.id && t.name.trim().toLowerCase() === nameClean.toLowerCase());
              if (hasConflict) {
                  ui.showMessage("Namenskonflikt", `Eine Tabelle mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                  return;
              }
              const exists = store.tables.some(t => t.id === activeObject.id);
              if (exists) store.updateTable(activeObject as Table);
              else store.addTable(activeObject as Table);
          } else if ('nodes' in activeObject && 'columns' in activeObject) {
              // Query
              const hasConflict = store.queries.some(q => q.id !== activeObject.id && q.name.trim().toLowerCase() === nameClean.toLowerCase());
              if (hasConflict) {
                  ui.showMessage("Namenskonflikt", `Eine Abfrage mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                  return;
              }
              const exists = store.queries.some(q => q.id === activeObject.id);
              if (exists) {
                  const queries = store.queries.map(q => q.id === activeObject.id ? activeObject as Query : q);
                  store.setQueries(queries);
              } else {
                  store.setQueries([...store.queries, activeObject as Query]);
              }
          } else if ('layout' in activeObject && 'sourceType' in activeObject) {
              // Form
              const hasConflict = store.forms.some(f => f.id !== activeObject.id && f.name.trim().toLowerCase() === nameClean.toLowerCase());
              if (hasConflict) {
                  ui.showMessage("Namenskonflikt", `Ein Formular mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                  return;
              }
              const exists = store.forms.some(f => f.id === activeObject.id);
              if (exists) {
                  const forms = store.forms.map(f => f.id === activeObject.id ? activeObject as Form : f);
                  store.setForms(forms);
              } else {
                  store.setForms([...store.forms, activeObject as Form]);
              }
          } else if ('layout' in activeObject && !('sourceType' in activeObject)) {
              // CustomPage
              const hasConflict = (store.pages || []).some(p => p.id !== activeObject.id && p.name.trim().toLowerCase() === nameClean.toLowerCase());
              if (hasConflict) {
                  ui.showMessage("Namenskonflikt", `Eine Seite mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                  return;
              }
              const exists = store.pages?.some(p => p.id === activeObject.id);
              if (exists) {
                  const pages = (store.pages || []).map(p => p.id === activeObject.id ? activeObject as any : p);
                  store.setPages(pages);
              } else {
                  store.setPages([...(store.pages || []), activeObject as any]);
              }
          } else if ('summaries' in activeObject) {
              // Report
              const hasConflict = store.reports.some(r => r.id !== activeObject.id && r.name.trim().toLowerCase() === nameClean.toLowerCase());
              if (hasConflict) {
                  ui.showMessage("Namenskonflikt", `Ein Bericht mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                  return;
              }
              const exists = store.reports.some(r => r.id === activeObject.id);
              if (exists) {
                  const reports = store.reports.map(r => r.id === activeObject.id ? activeObject as Report : r);
                  store.setReports(reports);
              } else {
                  store.setReports([...store.reports, activeObject as Report]);
              }
          } else if ('config' in activeObject) {
              // Chart
              const hasConflict = store.charts.some(c => c.id !== activeObject.id && c.name.trim().toLowerCase() === nameClean.toLowerCase());
              if (hasConflict) {
                  ui.showMessage("Namenskonflikt", `Ein Diagramm mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                  return;
              }
              const exists = store.charts.some(c => c.id === activeObject.id);
              if (exists) {
                  const charts = store.charts.map(c => c.id === activeObject.id ? activeObject as Chart : c);
                  store.setCharts(charts);
              } else {
                  store.setCharts([...store.charts, activeObject as Chart]);
              }
          } else if ('nodes' in activeObject) {
              // Workflow
              const hasConflict = store.workflows.some(w => w.id !== activeObject.id && w.name.trim().toLowerCase() === nameClean.toLowerCase());
              if (hasConflict) {
                  ui.showMessage("Namenskonflikt", `Ein Workflow mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                  return;
              }
              const exists = store.workflows.some(w => w.id === activeObject.id);
              if (exists) {
                  const workflows = store.workflows.map(w => w.id === activeObject.id ? activeObject as Workflow : w);
                  store.setWorkflows(workflows);
              } else {
                  store.setWorkflows([...store.workflows, activeObject as Workflow]);
              }
          }
          setIsDirty(false);
      }
      
      await store.saveProject();
      ui.addToast("Projekt gespeichert.", 'success');
      return {success:true}; 
  };

  // --- Keyboard Shortcuts (Hotkeys) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Save (Ctrl + S / Cmd + S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Check if user is typing in an input field, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      const isInput = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      );

      // 2. Open Command Palette (handled globally via Ctrl + K in Workspace too, but let's make sure it's here)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Dispatched or handled locally. We can dispatch a custom event
        window.dispatchEvent(new CustomEvent('toggle-command-palette'));
        return;
      }

      // If user is typing in an input, do not trigger editing/deletion/search shortcuts
      if (isInput) return;

      // 3. Duplicate active table or object (Ctrl+Shift+D or Alt+D)
      if (activeObject && (e.altKey && e.key.toLowerCase() === 'd' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd'))) {
        e.preventDefault();
        let type: 'table' | 'query' | 'form' | 'report' | 'chart' | 'workflow' | 'page' | null = null;
        if ('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
            type = 'table';
        } else if ('nodes' in activeObject && 'columns' in activeObject) {
            type = 'query';
        } else if ('layout' in activeObject) {
            type = 'form';
        } else if ('summaries' in activeObject) {
            type = 'report';
        } else if ('config' in activeObject) {
            type = 'chart';
        } else if ('nodes' in activeObject) {
            type = 'workflow';
        }

        if (type) {
          const newId = crypto.randomUUID();
          const name = `${activeObject.name}_Kopie`;
          if (type === 'table') {
              store.setTables([...store.tables, { ...activeObject as Table, id: newId, name }]);
          } else if (type === 'query') {
              store.setQueries([...store.queries, { ...activeObject as Query, id: newId, name }]);
          } else if (type === 'form') {
              store.setForms([...store.forms, { ...activeObject as Form, id: newId, name }]);
          } else if (type === 'report') {
              store.setReports([...store.reports, { ...activeObject as Report, id: newId, name }]);
          } else if (type === 'chart') {
              store.setCharts([...(store.charts || []), { ...activeObject as Chart, id: newId, name }]);
          } else if (type === 'workflow') {
              store.setWorkflows([...store.workflows, { ...activeObject as Workflow, id: newId, name }]);
          }
          ui.addToast(`Tabelle/Objekt "${activeObject.name}" wurde dupliziert als "${name}".`, 'success');
        }
        return;
      }

      // 4. Delete active table or object (Alt + Delete / Ctrl + Backspace or Delete key directly)
      if (activeObject && (e.key === 'Delete' || (e.altKey && e.key === 'Backspace'))) {
        e.preventDefault();
        let type: 'table' | 'query' | 'form' | 'report' | 'chart' | 'workflow' | 'page' | null = null;
        if ('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
            type = 'table';
        } else if ('nodes' in activeObject && 'columns' in activeObject) {
            type = 'query';
        } else if ('layout' in activeObject) {
            type = 'form';
        } else if ('summaries' in activeObject) {
            type = 'report';
        } else if ('config' in activeObject) {
            type = 'chart';
        } else if ('nodes' in activeObject) {
            type = 'workflow';
        }

        if (type) {
          const isUsedInRelationship = type === 'table' && store.relationships.some(rel => rel.fromTableId === activeObject.id || rel.toTableId === activeObject.id);
          const baseMessage = `Möchten Sie das aktive Objekt "${activeObject.name}" wirklich löschen?`;
          const message = isUsedInRelationship 
              ? `Die Tabelle "${activeObject.name}" wird in einer oder mehreren Beziehungen verwendet. Wenn Sie sie löschen, werden diese Beziehungen gelöscht. Fortfahren?`
              : baseMessage;
          ui.setConfirmationModal({
              title: `${type === 'table' ? 'Tabelle' : 'Objekt'} löschen`,
              message,
              onConfirm: () => {
                  const id = activeObject.id;
                  if (type === 'table') {
                      store.setTables(store.tables.filter(t => t.id !== id));
                      store.setRelationships(store.relationships.filter(rel => rel.fromTableId !== id && rel.toTableId !== id));
                  }
                  if (type === 'query') store.setQueries(store.queries.filter(q => q.id !== id));
                  if (type === 'form') store.setForms(store.forms.filter(f => f.id !== id));
                  if (type === 'report') store.setReports(store.reports.filter(r => r.id !== id));
                  if (type === 'workflow') store.setWorkflows(store.workflows.filter(w => w.id !== id));
                  
                  setActiveObject(null);
                  setCurrentView({ type: 'welcome' });
                  ui.addToast("Gelöscht.", 'warning');
              }
          });
        }
        return;
      }

      // 5. Search / Filter Toggle (Ctrl + F / Alt + F)
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-table-filters'));
        ui.addToast("Suchen & Ersetzen / Filterleiste geöffnet.", 'info');
        return;
      }

      // 6. New Table (Alt + N)
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const newTableName = prompt("Name der neuen Tabelle:", "NeueTabelle");
        if (newTableName) {
          const newId = crypto.randomUUID();
          store.addTable({
              id: newId,
              name: newTableName,
              description: '',
              fields: [
                { id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }
              ]
          });
          handleSetView({ type: 'table_edit', tableId: newId });
          ui.addToast(`Tabelle "${newTableName}" erstellt und geöffnet.`, 'success');
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeObject, isDirty, store.tables, store.queries, store.forms, store.reports, store.workflows, store.relationships]);

  // --- Listen to App Deep Navigation Events (e.g. from Linked Tickets) ---
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleSetView(customEvent.detail);
      }
    };
    window.addEventListener('navigate-app-view', handleNavigate);
    return () => {
      window.removeEventListener('navigate-app-view', handleNavigate);
    };
  }, [isDirty, activeObject]);

  const handleContextMenuAction = (action: 'view' | 'view_data' | 'export' | 'rename' | 'duplicate' | 'delete') => {
      if (!ui.itemContextMenu) return;
      const { type, id } = ui.itemContextMenu;
      ui.setItemContextMenu(null);

      if (action === 'delete') {
          let objectName = "Unbekannt";
          let isUsedInRelationship = false;

          if (type === 'table') {
              const tableObj = store.tables.find(t => t.id === id);
              objectName = tableObj?.name || 'Tabelle';
              isUsedInRelationship = store.relationships.some(rel => rel.fromTableId === id || rel.toTableId === id);
          } else if (type === 'query') {
              objectName = store.queries.find(q => q.id === id)?.name || 'Abfrage';
          } else if (type === 'form') {
              objectName = store.forms.find(f => f.id === id)?.name || 'Formular';
          } else if (type === 'report') {
              objectName = store.reports.find(r => r.id === id)?.name || 'Bericht';
          } else if (type === 'workflow') {
              objectName = store.workflows.find(w => w.id === id)?.name || 'Workflow';
          } else if (type === 'page') {
              objectName = store.pages?.find(p => p.id === id)?.name || 'Page';
          }

          const baseMessage = `Möchten Sie "${objectName}" wirklich löschen?`;
          const message = isUsedInRelationship 
              ? `Die Tabelle "${objectName}" wird in einer oder mehreren Beziehungen (Tabellenverknüpfungen) verwendet. Wenn Sie sie löschen, werden diese Beziehungen möglicherweise ungültig. Möchten Sie die Tabelle trotzdem löschen?` 
              : baseMessage;

          ui.setConfirmationModal({
              title: `${type === 'table' ? 'Tabelle' : 'Objekt'} löschen`,
              message,
              onConfirm: () => {
                  if (type === 'table') {
                      store.setTables(store.tables.filter(t => t.id !== id));
                      // Optional: Clean up relationships where this table was involved
                      store.setRelationships(store.relationships.filter(rel => rel.fromTableId !== id && rel.toTableId !== id));
                  }
                  if (type === 'query') store.setQueries(store.queries.filter(q => q.id !== id));
                  if (type === 'form') store.setForms(store.forms.filter(f => f.id !== id));
                  if (type === 'report') store.setReports(store.reports.filter(r => r.id !== id));
                  if (type === 'workflow') store.setWorkflows(store.workflows.filter(w => w.id !== id));
                  if (type === 'page' && store.pages) store.setPages(store.pages.filter(p => p.id !== id));
                  
                  if (activeObject?.id === id) {
                      setActiveObject(null);
                      setCurrentView({ type: 'welcome' });
                  }
                  ui.addToast("Gelöscht.", 'warning');
              }
          });
      }
      
      if (action === 'duplicate') {
          const newId = crypto.randomUUID();
          if (type === 'table') {
              const obj = store.tables.find(t => t.id === id);
              if (obj) store.setTables([...store.tables, { ...obj, id: newId, name: `${obj.name}_Kopie` }]);
          }
          if (type === 'query') {
              const obj = store.queries.find(t => t.id === id);
              if (obj) store.setQueries([...store.queries, { ...obj, id: newId, name: `${obj.name}_Kopie` }]);
          }
          if (type === 'form') {
              const obj = store.forms.find(t => t.id === id);
              if (obj) store.setForms([...store.forms, { ...obj, id: newId, name: `${obj.name}_Kopie` }]);
          }
          if (type === 'report') {
              const obj = store.reports.find(t => t.id === id);
              if (obj) store.setReports([...store.reports, { ...obj, id: newId, name: `${obj.name}_Kopie` }]);
          }
          if (type === 'chart') {
              const obj = store.charts?.find(t => t.id === id);
              if (obj) store.setCharts([...(store.charts || []), { ...obj, id: newId, name: `${obj.name}_Kopie` }]);
          }
          if (type === 'workflow') {
              const obj = store.workflows.find(t => t.id === id);
              if (obj) store.setWorkflows([...store.workflows, { ...obj, id: newId, name: `${obj.name}_Kopie` }]);
          }
          if (type === 'page') {
              const obj = store.pages?.find(t => t.id === id);
              if (obj) store.setPages([...(store.pages || []), { ...obj, id: newId, name: `${obj.name}_Kopie` }]);
          }
          ui.addToast("Erfolgreich dupliziert.", 'success');
      }

      if (action === 'rename') {
          let currentName = '';
          if (type === 'table') currentName = store.tables.find(t => t.id === id)?.name || '';
          if (type === 'query') currentName = store.queries.find(q => q.id === id)?.name || '';
          if (type === 'form') currentName = store.forms.find(f => f.id === id)?.name || '';
          if (type === 'report') currentName = store.reports.find(r => r.id === id)?.name || '';
          if (type === 'workflow') currentName = store.workflows.find(w => w.id === id)?.name || '';

          ui.setNameInput({
              title: 'Umbenennen',
              label: 'Neuer Name',
              initialValue: currentName,
              onConfirm: (newName) => {
                  const nameClean = newName.trim();
                  if (!nameClean) {
                      ui.addToast("Name darf nicht leer sein.", 'error');
                      return;
                  }
                  
                  const isDuplicate = (() => {
                      const lower = nameClean.toLowerCase();
                      if (type === 'table') return store.tables.some(t => t.id !== id && t.name.trim().toLowerCase() === lower);
                      if (type === 'query') return store.queries.some(q => q.id !== id && q.name.trim().toLowerCase() === lower);
                      if (type === 'form') return store.forms.some(f => f.id !== id && f.name.trim().toLowerCase() === lower);
                      if (type === 'report') return store.reports.some(r => r.id !== id && r.name.trim().toLowerCase() === lower);
                      if (type === 'workflow') return store.workflows.some(w => w.id !== id && w.name.trim().toLowerCase() === lower);
                      if (type === 'page' && store.pages) return store.pages.some(p => p.id !== id && p.name.trim().toLowerCase() === lower);
                      return false;
                  })();

                  if (isDuplicate) {
                      ui.showMessage("Namenskonflikt", `Ein Objekt vom Typ "${type === 'table' ? 'Tabelle' : type === 'query' ? 'Abfrage' : type === 'form' ? 'Formular' : type === 'report' ? 'Bericht' : type === 'workflow' ? 'Workflow' : 'Seite'}" mit dem Namen "${nameClean}" existiert bereits!`, 'error');
                      return;
                  }

                  if (type === 'table') store.setTables(store.tables.map(t => t.id === id ? { ...t, name: nameClean } : t));
                  if (type === 'query') store.setQueries(store.queries.map(q => q.id === id ? { ...q, name: nameClean } : q));
                  if (type === 'form') store.setForms(store.forms.map(f => f.id === id ? { ...f, name: nameClean } : f));
                  if (type === 'report') store.setReports(store.reports.map(r => r.id === id ? { ...r, name: nameClean } : r));
                  if (type === 'workflow') store.setWorkflows(store.workflows.map(w => w.id === id ? { ...w, name: nameClean } : w));
                  if (type === 'page' && store.pages) store.setPages(store.pages.map(p => p.id === id ? { ...p, name: nameClean } : p));
                  ui.setNameInput(null);
              },
              onCancel: () => ui.setNameInput(null)
          });
      }

      if (action === 'view') {
          if (type === 'table') handleSetView({ type: 'table_edit', tableId: id });
          if (type === 'query') handleSetView({ type: 'query_designer', queryId: id });
          if (type === 'form') handleSetView({ type: 'form_designer', formId: id });
          if (type === 'report') handleSetView({ type: 'report_designer', reportId: id });
          if (type === 'workflow') handleSetView({ type: 'workflow_designer', workflowId: id });
          if (type === 'chart') handleSetView({ type: 'chart_view', chartId: id });
          if (type === 'page') handleSetView({ type: 'page_designer', pageId: id });
      }

      if (action === 'view_data') {
          if (type === 'table') handleSetView({ type: 'table_data', tableId: id });
          if (type === 'query') handleSetView({ type: 'query_results', queryId: id });
          if (type === 'form') handleSetView({ type: 'form_view', formId: id });
          if (type === 'report') handleSetView({ type: 'report_view', reportId: id });
      }

      if (action === 'export') {
          // EXPORT LOGIC
          if (type === 'table' || type === 'query') {
              // DATA EXPORT (EXCEL)
              let data: any[] = [];
              let fileName = 'export';
              
              if (type === 'table') {
                  const t = store.tables.find(x => x.id === id);
                  if (t) { data = t.data || []; fileName = t.name; }
              } else {
                  const q = store.queries.find(x => x.id === id);
                  if (q) { 
                      data = store.executeQuery(q); 
                      fileName = q.name; 
                  }
              }

              if (data.length === 0) {
                  ui.addToast("Keine Daten zum Exportieren.", 'warning');
                  return;
              }

              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Daten");
              XLSX.writeFile(wb, `${fileName}.xlsx`);
              ui.addToast(`${fileName} als Excel exportiert.`, 'success');

          } else {
              // DEFINITION EXPORT (JSON) - Forms, Reports, Workflows
              let obj = null;
              if (type === 'form') obj = store.forms.find(x => x.id === id);
              if (type === 'report') obj = store.reports.find(x => x.id === id);
              if (type === 'workflow') obj = store.workflows.find(x => x.id === id);
              if (type === 'chart') obj = store.charts?.find(x => x.id === id);
              if (type === 'page') obj = store.pages?.find(x => x.id === id);

              if (obj) {
                  const dataStr = JSON.stringify(obj, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${obj.name}_${type}_def.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  ui.addToast(`${type} Definition exportiert.`, 'success');
              }
          }
      }
  };

  const closeSavePrompt = async (action: 'yes' | 'no' | 'cancel') => {
      const target = savePrompt.targetView;
      setSavePrompt({ show: false, targetView: undefined });
      
      if (action === 'cancel') return;
      
      if (action === 'yes') {
          await handleSave();
      } else {
          setIsDirty(false);
      }
      
      if (target) {
          handleSetView(target);
      }
  };

  const handleRibbonAction = async (action: string, payload?: any) => {
    try {
      if (action.startsWith('page_')) {
          if (action === 'page_live_preview' && currentView.type === 'page_designer') {
              const pId = (currentView as any).pageId;
              if (pId) {
                  handleSetView({ type: 'page_view', pageId: pId });
                  return;
              }
          }
          ui.setPageActionTrigger({ action, payload, timestamp: Date.now() });
          return;
      }

      if (action === 'backend_generate' || action === 'backend_export' || action.startsWith('form_') || action === 'export_form') {
          ui.setFormActionTrigger({ action, timestamp: Date.now() });
          if ((action === 'backend_generate' || action === 'backend_export') && currentView.type !== 'backend_generator') {
              handleSetView({ type: 'backend_generator' });
          }
          return;
      }
      
      if (action === 'report_update_style' && activeObject) { 
          const report = activeObject as Report;
          const { section, style } = payload;
          if (report.styles) {
              const newReport = { ...report, styles: { ...report.styles, [section]: { ...(report.styles as any)[section], ...style } } };
              handleActiveObjectChange(newReport);
          }
          return; 
      }

      if (action === 'report_update_settings' && activeObject) {
          const report = activeObject as Report;
          const newReport = { ...report, ...payload };
          handleActiveObjectChange(newReport);
          return;
      }

      switch(action) {
        case 'close_project':
        case 'new_db': 
            ui.setConfirmationModal({
                title: "Projekt schließen",
                 confirmText: "Änderungen verwerfen",
                 confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold",
                 alternateText: "Änderungen speichern",
                 onAlternate: async () => {
                    await store.saveProject();
                    store.closeProject();
                    setCurrentView({ type: "welcome" });
                 },
                 cancelText: "Abbrechen",
                message: "Möchten Sie zum Startbildschirm zurückkehren? Sie können Ihre aktuellen Änderungen speichern oder verwerfen.",
                onConfirm: () => {
                   store.closeProject();
                   setCurrentView({ type: 'welcome' });
                }
            });
            break;
        case 'create_table': handleSetView({ type: 'table_create' }); break;
        case 'create_table_from_template': {
          if (payload && payload.template) {
            const newTable = createTableFromTemplate(payload.template, store.tables, payload.withSampleData !== false);
            store.addTable(newTable);
            setActiveObject(newTable);
            handleSetView({ type: 'table_data', tableId: newTable.id });
            setIsDirty(true);
            ui.addToast(`Tabelle "${newTable.name}" aus Vorlage "${payload.template.name}" erfolgreich erstellt.`, 'success');
          }
          break;
        }
        case 'open_table_template_manager': {
          ui.setShowTableTemplateManager(true);
          break;
        }
        case 'save_current_as_template': {
          let tableToSave: Table | null = null;
          if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
            tableToSave = activeObject as Table;
          } else if (currentView.type === 'table_data' || currentView.type === 'table_edit') {
            const tId = (currentView as any).tableId;
            tableToSave = store.tables.find(t => t.id === tId) || null;
          } else if (store.tables.length > 0) {
            tableToSave = store.tables[0];
          }

          if (tableToSave) {
            ui.setSaveTableAsTemplateModal({ show: true, table: tableToSave });
          }
          ui.setShowTableTemplateManager(true);
          break;
        }
        case 'tickets_board': handleSetView({ type: 'tickets_board' }); break;
        case 'ai_swarm': handleSetView({ type: 'ai_swarm' }); break;
        case 'create_table_ai': handleSetView({ type: 'table_create' }); break;
        case 'create_query': handleSetView({ type: 'query_designer' }); break;
        case 'wizard_duplicate': ui.setActiveWizard('duplicate'); break;
        case 'wizard_inconsistency': ui.setActiveWizard('inconsistency'); break;
        case 'wizard_append': ui.setActiveWizard('append'); break;
        case 'wizard_delete': ui.setActiveWizard('delete'); break;
        case 'wizard_update': ui.setActiveWizard('update'); break;
        case 'create_report': ui.setShowReportWizard(true); break;
        case 'create_form': ui.setShowFormWizard(true); break;
        
        case 'create_login_form': {
             const loginForm: Form = {
                id: 'sys_login_' + Date.now(),
                name: 'Login',
                sourceId: '',
                sourceType: 'table',
                mode: 'edit',
                fields: [],
                layout: {
                   id: crypto.randomUUID(), type: 'container', className: 'p-8 max-w-sm mx-auto bg-white rounded-xl shadow-md border border-slate-200 mt-10', children: [
                       { id: crypto.randomUUID(), type: 'label', label: 'Willkommen', className: 'text-xl font-bold text-center text-slate-800 mb-2' },
                       { id: crypto.randomUUID(), type: 'label', label: 'Bitte loggen Sie sich ein, um fortzufahren.', className: 'text-sm text-center text-slate-500 mb-6 font-normal' },
                       { id: crypto.randomUUID(), type: 'field', fieldId: 'username_field', label: 'E-Mail', className: 'mb-4', widgetType: 'text' },
                       { id: crypto.randomUUID(), type: 'field', fieldId: 'password_field', label: 'Passwort', className: 'mb-6', widgetType: 'text' },
                       { id: crypto.randomUUID(), type: 'button', label: 'Anmelden', className: 'w-full bg-blue-600 hover:bg-blue-700 focus:ring focus:ring-blue-300 text-white font-bold py-2.5 px-4 rounded-lg transition-colors', actions: [] },
                       { id: crypto.randomUUID(), type: 'container', className: 'flex justify-between mt-6 text-sm', children: [
                           { id: crypto.randomUUID(), type: 'label', label: 'Passwort vergessen?', className: 'text-slate-500 hover:text-slate-800 cursor-pointer transition-colors' },
                           { id: crypto.randomUUID(), type: 'label', label: 'Registrieren', className: 'text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors' }
                       ]}
                   ]
                }
             };
             store.setForms([...store.forms, loginForm]);
             setActiveObject(loginForm);
             setCurrentView({ type: 'form_designer', formId: loginForm.id });
             setIsDirty(true);
             break;
        }

        case 'create_usermgmt_form': {
             const usrForm: Form = {
                id: 'sys_usr_' + Date.now(),
                name: 'Benutzerverwaltung',
                sourceId: store.tables.find(t => t.name.includes('user'))?.id || '',
                sourceType: 'table',
                mode: 'edit',
                fields: [],
                layout: {
                   id: crypto.randomUUID(), type: 'container', className: 'p-6 max-w-4xl max-h-full mx-auto bg-white rounded-xl shadow border border-slate-200 mt-4', children: [
                       { id: crypto.randomUUID(), type: 'label', label: 'Benutzer & Rechte verwalten', className: 'text-2xl font-bold mb-4 text-slate-800' },
                       { id: crypto.randomUUID(), type: 'container', className: 'grid grid-cols-2 gap-6', children: [
                           { id: crypto.randomUUID(), type: 'container', className: '', children: [
                                { id: crypto.randomUUID(), type: 'field', fieldId: 'new_usr_email', label: 'E-Mail', className: 'mb-4', widgetType: 'text' },
                                { id: crypto.randomUUID(), type: 'field', fieldId: 'new_usr_role', label: 'Rolle zuweisen', className: 'mb-4', widgetType: 'select' },
                                { id: crypto.randomUUID(), type: 'field', fieldId: 'new_usr_active', label: 'Aktiv', className: 'mb-6', widgetType: 'checkbox' },
                                { id: crypto.randomUUID(), type: 'button', label: 'Benutzer speichern', className: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded', actions: [] }
                           ]},
                           { id: crypto.randomUUID(), type: 'container', className: 'bg-slate-50 p-4 border rounded border-slate-200', children: [
                                { id: crypto.randomUUID(), type: 'label', label: 'Sicherheits-Informationen', className: 'font-semibold mb-2' },
                                { id: crypto.randomUUID(), type: 'label', label: 'Hier können Sie Administratoren und Standardbenutzer festlegen. Logins werden über die zentrale IAM-Policy geregelt.', className: 'text-sm text-slate-600' }
                           ]}
                       ]}
                   ]
                }
             };
             store.setForms([...store.forms, usrForm]);
             setActiveObject(usrForm);
             setCurrentView({ type: 'form_designer', formId: usrForm.id });
             setIsDirty(true);
             break;
        }

        case 'create_register_form': {
             const regForm: Form = {
                id: 'sys_reg_' + Date.now(),
                name: 'Registrierung',
                sourceId: '',
                sourceType: 'table',
                mode: 'edit',
                fields: [],
                layout: {
                   id: crypto.randomUUID(), type: 'container', className: 'p-8 max-w-md mx-auto bg-white rounded-xl shadow-md border border-slate-200 mt-10', children: [
                       { id: crypto.randomUUID(), type: 'label', label: 'Account erstellen', className: 'text-xl font-bold text-center text-slate-800 mb-6' },
                       { id: crypto.randomUUID(), type: 'field', fieldId: 'reg_name', label: 'Vollständiger Name', className: 'mb-4', widgetType: 'text' },
                       { id: crypto.randomUUID(), type: 'field', fieldId: 'reg_email', label: 'E-Mail Adresse', className: 'mb-4', widgetType: 'text' },
                       { id: crypto.randomUUID(), type: 'field', fieldId: 'reg_pass', label: 'Passwort', className: 'mb-4', widgetType: 'text' },
                       { id: crypto.randomUUID(), type: 'field', fieldId: 'reg_pass2', label: 'Passwort bestätigen', className: 'mb-6', widgetType: 'text' },
                       { id: crypto.randomUUID(), type: 'button', label: 'Jetzt Registrieren', className: 'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg', actions: [] },
                       { id: crypto.randomUUID(), type: 'label', label: 'Bereits ein Account? Zurück zum Login.', className: 'text-sm text-center text-slate-500 mt-4 cursor-pointer hover:underline font-medium' }
                   ]
                }
             };
             store.setForms([...store.forms, regForm]);
             setActiveObject(regForm);
             setCurrentView({ type: 'form_designer', formId: regForm.id });
             setIsDirty(true);
             break;
        }

        case 'create_chart': /* ... */ break;
        case 'create_page': {
             const newPage: any = { // Use any for now or CustomPage from types
                id: 'page_' + crypto.randomUUID(),
                name: 'Neue Seite',
                layout: { id: 'root', type: 'container', props: {}, children: [] }
             };
             store.setPages([...(store.pages || []), newPage]);
             setActiveObject(newPage);
             setCurrentView({ type: 'page_designer', pageId: newPage.id });
             setIsDirty(true);
             break;
        }
        case 'create_workflow': {
             const newWorkflow: Workflow = {
                id: 'workflow_' + Date.now(),
                name: 'Neuer Workflow',
                active: false,
                nodes: [],
                edges: []
             };
             store.setWorkflows([...store.workflows, newWorkflow]);
             setActiveObject(newWorkflow);
             setCurrentView({ type: 'workflow_designer', workflowId: newWorkflow.id });
             setIsDirty(true);
             break;
        }

        // --- Workflow Ribbon Actions ---
        case 'add_trigger_node':
        case 'add_db_action_node':
        case 'add_email_node':
        case 'add_export_node':
        case 'add_condition_node':
        case 'add_loop_node':
        case 'add_api_node':
        case 'add_action_node':
             if (currentView.type === 'workflow_designer' && activeObject && 'nodes' in activeObject) {
                 const wf = activeObject as Workflow;
                 let type = 'triggerNode';
                 let label = 'Knoten';
                 let data: any = {};

                 if (action === 'add_trigger_node') {
                     type = 'triggerNode';
                     label = 'Datensatz erstellt';
                     data = { label, triggerConfig: { event: 'onCreate', tableId: store.tables[0]?.id } };
                 } else if (action === 'add_db_action_node' || action === 'add_action_node') {
                     type = 'databaseActionNode';
                     label = 'Datensatz anlegen';
                     data = { label, databaseActionConfig: { actionType: 'createRecord', targetTableId: store.tables[0]?.id } };
                 } else if (action === 'add_email_node') {
                     type = 'emailActionNode';
                     label = 'E-Mail senden';
                     data = { label, emailActionConfig: { to: '{{trigger.email}}', subject: 'Benachrichtigung', body: 'Hallo {{trigger.name}}' } };
                 } else if (action === 'add_export_node') {
                     type = 'exportActionNode';
                     label = 'Excel Export';
                     data = { label, exportActionConfig: { exportType: 'excel', sourceType: 'table', sourceId: store.tables[0]?.id } };
                 } else if (action === 'add_condition_node') {
                     type = 'conditionNode';
                     label = 'Prüfung (IF)';
                     data = { label, conditionConfig: { operator: 'eq', value: 'Bezahlt' } };
                 } else if (action === 'add_loop_node') {
                     type = 'loopNode';
                     label = 'Für jeden Eintrag';
                     data = { label, loopConfig: { tableId: store.tables[0]?.id, variableName: 'item' } };
                 } else if (action === 'add_api_node') {
                     type = 'apiNode';
                     label = 'REST API Aufruf';
                     data = { label, apiConfig: { method: 'POST', url: 'https://api.example.com/v1/event' } };
                 }

                 const newNode = {
                     id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                     type,
                     position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
                     data
                 };
                 const updated = { ...wf, nodes: [...wf.nodes, newNode as any] };
                 setActiveObject(updated);
                 store.setWorkflows(store.workflows.map(w => w.id === updated.id ? updated : w));
                 setIsDirty(true);
                 ui.addToast(`Knoten "${label}" hinzugefügt.`, 'info');
             }
             break;

        case 'test_workflow':
             if (currentView.type === 'workflow_designer' && activeObject && 'nodes' in activeObject) {
                 const wf = activeObject as Workflow;
                 const triggerNode = wf.nodes.find(n => n.type === 'triggerNode');
                 const tableId = triggerNode?.data?.triggerConfig?.tableId;
                 const table = store.tables.find(t => t.id === tableId) || store.tables[0];
                 const record = table?.data?.[0] || { id: 'TEST_001', name: 'Test Datensatz' };

                 WorkflowExecutionEngine.executeWorkflow(
                     wf,
                     'onManual',
                     record,
                     undefined,
                     { onShowToast: (msg, type) => ui.addToast(msg, type) }
                 ).then(log => {
                     ui.addToast(`Workflow-Testlauf beendet: ${log.status === 'success' ? 'Erfolgreich' : 'Fehlgeschlagen'} (${log.durationMs}ms)`, log.status === 'success' ? 'success' : 'error');
                 });
             }
             break;

        case 'toggle_workflow_active':
             if (currentView.type === 'workflow_designer' && activeObject && 'nodes' in activeObject) {
                 const wf = activeObject as Workflow;
                 const newActive = !wf.active;
                 const updated = { ...wf, active: newActive };
                 setActiveObject(updated);
                 store.setWorkflows(store.workflows.map(w => w.id === updated.id ? updated : w));
                 ui.addToast(`Workflow ist jetzt ${newActive ? 'aktiviert' : 'deaktiviert'}.`, newActive ? 'success' : 'info');
             }
             break;

        case 'save_workflow':
             store.saveProject().then(() => ui.addToast("Workflow erfolgreich gespeichert.", 'success'));
             break;
        // -------------------------------
        
        // --- ER-Diagram Ribbon Actions ---
        case 'save_relationships':
             store.saveProject().then(() => ui.addToast("Layout gespeichert", 'success'));
             break;
        case 'auto_layout':
             if (currentView.type === 'relationships') {
                 const nodes = store.tables.map((t, index) => ({
                    id: 'node_' + t.id,
                    tableId: t.id,
                    x: 50 + (index % 4) * 300,
                    y: 50 + Math.floor(index / 4) * 300
                 }));
                 store.setLayout(nodes);
                 ui.addToast("Auto-Layout angewendet.", "success");
             }
             break;
        case 'export_er_image':
             ui.addToast("Nutzen Sie den Druck-Dialog (Ctrl+P) oder Screenshots.", "info");
             break;
        // -------------------------------

        case 'relationships': handleSetView({ type: 'relationships' }); break;
        case 'dbstudio_backend': handleSetView({ type: 'dbstudio_backend' }); break;
        case 'roadmap_view': handleSetView({ type: 'roadmap_view' }); break;
        case 'project_dashboard': handleSetView({ type: 'project_management', panel: 'dashboard' }); break;
        case 'project_requirements': handleSetView({ type: 'project_management', panel: 'requirements' }); break;
        case 'project_vmodel': handleSetView({ type: 'project_management', panel: 'vmodel' }); break;
        case 'project_dotnet': handleSetView({ type: 'project_management', panel: 'dotnet' }); break;
        case 'project_sqlite': handleSetView({ type: 'project_management', panel: 'sqlite' }); break;
        case 'project_rebuild': handleSetView({ type: 'project_management', panel: 'rebuild' }); break;
        case 'version_control': handleSetView({ type: 'version_control' }); break;
        case 'create_custom_component': handleSetView({ type: 'custom_component_designer' }); break;
        case 'manage_custom_components': handleSetView({ type: 'custom_components_manager' }); break;
        case 'api_import': handleSetView({ type: 'api_import' }); break;
        case 'live_sync': handleSetView({ type: 'live_sync' }); break;
        case 'sharepoint_import': ui.setShowSharePointWizard(true); break;
        
        case 'import_excel': ui.setShowExcelWizard(true); break;
        case 'import_access': ui.setShowAccessWizard(true); break;
        case 'import_schema': ui.setShowSchemaWizard(true); break;
        case 'generate_dummy': ui.setShowDummyDataWizard(true); break;
        case 'export_excel':
        case 'export_access':
        case 'export_sql':
        case 'load_backup':
             handleSetView({ type: 'api_import' });
             break;
        case 'save': await handleSave(); break;
        
        case 'electron_settings': ui.setShowElectronSettings(true); break;
        case 'security_manager': ui.setShowSecurityManager(true); break;
        case 'audit_trail': handleSetView({ type: 'audit_trail' }); break;
        case 'navigation_designer': handleSetView({ type: 'navigation_designer' }); break;
        case 'logic_designer': handleSetView({ type: 'logic_designer' }); break;
        case 'api_routing_designer': handleSetView({ type: 'api_routing_designer' }); break;
        case 'lifecycle_designer': handleSetView({ type: 'lifecycle_designer' }); break;
        case 'multi_tenancy_wizard': handleSetView({ type: 'multi_tenancy_wizard' }); break;
        case 'data_seeder_view': handleSetView({ type: 'data_seeder_view' }); break;
        case 'open_app_info': handleSetView({ type: 'app_info' }); break;
        case 'theme_designer':
        case 'open_whitelabel': ui.setShowWhitelabelModal(true); break;
        
        case 'open_ai_copilot':
        case 'ai_copilot': {
            if (payload === 'query') {
              ui.setAiCopilotTab('query');
            } else if (payload === 'optimizer') {
              ui.setAiCopilotTab('optimizer');
            } else {
              ui.setAiCopilotTab('schema');
            }
            ui.setShowAiCopilotModal(true);
            break;
        }
        
        case 'open_integrations': ui.setShowIntegrationsModal(true); break;
        case 'open_envs': ui.setShowEnvModal(true); break;
        case 'open_migrations': ui.setShowMigrationModal(true); break;
        case 'open_schema_diff': ui.setShowSchemaDiffModal(true); break;
        case 'open_openapi_mock':
        case 'open_swagger': ui.setShowOpenApiModal(true); break;
        case 'open_security_rls':
        case 'open_rls': ui.setShowSecurityRlsModal(true); break;
        case 'open_audit_trail':
        case 'open_audit': ui.setShowAuditTrailModal(true); break;
        case 'open_deployment_modal': ui.setShowDeploymentModal(true); break;
        case 'open_offline_sync': ui.setShowOfflineSyncModal(true); break;

        case 'open_bridge_runner': {
            useBridgeStore.getState().setRunnerModalOpen(true);
            break;
        }

        case 'open_bridge_options': {
            ui.setIsBackstageOpen(true);
            ui.setBackstageActiveTab('optionen');
            break;
        }

        case 'deploy_to_bridge': {
            const bridgeStore = useBridgeStore.getState();
            const isOnline = await bridgeStore.checkHealth();
            
            if (!isOnline) {
                ui.addToast("Lokale Bridge ist nicht aktiv (Port 5050). Bitte starten Sie die Bridge auf Ihrem PC.", "warning");
                bridgeStore.addLog({
                    type: 'stderr',
                    timestamp: new Date().toISOString(),
                    service: 'Bridge',
                    message: `⚠️ Lokale Bridge (${bridgeStore.config.host}:${bridgeStore.config.port}) ist nicht erreichbar. Bitte starten Sie die Bridge lokal auf Ihrem PC.`
                });
                bridgeStore.setRunnerModalOpen(true);
                break;
            }

            ui.addToast("Generiere Anwendungscode und übertrage an lokale Bridge...", "info");

            try {
                const macros = getSavedMacros();
                const cleanProjectName = sanitizeProjectName(store.projectName || 'MyProject');
                let files = generateBackendCode(
                    store.tables,
                    store.relationships,
                    store.queries,
                    store.backendConfig,
                    store.forms,
                    store.reports,
                    store.pages,
                    store.customComponents,
                    macros
                );

                if (store.backendConfig.deploymentConfig) {
                    const deployFiles = generateDeploymentScripts(store.backendConfig, `Backend/${cleanProjectName}`);
                    files = [...files, ...deployFiles];
                }

                const payload = {
                    projectId: sanitizeProjectName(store.projectId || store.projectName || 'my-project'),
                    projectName: store.projectName || 'MyProject',
                    stack: {
                        backendType: store.backendConfig.language || 'dotnet',
                        frontendType: store.backendConfig.frontendFramework || 'react',
                        databaseType: store.backendConfig.dbType || 'SQLite'
                    },
                    ports: {
                        backendPort: store.backendConfig.port || 5000,
                        frontendPort: store.backendConfig.frontendPort || 3000
                    },
                    options: {
                        useSharedDependencies: bridgeStore.config.useSharedDependencies !== false, // shared dependencies enabled to prevent disk pollution
                        autoInstall: bridgeStore.config.autoInstall,
                        autoMigrateDb: bridgeStore.config.autoMigrateDb,
                        autoRun: bridgeStore.config.autoRun
                    },
                    files: files.map(f => ({ path: f.path, content: f.content }))
                };

                await bridgeStore.deployProject(payload);
                ui.addToast("Projekt erfolgreich an die lokale Bridge übertragen!", "success");
            } catch (err: any) {
                ui.addToast(`Fehler bei der Bereitstellung: ${err.message}`, "error");
                bridgeStore.addLog({
                    type: 'stderr',
                    timestamp: new Date().toISOString(),
                    service: 'GeneratorError',
                    message: `Generierungsfehler: ${err.message}`
                });
            }
            break;
        }
        
        case 'project_backup': {
            const project = {
                id: store.projectId,
                name: store.projectName,
                lastModified: Date.now(),
                data: {
                    tables: store.tables,
                    relationships: store.relationships,
                    queries: store.queries,
                    forms: store.forms,
                    reports: store.reports,
                    pages: store.pages,
                    charts: store.charts,
                    workflows: store.workflows,
                    layout: store.layout,
                    tableGroups: store.tableGroups,
                    tickets: store.tickets,
                    chats: store.chats,
                    backendConfig: store.backendConfig
                }
            };
            const dataStr = JSON.stringify(project, null, 2);
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;
            const timeStr = `${hours}${minutes}${seconds}`;
            const filename = `${sanitizeProjectName(store.projectName || 'DBStudioPro')}_Backup_${dateStr}_${timeStr}.dbsp`;

            // Try client-side blob download first (works on any static or custom server without backend endpoint)
            try {
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Copy to clipboard fallback / extra safety
                try {
                    navigator.clipboard.writeText(dataStr);
                    ui.addToast("Backup wurde heruntergeladen und zur Sicherheit auch in Ihre Zwischenablage kopiert!", 'success');
                } catch {
                    ui.addToast("Backup heruntergeladen!", 'success');
                }
            } catch (blobError) {
                // Fallback to server POST form submit if client-side blob fails (e.g. strict iframe sandboxes)
                try {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = '/api/backup/download';
                    form.style.display = 'none';

                    const filenameInput = document.createElement('input');
                    filenameInput.type = 'hidden';
                    filenameInput.name = 'filename';
                    filenameInput.value = filename;
                    form.appendChild(filenameInput);

                    const contentInput = document.createElement('input');
                    contentInput.type = 'hidden';
                    contentInput.name = 'content';
                    contentInput.value = dataStr;
                    form.appendChild(contentInput);

                    document.body.appendChild(form);
                    form.submit();
                    document.body.removeChild(form);
                } catch (formError) {
                    // Try clipboard-only if all download methods fail
                    try {
                        navigator.clipboard.writeText(dataStr);
                        ui.showMessage("Download fehlgeschlagen", "Der automatische Download ist fehlgeschlagen, aber Ihr Backup-Inhalt wurde zur Sicherheit in Ihre Zwischenablage kopiert. Sie können ihn in eine Textdatei einfügen.", 'warning');
                    } catch {
                        ui.showMessage("Fehler beim Sichern", "Das Backup konnte nicht heruntergeladen werden. Bitte kopieren Sie Ihre Modelldaten manuell.", 'error');
                    }
                }
            }
            break;
        }
      }
    } catch (error: any) { ui.showMessage("Systemfehler", error.message, 'error'); }
  };

  const handleSaveIntegrations = (newConfig: IntegrationsConfig) => {
      if (store.backendConfig) {
          store.setBackendConfig({ ...store.backendConfig, integrations: newConfig });
          store.saveProject().then(() => ui.addToast("Integrationen gespeichert."));
      }
  };

  return {
    db: {
        projectId: store.projectId,
        currentProjectName: store.projectName,
        dbType: store.backendConfig.dbType,
        tables: store.tables,
        queries: store.queries,
        reports: store.reports,
        forms: store.forms,
        workflows: store.workflows,
        relationships: store.relationships,
        pages: store.pages,
        charts: store.charts,
        loadProject: async (project: Project) => {
            const full = await getProjectById(project.id);
            if (full) {
                store.loadProject(full);
            } else {
                store.loadProject(project);
            }
        },
        createNewDatabase: store.createNew,
        saveTable: (t: any, mode: any) => mode === 'create' ? store.addTable(t) : store.updateTable(t),
        saveQuery: (q: any) => store.setQueries([...store.queries, q]),
        saveReport: (r: any) => store.setReports([...store.reports, r]),
        saveForm: (f: any) => store.setForms([...store.forms, f]),
        saveWorkflow: (w: any) => store.setWorkflows([...store.workflows, w]),
        deleteRelationship: (id: string) => store.setRelationships(store.relationships.filter(r => r.id !== id)),
        updateRelationship: (rel: any) => store.setRelationships(store.relationships.map(r => r.id === rel.id ? rel : r)),
        setRelationships: store.setRelationships,
        executeQuery: store.executeQuery,
        exportProject: async (conf: BackendConfig) => {
            if (!store.projectId) return;
            const project: Project = {
                id: store.projectId,
                name: store.projectName,
                lastModified: Date.now(),
                isCloud: false,
                data: {
                    tables: store.tables,
                    queries: store.queries,
                    reports: store.reports,
                    forms: store.forms,
                    charts: store.charts,
                    workflows: store.workflows,
                    relationships: store.relationships,
                    layout: store.layout,
                    tableGroups: store.tableGroups,
                    backendConfig: conf || store.backendConfig,
                    lastSnapshot: store.lastSnapshot,
                    pages: store.pages
                }
            };
            const dataStr = JSON.stringify(project, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const linkElement = document.createElement('a');
            linkElement.href = url;
            linkElement.download = `${sanitizeProjectName(store.projectName)}.dbsp`;
            linkElement.click();
            
            URL.revokeObjectURL(url);
            ui.addToast("Projekt als .dbsp exportiert.", 'success');
        }
    },
    currentView, activeTab, setActiveTab, activeObject, isDirty, 
    backendConfig: store.backendConfig, setBackendConfig: store.setBackendConfig,
    savePrompt, 
    
    // UI State & Actions
    ...ui,
    // Provide store layout to UI hooks if needed or directly pass to ViewRouter
    relationshipNodes: store.layout || [], 
    setRelationshipNodes: store.setLayout, // Direct store update for moves
    
    // Chat State & Actions
    ...chat,

    // Core Logic Overrides
    onSaveElectronSettings: (s: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, electronSettings: s}); ui.setShowElectronSettings(false); }, onCloseElectronSettings: () => ui.setShowElectronSettings(false),
    
    onSaveDeploymentConfig: (c: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, deploymentConfig: c}); }, onDeploy: () => { ui.setShowDeploymentModal(false); ui.setFormActionTrigger({action:'backend_generate', timestamp: Date.now()}); },
    electronSettings: store.backendConfig?.electronSettings || { includeBackend: true, bundleFrontend: true },

    onSaveIntegrations: handleSaveIntegrations,
    onSaveWizardQuery: (q: any) => { store.setQueries([...store.queries, q]); ui.setActiveWizard(null); handleSetView({type: 'query_designer', queryId: q.id}); },
    onExecuteAppend: (s:any,t:any,m:any) => {}, 
    onExecuteDelete: (t:any,c:any) => {}, 
    onUpdateTable: store.updateTable,

    handleSetView, handleActiveObjectChange, handleSave, handleRibbonAction,
    closeSavePrompt, handleContextMenuAction, 
    
    onSnapshot: store.snapshot,
    onUpdateEnvironments: (e: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, environments: e}); },
    onUpdateCommercial: (w:any,m:any,l:any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, whitelabel: w, multiTenancy: m, licensing: l}); },
    lastSnapshot: store.lastSnapshot,

    activeLock
  };
};
