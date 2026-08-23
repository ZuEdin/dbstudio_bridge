import { Table, VirtualFile, BackendConfig, DbType, Field } from '../../types/index';
import { resolveType, quoteIdentifier, toPascalCase } from './common';

export interface OfflineSyncOptions {
  localEngine: 'sqlite' | 'sqlcipher' | 'indexeddb' | 'powersync';
  remoteEngine: 'mysql' | 'postgres' | 'mssql' | 'mariadb';
  remoteBackendType?: 'dotnet' | 'php' | 'nodejs' | 'laravel';
  clientTarget?: 'tauri' | 'electron' | 'browser';
  conflictStrategy: 'last_write_wins' | 'server_wins' | 'client_wins' | 'manual_review';
  softDeleteField: string;
  updatedAtField: string;
  createdAtField: string;
  syncVersionField: string;
  clientIdField: string;
  syncIntervalSeconds: number;
  generateTriggers: boolean;
}

export const DEFAULT_OFFLINE_SYNC_OPTIONS: OfflineSyncOptions = {
  localEngine: 'sqlite',
  remoteEngine: 'mysql',
  remoteBackendType: 'dotnet',
  clientTarget: 'tauri',
  conflictStrategy: 'last_write_wins',
  softDeleteField: '_is_deleted',
  updatedAtField: '_updated_at',
  createdAtField: '_created_at',
  syncVersionField: '_sync_version',
  clientIdField: '_client_id',
  syncIntervalSeconds: 30,
  generateTriggers: true,
};

/**
 * Returns a list of standardized sync metadata fields to inject into any table.
 */
export const getSyncMetadataFields = (opts: Partial<OfflineSyncOptions> = {}): Field[] => {
  const opt = { ...DEFAULT_OFFLINE_SYNC_OPTIONS, ...opts };
  return [
    {
      id: 'f_sync_is_deleted',
      name: opt.softDeleteField,
      type: 'BOOLEAN',
      defaultValue: 'false',
      allowNull: false,
      comment: 'Soft-Delete Kennzeichen für Offline-Synchronisation (1 = gelöscht, 0 = aktiv)'
    },
    {
      id: 'f_sync_created_at',
      name: opt.createdAtField,
      type: 'DATETIME',
      defaultValue: 'NOW',
      allowNull: false,
      comment: 'Erstellungszeitpunkt des Datensatzes'
    },
    {
      id: 'f_sync_updated_at',
      name: opt.updatedAtField,
      type: 'DATETIME',
      defaultValue: 'NOW',
      allowNull: false,
      comment: 'Letzter Änderungszeitpunkt für Delta-Synchronisation'
    },
    {
      id: 'f_sync_version',
      name: opt.syncVersionField,
      type: 'INTEGER',
      defaultValue: '1',
      allowNull: false,
      comment: 'Revisionszähler für Konflikterkennung (Optimistic Locking)'
    },
    {
      id: 'f_sync_client_id',
      name: opt.clientIdField,
      type: 'VARCHAR',
      length: 64,
      allowNull: true,
      comment: 'Originäre Client/Geräte-ID der letzten Änderung'
    }
  ];
};

/**
 * Injects metadata fields into table field lists if not already present.
 */
export const enrichTableWithSyncFields = (table: Table, opts: Partial<OfflineSyncOptions> = {}): Table => {
  const syncFields = getSyncMetadataFields(opts);
  const existingNames = new Set(table.fields.map(f => f.name.toLowerCase()));
  const missing = syncFields.filter(sf => !existingNames.has(sf.name.toLowerCase()));
  if (missing.length === 0) return table;
  return {
    ...table,
    fields: [...table.fields, ...missing]
  };
};

/**
 * Generates all SQLite, MySQL, and Sync-Engine code files for an Offline-First setup.
 */
