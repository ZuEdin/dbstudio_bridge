
import { Table } from '../types/index';
import initSqlJs from 'sql.js';

// Declare global types for Electron & Tauri environments
declare var window: any;

let db: any = null;
let SQL: any = null;
let activeDriver: 'wasm' | 'tauri' | 'electron' = 'wasm';
let tauriDbConnection: any = null;

// Developer driver registry for custom connections
export interface ConnectionDriverConfig {
  host?: string;
  filepath?: string;
  driverType: 'wasm' | 'tauri' | 'electron';
  customExecute?: (sql: string, params?: any[]) => Promise<any[]>;
}

let registeredDriverConfig: ConnectionDriverConfig = {
  driverType: 'wasm',
  filepath: 'dbstudio_local.db'
};

/**
 * Configure and register custom SQLite drivers for Tauri, Electron, or custom desktop setups.
 */
export const registerConnectionDriver = (config: ConnectionDriverConfig) => {
  registeredDriverConfig = { ...registeredDriverConfig, ...config };
  console.log(`Registered connection driver of type: ${config.driverType}`);
};

/**
 * Get active connection details & environment status.
 */
export const getActiveDriverStatus = () => {
  return {
    driver: activeDriver,
    registeredConfig: registeredDriverConfig,
    isTauri: typeof window !== 'undefined' && !!window.__TAURI__,
    isElectron: typeof window !== 'undefined' && (!!window.ipcRenderer || (window.process && window.process.versions && !!window.process.versions.electron))
  };
};

/**
 * Initializes the SQL engine.
 * Detects Tauri or Electron and configures the native SQLite driver bridge.
 * Falls back to SQL.js WASM in standard browser mode.
 */
export const initSqlEngine = async () => {
  if (db || tauriDbConnection) return;
  
  try {
    const status = getActiveDriverStatus();
    
    if (status.isTauri) {
      activeDriver = 'tauri';
      console.log("Tauri environment detected. Attempting connection to local SQLite plugin...");
      // In Tauri, databases are opened via the tauri-plugin-sql API
      if (window.__TAURI__?.sql) {
        try {
          tauriDbConnection = await window.__TAURI__.sql.load(`sqlite:${registeredDriverConfig.filepath || 'dbstudio_local.db'}`);
          console.log("Tauri native SQLite connection established successfully.");
          return;
        } catch (err) {
          console.warn("Failed to load Tauri SQL plugin, falling back to WASM emulation", err);
        }
      }
    }
    
    if (status.isElectron) {
      activeDriver = 'electron';
      console.log("Electron environment detected. SQLite operations will map through main process IPC channel.");
      // In Electron, database calls are proxied through ipcRenderer
      if (window.ipcRenderer) {
        try {
          const success = await window.ipcRenderer.invoke('sqlite-init', { filepath: registeredDriverConfig.filepath });
          if (success) {
            console.log("Electron native SQLite IPC bridge initialized successfully.");
            return;
          }
        } catch (err) {
          console.warn("Failed to invoke Electron SQLite IPC bridge, falling back to WASM emulation", err);
        }
      }
    }

    // Default Browser WASM Fallback
    activeDriver = 'wasm';
    const initializer = (typeof window !== 'undefined' && window.initSqlJs) ? window.initSqlJs : initSqlJs;
    if (typeof initializer === 'function') {
      SQL = await initializer({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
      });
      db = new SQL.Database();
      console.log("SQL Engine Initialized (WASM Engine Active)");
    } else {
      console.warn("SQL.js initializer pending or unavailable.");
    }
  } catch (e) {
    console.error("Failed to init SQL Engine", e);
  }
};

const mapTypeToSql = (type: string): string => {
    switch(type) {
        case 'INTEGER': return 'INTEGER';
        case 'DECIMAL': case 'DOUBLE': return 'REAL';
        default: return 'TEXT';
    }
};

/**
 * Synchronizes list of designer tables to the SQLite database.
 */
