import React, { useState, useEffect } from 'react';
import { CheckSquare, Sparkles } from 'lucide-react';
import { RoadmapItem } from './roadmap/types';

// Subcomponents
import { RoadmapPhaseSection } from './roadmap/RoadmapPhaseSection';
import { RoadmapCustomTaskForm } from './roadmap/RoadmapCustomTaskForm';
import { RoadmapArchitectureChart } from './roadmap/RoadmapArchitectureChart';

interface RoadmapViewProps {
  onAddTicket?: (title: string, description: string, priority: 'low' | 'medium' | 'high', assignedTo: string) => Promise<void>;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  onSetView: (view: any) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  onAddTicket,
  showMessage,
  onSetView
}) => {
  // Pre-loaded items from TODO.md Checklist
  const defaultItems: RoadmapItem[] = [
    // Phase 1
    { id: 'p1_sqlite', phase: 1, task: 'SQLite-Verbindungstreiber für Electron/Tauri konfigurieren.', defaultCompleted: true, category: 'Local Mode' },
    { id: 'p1_indexeddb', phase: 1, task: 'IndexedDB Wrapper für Browser-Fallback schreiben (Projekt-Auto-Save).', defaultCompleted: true, category: 'Local Mode' },
    { id: 'p1_styling', phase: 1, task: 'Styling-Frameworks (Bootstrap/Tailwind) sauber trennen und im Code-Generator unterstützen.', defaultCompleted: true, category: 'Local Mode' },
    
    // Phase 2
    { id: 'p2_express', phase: 2, task: 'Express/NestJS Server-Vorlage für den Cloud Hub erstellen.', defaultCompleted: true, category: 'Cloud backend' },
    { id: 'p2_rls', phase: 2, task: 'Multi-Tenant Isolation auf Datenbankebene (RLS - Row Level Security) implementieren.', defaultCompleted: true, category: 'Cloud backend' },
    { id: 'p2_jwt', phase: 2, task: 'JWT und OAuth2 (z. B. GitHub, Google) für Team-Logins bereitstellen.', defaultCompleted: true, category: 'Cloud backend' },
    
    // Phase 3
    { id: 'p3_diff', phase: 3, task: 'Eine UI-Komponente erstellen, die lokale Schema-Änderungen anzeigt.', defaultCompleted: true, category: 'Sync Assistant' },
    { id: 'p3_question', phase: 3, task: 'Fragebogen-Schnittstelle implementieren ("Was soll implementiert werden?").', defaultCompleted: true, category: 'Sync Assistant' },
    { id: 'p3_fk_val', phase: 3, task: 'Validierung von FK-Beziehungen vor dem Upload, um referenzielle Integrität zu sichern.', defaultCompleted: true, category: 'Sync Assistant' },
    { id: 'p3_mock', phase: 3, task: 'Mock-Verbindung für Demonstrationszwecke einbauen.', defaultCompleted: true, category: 'Sync Assistant' },
    
    // Phase 4
    { id: 'p4_mp_cursor', phase: 4, task: 'Multiplayer Cursor-Simulation für Live-Sitzungen.', defaultCompleted: true, category: 'Multiplayer' },
    { id: 'p4_kanban', phase: 4, task: 'Integriertes Kanban-Ticketsystem zur Aufgabensteuerung direkt an Datenfeldern.', defaultCompleted: true, category: 'Multiplayer' },
    { id: 'p4_chat', phase: 4, task: 'Echtzeit-Team-Chat-Panel mit Benachrichtigungsdienst für Schema-Änderungen.', defaultCompleted: true, category: 'Multiplayer' },
    { id: 'p4_git', phase: 4, task: 'Versionsverwaltung (Git-ähnlicher Commit-Verlauf für Schemata).', defaultCompleted: true, category: 'Multiplayer' },

    // Phase 5: Next-Level Enterprise & Developer Features (v3.0)
    { id: 'p5_ai_copilot', phase: 5, task: 'AI Schema- & Query-Copilot (Natural Language Schema Generator, Visual Query Builder & SQL Optimizer).', defaultCompleted: true, category: 'AI Copilot' },
    { id: 'p5_schema_diff', phase: 5, task: 'Schema-Diff & Automatische SQL-Migrationen (Flyway & Liquibase DDL Up/Down Generator).', defaultCompleted: false, category: 'Enterprise' },
    { id: 'p5_rls_matrix', phase: 5, task: 'Visuelle Row-Level-Security (RLS) & Rollen-Matrix (PostgreSQL Policies & Auth-Handlers).', defaultCompleted: false, category: 'Security' },
    { id: 'p5_swagger_mock', phase: 5, task: 'Live OpenAPI / Swagger 3.1 & In-Browser Local Mock Server mit IndexedDB Testdaten.', defaultCompleted: false, category: 'API Hub' },
    { id: 'p5_audit_trail', phase: 5, task: 'Audit-Trail & Change Data Capture (CDC / Time-Travel Datensatz-Wiederherstellung).', defaultCompleted: false, category: 'Audit' },
    { id: 'p5_n8n_zapier', phase: 5, task: 'n8n & Zapier / Make.com No-Code Workflow JSON Generator & Event-Bridges.', defaultCompleted: false, category: 'Workflows' },
    { id: 'p5_webhook_hub', phase: 5, task: 'Inbound Webhook & Event-Trigger Ingestion Hub mit JSON-Payload Validierung.', defaultCompleted: false, category: 'Integrations' },
    { id: 'p5_multi_db_sync', phase: 5, task: 'Heterogene Multi-DB Synchronisation & Hybrid-Replikation (SQLite, PostgreSQL, MS SQL).', defaultCompleted: false, category: 'Database Sync' }
  ];

  // Load state from localStorage or default
  const [items, setItems] = useState<RoadmapItem[]>(() => {
    try {
      const saved = localStorage.getItem('db_studio_roadmap_items');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return defaultItems;
  });

  const [completedState, setCompletedState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('db_studio_roadmap_completed');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    // Set default values
    const initial: Record<string, boolean> = {};
    defaultItems.forEach(item => {
      initial[item.id] = item.defaultCompleted;
    });
    return initial;
  });

  // Custom User tasks
  const [customTask, setCustomTask] = useState('');
  const [customPhase, setCustomPhase] = useState<number>(1);
  const [customCategory] = useState('Benutzerdefiniert');

  // Info card active section
  const [activeArchSection, setActiveArchSection] = useState<'local' | 'sync' | 'cloud'>('local');

  // Save changes to localStorage on state changes
  useEffect(() => {
    localStorage.setItem('db_studio_roadmap_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('db_studio_roadmap_completed', JSON.stringify(completedState));
  }, [completedState]);

  const toggleTask = (id: string) => {
    setCompletedState(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      return updated;
    });
    showMessage("Planer aktualisiert", "Task-Status wurde angepasst.", "info");
  };

  const addCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTask.trim()) return;

    const newId = 'custom-' + crypto.randomUUID();
    const newItem: RoadmapItem = {
      id: newId,
      phase: customPhase,
      task: customTask.trim(),
      defaultCompleted: false,
      category: customCategory || 'Custom'
    };

    setItems(prev => [...prev, newItem]);
    setCompletedState(prev => ({ ...prev, [newId]: false }));
    setCustomTask('');
    showMessage("Task hinzugefügt", "Ihr benutzerdefiniertes Meilenstein-Ziel wurde in den Fahrplan aufgenommen.", "success");
  };

  const deleteCustomTask = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setCompletedState(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showMessage("Task gelöscht", "Ziel wurde aus dem Fahrplan entfernt.", "info");
  };

  // Convert roadmap item to a team ticket
  const convertToTicket = async (item: RoadmapItem) => {
    if (!onAddTicket) {
      showMessage("Fehler", "Ticketsystem-Schnittstelle ist momentan nicht bereit.", "error");
      return;
    }

    try {
      await onAddTicket(
        `Implementieren: ${item.task.substring(0, 50)}...`,
        `Roadmap Phase ${item.phase} - ${item.category}\n\nVoller Auftrag:\n${item.task}\n\n(Automatisch aus dem DB Studio Pro ToDo-Planer generiert)`,
        item.phase >= 3 ? 'high' : 'medium',
        'u2' // Assign to Sarah as a teammate
      );
      showMessage("In Ticket umgewandelt", "Der Meilenstein wurde als offene Aufgabe im Kanban Board für Sarah hinterlegt!", "success");
    } catch (err) {
      showMessage("Fehler", "Ticket konnte nicht angelegt werden.", "error");
    }
  };

  // Calculate statistics
  const getPhaseStats = (phase: number) => {
    const phaseItems = items.filter(i => i.phase === phase);
    const completedCount = phaseItems.filter(i => completedState[i.id]).length;
    const totalCount = phaseItems.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completedCount, totalCount, pct };
  };

  const totalCompleted = items.filter(i => completedState[i.id]).length;
  const totalTasks = items.length;
  const totalPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-white">
            <CheckSquare className="text-emerald-400 shrink-0" size={20} />
            <span>DB Studio Pro - Roadmap &amp; Fahrplan</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">Interaktive ToDo.md</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Planen und visualisieren Sie die Entwicklung des self-hosted Backends sowie die Kollaborations-Roadmap direkt im System.
          </p>
        </div>

        {/* Global Progress Display */}
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto">
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400 font-semibold">Gesamtfortschritt</div>
            <div className="text-sm font-bold text-white">{totalCompleted} / {totalTasks} erledigt</div>
          </div>
          <div className="relative w-24 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
            <div className="absolute top-0 bottom-0 left-0 bg-emerald-500 transition-all duration-500" style={{ width: `${totalPct}%` }} />
          </div>
          <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">{totalPct}%</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: The Interactive Checklists */}
        <div className="xl:col-span-7 space-y-6 flex flex-col min-h-0">
          
          {/* Quick instructions */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 flex items-center gap-3">
            <Sparkles className="text-indigo-400 shrink-0" size={18} />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Entwicklungs-Fahrplan:</strong> Haken Sie Meilensteine ab, um Ihren Projektfortschritt zu loggen. Sie können Meilensteine direkt in <strong>Kanban-Tickets</strong> für Ihr Team umwandeln oder eigene Meilensteine definieren.
            </p>
          </div>

          {/* Phase 1-5 Accordion Checklist */}
          {[1, 2, 3, 4, 5].map(phaseNum => {
            const stats = getPhaseStats(phaseNum);
            return (
              <RoadmapPhaseSection
                key={phaseNum}
                phaseNum={phaseNum}
                stats={stats}
                items={items}
                completedState={completedState}
                toggleTask={toggleTask}
                convertToTicket={convertToTicket}
                deleteCustomTask={deleteCustomTask}
              />
            );
          })}

          {/* Add custom Meilenstein Goal */}
          <RoadmapCustomTaskForm
            customTask={customTask}
            setCustomTask={setCustomTask}
            customPhase={customPhase}
            setCustomPhase={setCustomPhase}
            addCustomTask={addCustomTask}
          />

        </div>

        {/* Right 5 Columns: The Flowchart & Metadata Schemas */}
        <div className="xl:col-span-5">
          <RoadmapArchitectureChart
            activeArchSection={activeArchSection}
            setActiveArchSection={setActiveArchSection}
            totalCompleted={totalCompleted}
            totalTasks={totalTasks}
            onSetView={onSetView}
          />
        </div>

      </div>
    </div>
  );
};
