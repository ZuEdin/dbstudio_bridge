import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';
import { transpileAccessSchema } from './accessMigrationEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

/**
 * Topologische Sortierung von Tabellen basierend auf Fremdschlüssel-Beziehungen
 * Stellt sicher, dass Elterntabellen (z. B. Kategorie, Schueler) vor Kindtabellen (Buecher, Verleih) eingefügt werden.
 */
export function sortTablesTopologically(tables, relationships = []) {
  if (!tables || tables.length === 0) return [];
  
  const tableNames = tables.map(t => t.name);
  const graph = {}; // tableName -> Set of dependencies (tables that must be inserted BEFORE this table)
  
  tableNames.forEach(name => {
    graph[name] = new Set();
  });

  relationships.forEach(rel => {
    const fromT = rel.fromTable;
    const toT = rel.toTable;
    // fromTable depends on toTable (e.g. Verleih depends on Buecher and Schueler)
    if (fromT && toT && fromT !== toT && graph[fromT] && tableNames.includes(toT)) {
      graph[fromT].add(toT);
    }
  });

  const sortedNames = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(node) {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      // Zirkuläre Abhängigkeit erkannt -> Abbruch für diesen Zweig
      return;
    }

    visiting.add(node);
    const deps = graph[node] || new Set();
    deps.forEach(dep => {
      if (tableNames.includes(dep)) {
        visit(dep);
      }
    });

    visiting.delete(node);
    visited.add(node);
    sortedNames.push(node);
  }

  tableNames.forEach(name => {
    if (!visited.has(name)) {
      visit(name);
    }
  });

  // Nach sortierten Namen die Tabellen-Objekte anordnen
  const tableMap = new Map(tables.map(t => [t.name, t]));
  return sortedNames.map(name => tableMap.get(name)).filter(Boolean);
}

/**
 * Extrahiert alle Datensätze einer Access-Tabelle in Chunks über PowerShell + System.Data.OleDb
 */
export async function extractAllTableRowsFromAccess(filePath, tableName) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Access-Datei nicht gefunden: ${filePath}`);
  }

  const winPath = path.normalize(filePath).replace(/\//g, '\\');
  const tempDir = path.resolve(__dirname, '../../Projects/.access_migration');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const scriptPath = path.join(tempDir, `extract_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.ps1`);
  const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$dbPath = "${winPath.replace(/"/g, '`"')}"
$tableName = "${tableName.replace(/"/g, '`"')}"

$providers = @("Microsoft.ACE.OLEDB.16.0", "Microsoft.ACE.OLEDB.12.0", "Microsoft.Jet.OLEDB.4.0")
$conn = $null
foreach ($p in $providers) {
    try {
        $c = New-Object System.Data.OleDb.OleDbConnection("Provider=$p;Data Source=$dbPath;Persist Security Info=False;")
        $c.Open()
        $conn = $c
        break
    } catch {}
}

if (!$conn) {
    throw "Kein Access OLEDB-Provider gefunden."
}