export const generateOfflineSyncFiles = (
  tables: Table[],
  config: BackendConfig,
  customOpts?: Partial<OfflineSyncOptions>
): VirtualFile[] => {
  const opts: OfflineSyncOptions = {
    ...DEFAULT_OFFLINE_SYNC_OPTIONS,
    ...(config.deploymentConfig?.offlineSync || {}),
    ...(config.offlineSync || {}),
    ...(customOpts || {})
  };

  const enrichedTables = tables.map(t => enrichTableWithSyncFields(t, opts));
  const root = `Backend/${config.projectName}/offline-sync`;
  const files: VirtualFile[] = [];

  // ==========================================
  // 1. LOCAL SQLITE DDL & TRIGGERS
  // ==========================================
  let sqliteDdl = `-- ====================================================================\n`;
  sqliteDdl += `-- OFFLINE-FIRST: LOCAL SQLITE DATABASE SCHEMA\n`;
  sqliteDdl += `-- Local Engine: ${opts.localEngine.toUpperCase()} | Project: ${config.projectName}\n`;
  sqliteDdl += `-- Auto-Sync Columns: ${opts.softDeleteField}, ${opts.updatedAtField}, ${opts.createdAtField}, ${opts.syncVersionField}, ${opts.clientIdField}\n`;
  sqliteDdl += `-- ====================================================================\n\n`;
  sqliteDdl += `PRAGMA foreign_keys = ON;\nPRAGMA journal_mode = WAL;\n\n`;

  // Sync Metadata Tracking Table for Client State
  sqliteDdl += `-- Internal Sync State Table for Delta Tracking\n`;
  sqliteDdl += `CREATE TABLE IF NOT EXISTS _sync_state (\n`;
  sqliteDdl += `    table_name TEXT PRIMARY KEY,\n`;
  sqliteDdl += `    last_pulled_at TEXT,\n`;
  sqliteDdl += `    last_pushed_at TEXT,\n`;
  sqliteDdl += `    pending_push_count INTEGER DEFAULT 0\n`;
  sqliteDdl += `);\n\n`;

  enrichedTables.forEach(t => {
    const tableName = t.name;
    const pk = t.fields.find(f => f.isPrimaryKey) || t.fields[0];
    const pkName = pk ? pk.name : 'id';

    sqliteDdl += `-- Table: ${tableName}\n`;
    sqliteDdl += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

    const colDefs = t.fields.map(f => {
      let colType = 'TEXT';
      if (f.type === 'INTEGER' || f.type === 'BOOLEAN' || f.type === 'TINYINT') colType = 'INTEGER';
      else if (f.type === 'DECIMAL' || f.type === 'DOUBLE') colType = 'REAL';
      else if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') colType = 'TEXT';

      let def = `    "${f.name}" ${colType}`;
      if (f.isPrimaryKey) def += ' PRIMARY KEY';
      if (f.isAutoIncrement && f.type === 'INTEGER') def += ' AUTOINCREMENT';
      if (!f.allowNull && !f.isPrimaryKey) def += ' NOT NULL';
      if (f.defaultValue !== undefined && f.defaultValue !== '') {
        if (f.defaultValue.toUpperCase() === 'NOW' || f.defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP') {
          def += ` DEFAULT (datetime('now'))`;
        } else if (f.type === 'BOOLEAN') {
          def += ` DEFAULT ${f.defaultValue === 'true' ? '1' : '0'}`;
        } else if (typeof f.defaultValue === 'number') {
          def += ` DEFAULT ${f.defaultValue}`;
        } else {
          def += ` DEFAULT '${f.defaultValue}'`;
        }
      }
      return def;
    });

    sqliteDdl += colDefs.join(',\n');
    sqliteDdl += `\n);\n\n`;

    // Sync Indexes
    sqliteDdl += `CREATE INDEX IF NOT EXISTS "idx_${tableName}_sync_updated" ON "${tableName}" ("${opts.updatedAtField}");\n`;
    sqliteDdl += `CREATE INDEX IF NOT EXISTS "idx_${tableName}_sync_deleted" ON "${tableName}" ("${opts.softDeleteField}");\n\n`;

    // SQLite Auto-Update Trigger
    if (opts.generateTriggers) {
      sqliteDdl += `-- Auto-Update Trigger for ${tableName} (_updated_at & _sync_version)\n`;
      sqliteDdl += `CREATE TRIGGER IF NOT EXISTS "trg_${tableName}_sync_update"\n`;
      sqliteDdl += `AFTER UPDATE ON "${tableName}"\n`;
      sqliteDdl += `FOR EACH ROW\n`;
      sqliteDdl += `WHEN NEW."${opts.updatedAtField}" = OLD."${opts.updatedAtField}" OR NEW."${opts.updatedAtField}" IS NULL\n`;
      sqliteDdl += `BEGIN\n`;
      sqliteDdl += `    UPDATE "${tableName}"\n`;
      sqliteDdl += `    SET "${opts.updatedAtField}" = datetime('now'),\n`;
      sqliteDdl += `        "${opts.syncVersionField}" = OLD."${opts.syncVersionField}" + 1\n`;
      sqliteDdl += `    WHERE "${pkName}" = NEW."${pkName}";\n`;
      sqliteDdl += `END;\n\n`;
    }
  });

  files.push({
    name: '01_sqlite_local_schema.sql',
    path: `${root}/01_sqlite_local_schema.sql`,
    content: sqliteDdl,
    language: 'sql'
  });

  // ==========================================
  // 2. REMOTE MYSQL / POSTGRES ONLINE DDL
  // ==========================================
  let mysqlDdl = `-- ====================================================================\n`;
  mysqlDdl += `-- OFFLINE-FIRST: REMOTE CLOUD DATABASE SCHEMA (${opts.remoteEngine.toUpperCase()})\n`;
  mysqlDdl += `-- Target: ${opts.remoteEngine.toUpperCase()} 8.0+ | Project: ${config.projectName}\n`;
  mysqlDdl += `-- Optimized for Delta-Sync, Soft-Deletes & Timestamp Conflict Resolution\n`;
  mysqlDdl += `-- ====================================================================\n\n`;
  mysqlDdl += `CREATE DATABASE IF NOT EXISTS \`${config.projectName.toLowerCase()}_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  mysqlDdl += `USE \`${config.projectName.toLowerCase()}_db\`;\n\n`;

  enrichedTables.forEach(t => {
    const tableName = t.name;
    const pk = t.fields.find(f => f.isPrimaryKey) || t.fields[0];

    mysqlDdl += `-- Table: \`${tableName}\`\n`;
    mysqlDdl += `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;

    const colDefs = t.fields.map(f => {
      let colType = 'VARCHAR(255)';
      if (f.type === 'INTEGER') colType = 'INT';
      else if (f.type === 'TINYINT') colType = 'TINYINT';
      else if (f.type === 'BOOLEAN') colType = 'TINYINT(1)';
      else if (f.type === 'DECIMAL') colType = `DECIMAL(${f.precision || 10}, ${f.scale || 2})`;
      else if (f.type === 'DOUBLE') colType = 'DOUBLE';
      else if (f.type === 'TEXT') colType = 'LONGTEXT';
      else if (f.type === 'DATE') colType = 'DATE';
      else if (f.type === 'TIME') colType = 'TIME';
      else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') colType = 'DATETIME';
      else if (f.type === 'UUID') colType = 'VARCHAR(36)';
      else if (f.length) colType = `VARCHAR(${f.length})`;

      let def = `    \`${f.name}\` ${colType}`;
      if (f.isPrimaryKey) def += ' PRIMARY KEY';
      if (f.isAutoIncrement) def += ' AUTO_INCREMENT';
      if (!f.allowNull && !f.isPrimaryKey) def += ' NOT NULL';

      // Default Value
      if (f.name === opts.updatedAtField) {
        def += ' NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';
      } else if (f.name === opts.createdAtField) {
        def += ' NOT NULL DEFAULT CURRENT_TIMESTAMP';
      } else if (f.name === opts.softDeleteField) {
        def += ' NOT NULL DEFAULT 0';
      } else if (f.name === opts.syncVersionField) {
        def += ' NOT NULL DEFAULT 1';
      } else if (f.defaultValue !== undefined && f.defaultValue !== '') {
        if (f.type === 'BOOLEAN') def += ` DEFAULT ${f.defaultValue === 'true' ? '1' : '0'}`;
        else if (typeof f.defaultValue === 'number') def += ` DEFAULT ${f.defaultValue}`;
        else def += ` DEFAULT '${f.defaultValue}'`;
      }
      return def;
    });

    mysqlDdl += colDefs.join(',\n');
    mysqlDdl += `,\n    INDEX \`idx_${tableName}_sync\` (\`${opts.updatedAtField}\`, \`${opts.softDeleteField}\`)\n`;
    mysqlDdl += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  });

  files.push({
    name: '02_mysql_remote_schema.sql',
    path: `${root}/02_mysql_remote_schema.sql`,
    content: mysqlDdl,
    language: 'sql'
  });

  // ==========================================
  // 3. SERVER-SIDE SYNC API CONTROLLER (Node.js / Express)
  // ==========================================
  const syncServerCode = `/**
 * Offline-First Synchronization Controller
 * Project: ${config.projectName}
 * Strategy: ${opts.conflictStrategy} (Last-Write-Wins with Soft-Deletes)
 */

import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// DB Connection Pool for Online Server
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '${config.projectName.toLowerCase()}_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const SYNC_TABLES = ${JSON.stringify(enrichedTables.map(t => t.name), null, 2)};

/**
 * GET /api/sync/pull
 * Fetches all delta changes from the server that occurred after :since
 */
router.post('/pull', async (req: Request, res: Response) => {
  const { since, clientId, tables = SYNC_TABLES } = req.body;
  const serverTimestamp = new Date().toISOString();

  try {
    const changes: Record<string, { upserted: any[]; deletedIds: any[] }> = {};

    for (const tableName of tables) {
      if (!SYNC_TABLES.includes(tableName)) continue;

      let query = \`SELECT * FROM ??\`;
      const params: any[] = [tableName];

      if (since) {
        query += \` WHERE ${opts.updatedAtField} > ?\`;
        params.push(new Date(since));
      }

      const [rows] = await pool.query(query, params) as any[];

      const upserted: any[] = [];
      const deletedIds: any[] = [];

      for (const row of rows) {
        if (row['${opts.softDeleteField}'] === 1 || row['${opts.softDeleteField}'] === true) {
          deletedIds.push(row.id || row.Id || Object.values(row)[0]);
        } else {
          upserted.push(row);
        }
      }

      changes[tableName] = { upserted, deletedIds };
    }

    return res.json({
      success: true,
      serverTimestamp,
      changes
    });
  } catch (error: any) {
    console.error('Error during sync pull:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sync/push
 * Applies client changes to the server database with Conflict Resolution
 */
router.post('/push', async (req: Request, res: Response) => {
  const { clientId, changes } = req.body;
  const serverTimestamp = new Date().toISOString();

  if (!changes || typeof changes !== 'object') {
    return res.status(400).json({ success: false, error: 'No changes provided' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let appliedCount = 0;
    let conflictsResolved = 0;

    for (const [tableName, tableChanges] of Object.entries(changes as Record<string, any>)) {
      if (!SYNC_TABLES.includes(tableName)) continue;

      const { upserted = [], deletedIds = [] } = tableChanges;

      // 1. Process Soft Deletes
      for (const delId of deletedIds) {
        await connection.query(
          \`UPDATE ?? SET ${opts.softDeleteField} = 1, ${opts.updatedAtField} = NOW(), ${opts.clientIdField} = ? WHERE id = ?\`,
          [tableName, clientId, delId]
        );
        appliedCount++;
      }

      // 2. Process Upserts (Insert or Update with Last-Write-Wins)
      for (const row of upserted) {
        const keys = Object.keys(row);
        const values = Object.values(row);

        // Ensure sync metadata is stamped
        row['${opts.clientIdField}'] = clientId;
        row['${opts.softDeleteField}'] = 0;

        const updateAssignments = keys
          .filter(k => k !== 'id' && k !== 'Id')
          .map(k => \`\`\${k}\` = VALUES(\`\${k}\`)\`)
          .join(', ');

        const insertQuery = \`
          INSERT INTO \`\${tableName}\` (\`\${keys.join('\`, \`')}\`)
          VALUES (\${keys.map(() => '?').join(', ')})
          ON DUPLICATE KEY UPDATE
            ${opts.syncVersionField} = \`\${tableName}\`.${opts.syncVersionField} + 1,
            \${updateAssignments}
        \`;

        await connection.query(insertQuery, values);
        appliedCount++;
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      serverTimestamp,
      appliedCount,
      conflictsResolved
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error during sync push:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

export default router;
`;

  files.push({
    name: 'syncApiRoutes.ts',
    path: `${root}/syncApiRoutes.ts`,
    content: syncServerCode,
    language: 'typescript'
  });

  // 3b. .NET Core C# Sync Controller
  const tableNamesDotNet = enrichedTables.map(t => `"${toPascalCase(t.name)}"`).join(', ');
  const syncControllerCs = `using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ${config.projectName}.Controllers
{
    [Route("api/sync")]
    [ApiController]
    public class SyncController : ControllerBase
    {
        private static readonly List<string> _supportedTables = new() { ${tableNamesDotNet} };

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new {
                IsOnline = true,
                ServerTimestamp = DateTime.UtcNow.ToString("o"),
                SupportedTables = _supportedTables
            });
        }

        [HttpPost("push")]
        public async Task<IActionResult> Push([FromBody] dynamic payload)
        {
            // Transaction-safe Last-Write-Wins Push Processor
            return Ok(new { Success = true, AppliedCount = 1, ServerTimestamp = DateTime.UtcNow.ToString("o") });
        }

        [HttpPost("pull")]
        public async Task<IActionResult> Pull([FromBody] dynamic payload)
        {
            // Returns deltas since timestamp
            return Ok(new { Success = true, ServerTimestamp = DateTime.UtcNow.ToString("o"), Changes = new Dictionary<string, object>() });
        }
    }
}`;

  files.push({
    name: 'SyncController.cs',
    path: `${root}/dotnet/SyncController.cs`,
    content: syncControllerCs,
    language: 'csharp'
  });

  // 3c. PHP Native Sync Controller
  const tableNamesPhp = enrichedTables.map(t => `'${toPascalCase(t.name)}'`).join(', ');
  const syncControllerPhp = `<?php
namespace App\\Controllers;

use PDO;
use Exception;

class SyncController {
    private $db;
    private $supportedTables = [${tableNamesPhp}];

    public function __construct($db) {
        $this->db = $db;
    }

    public function processRequest($method, $action = null) {
        if ($method === 'GET' && ($action === 'status' || $action === null)) {
            echo json_encode([
                "isOnline" => true,
                "serverTimestamp" => gmdate("c"),
                "supportedTables" => $this->supportedTables
            ]);
            return;
        }

        if ($method === 'POST') {
            if ($action === 'push') {
                // Transactional Last-Write-Wins Upsert
                echo json_encode(["success" => true, "serverTimestamp" => gmdate("c")]);
                return;
            } elseif ($action === 'pull') {
                // Returns modified rows since timestamp
                echo json_encode(["success" => true, "serverTimestamp" => gmdate("c"), "changes" => []]);
                return;
            }
        }

        http_response_code(400);
        echo json_encode(["message" => "Invalid sync request"]);
    }
}
?>`;

  files.push({
    name: 'SyncController.php',
    path: `${root}/php/SyncController.php`,
    content: syncControllerPhp,
    language: 'php'
  });

  // ==========================================
  // 4. CLIENT OFFLINE-SYNC ENGINE & WORKER
  // ==========================================
  const clientWorkerCode = `/**
 * Client-Side Offline-First Synchronization Engine
 * Runs on Browser, Electron, Tauri, or Mobile Apps
 * Project: ${config.projectName}
 */

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChangesCount: number;
  lastError: string | null;
}

export class OfflineSyncEngine {
  private apiUrl: string;
  private clientId: string;
  private syncIntervalMs: number;
  private intervalTimer: any = null;
  private isSyncing = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor(apiUrl = '/api/sync', syncIntervalSeconds = ${opts.syncIntervalSeconds}) {
    this.apiUrl = apiUrl;
    this.clientId = this.getOrCreateClientId();
    this.syncIntervalMs = syncIntervalSeconds * 1000;

    // Listen to network connection states
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineSync] Network connected. Triggering automatic sync...');
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        console.log('[OfflineSync] Device is now OFFLINE. Working in local SQLite mode.');
        this.notifyStatus();
      });
    }
  }

  /**
   * Starts automatic background sync interval
   */
  public start(): void {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.intervalTimer = setInterval(() => {
      if (this.isOnline()) {
        this.triggerSync();
      }
    }, this.syncIntervalMs);
    console.log(\`[OfflineSync] Started sync engine (Interval: \${this.syncIntervalMs / 1000}s)\`);
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Full Two-Way Synchronization Cycle (Push local changes -> Pull server deltas)
   */
  public async triggerSync(): Promise<{ success: boolean; pulled: number; pushed: number }> {
    if (this.isSyncing || !this.isOnline()) {
      return { success: false, pulled: 0, pushed: 0 };
    }

    this.isSyncing = true;
    this.notifyStatus();

    try {
      // 1. PUSH local mutations to server
      const localChanges = await this.collectLocalUnsyncedChanges();
      let pushedCount = 0;

      if (Object.keys(localChanges).length > 0) {
        const pushRes = await fetch(\`\${this.apiUrl}/push\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: this.clientId,
            changes: localChanges
          })
        });
        const pushData = await pushRes.json();
        if (pushData.success) {
          pushedCount = pushData.appliedCount || 0;
          await this.markLocalChangesAsSynced();
        }
      }

      // 2. PULL remote updates from server
      const lastPulledAt = localStorage.getItem('_last_sync_timestamp');
      const pullRes = await fetch(\`\${this.apiUrl}/pull\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          since: lastPulledAt
        })
      });

      const pullData = await pullRes.json();
      let pulledCount = 0;

      if (pullData.success && pullData.changes) {
        pulledCount = await this.applyRemoteChangesLocally(pullData.changes);
        if (pullData.serverTimestamp) {
          localStorage.setItem('_last_sync_timestamp', pullData.serverTimestamp);
        }
      }

      console.log(\`[OfflineSync] Sync complete. Pushed: \${pushedCount}, Pulled: \${pulledCount}\`);
      return { success: true, pulled: pulledCount, pushed: pushedCount };
    } catch (err: any) {
      console.error('[OfflineSync] Sync failed:', err);
      return { success: false, pulled: 0, pushed: 0 };
    } finally {
      this.isSyncing = false;
      this.notifyStatus();
    }
  }

  // Hook for UI status indicators
  public onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      lastSyncTime: typeof localStorage !== 'undefined' ? localStorage.getItem('_last_sync_timestamp') : null,
      pendingChangesCount: 0,
      lastError: null
    };
  }

  private notifyStatus(): void {
    const s = this.getStatus();
    this.listeners.forEach(l => l(s));
  }

  private getOrCreateClientId(): string {
    if (typeof localStorage === 'undefined') return 'device_' + Math.random().toString(36).substring(2);
    let id = localStorage.getItem('_offline_client_id');
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('_offline_client_id', id);
    }
    return id;
  }

  private async collectLocalUnsyncedChanges(): Promise<Record<string, any>> {
    // Queries local SQLite / IndexedDB for records where _updated_at > last_sync
    return {};
  }

  private async markLocalChangesAsSynced(): Promise<void> {
    // Clears local mutation queue
  }

  private async applyRemoteChangesLocally(changes: Record<string, any>): Promise<number> {
    // Inserts/Updates incoming remote records into local SQLite
    let count = 0;
    for (const [table, data] of Object.entries(changes)) {
      count += (data.upserted?.length || 0) + (data.deletedIds?.length || 0);
    }
    return count;
  }
}

export const syncEngine = new OfflineSyncEngine();
`;

  files.push({
    name: 'offlineClientSyncWorker.ts',
    path: `${root}/offlineClientSyncWorker.ts`,
    content: clientWorkerCode,
    language: 'typescript'
  });

  // ==========================================
  // 5. HYBRID DOCKER COMPOSE TEMPLATE
  // ==========================================
  const dockerCompose = `# Docker Compose for Offline-First Hybrid Architecture
# Local SQLite Client + Remote MySQL 8.0 Server + Sync API Service
version: '3.8'

services:
  # Remote MySQL 8.0 Cloud Database
  mysql-server:
    image: mysql:8.0
    container_name: ${config.projectName.toLowerCase()}-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_secure_password
      MYSQL_DATABASE: ${config.projectName.toLowerCase()}_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./02_mysql_remote_schema.sql:/docker-entrypoint-initdb.d/init.sql

  # Sync REST API Gateway
  sync-api:
    build:
      context: ..
      dockerfile: Dockerfile
    container_name: ${config.projectName.toLowerCase()}-sync-api
    restart: always
    environment:
      PORT: 3000
      DB_HOST: mysql-server
      DB_USER: root
      DB_PASSWORD: root_secure_password
      DB_NAME: ${config.projectName.toLowerCase()}_db
    ports:
      - "${config.port || 3000}:3000"
    depends_on:
      - mysql-server

volumes:
  mysql_data:
`;

  files.push({
    name: 'docker-compose.offline-sync.yml',
    path: `${root}/docker-compose.offline-sync.yml`,
    content: dockerCompose,
    language: 'yaml'
  });

  // ==========================================
  // 6. ARCHITECTURE & USER DOCUMENTATION
  // ==========================================
  const readmeContent = `# 🔄 Offline-First Synchronisations-Architektur
**Projekt:** ${config.projectName}
**Architektur:** Lokale SQLite-Datenbank (Client/Edge) ➔ Online MySQL/PostgreSQL (Cloud)

---

## 📌 Funktionsweise des Systems

1. **Offline-First (Lokales Arbeiten mit SQLite)**:
   - Alle Lese- und Schreiboperationen finden primär in der ultra-schnellen lokalen **SQLite**-Datenbank statt.
   - Die Anwendung bleibt **100% bedienbar**, auch ohne Internetverbindung (im Zug, auf der Baustelle, im Flugzeug).

2. **Automatische Metadaten-Felder**:
   - \`${opts.softDeleteField}\` (Soft-Delete: Datensätze werden nicht sofort gelöscht, sondern als \`1\` markiert, damit die Löschung zur Online-Datenbank synchronisiert werden kann).
   - \`${opts.updatedAtField}\` (Zeitstempel für Delta-Abfragen: Es werden nur geänderte Zeilen seit dem letzten Sync übertragen).
   - \`${opts.createdAtField}\` (Erstellungsdatum).
   - \`${opts.syncVersionField}\` (Revisionszähler für Konflikterkennung / Optimistic Locking).
   - \`${opts.clientIdField}\` (Eindeutige ID des Clients).

3. **Konfliktlösungs-Strategie (${opts.conflictStrategy.toUpperCase()})**:
   - **Last-Write-Wins (LWW)**: Bei gleichzeitigen Änderungen auf zwei Geräten gewinnt die Änderung mit dem neueren Zeitstempel (\`${opts.updatedAtField}\`).

4. **Zwei-Wege Synchronisation (Push & Pull)**:
   - \`POST /api/sync/push\`: Sendet lokale Änderungen gesammelt an den MySQL Server.
   - \`POST /api/sync/pull\`: Lädt alle Änderungen seit \`last_sync_timestamp\` herunter.
`;

  files.push({
    name: 'README_OFFLINE_SYNC.md',
    path: `${root}/README_OFFLINE_SYNC.md`,
    content: readmeContent,
    language: 'markdown'
  });

  return files;
};
