import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Download, 
  Layers, 
  Key, 
  Sparkles, 
  Database, 
  Code2, 
  Link2, 
  Table, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCode
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { AccessInspectionResult, AccessTranspileResult } from '../../types/bridge';

export const AccessMigrationView: React.FC = () => {
  const [inspectionData, setInspectionData] = useState<AccessInspectionResult | null>(null);
  const [selectedDialect, setSelectedDialect] = useState<'postgres' | 'mysql' | 'sqlite' | 'sqlserver'>('postgres');
  const [transpileResult, setTranspileResult] = useState<AccessTranspileResult | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'ddl' | 'queries' | 'relations' | 'tables' | 'sync'>('ddl');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportFullSqlDump = async () => {
    if (!inspectionData) return;
    setIsSyncing(true);
    setSyncStatus(`Generiere vollständigen ${selectedDialect.toUpperCase()} SQL Data-Dump...`);
    try {
      const res = await bridgeApi.exportSqlDataDump(inspectionData, selectedDialect);
      if (res.success && res.sqlDump) {
        const blob = new Blob([res.sqlDump], { type: 'text/sql;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || `${inspectionData.fileName}_full_dump.sql`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);

        setSyncStatus(`Erfolgreich! ${res.totalRows} Datensätze in ${res.totalTables} Tabellen exportiert.`);
        showNotification(`SQL Data-Dump '${res.fileName}' heruntergeladen!`);
      } else {
        setSyncStatus(`Fehler: ${res.error || 'Dump-Erstellung fehlgeschlagen'}`);
      }
    } catch (err: any) {
      setSyncStatus(`Fehler: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToLocalSqlite = async () => {
    if (!inspectionData) return;
    setIsSyncing(true);
    setSyncStatus('Erstelle lokale SQLite-Datenbank und migriere alle Datensätze...');
    try {
      const res = await bridgeApi.syncToSqlite(inspectionData);
      if (res.success) {
        setSyncResult(res);
        setSyncStatus(`Fertig! ${res.totalRows} Datensätze erfolgreich in '${res.targetFileName}' gespeichert.`);
        showNotification(`SQLite-Datenbank '${res.targetFileName}' erfolgreich erstellt!`);
      } else {
        setSyncStatus(`Fehler: ${res.error || 'Migration fehlgeschlagen'}`);
      }
    } catch (err: any) {
      setSyncStatus(`Fehler: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const res = await bridgeApi.uploadAccessDatabase(file.name, base64);
        if (res.success) {
          setInspectionData(res);
          await triggerTranspilation(res, selectedDialect);
          showNotification(`Access-Datei '${file.name}' erfolgreich analysiert!`);
        } else {
          showNotification(`Fehler: ${res.error || 'Inspektion fehlgeschlagen'}`);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showNotification(`Fehler: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const triggerTranspilation = async (data: AccessInspectionResult, dialect: 'postgres' | 'mysql' | 'sqlite' | 'sqlserver') => {
    if (!data || !data.tables) return;
    try {
      const res = await bridgeApi.transpileAccessDatabase(data.tables, data.queries, dialect);
      if (res.success) {
        setTranspileResult(res);
      }
    } catch {
      // Ignore
    }
  };

  const handleDialectChange = async (dialect: 'postgres' | 'mysql' | 'sqlite' | 'sqlserver') => {
    setSelectedDialect(dialect);
    if (inspectionData) {
      await triggerTranspilation(inspectionData, dialect);
    }
  };

  const handleCopySql = () => {
    if (!transpileResult?.ddl) return;
    navigator.clipboard.writeText(transpileResult.ddl);
    showNotification('SQL DDL Skript in Zwischenablage kopiert!');
  };

  const handleDownloadSql = () => {
    if (!transpileResult?.ddl) return;
    const blob = new Blob([transpileResult.ddl], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inspectionData?.fileName || 'access_migration'}_${selectedDialect}.sql`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    showNotification('SQL-Datei erfolgreich heruntergeladen!');
  };

  const handleDownloadDbsp = async () => {
    if (!inspectionData) return;
    setIsExporting(true);
    try {
      const res = await bridgeApi.exportAccessToDbsp(inspectionData);
      if (res.success && res.dbspContent) {
        const jsonStr = JSON.stringify(res.dbspContent, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || `${inspectionData.fileName}.dbsp`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);

        showNotification(`.dbsp Projektdatei '${res.fileName}' erfolgreich heruntergeladen!`);
      } else {
        showNotification(`Fehler: ${res.error || 'Export fehlgeschlagen'}`);
      }
    } catch (err: any) {
      showNotification(`Fehler: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToDbStudio = async () => {
    if (!inspectionData) return;
    setIsExporting(true);
    try {
      const res = await bridgeApi.exportAccessToDbStudio(inspectionData, selectedDialect);
      if (res.success && res.exportPayload) {
        const jsonStr = JSON.stringify(res.exportPayload, null, 2);
        navigator.clipboard.writeText(jsonStr);
        
        // Auch als Datei anbieten
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dbstudio_${inspectionData.fileName}_schema.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);

        showNotification('1-Klick Export erfolgreich! JSON in Zwischenablage & heruntergeladen.');
      }
    } catch (err: any) {
      showNotification(`Export-Fehler: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1524]/95 border border-emerald-500/50 text-emerald-300 text-xs px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md glow-emerald flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-emerald shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Microsoft Access Migration Engine</h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Phase 8 Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Liest <code className="text-emerald-400 font-mono">.accdb</code> und <code className="text-emerald-400 font-mono">.mdb</code> Dateien ein, transpilliert Tabellen & Access-Abfragen (NZ, IIF, Date) in Standard-SQL und bereitet Beziehungen für DB Studio vor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      {!inspectionData ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`bg-[#0E1524]/60 backdrop-blur-md border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
            isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner glow-emerald">
              <Upload className={`w-8 h-8 ${isProcessing ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Access-Datenbank hier ablegen</h4>
              <p className="text-xs text-slate-400">Unterstützt .accdb (Access 2007-2024) und .mdb (Access 97-2003)</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <label className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                <span>Datei auswählen...</span>
                <input
                  type="file"
                  accept=".accdb,.mdb"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* Analysis Results Dashboard */
        <div className="space-y-6">
          {/* File Meta & Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Quelldatei</span>
                <span className="font-mono text-emerald-400">{inspectionData.extension}</span>
              </div>
              <p className="text-sm font-bold text-white truncate" title={inspectionData.fileName}>{inspectionData.fileName}</p>
              <p className="text-[11px] text-slate-500 mt-1">{inspectionData.fileSizeFormatted}</p>
            </div>

            <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Tabellen</span>
                <Table className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-xl font-bold text-cyan-400">{inspectionData.tableCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Strukturierte Entitäten</p>
            </div>

            <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Access Abfragen</span>
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-400">{inspectionData.queryCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Transpiliert in Standard-SQL</p>
            </div>

            <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Beziehungen</span>
                <Link2 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <p className="text-xl font-bold text-teal-400">{inspectionData.relationships.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Für DB Studio ER-Modell</p>
            </div>
          </div>

          {/* Dialect Selector Bar & Action Center */}
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Ziel-Datenbank:</span>
              {[
                { id: 'postgres', label: 'PostgreSQL' },
                { id: 'mysql', label: 'MySQL / MariaDB' },
                { id: 'sqlite', label: 'SQLite' },
                { id: 'sqlserver', label: 'SQL Server (T-SQL)' }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleDialectChange(d.id as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    selectedDialect === d.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 glow-emerald'
                      : 'bg-[#080D17] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadDbsp}
                disabled={isExporting}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-950/60 glow-emerald"
                title="Generiert eine vollwertige .dbsp Projektdatei zum direkten Import in DB Studio"
              >
                <Download className="w-4 h-4" />
                <span>.dbsp Projektdatei herunterladen</span>
              </button>

              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 bg-[#080D17] hover:bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-800 transition-all shadow-inner"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQL kopieren</span>
              </button>

              <button
                onClick={handleDownloadSql}
                className="flex items-center gap-1 bg-[#080D17] hover:bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-800 transition-all shadow-inner"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>.SQL speichern</span>
              </button>

              <button
                onClick={handleExportToDbStudio}
                disabled={isExporting}
                className="flex items-center gap-1 bg-[#080D17] hover:bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 transition-all shadow-inner"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Schema JSON</span>
              </button>

              <button
                onClick={() => { setInspectionData(null); setTranspileResult(null); }}
                className="bg-[#080D17] hover:bg-slate-800 text-slate-400 text-xs px-2.5 py-1.5 rounded-xl border border-slate-800"
                title="Andere Datei wählen"
              >
                Neue Datei
              </button>
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap">
            {[
              { id: 'ddl', label: '1. Transpiliertes SQL-Schema (DDL)', icon: Code2, count: null },
              { id: 'queries', label: '2. Abfragen & VBA Transpiler', icon: FileCode, count: inspectionData.queryCount },
              { id: 'relations', label: '3. Beziehungs-Matrix (ER-Modell)', icon: Link2, count: inspectionData.relationships.length },
              { id: 'tables', label: '4. Tabellen & Spalten-Inspektor', icon: Layers, count: inspectionData.tableCount },
              { id: 'sync', label: '5. 🔄 Live Data-Sync & Batch Migration', icon: RefreshCw, count: null }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all ${
                    active
                      ? 'bg-slate-800/90 text-emerald-400 border border-slate-700 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded-md text-slate-400 font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Transpiled SQL DDL */}
          {activeSubTab === 'ddl' && (
            <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-emerald-400 uppercase font-semibold">
                  Generiertes {selectedDialect.toUpperCase()} Schema
                </span>
                <span>Auto-Increment, Primärschlüssel & Typen konvertiert</span>
              </div>
              <pre className="bg-[#080D17] p-4.5 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[500px] shadow-inner leading-relaxed">
                {transpileResult?.ddl || '-- Generiere DDL...'}
              </pre>
            </div>
          )}

          {/* Tab 2: Queries & VBA Transpiler */}
          {activeSubTab === 'queries' && (
            <div className="space-y-4">
              {inspectionData.queries.map((q, idx) => {
                const transpiled = transpileResult?.queries.find(tq => tq.name === q.name)?.transpiledSql || '';
                return (
                  <div key={idx} className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white text-xs font-mono">{q.name}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30">
                        Access ➔ {selectedDialect.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-slate-500 font-semibold">Original Access SQL (VBA Functions)</span>
                        <pre className="bg-[#080D17] p-3 rounded-xl border border-slate-800 text-slate-400 overflow-x-auto text-[11px] shadow-inner">
                          {q.accessSql}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-emerald-400 font-semibold">Transpiliertes Standard-SQL</span>
                        <pre className="bg-[#080D17] p-3 rounded-xl border border-emerald-500/30 text-emerald-300 overflow-x-auto text-[11px] shadow-inner glow-emerald">
                          {transpiled || q.accessSql}
                        </pre>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Relationship Matrix & Re-modeling Notice */}
          {activeSubTab === 'relations' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3 shadow-md">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">Architektur-Vorgabe für DB Studio:</p>
                  <p className="text-amber-200/90 leading-relaxed">
                    Die unten aufgeführten Beziehungen wurden aus der Access-Datei extrahiert. Die eigentlichen Fremdschlüssel-Verknüpfungen (1:n, n:m, ON DELETE CASCADE/RESTRICT) werden <strong>in DB Studio im visuellen Entity-Relationship-Editor neu definiert und geschärft</strong>, um historische Zirkelbezüge zu bereinigen.
                  </p>
                </div>
              </div>

              <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#080D17] border-b border-slate-800 text-slate-400">
                      <th className="p-3.5 font-semibold">Von Tabelle (Foreign Key)</th>
                      <th className="p-3.5 font-semibold">Fremdschlüssel-Spalte</th>
                      <th className="p-3.5 font-semibold">Zu Zieltabelle (Primary Key)</th>
                      <th className="p-3.5 font-semibold">Typ</th>
                      <th className="p-3.5 font-semibold">Empfehlung für DB Studio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {inspectionData.relationships.map((rel, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-3.5 text-white font-semibold">{rel.fromTable}</td>
                        <td className="p-3.5 text-cyan-400">{rel.fromColumn}</td>
                        <td className="p-3.5 text-emerald-400">{rel.toTable} ({rel.toColumn})</td>
                        <td className="p-3.5">
                          <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 text-[10px]">
                            {rel.type}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px] font-sans">{rel.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Tables & Columns Inspector */}
          {activeSubTab === 'tables' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspectionData.tables.map((tbl, idx) => (
                <div key={idx} className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-xs">{tbl.name}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                      ~{tbl.rowCount} Datensätze
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {tbl.columns.map((c, cIdx) => (
                      <div key={cIdx} className="flex items-center justify-between text-[11px] font-mono bg-[#080D17] p-2 rounded-xl border border-slate-800/70">
                        <div className="flex items-center gap-1.5">
                          {c.isPrimaryKey && <Key className="w-3 h-3 text-amber-400" />}
                          <span className="text-slate-200">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">{c.accessType}</span>
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          <span className="text-emerald-400 text-[10px] font-bold">
                            {c.isPrimaryKey && c.accessType === 'AutoNumber' ? 'PK AUTO' : c.accessType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Live Data-Sync & Batch Migration (Phase 9) */}
          {activeSubTab === 'sync' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-emerald">
                      <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Batch-Datenmigration & Synchronisation</h4>
                      <p className="text-xs text-slate-400">
                        Überträgt alle Zeilen in optimierten Batches mit automatischer Typbereinigung & Fremdschlüssel-Sortierung.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono bg-[#080D17] px-3.5 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Gesamtvolumen:</span>
                    <span className="text-emerald-400 font-bold">
                      {inspectionData.tables.reduce((acc, t) => acc + (t.rowCount || 0), 0).toLocaleString()} Datensätze
                    </span>
                  </div>
                </div>

                {/* Topologischer Ausführungsplan */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    1. Topologische Einfügereihenfolge (Dependency Graph):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {inspectionData.tables.map((tbl, idx) => (
                      <div key={idx} className="bg-[#080D17] border border-slate-800 p-3.5 rounded-xl space-y-1 shadow-inner relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Schritt {idx + 1}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {tbl.rowCount} Zeilen
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white truncate pt-1">{tbl.name}</p>
                        <p className="text-[10px] text-slate-500">{tbl.columns.length} Spalten konfiguriert</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aktions-Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Option A: SQL Data Dump Download */}
                  <div className="bg-[#080D17]/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-cyan-400" />
                        <h5 className="text-xs font-bold text-white">Vollständiger SQL Data-Dump (.sql)</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Generiert ein vollständiges Skript mit Tabellen-DDL und allen Datensätzen als Multi-Row <code className="text-cyan-300 font-mono">INSERT INTO</code> Statements für {selectedDialect.toUpperCase()}.
                      </p>
                    </div>

                    <button
                      onClick={handleExportFullSqlDump}
                      disabled={isSyncing}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isSyncing ? 'Verarbeite Datensätze...' : `SQL Data-Dump (${selectedDialect.toUpperCase()}) herunterladen`}</span>
                    </button>
                  </div>

                  {/* Option B: Direct SQLite Write */}
                  <div className="bg-[#080D17]/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <h5 className="text-xs font-bold text-white">Lokale SQLite-Datenbank (.db)</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Erstellt eine einsatzbereite native SQLite-Datenbankdatei im <code className="text-emerald-300 font-mono">Projects/</code> Ordner und schreibt alle Tabellen und Datensätze direkt auf die Festplatte.
                      </p>
                    </div>

                    <button
                      onClick={handleSyncToLocalSqlite}
                      disabled={isSyncing}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 glow-emerald"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isSyncing ? 'Schreibe in SQLite...' : 'In lokale SQLite-Datenbank (.db) schreiben'}</span>
                    </button>
                  </div>
                </div>

                {/* Status- & Fortschrittsanzeige */}
                {syncStatus && (
                  <div className="bg-[#080D17] border border-emerald-500/30 p-4 rounded-xl text-xs space-y-2 animate-fade-in shadow-inner">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{syncStatus}</span>
                    </div>
                    {syncResult && (
                      <div className="text-[11px] font-mono text-slate-400 pl-6 space-y-1">
                        <p>📁 Speicherort: <span className="text-slate-200">{syncResult.targetDbPath}</span></p>
                        <p>📊 Gesamt: <span className="text-emerald-400 font-bold">{syncResult.totalRows} Datensätze</span> in {syncResult.totalTables} Tabellen geschrieben.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