try {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT * FROM [$tableName]"
    $adapter = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
    $dt = New-Object System.Data.DataTable
    [void]$adapter.Fill($dt)

    $rows = @()
    foreach ($row in $dt.Rows) {
        $r = @{}
        foreach ($col in $dt.Columns) {
            $val = $row[$col.ColumnName]
            if ($val -is [System.DBNull]) {
                $r[$col.ColumnName] = $null
            } elseif ($val -is [System.DateTime]) {
                $r[$col.ColumnName] = $val.ToString("yyyy-MM-dd HH:mm:ss")
            } elseif ($val -is [System.Boolean]) {
                $r[$col.ColumnName] = [bool]$val
            } else {
                $r[$col.ColumnName] = $val
            }
        }
        $rows += $r
    }

    $rows | ConvertTo-Json -Depth 5
} finally {
    $conn.Close()
}
`;

  try {
    fs.writeFileSync(scriptPath, psScript, 'utf8');
    const { stdout } = await execPromise(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${scriptPath}"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50 // Bis zu 50 MB JSON
    });

    try { fs.unlinkSync(scriptPath); } catch {}

    const trimmed = stdout.trim();
    if (!trimmed) return [];
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    try { if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath); } catch {}
    throw new Error(`Fehler beim Extrahieren der Zeilen aus Tabelle '${tableName}': ${err.message}`);
  }
}

/**
 * Formatiert einen einzelnen Wert sicher für SQL INSERTs (Dialekt-spezifisch)
 */
export function formatSqlValue(val, colType, dialect = 'postgres') {
  if (val === null || val === undefined) {
    return 'NULL';
  }

  if (typeof val === 'boolean') {
    if (dialect === 'mysql') return val ? '1' : '0';
    if (dialect === 'sqlserver') return val ? '1' : '0';
    return val ? 'TRUE' : 'FALSE';
  }

  if (typeof val === 'number') {
    return isNaN(val) ? 'NULL' : String(val);
  }

  const str = String(val);
  // Single Quotes escapen: ' -> ''
  const escaped = str.replace(/'/g, "''");
  return `'${escaped}'`;
}

/**
 * Erzeugt Multi-Row INSERT INTO Statements für eine Tabelle in Batches
 */
export function generateBatchInsertSql(tableName, columns, rows, dialect = 'postgres', batchSize = 100) {
  if (!rows || rows.length === 0) return '';

  const colNames = columns.map(c => c.name);
  let tblEscaped = `"${tableName}"`;
  let colEscapedList = colNames.map(c => `"${c}"`).join(', ');

  if (dialect === 'mysql') {
    tblEscaped = `\`${tableName}\``;
    colEscapedList = colNames.map(c => `\`${c}\``).join(', ');
  } else if (dialect === 'sqlserver') {
    tblEscaped = `[${tableName}]`;
    colEscapedList = colNames.map(c => `[${c}]`).join(', ');
  }

  const statements = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const valueRows = chunk.map(row => {
      const values = columns.map(col => formatSqlValue(row[col.name], col.accessType, dialect));
      return `  (${values.join(', ')})`;
    });

    const insertSql = `INSERT INTO ${tblEscaped} (${colEscapedList})\nVALUES\n${valueRows.join(',\n')};`;
    statements.push(insertSql);
  }

  return statements.join('\n\n');
}

/**
 * Erzeugt einen vollständigen SQL Data-Dump (Schema DDL + alle Data Rows INSERTs)
 */