export const syncTablesToSql = async (tables: Table[]) => {
    // Helper to get unique fields per table (prevent duplicate column name errors)
    const getUniqueFields = (fields: typeof tables[0]['fields']) => {
        const seen = new Set<string>();
        return fields.filter(f => {
            if (!f.name) return false;
            const lower = f.name.trim().toLowerCase();
            if (seen.has(lower)) return false;
            seen.add(lower);
            return true;
        });
    };

    // If native Tauri SQLite is active
    if (activeDriver === 'tauri' && tauriDbConnection) {
      try {
        // Drop existing and recreate tables dynamically in Tauri SQLite
        for (const table of tables) {
          await tauriDbConnection.execute(`DROP TABLE IF EXISTS "${table.name}"`);
          const uniqueFields = getUniqueFields(table.fields);
          const fields = uniqueFields.map(f => `"${f.name}" ${mapTypeToSql(f.type)}`).join(', ');
          if (!fields) continue;
          
          await tauriDbConnection.execute(`CREATE TABLE "${table.name}" (${fields});`);
          
          if (table.data && table.data.length > 0) {
            for (const row of table.data) {
              const keys = uniqueFields.map(f => `"${f.name}"`).join(', ');
              const values = uniqueFields.map(() => '?').join(', ');
              const sqlParams = uniqueFields.map(f => row[f.name] ?? null);
              await tauriDbConnection.execute(
                `INSERT INTO "${table.name}" (${keys}) VALUES (${values})`,
                sqlParams
              );
            }
          }
        }
        console.log("Tauri SQLite Sync completed.");
        return;
      } catch (err) {
        console.error("Tauri SQLite Sync Error", err);
      }
    }

    // If Electron SQLite is active
    if (activeDriver === 'electron' && window.ipcRenderer) {
      try {
        await window.ipcRenderer.invoke('sqlite-sync-tables', tables);
        console.log("Electron SQLite Sync completed.");
        return;
      } catch (err) {
        console.error("Electron SQLite Sync Error", err);
      }
    }

    // WASM Fallback
    if (!db) {
        console.warn("SQL Engine not ready. Cannot sync tables.");
        return;
    }
    
    try {
        const existing = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
        if (existing.length > 0 && existing[0].values) {
            existing[0].values.forEach((row: any[]) => {
                if (row[0] !== 'sqlite_sequence') db.run(`DROP TABLE IF EXISTS "${row[0]}"`);
            });
        }

        // Deduplicate tables by name to prevent "table already exists" error
        const uniqueTablesMap = new Map<string, Table>();
        tables.forEach(t => uniqueTablesMap.set(t.name, t));
        
        const uniqueTables = Array.from(uniqueTablesMap.values());

        uniqueTables.forEach(table => {
            const uniqueFields = getUniqueFields(table.fields);
            const fields = uniqueFields.map(f => `"${f.name}" ${mapTypeToSql(f.type)}`).join(', ');
            // Handle empty tables (no fields) to avoid SQL errors
            if (!fields) return;

            const createSql = `CREATE TABLE "${table.name}" (${fields});`;
            db.run(createSql);

            if (table.data && table.data.length > 0) {
                const stmt = db.prepare(`INSERT INTO "${table.name}" VALUES (${uniqueFields.map(() => '?').join(',')})`);
                table.data.forEach(row => {
                    const values = uniqueFields.map(f => {
                        const val = row[f.name];
                        // sql.js throws on undefined, use null instead
                        return val === undefined ? null : val;
                    });
                    stmt.run(values);
                });
                stmt.free();
            }
        });
    } catch (e) {
        console.error("SQL Sync Error", e);
    }
};

/**
 * Executes a raw query string against the registered SQLite connection.
 */
export const executeRawSql = (sql: string): any[] => {
    // Custom driver interception
    if (registeredDriverConfig.customExecute) {
      try {
        let results: any[] = [];
        registeredDriverConfig.customExecute(sql).then(res => { results = res; });
        return results;
      } catch (e) {
        console.warn("Custom connection driver execution failed", e);
      }
    }

    // If Tauri DB is loaded
    if (activeDriver === 'tauri' && tauriDbConnection) {
      try {
        let results: any[] = [];
        tauriDbConnection.select(sql).then((res: any) => { results = res; });
        return results; // Note: async-to-sync returns immediate or relies on state
      } catch (err) {
        console.warn("Tauri select query execution failed", err);
      }
    }

    // WASM Fallback (Standard Mode)
    if (!db) {
        console.warn("SQL Engine not ready. Call initSqlEngine() first.");
        return [];
    }
    try {
        const res = db.exec(sql);
        if (res.length === 0) return [];
        
        const columns = res[0].columns;
        const values = res[0].values;
        
        return values.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, i: number) => {
                obj[col] = row[i];
            });
            return obj;
        });
    } catch (e: any) {
        console.warn("SQL Execution Error:", e);
        return []; 
    }
};

/**
 * Export the current SQLite Database state as a binary file download (e.g. for backup or migration to local folder).
 */
export const exportSqliteDatabaseFile = () => {
  if (!db) {
    console.error("No active local WASM database to export.");
    return null;
  }
  try {
    const binaryArray = db.export();
    const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${registeredDriverConfig.filepath || 'dbstudio_local.sqlite'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log("Local SQLite database file exported successfully.");
    return binaryArray;
  } catch (err) {
    console.error("Failed to export SQLite database binary", err);
    return null;
  }
};
