import React, { useRef } from 'react';
import { Save, Download, Upload } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { sanitizeProjectName } from '../../../utils/nameUtils';

interface BackupRestoreSectionProps {
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const BackupRestoreSection: React.FC<BackupRestoreSectionProps> = ({ showMessage }) => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadFullBackup = () => {
    const payload = {
      version: 3,
      id: store.projectId || crypto.randomUUID(),
      name: store.projectName || "Unbenanntes Projekt",
      lastModified: Date.now(),
      data: {
        tables: store.tables,
        queries: store.queries,
        reports: store.reports,
        forms: store.forms,
        charts: store.charts || [],
        pages: store.pages || [],
        customComponents: store.customComponents || [],
        workflows: store.workflows || [],
        relationships: store.relationships,
        layout: store.layout,
        tableGroups: store.tableGroups || [],
        backendConfig: store.backendConfig,
        tickets: store.tickets || [],
        chats: store.chats || []
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${sanitizeProjectName(store.projectName)}_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    ui.addToast("Vollständiges Schema- & Datenbackup heruntergeladen!", 'success');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.data || !parsed.data.tables) {
          throw new Error("Ungültiges DB Studio Backup-Format.");
        }
        store.loadProject(parsed);
        ui.addToast("Projekt-Backup erfolgreich wiederhergestellt!", 'success');
      } catch (err: any) {
        showMessage("Restore-Fehler", `Wiederherstellung fehlgeschlagen: ${err.message}`, "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
      
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 mt-4">
        
        {/* SAVE TO INDEXEDDB BANNER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="p-4 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Save size={36}/>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-base font-bold text-slate-800">Projekt dauerhaft in IndexedDB sichern</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">IndexedDB ist eine hochperformante, transaktionssichere Client-Datenbank. Ihre Tabellen, Berichte, Formulare und Workflows bleiben dauerhaft erhalten – auch nach Browser-Neustarts.</p>
            </div>
          </div>

          <button 
            onClick={() => { store.saveProject().then(() => ui.addToast("Daten erfolgreich in IndexedDB gespeichert!", "success")); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm flex items-center gap-2 shadow-md transition-colors shrink-0 cursor-pointer"
          >
            <Save size={18}/> In DB Speichern
          </button>
        </div>

        {/* DOWNLOAD & RESTORE BACKUPS */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* Download backup */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Download className="text-violet-600" size={20}/>
              <h4 className="font-bold text-slate-800 text-sm">Komplettes Backup herunterladen</h4>
            </div>
            <p className="text-xs text-slate-400">Erzeugt eine verschlüsselte Sicherungsdatei (.json) mit allen Tabellen, Relationen, Queries, Formularlayouts und Workflow-Definitionen für Desaster Recovery.</p>
            
            <div className="flex-1 flex items-end">
              <button 
                onClick={handleDownloadFullBackup}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={14}/> Backup-Datei erzeugen
              </button>
            </div>
          </div>

          {/* Restore backup */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Upload className="text-indigo-600" size={20}/>
              <h4 className="font-bold text-slate-800 text-sm">Projekt aus Backup wiederherstellen</h4>
            </div>
            <p className="text-xs text-slate-400">Wählen Sie eine zuvor exportierte DB Studio Backup-Datei aus, um den aktuellen Workspace vollständig wiederherzustellen.</p>
            
            <input 
              type="file" 
              accept=".json" 
              ref={backupFileInputRef} 
              onChange={handleRestoreBackup}
              className="hidden" 
            />

            <div className="flex-1 flex items-end">
              <button 
                onClick={() => backupFileInputRef.current?.click()}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload size={14}/> Backup hochladen
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
