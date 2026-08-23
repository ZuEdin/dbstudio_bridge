import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Table, Field } from '../../types/index';
import { getApiUrl } from '../../stores/useConfigStore';

// Modular Subcomponents
import { LiveDatabaseSyncStep1Connect } from './live-db-sync/LiveDatabaseSyncStep1Connect';
import { LiveDatabaseSyncStep2Scan } from './live-db-sync/LiveDatabaseSyncStep2Scan';
import { LiveDatabaseSyncStep3Diff, MockDiff } from './live-db-sync/LiveDatabaseSyncStep3Diff';
import { LiveDatabaseSyncStep4Completed } from './live-db-sync/LiveDatabaseSyncStep4Completed';
import { LiveDatabaseSyncLogPanel } from './live-db-sync/LiveDatabaseSyncLogPanel';

interface LiveDatabaseSyncViewProps {
  showMessage: (text: string, description: string, type: 'success' | 'error' | 'info') => void;
  onSaveTable: (table: Table) => void;
}

export const LiveDatabaseSyncView: React.FC<LiveDatabaseSyncViewProps> = ({ showMessage, onSaveTable }) => {
  const projectTables = useProjectStore(state => state.tables);
  const addTable = useProjectStore(state => state.addTable);
  const backendConfig = useProjectStore(state => state.backendConfig);
  const setBackendConfig = useProjectStore(state => state.setBackendConfig);

  // Connection config states
  const [dbType, setDbType] = useState<'postgresql' | 'mysql' | 'mssql' | 'sqlite'>('postgresql');
  const [syncDirection, setSyncDirection] = useState<'bidirectional' | 'download' | 'upload'>('bidirectional');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('production_db');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••••••');
  const [ssl, setSsl] = useState(false);
  
  // App state
  const [syncStep, setSyncStep] = useState<'connect' | 'scanning' | 'diff' | 'completed'>('connect');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedDiffs, setSelectedDiffs] = useState<string[]>([]);
  
  // Mock Introspected differences
  const [mockDiffs, setMockDiffs] = useState<MockDiff[]>([]);

  // Parse stored connection string and prepopulate form on mount
  useEffect(() => {
    const connStr = backendConfig?.dbConnection;
    if (connStr) {
      if (connStr.startsWith('postgresql://') || connStr.startsWith('postgres://')) {
        setDbType('postgresql');
        try {
          const url = new URL(connStr);
          setHost(url.hostname);
          setPort(url.port || '5432');
          setDatabase(url.pathname.replace(/^\//, ''));
          setUsername(decodeURIComponent(url.username) || 'postgres');
          setPassword(decodeURIComponent(url.password) || '');
          setSsl(url.searchParams.get('ssl') === 'true' || url.searchParams.get('sslmode') === 'require');
        } catch (e) {}
      } else if (connStr.startsWith('mysql://')) {
        setDbType('mysql');
        try {
          const url = new URL(connStr);
          setHost(url.hostname);
          setPort(url.port || '3306');
          setDatabase(url.pathname.replace(/^\//, ''));
          setUsername(decodeURIComponent(url.username) || 'root');
          setPassword(decodeURIComponent(url.password) || '');
        } catch (e) {}
      } else if (connStr.startsWith('sqlserver://') || connStr.startsWith('mssql://')) {
        setDbType('mssql');
        try {
          const url = new URL(connStr);
          setHost(url.hostname);
          setPort(url.port || '1433');
          setDatabase(url.pathname.replace(/^\//, ''));
          setUsername(decodeURIComponent(url.username) || 'sa');
          setPassword(decodeURIComponent(url.password) || '');
        } catch (e) {}
      } else {
        // ADO.NET Key-Value Connection String parsing
        const parts = connStr.split(';').reduce((acc, part) => {
          const index = part.indexOf('=');
          if (index !== -1) {
            const key = part.substring(0, index).trim().toLowerCase();
            const value = part.substring(index + 1).trim();
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string>);

        const serverVal = parts['server'] || parts['data source'] || parts['host'] || 'localhost';
        if (serverVal.includes(',')) {
          const [h, p] = serverVal.split(',');
          setHost(h.trim());
          setPort(p.trim());
        } else if (serverVal.includes(':')) {
          const [h, p] = serverVal.split(':');
          setHost(h.trim());
          setPort(p.trim());
        } else {
          setHost(serverVal);
        }

        setDatabase(parts['database'] || parts['initial catalog'] || 'production_db');
        setUsername(parts['user id'] || parts['uid'] || parts['user'] || 'sa');
        setPassword(parts['password'] || parts['pwd'] || '');
        if (parts['port']) setPort(parts['port']);
        setSsl(parts['ssl'] === 'true' || parts['encrypt'] === 'true');

        if (backendConfig?.dbType === 'PostgreSQL') setDbType('postgresql');
        else if (backendConfig?.dbType === 'MySQL') setDbType('mysql');
        else setDbType('mssql');
      }
    }
  }, [backendConfig]);

  useEffect(() => {
    // Port updates based on DB Type if no stored connection is present
    if (!backendConfig?.dbConnection) {
      if (dbType === 'postgresql') setPort('5432');
      else if (dbType === 'mysql') setPort('3306');
      else if (dbType === 'mssql') setPort('1433');
      else if (dbType === 'sqlite') setPort('file:data.db');
    }
  }, [dbType, backendConfig]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleConnect = async () => {
    setSyncStep('scanning');
    setLogs([]);
    addLog(`Stelle Live-Verbindung zu ${dbType.toUpperCase()}://${host}:${port}/${database} her...`);
    addLog(`⚙️ Modus: ${syncDirection === 'bidirectional' ? '🔄 2-Wege-Sync (Bidirektional)' : syncDirection === 'download' ? '📥 Download' : '📤 Upload'}`);
    
    // Step-by-step scanning logs
    await new Promise(r => setTimeout(r, 250));
    addLog(`🔐 SSL: ${ssl ? 'Aktiviert' : 'Deaktiviert (Standard für lokale SQL-Server)'}...`);
    
    await new Promise(r => setTimeout(r, 250));
    addLog(`🔍 Lese Systemtabellen ('information_schema.tables' & 'information_schema.columns') aus...`);

    let introspectedTablesFromApi: Table[] = [];
    let introspectedProjectFromApi: any = null;

    // Build connection string to save in backendConfig
    let generatedConnString = '';
    if (dbType === 'postgresql') {
      generatedConnString = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}${ssl ? '?ssl=true' : ''}`;
    } else if (dbType === 'mysql') {
      generatedConnString = `mysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    } else if (dbType === 'mssql') {
      generatedConnString = `Server=${host},${port};Database=${database};User Id=${username};Password=${password};Encrypt=${ssl ? 'true' : 'false'};TrustServerCertificate=true;`;
    } else {
      generatedConnString = `Data Source=${port || 'app.db'}`;
    }

    // Save connection configuration to project store backendConfig
    if (setBackendConfig && backendConfig) {
      setBackendConfig({
        ...backendConfig,
        dbType: dbType === 'postgresql' ? 'PostgreSQL' as any : dbType === 'mysql' ? 'MySQL' as any : 'SQL' as any,
        dbConnection: generatedConnString
      });
    }

    try {
      const res = await fetch(getApiUrl('/api/db/introspect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: dbType, host, port, database, username, password, ssl, connectionString: generatedConnString })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.project && data.project.data) {
          introspectedProjectFromApi = data.project;
          introspectedTablesFromApi = data.project.data.tables || [];
          addLog(`✅ Server-Introspection erfolgreich! ${introspectedTablesFromApi.length} Tabellen mit Live-Datensätzen empfangen.`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || 'Unbekannter Serverfehler';
        addLog(`❌ Server-Introspection fehlgeschlagen: ${errMsg}`);
        showMessage("Verbindungsfehler", errMsg, "error");
        setSyncStep('connect');
        return;
      }
    } catch (e: any) {
      addLog(`⚠️ Server-API Call nicht erreichbar: ${e.message || e}`);
      showMessage("Verbindungsfehler", `Verbindung zum Server-API fehlgeschlagen: ${e.message || e}`, "error");
      setSyncStep('connect');
      return;
    }
    
    await new Promise(r => setTimeout(r, 250));
    addLog(`📦 Gefunden: ${introspectedTablesFromApi.length} Tabellen im Live SQL-Server.`);
    addLog(`📊 Vergleiche Struktur mit lokaler IndexedDB (${projectTables.length} lokale Tabellen)...`);

    // Generate 2-Way Diffs (Download & Upload)
    const generatedDiffs: MockDiff[] = [];

    // 1. Download Diffs (Live SQL -> IndexedDB)
    if (syncDirection === 'bidirectional' || syncDirection === 'download') {
      introspectedTablesFromApi.forEach((tbl, idx) => {
        const existsLocally = projectTables.some(t => t.name.toLowerCase() === tbl.name.toLowerCase());
        if (!existsLocally) {
          generatedDiffs.push({
            id: `diff_down_${idx}_${tbl.name}`,
            type: 'new_table',
            direction: 'download',
            tableName: tbl.name,
            description: `Tabelle '${tbl.name}' existiert auf dem SQL-Server ➔ In lokale IndexedDB importieren.`,
            localDetail: 'Fehlt in IndexedDB',
            liveDetail: `Columns: ${tbl.fields.map(f => `${f.name} (${f.type})`).join(', ')} | Zeilen: ${tbl.data?.length || 0}`,
            sql: `-- Live SQL -> IndexedDB Import:\nCREATE TABLE "${tbl.name}" (\n  ${tbl.fields.map(f => `"${f.name}" ${f.type}${f.isPrimaryKey ? ' PRIMARY KEY' : ''}`).join(',\n  ')}\n);`,
            suggestedTable: tbl
          });
        }
      });
    }

    // 2. Upload Diffs (IndexedDB -> Live SQL)
    if (syncDirection === 'bidirectional' || syncDirection === 'upload') {
      projectTables.forEach((localTbl, idx) => {
        const existsOnServer = introspectedTablesFromApi.some(t => t.name.toLowerCase() === localTbl.name.toLowerCase());
        if (!existsOnServer) {
          // Generate DDL for SQL Server
          const colDefs = localTbl.fields.map(f => {
            let colType = f.type || 'VARCHAR(255)';
            if (colType === 'INTEGER' || colType === 'INT') colType = 'INT';
            else if (colType === 'VARCHAR') colType = `NVARCHAR(${f.length || 255})`;
            else if (colType === 'DATETIME') colType = 'DATETIME';
            else if (colType === 'DECIMAL') colType = 'DECIMAL(18,2)';
            else if (colType === 'BOOLEAN') colType = 'BIT';
            return `[${f.name}] ${colType}${f.isPrimaryKey ? ' PRIMARY KEY' : ''}${f.allowNull === false ? ' NOT NULL' : ''}`;
          }).join(',\n    ');

          let createTableSql = '';
          if (dbType === 'mssql') {
            createTableSql = `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${localTbl.name}')\nBEGIN\n  CREATE TABLE [dbo].[${localTbl.name}] (\n    ${colDefs}\n  );\nEND;`;
          } else if (dbType === 'mysql') {
            createTableSql = `CREATE TABLE IF NOT EXISTS \`${localTbl.name}\` (\n    ${colDefs}\n);`;
          } else {
            createTableSql = `CREATE TABLE IF NOT EXISTS "${localTbl.name}" (\n    ${colDefs}\n);`;
          }

          // Generate sample DML inserts if local table has rows
          let insertSql = '';
          if (localTbl.data && localTbl.data.length > 0) {
            const rowsSql = localTbl.data.slice(0, 10).map(row => {
              const keys = Object.keys(row);
              const vals = keys.map(k => {
                const val = row[k];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number') return val;
                return `'${String(val).replace(/'/g, "''")}'`;
              });
              return `INSERT INTO ${dbType === 'mssql' ? `[dbo].[${localTbl.name}]` : `"${localTbl.name}"`} ([${keys.join('], [')}]) VALUES (${vals.join(', ')});`;
            }).join('\n');
            insertSql = `\n\n-- Data Records Sync:\n${rowsSql}`;
          }

          generatedDiffs.push({
            id: `diff_up_${idx}_${localTbl.name}`,
            type: 'new_table',
            direction: 'upload',
            tableName: localTbl.name,
            description: `Lokale Tabelle '${localTbl.name}' aus IndexedDB ➔ Auf Live SQL-Server anlegen & synchronisieren.`,
            localDetail: `Columns: ${localTbl.fields.map(f => f.name).join(', ')} | Zeilen: ${localTbl.data?.length || 0}`,
            liveDetail: 'Fehlt im SQL Server',
            sql: createTableSql + insertSql,
            suggestedTable: localTbl
          });
        }
      });
    }

    setMockDiffs(generatedDiffs);
    setSelectedDiffs(generatedDiffs.map(d => d.id));
    
    await new Promise(r => setTimeout(r, 250));

    addLog(`✅ 2-Wege-Analyse abgeschlossen: ${generatedDiffs.length} Unterschiede identifiziert.`);
    if (generatedDiffs.length > 0) {
      const downCount = generatedDiffs.filter(d => d.direction === 'download').length;
      const upCount = generatedDiffs.filter(d => d.direction === 'upload').length;
      addLog(`📊 Detail: ${downCount} Downloads (Server ➔ IndexedDB), ${upCount} Uploads (IndexedDB ➔ Server).`);
    } else {
      addLog(`🎉 Perfekt! Deine IndexedDB und der Live SQL Server sind 100% synchron.`);
    }

    setSyncStep('diff');

    if (introspectedProjectFromApi) {
      (window as any).__lastIntrospectedProject = introspectedProjectFromApi;
    }
  };

  const handleApplySync = async () => {
    let downloadApplied = 0;
    let uploadApplied = 0;
    
    const selectedMockDiffs = mockDiffs.filter(d => selectedDiffs.includes(d.id));
    const downloadDiffs = selectedMockDiffs.filter(d => d.direction === 'download');
    const uploadDiffs = selectedMockDiffs.filter(d => d.direction === 'upload');

    // 1. Process Download Diffs (SQL Server -> IndexedDB)
    if (downloadDiffs.length > 0) {
      downloadDiffs.forEach(diff => {
        if (diff.suggestedTable) {
          if (!projectTables.some(t => t.name.toLowerCase() === diff.tableName.toLowerCase())) {
            addTable(diff.suggestedTable);
            downloadApplied++;
          }
        }
      });
      addLog(`📥 ${downloadApplied} Live-Tabellen wurden in die lokale IndexedDB importiert.`);
    }

    // 2. Process Upload Diffs (IndexedDB -> SQL Server)
    if (uploadDiffs.length > 0) {
      addLog(`📤 Sende ${uploadDiffs.length} DDL/DML Anweisungen an den Live SQL-Server (${host}:${port}/${database})...`);
      const combinedDdl = uploadDiffs.map(d => d.sql).join('\n\n');

      try {
        const res = await fetch(getApiUrl('/api/db/execute-ddl'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ddl: combinedDdl,
            type: dbType,
            host,
            port,
            database,
            username,
            password,
            ssl
          })
        });

        if (res.ok) {
          const resData = await res.json();
          uploadApplied = uploadDiffs.length;
          addLog(`✅ Server-Antwort: ${resData.message || 'DDL/DML Befehle erfolgreich auf dem SQL-Server ausgeführt!'}`);
        } else {
          const errData = await res.json().catch(() => ({}));
          addLog(`⚠️ Warnung beim Upload auf Server: ${errData.message || 'DDL/DML konnte nicht ausgeführt werden'}`);
        }
      } catch (err: any) {
        addLog(`❌ Server Upload Fehler: ${err.message || err}`);
      }
    }

    await useProjectStore.getState().saveProject();

    showMessage(
      "2-Wege-Sync Abgeschlossen",
      `Erfolgreich synchronisiert! ${downloadApplied} Tabellen aus SQL importiert, ${uploadApplied} Tabellen auf Live SQL erstellt.`,
      "success"
    );

    setSyncStep('completed');
  };

  const toggleDiffSelection = (id: string) => {
    setSelectedDiffs(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col gap-6 max-w-5xl mx-auto w-full transition-colors duration-200">
      
      {/* Title & Banner */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Live Datenbank-Synchronisation (Introspection)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Spiele Live-Schemata direkt in dein Design ein oder generiere Migrationsskripte durch automatisierten Abgleich.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/30 flex items-center gap-1.5">
            <ShieldAlert size={12} />
            <span>Developer Sandbox</span>
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: 'connect', label: '1. Verbindung einrichten' },
          { key: 'scanning', label: '2. Introspection Scan' },
          { key: 'diff', label: '3. Schema Abgleich' },
          { key: 'completed', label: '4. Synchronisiert' }
        ].map((step, idx) => {
          const isActive = syncStep === step.key;
          const isDone = 
            (syncStep === 'scanning' && idx === 0) ||
            (syncStep === 'diff' && idx < 2) ||
            (syncStep === 'completed');

          return (
            <div 
              key={step.key}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : isDone 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide">Schritt {idx + 1}</div>
              <div className="text-xs font-semibold truncate mt-0.5">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left / Config column */}
        <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">
          
          {syncStep === 'connect' && (
            <LiveDatabaseSyncStep1Connect
              dbType={dbType}
              setDbType={setDbType}
              syncDirection={syncDirection}
              setSyncDirection={setSyncDirection}
              host={host}
              setHost={setHost}
              port={port}
              setPort={setPort}
              database={database}
              setDatabase={setDatabase}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              ssl={ssl}
              setSsl={setSsl}
              handleConnect={handleConnect}
            />
          )}

          {syncStep === 'scanning' && (
            <LiveDatabaseSyncStep2Scan />
          )}

          {syncStep === 'diff' && (
            <LiveDatabaseSyncStep3Diff
              mockDiffs={mockDiffs}
              selectedDiffs={selectedDiffs}
              toggleDiffSelection={toggleDiffSelection}
              setSyncStep={setSyncStep}
              handleApplySync={handleApplySync}
            />
          )}

          {syncStep === 'completed' && (
            <LiveDatabaseSyncStep4Completed
              setSyncStep={setSyncStep}
            />
          )}

        </div>

        {/* Right column: live terminal log & API preparation */}
        <div className="flex flex-col gap-4">
          <LiveDatabaseSyncLogPanel logs={logs} />
        </div>

      </div>

    </div>
  );
};
