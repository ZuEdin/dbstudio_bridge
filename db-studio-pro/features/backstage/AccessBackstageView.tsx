import React, { useState, useEffect } from 'react';
import { Project, DbType } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { getAllProjects, getProjectById, deleteProjectFromStorage, saveProjectToStorage, updateProjectScope } from '../../services/storageService';
import { BackstageNavSidebar, BackstageTabType } from './components/BackstageNavSidebar';
import { StartseiteTab } from './components/StartseiteTab';
import { NeuTab } from './components/NeuTab';
import { OeffnenTab } from './components/OeffnenTab';
import { InfoTab } from './components/InfoTab';
import { UeberDbStudioTab } from './components/UeberDbStudioTab';
import { KontoTab } from './components/KontoTab';
import { OptionenTab } from './components/OptionenTab';
import { NewDatabaseModal } from './components/NewDatabaseModal';
import { createTableFromTemplate, getAllTemplates } from '../../services/tableTemplateService';
import { getTemplates } from '../../data/templates/index';

interface AccessBackstageViewProps {
  onCloseBackstage?: () => void;
}

export const AccessBackstageView: React.FC<AccessBackstageViewProps> = ({
  onCloseBackstage,
}) => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('access_pinned_projects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSubTab, setActiveSubTab] = useState<BackstageTabType>(
    ui.backstageActiveTab || 'startseite'
  );
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const hasActiveProject = Boolean(store.projectId);

  // Load all projects from IndexedDB
  const refreshProjects = async () => {
    try {
      const list = await getAllProjects();
      setProjects(list);
    } catch (e) {
      console.error("Failed to load projects from IndexedDB", e);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  // Sync sub tab with UI store
  useEffect(() => {
    if (ui.backstageActiveTab) {
      setActiveSubTab(ui.backstageActiveTab);
    }
  }, [ui.backstageActiveTab]);

  // Handle ESC key to exit backstage when project is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasActiveProject) {
        if (onCloseBackstage) {
          onCloseBackstage();
        } else {
          ui.setIsBackstageOpen(false);
          if (ui.activeTab === 'file') {
            ui.setActiveTab('home');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasActiveProject, onCloseBackstage, ui]);

  // Toggle Pin Favorite
  const handleTogglePin = (id: string) => {
    setPinnedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem('access_pinned_projects', JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save pinned projects", e);
      }
      return updated;
    });
  };

  // Open existing project
  const handleOpenProject = async (id: string) => {
    try {
      const proj = await getProjectById(id);
      if (proj) {
        store.loadProject(proj);
        ui.setIsBackstageOpen(false);
        ui.setActiveTab('home');
        const loadedTables = proj.data?.tables || [];
        if (loadedTables.length > 0) {
          ui.setCurrentView({ type: 'table_data', tableId: loadedTables[0].id });
        } else {
          ui.setCurrentView({ type: 'welcome' });
        }
        ui.addToast("Datenbank erfolgreich geladen.", 'success');
        if (onCloseBackstage) onCloseBackstage();
      } else {
        ui.addToast("Datenbank konnte nicht gefunden werden.", 'error');
      }
    } catch (e) {
      console.error("Failed to open project", e);
      ui.addToast("Fehler beim Öffnen der Datenbank.", 'error');
    }
  };

  // Create new blank database
  const handleCreateDatabase = async (
    name: string,
    dbType: DbType,
    language: 'csharp' | 'typescript' | 'php' | 'python',
    isCloud?: boolean
  ) => {
    setIsNewModalOpen(false);
    try {
      const newId = crypto.randomUUID();
      const defaultTableId = crypto.randomUUID();

      // Create standard initial Table matching modern DB Studio standard ("Tabelle1" with AutoWert primary key)
      const initialTable = {
        id: defaultTableId,
        name: 'Tabelle1',
        description: 'Standard-Tabelle',
        fields: [
          {
            id: crypto.randomUUID(),
            name: 'ID',
            type: 'INTEGER' as const,
            isPrimaryKey: true,
            isAutoIncrement: true,
            comment: 'AutoWert Primärschlüssel',
          },
          {
            id: crypto.randomUUID(),
            name: 'Feld1',
            type: 'VARCHAR' as const,
            length: 255,
            comment: 'Kurzer Text',
          },
        ],
        data: [
          { ID: 1, Feld1: 'Beispieldatensatz 1' },
          { ID: 2, Feld1: 'Beispieldatensatz 2' },
        ],
      };

      const newProject: Project = {
        id: newId,
        name,
        isCloud: Boolean(isCloud),
        lastModified: Date.now(),
        data: {
          tables: [initialTable],
          relationships: [],
          queries: [],
          forms: [],
          reports: [],
          charts: [],
          workflows: [],
          records: {
            [defaultTableId]: [
              { ID: 1, Feld1: 'Beispieldatensatz 1' },
              { ID: 2, Feld1: 'Beispieldatensatz 2' },
            ],
          },
          layout: [],
          tableGroups: [],
          backendConfig: {
            dbType,
            language: language === 'csharp' ? 'dotnet' : (language === 'typescript' ? 'nodejs' : (language as any)),
            projectName: name,
            port: 5000,
            dbConnection: '',
            useSwagger: true,
            frontendFramework: 'react',
          },
        },
      };

      // 1. Save directly to IndexedDB
      await saveProjectToStorage(newProject);
      // 2. Load into state
      store.loadProject(newProject);
      
      ui.setIsBackstageOpen(false);
      ui.setActiveTab('home');
      ui.setCurrentView({ type: 'table_data', tableId: defaultTableId });
      ui.addToast(`Datenbank "${name}" (${isCloud ? 'Cloud Workspace' : 'Privat / IndexedDB'}) erstellt und geöffnet.`, 'success');
      if (onCloseBackstage) onCloseBackstage();
      refreshProjects();
    } catch (e) {
      console.error("Failed to create database", e);
      ui.addToast("Fehler beim Erstellen der Datenbank.", 'error');
    }
  };

  const handleToggleScope = async (id: string, newIsCloud: boolean) => {
    try {
      await updateProjectScope(id, newIsCloud);
      ui.addToast(
        newIsCloud
          ? 'Projekt als Cloud Workspace festgelegt.'
          : 'Projekt als Privat (IndexedDB) festgelegt.',
        'info'
      );
      refreshProjects();
    } catch (e) {
      console.error('Failed to update project scope', e);
      ui.addToast('Fehler beim Ändern des Speicherorts.', 'error');
    }
  };

  // Create from business template or single table template
  const handleApplyTemplate = async (templateId: string, templateName: string) => {
    try {
      const newId = crypto.randomUUID();
      const projectTemplates = getTemplates('de');
      const projTemplate = projectTemplates.find(t => t.id === templateId);

      let newProject: Project;

      if (projTemplate) {
        // Full project template with multiple tables, forms, reports, relationships, etc.
        const recordsObj: Record<string, any[]> = {};
        (projTemplate.data.tables || []).forEach(tbl => {
          recordsObj[tbl.id] = tbl.data || [];
        });

        newProject = {
          id: newId,
          name: projTemplate.name,
          lastModified: Date.now(),
          data: {
            tables: projTemplate.data.tables || [],
            relationships: projTemplate.data.relationships || [],
            queries: projTemplate.data.queries || [],
            forms: projTemplate.data.forms || [],
            reports: projTemplate.data.reports || [],
            charts: projTemplate.data.charts || [],
            workflows: projTemplate.data.workflows || [],
            records: recordsObj,
            layout: projTemplate.data.layout || [],
            tableGroups: projTemplate.data.tableGroups || [],
            backendConfig: projTemplate.data.backendConfig || {
              dbType: DbType.SQL,
              language: 'dotnet',
              projectName: projTemplate.name,
              port: 5000,
              dbConnection: '',
              useSwagger: true,
              frontendFramework: 'react',
            },
          },
        };
      } else {
        // Single table template fallback
        const allTemplates = getAllTemplates();
        const matched = allTemplates.find(t => t.id === templateId) || allTemplates[0];
        const table = matched ? createTableFromTemplate(matched, [], true) : {
          id: crypto.randomUUID(),
          name: templateName,
          description: 'Aus Vorlage erstellt',
          fields: [
            { id: crypto.randomUUID(), name: 'ID', type: 'INTEGER' as const, isPrimaryKey: true, isAutoIncrement: true },
            { id: crypto.randomUUID(), name: 'Titel', type: 'VARCHAR' as const, length: 255 }
          ],
          data: []
        };

        newProject = {
          id: newId,
          name: templateName,
          lastModified: Date.now(),
          data: {
            tables: [table],
            relationships: [],
            queries: [],
            forms: [],
            reports: [],
            charts: [],
            workflows: [],
            records: {
              [table.id]: table.data || []
            },
            layout: [],
            tableGroups: [],
            backendConfig: {
              dbType: DbType.SQLite,
              language: 'dotnet',
              projectName: templateName,
              port: 5000,
              dbConnection: '',
              useSwagger: true,
              frontendFramework: 'react',
            },
          },
        };
      }

      await saveProjectToStorage(newProject);
      store.loadProject(newProject);

      ui.setIsBackstageOpen(false);
      ui.setActiveTab('home');
      const loadedTables = useProjectStore.getState().tables;
      if (loadedTables && loadedTables.length > 0) {
        ui.setCurrentView({ type: 'table_data', tableId: loadedTables[0].id });
      } else {
        ui.setCurrentView({ type: 'welcome' });
      }
      ui.addToast(`Vorlage "${newProject.name}" erfolgreich importiert.`, 'success');
      if (onCloseBackstage) onCloseBackstage();
      refreshProjects();
    } catch (e) {
      console.error("Failed to apply template", e);
      ui.addToast("Fehler beim Laden der Vorlage.", 'error');
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    ui.setConfirmationModal({
      title: "Datenbank löschen",
      message: "Möchten Sie diese Datenbank unwiderruflich aus dem lokalen Speicher (IndexedDB) entfernen?",
      confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold",
      confirmText: "Löschen",
      onConfirm: async () => {
        try {
          await deleteProjectFromStorage(id);
          ui.addToast("Datenbank gelöscht.", 'warning');
          refreshProjects();
        } catch (e) {
          ui.addToast("Löschen fehlgeschlagen.", 'error');
        }
      },
    });
  };

  // Duplicate project
  const handleDuplicateProject = async (project: Project) => {
    try {
      const newId = crypto.randomUUID();
      const duplicate: Project = {
        ...project,
        id: newId,
        name: `${project.name} - Kopie`,
        lastModified: Date.now(),
      };
      await saveProjectToStorage(duplicate);
      ui.addToast(`Kopie "${duplicate.name}" erstellt.`, 'success');
      refreshProjects();
    } catch (e) {
      ui.addToast("Duplizieren fehlgeschlagen.", 'error');
    }
  };

  // Rename project
  const handleRenameProject = (id: string, currentName: string) => {
    ui.setNameInput({
      title: 'Datenbank umbenennen',
      label: 'Neuer Name',
      initialValue: currentName,
      onConfirm: async (newName: string) => {
        const clean = newName.trim();
        if (!clean) return;
        try {
          // If currently loaded
          if (store.projectId === id) {
            await store.renameProject(clean);
          } else {
            const list = await getAllProjects();
            const target = list.find((p) => p.id === id);
            if (target) {
              target.name = clean;
              target.lastModified = Date.now();
              await saveProjectToStorage(target);
            }
          }
          ui.setNameInput(null);
          ui.addToast("Datenbank umbenannt.", 'success');
          refreshProjects();
        } catch (e) {
          ui.addToast("Umbenennen fehlgeschlagen.", 'error');
        }
      },
      onCancel: () => ui.setNameInput(null),
    });
  };

  // Export project file (.dbsp / .json)
  const handleExportProject = async (id: string) => {
    try {
      const list = await getAllProjects();
      const target = list.find((p) => p.id === id);
      if (target) {
        const dataStr = JSON.stringify(target, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${target.name}.dbsp`;
        a.click();
        URL.revokeObjectURL(url);
        ui.addToast("Projektdatei exportiert.", 'success');
      }
    } catch (e) {
      ui.addToast("Export fehlgeschlagen.", 'error');
    }
  };

  // Import file
  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.id) parsed.id = crypto.randomUUID();
      if (!parsed.name) parsed.name = file.name.replace(/\.[^/.]+$/, "");
      parsed.lastModified = Date.now();

      await saveProjectToStorage(parsed);
      store.loadProject(parsed);

      ui.setIsBackstageOpen(false);
      ui.setActiveTab('home');
      const loadedTables = useProjectStore.getState().tables;
      if (loadedTables && loadedTables.length > 0) {
        ui.setCurrentView({ type: 'table_data', tableId: loadedTables[0].id });
      } else {
        ui.setCurrentView({ type: 'welcome' });
      }
      ui.addToast(`Datenbank "${parsed.name}" importiert und geöffnet.`, 'success');
      if (onCloseBackstage) onCloseBackstage();
      refreshProjects();
    } catch (e) {
      console.error("Import error", e);
      ui.addToast("Ungültiges Dateiformat für den Import.", 'error');
    }
  };

  // Close active project & stay on Backstage
  const handleCloseProject = () => {
    ui.setConfirmationModal({
      title: "Datenbank schließen",
      message: "Möchten Sie die aktive Datenbank schließen und zum Startbildschirm zurückkehren?",
      confirmText: "Schließen",
      onConfirm: () => {
        store.closeProject();
        setActiveSubTab('startseite');
        ui.setBackstageActiveTab('startseite');
        ui.addToast("Datenbank geschlossen.", 'info');
      },
    });
  };

  // Save active project
  const handleSaveActiveProject = async () => {
    try {
      await store.saveProject();
      ui.setIsDirty(false);
      ui.addToast("Datenbank in IndexedDB gespeichert.", 'success');
    } catch (e) {
      ui.addToast("Fehler beim Speichern.", 'error');
    }
  };

  // Return to workspace
  const handleBackToProject = () => {
    if (onCloseBackstage) {
      onCloseBackstage();
    } else {
      ui.setIsBackstageOpen(false);
      if (ui.activeTab === 'file') {
        ui.setActiveTab('home');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex bg-[#2b2b2b] text-neutral-100 select-none overflow-hidden animate-in fade-in duration-100">
      {/* Left Backstage Navigation Sidebar */}
      <BackstageNavSidebar
        activeTab={activeSubTab}
        onSelectTab={(tab) => {
          setActiveSubTab(tab);
          ui.setBackstageActiveTab(tab);
        }}
        hasActiveProject={hasActiveProject}
        onBackToProject={handleBackToProject}
        onSaveProject={handleSaveActiveProject}
        onCloseProject={handleCloseProject}
      />

      {/* Main Backstage Content Area based on active tab */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#2b2b2b]">
        {activeSubTab === 'startseite' && (
          <StartseiteTab
            projects={projects}
            pinnedIds={pinnedIds}
            onTogglePin={handleTogglePin}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onRenameProject={handleRenameProject}
            onExportProject={handleExportProject}
            onGoToTemplates={() => setActiveSubTab('neu')}
            onGoToOpenTab={() => setActiveSubTab('oeffnen')}
            onToggleScope={handleToggleScope}
            onApplyTemplate={handleApplyTemplate}
          />
        )}

        {activeSubTab === 'neu' && (
          <NeuTab
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onApplyTemplate={handleApplyTemplate}
          />
        )}

        {activeSubTab === 'oeffnen' && (
          <OeffnenTab
            projects={projects}
            pinnedIds={pinnedIds}
            onTogglePin={handleTogglePin}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onRenameProject={handleRenameProject}
            onExportProject={handleExportProject}
            onImportFile={handleImportFile}
            onToggleScope={handleToggleScope}
          />
        )}

        {activeSubTab === 'info' && (
          <InfoTab
            onSelectTab={(tab) => {
              setActiveSubTab(tab);
              ui.setBackstageActiveTab(tab);
            }}
          />
        )}
        {activeSubTab === 'ueber_db_studio' && (
          <UeberDbStudioTab onOpenNewModal={() => setIsNewModalOpen(true)} />
        )}
        {activeSubTab === 'konto' && <KontoTab />}
        {activeSubTab === 'optionen' && <OptionenTab />}

        {activeSubTab === 'speichern_unter' && (
          <div className="p-10 max-w-xl">
            <h1 className="text-2xl font-light text-white mb-2">Speichern unter</h1>
            <p className="text-xs text-neutral-400 mb-6">Exportieren Sie das Datenbankschema und die Tabellendaten</p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (store.projectId) handleExportProject(store.projectId);
                }}
                className="w-full p-4 rounded-xl bg-[#333333] hover:bg-[#3d3d3d] border border-[#444444] text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white">DB Studio Datenbankdatei (.dbsp / .json)</h3>
                  <p className="text-xs text-neutral-400">Komplettes Projekt inkl. aller Tabellen, Beziehungen, Abfragen und Daten</p>
                </div>
                <span className="text-xs font-bold text-indigo-400">Exportieren →</span>
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'drucken' && (
          <div className="p-10 max-w-xl">
            <h1 className="text-2xl font-light text-white mb-2">Drucken & Berichts-Export</h1>
            <p className="text-xs text-neutral-400 mb-6">Drucken Sie Tabellen, Berichte oder Exportieren Sie als PDF</p>
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
            >
              Druckansicht öffnen
            </button>
          </div>
        )}
      </div>

      {/* Modal for Creating New Empty Database */}
      <NewDatabaseModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateDatabase}
      />
    </div>
  );
};
