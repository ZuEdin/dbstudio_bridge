import React, { useState, useMemo } from 'react';
import { Table, BackendConfig, VirtualFile, DbType } from '../../../types/index';
import { 
  X, RefreshCw, Database, Server, HardDrive, Shield, Check, 
  Copy, Download, Zap, Terminal, Sparkles, FileText, CheckCircle2, 
  Layers, ArrowRight, Clock, Trash2, GitMerge, AlertCircle, Laptop
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import JSZip from 'jszip';
import { 
  generateOfflineSyncFiles, 
  OfflineSyncOptions, 
  DEFAULT_OFFLINE_SYNC_OPTIONS,
  enrichTableWithSyncFields,
  getSyncMetadataFields
} from '../../../utils/generators/offlineSyncGenerator';

interface OfflineSyncGeneratorModalProps {
  tables: Table[];
  backendConfig: BackendConfig;
  onUpdateTables: (tables: Table[]) => void;
  onSaveConfig: (config: BackendConfig) => void;
  onClose: () => void;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const OfflineSyncGeneratorModal: React.FC<OfflineSyncGeneratorModalProps> = ({
  tables,
  backendConfig,
  onUpdateTables,
  onSaveConfig,
  onClose,
  showMessage,
  addToast
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'architecture'>('config');
  
  // Local Config State
  const [options, setOptions] = useState<OfflineSyncOptions>({
    ...DEFAULT_OFFLINE_SYNC_OPTIONS,
    ...(backendConfig.offlineSync || {}),
    ...(backendConfig.deploymentConfig?.offlineSync || {})
  });

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Generate virtual sync files dynamically based on current options
  const generatedFiles: VirtualFile[] = useMemo(() => {
    return generateOfflineSyncFiles(tables, backendConfig, options);
  }, [tables, backendConfig, options]);

  const currentFile = generatedFiles[selectedFileIndex] || generatedFiles[0];

  // Count how many tables already have sync fields
  const syncFields = getSyncMetadataFields(options);
  const tablesWithSyncFieldsCount = useMemo(() => {
    const softDelName = options.softDeleteField.toLowerCase();
    const updatedName = options.updatedAtField.toLowerCase();
    return tables.filter(t => 
      t.fields.some(f => f.name.toLowerCase() === softDelName) &&
      t.fields.some(f => f.name.toLowerCase() === updatedName)
    ).length;
  }, [tables, options]);

  // Handler: Add Sync Fields to all tables in the current project
  const handleAutoInjectFieldsToAllTables = () => {
    const updatedTables = tables.map(t => enrichTableWithSyncFields(t, options));
    onUpdateTables(updatedTables);
    
    if (addToast) {
      addToast(`Sync-Spalten (${options.softDeleteField}, ${options.updatedAtField} etc.) zu ${tables.length} Tabellen hinzugefügt!`, 'success');
    } else {
      showMessage('Erfolg', `Sync-Metadaten Spalten wurden erfolgreich zu allen ${tables.length} Tabellen hinzugefügt.`, 'success');
    }
  };

  // Handler: Save Options into Project Backend Config
  const handleSave = () => {
    const targetLang = options.remoteBackendType || backendConfig.language;
    const targetDeployment = options.clientTarget === 'tauri' ? 'tauri' : (backendConfig.deploymentConfig?.target || 'offline_sync');
    const newConfig: BackendConfig = {
      ...backendConfig,
      language: targetLang,
      offlineSync: {
        ...options,
        enabled: true
      },
      deploymentConfig: {
        ...(backendConfig.deploymentConfig || { target: targetDeployment }),
        target: targetDeployment,
        offlineSync: {
          ...options,
          enabled: true
        }
      }
    };
    onSaveConfig(newConfig);
    if (addToast) {
      addToast(`Offline-Sync gespeichert: ${targetLang.toUpperCase()} Server ➔ ${options.clientTarget === 'tauri' ? 'Tauri (SQLite)' : 'Client'}`, 'success');
    } else {
      showMessage('Gespeichert', `Offline-First Synchronisations-Konfiguration (${targetLang.toUpperCase()} Server ➔ Tauri/SQLite) wurde übernommen.`, 'success');
    }
  };

  // Handler: Download All Files as ZIP
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    generatedFiles.forEach(file => {
      const relativePath = file.path.replace(`Backend/${backendConfig.projectName}/offline-sync/`, '');
      zip.file(relativePath, file.content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-sync-${backendConfig.projectName.toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    if (addToast) {
      addToast('Offline-Sync Paket (.zip) heruntergeladen!', 'success');
    }
  };

  const handleCopyCode = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl border border-slate-300 dark:border-slate-800 overflow-hidden flex flex-col h-[780px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-lg border border-emerald-500/30 text-emerald-400">
              <RefreshCw className="w-5 h-5 animate-spin-reverse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">Offline-First & Hybrid Sync Generator</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                  SQLite ➔ MySQL / Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lokale SQLite-Clientdatenbank mit Online-MySQL synchronisieren inkl. Soft-Deletes, Zeitstempeln & Konfliktlösung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors"
            >
              <Download size={14} className="text-emerald-400" /> ZIP Download
            </button>
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-md shadow-emerald-900/30 transition-all"
            >
              <Check size={14} /> Speichern
            </button>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 dark:bg-slate-950/80 px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors ${
                activeTab === 'config'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers size={14} /> 1. Konfiguration & Metadaten
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors ${
                activeTab === 'code'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Terminal size={14} /> 2. Generierter Code & DDL ({generatedFiles.length} Dateien)
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors ${
                activeTab === 'architecture'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitMerge size={14} /> 3. Live-Architektur Visualisierung
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Projekt-Tabellen mit Sync-Status:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
              tablesWithSyncFieldsCount === tables.length
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {tablesWithSyncFieldsCount} / {tables.length} Tabellen
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'config' && (
            <div className="p-6 overflow-y-auto h-full space-y-6">
              
              {/* Quick Auto-Inject Banner */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-emerald-500 w-5 h-5" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Automatische Metadaten-Injektion in alle Tabellen
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                    Fügt automatisch die erforderlichen Synchronisationsspalten (<code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{options.softDeleteField}</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{options.updatedAtField}</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{options.createdAtField}</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{options.syncVersionField}</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{options.clientIdField}</code>) in alle bestehenden {tables.length} Tabellen des aktuellen Projekts ein.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoInjectFieldsToAllTables}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0"
                >
                  <Zap size={15} /> Metadaten jetzt in alle Tabellen einfügen
                </button>
              </div>

              {/* Grid 2 Columns: Engines & Sync Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Database Engines & Technologies */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Database size={15} className="text-blue-500" /> Remote Backend & Client-Plattform
                  </h4>

                  {/* Remote Sync Backend API Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Remote Sync-Server Backend (API Sprache)
                    </label>
                    <select
                      value={options.remoteBackendType || (backendConfig.language === 'php' ? 'php' : backendConfig.language === 'dotnet' ? 'dotnet' : 'dotnet')}
                      onChange={e => {
                        const val = e.target.value as any;
                        setOptions({ ...options, remoteBackendType: val });
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="dotnet">.NET 10/9/8 C# (SyncController.cs & EF Core)</option>
                      <option value="php">PHP Native (SyncController.php & PDO)</option>
                      <option value="nodejs">Node.js (Express + TypeScript syncApiRoutes.ts)</option>
                      <option value="laravel">PHP Laravel API (SyncController.php)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Wählen Sie hier, ob der Remote-Server in <strong>.NET (C#)</strong> oder <strong>PHP</strong> läuft.
                    </p>
                  </div>

                  {/* Client / Desktop Shell Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client-Plattform (Desktop / Native / Web)
                    </label>
                    <select
                      value={options.clientTarget || (backendConfig.deploymentConfig?.target === 'tauri' ? 'tauri' : 'tauri')}
                      onChange={e => {
                        const val = e.target.value as any;
                        setOptions({ ...options, clientTarget: val });
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="tauri">Tauri App (Rust + Native SQLite Desktop)</option>
                      <option value="electron">Electron Desktop (Node.js + SQLite3)</option>
                      <option value="browser">Web Browser / PWA (IndexedDB / SQLite WASM)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Die Client-Anwendung läuft in Tauri mit SQLite und synchronisiert zur gewählten Remote-API.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lokale Client-Engine (Offline)
                    </label>
                    <select
                      value={options.localEngine}
                      onChange={e => setOptions({ ...options, localEngine: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="sqlite">SQLite 3 (Standard Desktop / Native / File)</option>
                      <option value="sqlcipher">SQLCipher (AES-256 Verschlüsselte SQLite Datei)</option>
                      <option value="indexeddb">IndexedDB / SQLite WASM (Browser Offline Storage)</option>
                      <option value="powersync">PowerSync Edge Engine</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Wird lokal auf dem Endgerät in Tauri/SQLite gespeichert und bleibt ohne Internet 100% bedienbar.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Remote Cloud/Server-Engine (Online)
                    </label>
                    <select
                      value={options.remoteEngine}
                      onChange={e => setOptions({ ...options, remoteEngine: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="mysql">MySQL 8.0+ (InnoDB mit Delta-Indizes)</option>
                      <option value="mariadb">MariaDB 10.6+</option>
                      <option value="postgres">PostgreSQL 15+ (JSONB & Timestamps)</option>
                      <option value="mssql">Microsoft SQL Server</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Zentraler Cloud-Server, zu dem alle synchronisierten Endgeräte periodisch pushen und pullen.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hintergrund-Sync Intervall
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="5"
                        max="3600"
                        value={options.syncIntervalSeconds}
                        onChange={e => setOptions({ ...options, syncIntervalSeconds: parseInt(e.target.value) || 30 })}
                        className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-center text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Sekunden (Automatisch bei Re-Connect)</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Conflict & Field Names */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Shield size={15} className="text-emerald-500" /> Konfliktlösungs-Strategie & Spalten
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Konflikt-Strategie (Conflict Resolution)
                    </label>
                    <select
                      value={options.conflictStrategy}
                      onChange={e => setOptions({ ...options, conflictStrategy: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="last_write_wins">Last-Write-Wins (LWW nach Zeitstempel _updated_at) [Empfohlen]</option>
                      <option value="server_wins">Server hat Vorrang (Server-Authority)</option>
                      <option value="client_wins">Lokaler Client hat Vorrang (Client-Wins)</option>
                      <option value="manual_review">CRDT / Revisions-Konfliktflag zur manuellen Prüfung</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Soft-Delete Spalte</label>
                      <input
                        type="text"
                        value={options.softDeleteField}
                        onChange={e => setOptions({ ...options, softDeleteField: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Update-Zeitstempel</label>
                      <input
                        type="text"
                        value={options.updatedAtField}
                        onChange={e => setOptions({ ...options, updatedAtField: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Erstell-Zeitstempel</label>
                      <input
                        type="text"
                        value={options.createdAtField}
                        onChange={e => setOptions({ ...options, createdAtField: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Revisionszähler</label>
                      <input
                        type="text"
                        value={options.syncVersionField}
                        onChange={e => setOptions({ ...options, syncVersionField: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={options.generateTriggers}
                        onChange={e => setOptions({ ...options, generateTriggers: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Automatische SQLite Triggers für <code className="font-mono text-blue-600 dark:text-blue-400">{options.updatedAtField}</code> generieren
                    </label>
                  </div>
                </div>

              </div>

              {/* Table Sync Overview */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Übersicht aller synchronisierten Tabellen im Projekt
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {tables.map(table => {
                    const hasDeleted = table.fields.some(f => f.name.toLowerCase() === options.softDeleteField.toLowerCase());
                    const hasUpdated = table.fields.some(f => f.name.toLowerCase() === options.updatedAtField.toLowerCase());
                    const isSynced = hasDeleted && hasUpdated;

                    return (
                      <div
                        key={table.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{table.name}</div>
                          <div className="text-[10px] text-slate-500">{table.fields.length} Spalten</div>
                        </div>
                        <div>
                          {isSynced ? (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Bereit
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <Clock size={11} /> Spalten fehlen
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'code' && (
            <div className="flex h-full overflow-hidden">
              
              {/* File Selector Sidebar */}
              <div className="w-80 bg-slate-50 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1">
                  Generierte Sync-Dateien
                </div>
                {generatedFiles.map((file, idx) => {
                  const isSelected = idx === selectedFileIndex;
                  const filename = file.path.split('/').pop();
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <FileText size={14} className={isSelected ? 'text-white' : 'text-blue-500'} />
                      <div className="truncate flex-1">
                        <div className="truncate">{filename}</div>
                        <div className={`text-[9px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {file.language.toUpperCase()} • {file.content.split('\n').length} Zeilen
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Code Viewer */}
              <div className="flex-1 flex flex-col bg-slate-900">
                <div className="p-3 px-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs text-slate-300">
                  <div className="font-mono text-emerald-400 flex items-center gap-2">
                    <span>{currentFile?.path}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold transition-colors"
                  >
                    {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {isCopied ? 'Kopiert!' : 'Code kopieren'}
                  </button>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={currentFile?.language || 'sql'}
                    theme="vs-dark"
                    value={currentFile?.content || ''}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </div>

            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="p-8 overflow-y-auto h-full space-y-8 bg-slate-900 text-slate-100">
              
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-xl font-extrabold text-white">
                  Zwei-Wege Synchronisations-Pipeline
                </h3>
                <p className="text-xs text-slate-400">
                  Vollständig entkoppeltes, offline-fähiges Datenmodell mit Delta-Push, Delta-Pull und Last-Write-Wins Zeitstempel-Abgleich.
                </p>
              </div>

              {/* Visual Pipeline Flow */}
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                
                {/* Node 1 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3 relative group hover:border-emerald-500/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Laptop size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">1. Client / Edge</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Lokale <strong>SQLite</strong> Datenbank
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[9px] text-slate-400 text-left w-full font-mono space-y-0.5">
                    <div>• 100% Offline fähig</div>
                    <div>• Soft-Delete (_is_deleted=1)</div>
                    <div>• Lokale Mutationen Queue</div>
                  </div>
                </div>

                {/* Node 2 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3 relative group hover:border-blue-500/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <RefreshCw size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">2. Sync Worker</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Hintergrund Delta Engine
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[9px] text-slate-400 text-left w-full font-mono space-y-0.5">
                    <div>• Intervall: {options.syncIntervalSeconds}s</div>
                    <div>• Online Event Listener</div>
                    <div>• Client-ID Stempelung</div>
                  </div>
                </div>

                {/* Node 3 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3 relative group hover:border-amber-500/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Server size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">3. Sync API Gateway</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      REST Push & Pull Routes
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[9px] text-slate-400 text-left w-full font-mono space-y-0.5">
                    <div>• POST /api/sync/push</div>
                    <div>• POST /api/sync/pull</div>
                    <div>• Last-Write-Wins LWW</div>
                  </div>
                </div>

                {/* Node 4 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3 relative group hover:border-purple-500/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <HardDrive size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">4. Cloud Database</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Online <strong>{options.remoteEngine.toUpperCase()}</strong> 8.0+
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[9px] text-slate-400 text-left w-full font-mono space-y-0.5">
                    <div>• Delta Indizes</div>
                    <div>• ON UPDATE CURRENT_TIMESTAMP</div>
                    <div>• Multi-Device Master</div>
                  </div>
                </div>

              </div>

              {/* Explanatory Cards */}
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={15} /> Warum Soft-Deletes ({options.softDeleteField})?
                  </h5>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Wenn ein Benutzer offline einen Datensatz löscht, darf dieser nicht sofort physisch mit <code>DELETE</code> entfernt werden. Stattdessen wird <code>{options.softDeleteField} = 1</code> und <code>{options.updatedAtField} = NOW()</code> gesetzt. Sobald die Verbindung wiederhergestellt ist, sendet der Sync Worker diese Löschung an den MySQL-Server, welcher die Löschung an alle anderen Clients propagiert.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-blue-400 flex items-center gap-2">
                    <GitMerge size={15} /> Last-Write-Wins Konfliktlösung ({options.conflictStrategy})
                  </h5>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Ändern zwei Mitarbeiter gleichzeitig denselben Kundendatensatz (einer im Büro online, einer auf der Baustelle offline), vergleicht der Server den Zeitstempel <code>{options.updatedAtField}</code> und den Revisionszähler <code>{options.syncVersionField}</code>. Die jüngste Änderung gewinnt deterministisch, ohne dass Daten verloren gehen.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