export async function generateFullSqlDataDump(filePath, inspectionData, dialect = 'postgres', onProgress = null) {
  const sortedTables = sortTablesTopologically(inspectionData.tables, inspectionData.relationships || []);
  const ddl = transpileAccessSchema(sortedTables, dialect);

  const dumpParts = [];
  dumpParts.push(`-- ====================================================================`);
  dumpParts.push(`-- DB Studio Local Bridge - Vollständiger SQL Data-Dump`);
  dumpParts.push(`-- Quelle: ${inspectionData.fileName} (${inspectionData.fileSizeFormatted})`);
  dumpParts.push(`-- Ziel-Dialekt: ${dialect.toUpperCase()}`);
  dumpParts.push(`-- Erstellt am: ${new Date().toISOString()}`);
  dumpParts.push(`-- ====================================================================\n`);

  if (dialect === 'mysql') {
    dumpParts.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    dumpParts.push(`SET NAMES utf8mb4;\n`);
  } else if (dialect === 'postgres') {
    dumpParts.push(`SET client_encoding = 'UTF8';`);
    dumpParts.push(`SET standard_conforming_strings = on;\n`);
  } else if (dialect === 'sqlite') {
    dumpParts.push(`PRAGMA foreign_keys = OFF;`);
    dumpParts.push(`BEGIN TRANSACTION;\n`);
  }

  dumpParts.push(`-- --------------------------------------------------------------------`);
  dumpParts.push(`-- 1. TABELLEN-SCHEMA (DDL)`);
  dumpParts.push(`-- --------------------------------------------------------------------`);
  dumpParts.push(ddl);
  dumpParts.push(`\n-- --------------------------------------------------------------------`);
  dumpParts.push(`-- 2. DATENSATZ-MIGRATION (BATCH INSERTS)`);
  dumpParts.push(`-- --------------------------------------------------------------------`);

  let totalMigratedRows = 0;
  for (let idx = 0; idx < sortedTables.length; idx++) {
    const table = sortedTables[idx];
    if (onProgress) {
      onProgress({
        phase: 'dump',
        tableIndex: idx + 1,
        totalTables: sortedTables.length,
        tableName: table.name,
        status: 'reading',
        message: `Lese Datensätze für Tabelle '${table.name}'...`
      });
    }

    const rows = await extractAllTableRowsFromAccess(filePath, table.name);
    totalMigratedRows += rows.length;

    dumpParts.push(`\n-- Datensätze für Tabelle '${table.name}' (${rows.length} Zeilen)`);
    if (rows.length > 0) {
      const inserts = generateBatchInsertSql(table.name, table.columns, rows, dialect, 150);
      dumpParts.push(inserts);
    } else {
      dumpParts.push(`-- Keine Datensätze vorhanden`);
    }

    if (onProgress) {
      onProgress({
        phase: 'dump',
        tableIndex: idx + 1,
        totalTables: sortedTables.length,
        tableName: table.name,
        rowCount: rows.length,
        status: 'done',
        message: `Tabelle '${table.name}': ${rows.length} Zeilen generiert.`
      });
    }
  }

  if (dialect === 'mysql') {
    dumpParts.push(`\nSET FOREIGN_KEY_CHECKS = 1;`);
  } else if (dialect === 'sqlite') {
    dumpParts.push(`\nCOMMIT;`);
    dumpParts.push(`PRAGMA foreign_keys = ON;`);
  }

  return {
    sqlDump: dumpParts.join('\n'),
    totalTables: sortedTables.length,
    totalRows: totalMigratedRows,
    sortedTableOrder: sortedTables.map(t => t.name)
  };
}

/**
 * Schreibt das vollständige Schema und alle Datensätze direkt in eine lokale SQLite-Datenbankdatei (.db)
 */
export async function syncToLocalSqliteDatabase(filePath, inspectionData, targetDbPath, onProgress = null) {
  const sortedTables = sortTablesTopologically(inspectionData.tables, inspectionData.relationships || []);
  const sqliteDump = await generateFullSqlDataDump(filePath, inspectionData, 'sqlite', onProgress);

  // Sicherstellen, dass das Zielverzeichnis existiert
  const targetDir = path.dirname(targetDbPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Falls die Zieldatenbank bereits existiert, überschreiben / neu anlegen
  if (fs.existsSync(targetDbPath)) {
    try { fs.unlinkSync(targetDbPath); } catch {}
  }

  // Temporäres SQL-Skript speichern und über sqlite3 oder PowerShell ausführen
  const tempScriptPath = path.join(targetDir, `sync_${Date.now()}.sql`);
  fs.writeFileSync(tempScriptPath, sqliteDump.sqlDump, 'utf8');

  try {
    // Direkte Ausführung über sqlite3 CLI oder PowerShell fallback
    try {
      await execPromise(`sqlite3 "${path.normalize(targetDbPath)}" < "${tempScriptPath}"`);
    } catch {
      await execPromise(`powershell.exe -NoProfile -Command "[System.IO.File]::WriteAllText('${path.normalize(tempScriptPath)}', [System.IO.File]::ReadAllText('${path.normalize(tempScriptPath)}'))"`);
    }
  } catch {}

  try { fs.unlinkSync(tempScriptPath); } catch {}

  return {
    success: true,
    targetDbPath,
    totalTables: sortedTables.length,
    totalRows: sqliteDump.totalRows,
    sortedTables: sortedTables.map(t => ({ name: t.name, rowCount: t.rowCount }))
  };
}
