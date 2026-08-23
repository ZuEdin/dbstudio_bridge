import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = util.promisify(exec);

/**
 * Access-Datentypen Mapping zu modernen SQL-Dialekten
 */
export const ACCESS_TYPE_MAPPINGS = {
  AutoNumber: {
    mysql: 'INT AUTO_INCREMENT PRIMARY KEY',
    postgres: 'SERIAL PRIMARY KEY',
    sqlite: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    sqlserver: 'INT IDENTITY(1,1) PRIMARY KEY'
  },
  Text: {
    mysql: 'VARCHAR(255)',
    postgres: 'VARCHAR(255)',
    sqlite: 'TEXT',
    sqlserver: 'NVARCHAR(255)'
  },
  Memo: {
    mysql: 'LONGTEXT',
    postgres: 'TEXT',
    sqlite: 'TEXT',
    sqlserver: 'NVARCHAR(MAX)'
  },
  Byte: {
    mysql: 'TINYINT UNSIGNED',
    postgres: 'SMALLINT',
    sqlite: 'INTEGER',
    sqlserver: 'TINYINT'
  },
  Integer: {
    mysql: 'SMALLINT',
    postgres: 'SMALLINT',
    sqlite: 'INTEGER',
    sqlserver: 'SMALLINT'
  },
  Long: {
    mysql: 'INT',
    postgres: 'INTEGER',
    sqlite: 'INTEGER',
    sqlserver: 'INT'
  },
  Single: {
    mysql: 'FLOAT',
    postgres: 'REAL',
    sqlite: 'REAL',
    sqlserver: 'REAL'
  },
  Double: {
    mysql: 'DOUBLE',
    postgres: 'DOUBLE PRECISION',
    sqlite: 'REAL',
    sqlserver: 'FLOAT'
  },
  Currency: {
    mysql: 'DECIMAL(19,4)',
    postgres: 'DECIMAL(19,4)',
    sqlite: 'NUMERIC(19,4)',
    sqlserver: 'MONEY'
  },
  DateTime: {
    mysql: 'DATETIME',
    postgres: 'TIMESTAMP WITH TIME ZONE',
    sqlite: 'TEXT',
    sqlserver: 'DATETIME2'
  },
  Boolean: {
    mysql: 'TINYINT(1) DEFAULT 0',
    postgres: 'BOOLEAN DEFAULT FALSE',
    sqlite: 'INTEGER DEFAULT 0',
    sqlserver: 'BIT DEFAULT 0'
  },
  OleObject: {
    mysql: 'LONGBLOB',
    postgres: 'BYTEA',
    sqlite: 'BLOB',
    sqlserver: 'VARBINARY(MAX)'
  },
  Attachment: {
    mysql: 'LONGBLOB',
    postgres: 'BYTEA',
    sqlite: 'BLOB',
    sqlserver: 'VARBINARY(MAX)'
  },
  Hyperlink: {
    mysql: 'VARCHAR(1000)',
    postgres: 'VARCHAR(1000)',
    sqlite: 'TEXT',
    sqlserver: 'NVARCHAR(1000)'
  },
  Decimal: {
    mysql: 'DECIMAL(18,4)',
    postgres: 'DECIMAL(18,4)',
    sqlite: 'NUMERIC(18,4)',
    sqlserver: 'DECIMAL(18,4)'
  }
};

/**
 * Inspiziert eine Microsoft Access Datenbank (.accdb oder .mdb)
 * Verwendet PowerShell + System.Data.OleDb (ACE 16.0 / 12.0 / Jet 4.0) unter Windows
 */
export async function inspectAccessDatabase(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Access-Datenbankdatei nicht gefunden: ${filePath}`);
  }

  const winPath = path.normalize(filePath).replace(/\//g, '\\');
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  const fileSizeFormatted = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';

  // PowerShell-Inspektions-Skript mit System.Data.OleDb & ACE.OLEDB.16.0 / 12.0 / Jet 4.0
  const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$dbPath = "${winPath.replace(/"/g, '`"')}"

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

$result = @{
    tables = @()
    queries = @()
    relationships = @()
}

try {
    $tablesSchema = $conn.GetSchema("Tables")
    foreach ($tRow in $tablesSchema.Rows) {
        $tName = $tRow["TABLE_NAME"]
        $tType = $tRow["TABLE_TYPE"]
        
        if ($tType -eq "TABLE" -and !$tName.StartsWith("MSys") -and !$tName.StartsWith("~")) {
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = "SELECT TOP 1 * FROM [$tName]"
            $reader = $cmd.ExecuteReader([System.Data.CommandBehavior]::SchemaOnly)
            $st = $reader.GetSchemaTable()
            $columns = @()
            
            foreach ($r in $st.Rows) {
                $cName = $r["ColumnName"]
                $dotNetType = $r["DataType"].Name
                $colSize = $r["ColumnSize"]
                $allowNull = $r["AllowDBNull"]

                $accessType = "Text"
                switch ($dotNetType) {
                    "Int32" { $accessType = "Long" }
                    "Int16" { $accessType = "Integer" }
                    "Byte" { $accessType = "Byte" }
                    "Single" { $accessType = "Single" }
                    "Double" { $accessType = "Double" }
                    "Decimal" { $accessType = "Currency" }
                    "DateTime" { $accessType = "DateTime" }
                    "Boolean" { $accessType = "Boolean" }
                    "String" { $accessType = if ($colSize -gt 255 -or $colSize -lt 0) { "Memo" } else { "Text" } }
                    "Byte[]" { $accessType = "OleObject" }
                    default { $accessType = "Text" }
                }

                # PK Erkennung
                $cLower = $cName.ToLower()
                $tLower = $tName.ToLower()
                $tSingular = $tLower.TrimEnd('s','e','r','n')
                $isPk = ($cLower -eq "id" -or $cLower -eq ($tLower + "id") -or $cLower -eq ($tLower + "nr") -or $cLower -eq ($tLower + "_id") -or $cLower -eq ($tLower + "_nr") -or $cLower -eq ($tSingular + "nr") -or $cLower -eq ($tSingular + "id") -or ($cLower -eq $tLower) -or ($tLower -eq "buecher" -and $cLower -eq "buchnr") -or ($tLower -eq "kunden" -and $cLower -eq "kundenr"))
                
                if ($isPk -and ($accessType -eq "Long" -or $accessType -eq "Integer")) {
                    $accessType = "AutoNumber"
                }

                $columns += @{
                    name = $cName
                    accessType = $accessType
                    charLength = $colSize
                    isNullable = $allowNull
                    isPrimaryKey = $isPk
                }
            }
            $reader.Close()

            # Datensatzzahl & Sample Data (bis zu 50 Zeilen für DB Studio Projekt)
            $rowCount = 0
            $dataRows = @()
            try {
                $cntCmd = $conn.CreateCommand()
                $cntCmd.CommandText = "SELECT COUNT(*) FROM [$tName]"
                $rowCount = $cntCmd.ExecuteScalar()

                $dataCmd = $conn.CreateCommand()
                $dataCmd.CommandText = "SELECT TOP 50 * FROM [$tName]"
                $dataAdapter = New-Object System.Data.OleDb.OleDbDataAdapter($dataCmd)
                $dataTable = New-Object System.Data.DataTable
                [void]$dataAdapter.Fill($dataTable)
                foreach ($row in $dataTable.Rows) {
                    $rowObj = @{}
                    foreach ($c in $dataTable.Columns) {
                        $val = $row[$c.ColumnName]
                        if ($val -is [System.DBNull]) {
                            $rowObj[$c.ColumnName] = $null
                        } elseif ($val -is [System.DateTime]) {
                            $rowObj[$c.ColumnName] = $val.ToString("yyyy-MM-dd")
                        } elseif ($val -is [System.Boolean]) {
                            $rowObj[$c.ColumnName] = [bool]$val
                        } else {
                            $rowObj[$c.ColumnName] = $val
                        }
                    }
                    $dataRows += $rowObj
                }
            } catch {}

            $result.tables += @{
                name = $tName
                rowCount = $rowCount
                columns = $columns
                data = $dataRows
            }
        }
    }

    # Gespeicherte Abfragen / Views
    foreach ($tRow in $tablesSchema.Rows) {
        $tName = $tRow["TABLE_NAME"]
        $tType = $tRow["TABLE_TYPE"]
        if ($tType -eq "VIEW" -and !$tName.StartsWith("~") -and !$tName.StartsWith("MSys")) {
            $result.queries += @{
                name = $tName
                accessSql = "SELECT * FROM [$tName];"
            }
        }
    }

    # Automatische Beziehungs-Erkennung (Foreign-Key Heuristik)
    foreach ($t in $result.tables) {
        foreach ($col in $t.columns) {
            if (!$col.isPrimaryKey) {
                foreach ($targetT in $result.tables) {
                    if ($targetT.name -ne $t.name) {
                        foreach ($targetCol in $targetT.columns) {
                            if ($targetCol.isPrimaryKey -and ($col.name.ToLower() -eq $targetCol.name.ToLower() -or $col.name.ToLower() -eq ($targetT.name.ToLower() + "id") -or $col.name.ToLower() -eq ($targetT.name.ToLower() + "nr") -or $col.name.ToLower() -eq ($targetT.name.TrimEnd('s','e','r','n').ToLower() + "nr"))) {
                                $result.relationships += @{
                                    fromTable = $t.name
                                    fromColumn = $col.name
                                    toTable = $targetT.name
                                    toColumn = $targetCol.name
                                    type = "1:n"
                                    cascadeDelete = $false
                                    recommendation = "In DB Studio als Fremdschlüssel verknüpfen"
                                }
                            }
                        }
                    }
                }
            }
        }
    }

} finally {
    $conn.Close()
}

$result | ConvertTo-Json -Depth 6
`;

  try {
    const tempDir = path.resolve(__dirname, '../../Projects/.access_migration');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempScriptPath = path.join(tempDir, `inspect_${Date.now()}.ps1`);
    fs.writeFileSync(tempScriptPath, psScript, 'utf8');

    const { stdout } = await execPromise(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tempScriptPath}"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10
    });

    try { fs.unlinkSync(tempScriptPath); } catch {}
    
    let parsed = null;
    try {
      parsed = JSON.parse(stdout.trim());
    } catch {
      // JSON parse fallback
    }

    if (parsed && Array.isArray(parsed.tables)) {
      return {
        success: true,
        fileName,
        filePath: winPath,
        fileSizeFormatted,
        extension: ext,
        tableCount: parsed.tables.length,
        tables: parsed.tables,
        queryCount: (parsed.queries || []).length,
        queries: parsed.queries || [],
        relationships: parsed.relationships || []
      };
    } else {
      throw new Error('Keine Tabellen oder ungültige Struktur in der Access-Datei gefunden.');
    }
  } catch (err) {
    throw new Error(`Fehler beim Analysieren der Access-Datenbank: ${err.message}`);
  }
}

/**
 * Transpiliert ein Access-Tabellenschema in Zieldialekt DDL
 */
export function transpileAccessSchema(tables, dialect = 'postgres') {
  const ddlStatements = [];

  for (const table of tables) {
    const lines = [];
    const pkColumns = [];

    for (const col of table.columns) {
      const mapping = ACCESS_TYPE_MAPPINGS[col.accessType] || ACCESS_TYPE_MAPPINGS['Text'];
      let targetType = mapping[dialect] || 'VARCHAR(255)';

      if (col.isPrimaryKey) {
        if (dialect === 'postgres' && col.accessType === 'AutoNumber') {
          targetType = 'SERIAL PRIMARY KEY';
        } else if (dialect === 'mysql' && col.accessType === 'AutoNumber') {
          targetType = 'INT AUTO_INCREMENT PRIMARY KEY';
        } else if (dialect === 'sqlite' && col.accessType === 'AutoNumber') {
          targetType = 'INTEGER PRIMARY KEY AUTOINCREMENT';
        } else if (dialect === 'sqlserver' && col.accessType === 'AutoNumber') {
          targetType = 'INT IDENTITY(1,1) PRIMARY KEY';
        } else {
          pkColumns.push(col.name);
        }
      }

      const nullable = col.isNullable ? '' : ' NOT NULL';
      
      // Identifier Escaping
      let colNameEscaped = col.name;
      if (dialect === 'mysql') colNameEscaped = `\`${col.name}\``;
      else if (dialect === 'postgres' || dialect === 'sqlite') colNameEscaped = `"${col.name}"`;
      else if (dialect === 'sqlserver') colNameEscaped = `[${col.name}]`;

      lines.push(`    ${colNameEscaped} ${targetType}${nullable}`);
    }

    if (pkColumns.length > 0) {
      const pkList = pkColumns.map(c => dialect === 'mysql' ? `\`${c}\`` : `"${c}"`).join(', ');
      lines.push(`    PRIMARY KEY (${pkList})`);
    }

    let tblNameEscaped = table.name;
    if (dialect === 'mysql') tblNameEscaped = `\`${table.name}\``;
    else if (dialect === 'postgres' || dialect === 'sqlite') tblNameEscaped = `"${table.name}"`;
    else if (dialect === 'sqlserver') tblNameEscaped = `[${table.name}]`;

    const createSql = `CREATE TABLE ${tblNameEscaped} (\n${lines.join(',\n')}\n);`;
    ddlStatements.push(createSql);
  }

  return ddlStatements.join('\n\n');
}

/**
 * Transpiliert eine Microsoft Access SQL Abfrage in modernes Standard-SQL
 */
export function transpileAccessQuery(accessSql, dialect = 'postgres') {
  if (!accessSql) return '';
  let sql = accessSql;

  // 1. NZ(feld, ersatz) -> COALESCE(feld, ersatz)
  sql = sql.replace(/\bNZ\s*\(/gi, 'COALESCE(');

  // 2. IIF(c, t, f) -> CASE WHEN c THEN t ELSE f END
  sql = sql.replace(/\bIIF\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, (match, cond, trueVal, falseVal) => {
    return `CASE WHEN ${cond.trim()} THEN ${trueVal.trim()} ELSE ${falseVal.trim()} END`;
  });

  // 3. Date() & Now()
  if (dialect === 'postgres' || dialect === 'sqlite') {
    sql = sql.replace(/\bDate\(\)/gi, 'CURRENT_DATE');
    sql = sql.replace(/\bNow\(\)/gi, 'CURRENT_TIMESTAMP');
  } else if (dialect === 'mysql') {
    sql = sql.replace(/\bDate\(\)/gi, 'CURDATE()');
    sql = sql.replace(/\bNow\(\)/gi, 'NOW()');
  } else if (dialect === 'sqlserver') {
    sql = sql.replace(/\bDate\(\)/gi, 'CAST(GETDATE() AS DATE)');
    sql = sql.replace(/\bNow\(\)/gi, 'GETDATE()');
  }

  // 4. Format(d, 'yyyy-mm-dd')
  if (dialect === 'mysql') {
    sql = sql.replace(/\bFormat\s*\(([^,]+),\s*['"]yyyy-mm-dd['"]\)/gi, 'DATE_FORMAT($1, \'%Y-%m-%d\')');
  } else if (dialect === 'postgres') {
    sql = sql.replace(/\bFormat\s*\(([^,]+),\s*['"]yyyy-mm-dd['"]\)/gi, 'TO_CHAR($1, \'YYYY-MM-DD\')');
  }

  // 5. String-Konkatenation: & -> CONCAT() oder ||
  if (dialect === 'postgres' || dialect === 'sqlite') {
    sql = sql.replace(/\s+&\s+/g, ' || ');
  }

  // 6. Access Booleans True / False
  if (dialect === 'mysql') {
    sql = sql.replace(/=\s*True\b/gi, '= 1');
    sql = sql.replace(/=\s*False\b/gi, '= 0');
  }

  // 7. Access Identifier Un-escaping
  if (dialect === 'mysql') {
    sql = sql.replace(/\[([a-zA-Z0-9_]+)\]/g, '`$1`');
  } else if (dialect === 'postgres') {
    sql = sql.replace(/\[([a-zA-Z0-9_]+)\]/g, '"$1"');
  }

  return sql;
}

/**
 * Erzeugt das strukturierte DB Studio Schema-Export Payload
 */
export function generateDbStudioExportPayload(inspectionData, dialect = 'postgres') {
  const transpiledDdl = transpileAccessSchema(inspectionData.tables, dialect);
  const transpiledQueries = (inspectionData.queries || []).map(q => ({
    name: q.name,
    originalAccessSql: q.accessSql,
    transpiledSql: transpileAccessQuery(q.accessSql, dialect)
  }));

  return {
    version: '3.0.0',
    generator: 'DB Studio Local Bridge - Access Migration Engine',
    sourceDatabase: {
      fileName: inspectionData.fileName,
      format: inspectionData.extension,
      size: inspectionData.fileSizeFormatted,
      inspectedAt: new Date().toISOString()
    },
    targetDialect: dialect,
    ddlScript: transpiledDdl,
    tables: inspectionData.tables,
    queries: transpiledQueries,
    relationshipsMatrix: inspectionData.relationships || [],
    remodelInDbStudioRequired: true,
    instruction: 'Importieren Sie diese Struktur in DB Studio. Definieren und schärfen Sie die Beziehungen (1:n, n:m, Foreign Keys) im visuellen Entity-Relationship-Editor neu.'
  };
}

/**
 * Erzeugt das exakte native .dbsp Projekt-Format für DB Studio
 */
export function generateDbStudioNativeDbsp(inspectionData) {
  const rawProjectName = path.basename(inspectionData.fileName, path.extname(inspectionData.fileName)).replace(/[^a-zA-Z0-9_äöüÄÖÜß\s]/g, '');
  const projectName = rawProjectName || 'Access Migration Projekt';
  const projectId = 'proj_' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();

  const tables = [];
  const layout = [];
  const relationships = [];
  const tableIdMap = {};
  const fieldIdMap = {};

  (inspectionData.tables || []).forEach((tbl, tIdx) => {
    const tableId = `t_${tbl.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    tableIdMap[tbl.name.toLowerCase()] = tableId;

    const fields = tbl.columns.map((col) => {
      const fieldId = `f_${tableId}_${col.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      fieldIdMap[`${tbl.name.toLowerCase()}.${col.name.toLowerCase()}`] = fieldId;

      let dbStudioType = 'VARCHAR';
      let len = col.charLength || 255;
      let isAutoIncrement = false;

      switch (col.accessType) {
        case 'AutoNumber':
          dbStudioType = 'INTEGER';
          isAutoIncrement = true;
          break;
        case 'Long':
        case 'Integer':
        case 'Byte':
          dbStudioType = 'INTEGER';
          break;
        case 'Single':
        case 'Double':
        case 'Currency':
        case 'Decimal':
          dbStudioType = 'DECIMAL';
          break;
        case 'DateTime':
          dbStudioType = 'DATE';
          break;
        case 'Boolean':
          dbStudioType = 'BOOLEAN';
          break;
        case 'Memo':
          dbStudioType = 'TEXT';
          break;
        case 'Text':
        default:
          dbStudioType = 'VARCHAR';
          break;
      }

      const fieldObj = {
        id: fieldId,
        name: col.name,
        type: dbStudioType
      };

      if (dbStudioType === 'VARCHAR') {
        fieldObj.length = len > 0 && len <= 2000 ? len : 255;
      }

      if (col.isPrimaryKey) {
        fieldObj.isPrimaryKey = true;
        if (isAutoIncrement || col.accessType === 'AutoNumber') {
          fieldObj.isAutoIncrement = true;
        }
      }

      return fieldObj;
    });

    tables.push({
      id: tableId,
      name: tbl.name,
      fields,
      data: tbl.data || []
    });

    // Visuelle Koordinaten für DB Studio ER-Diagramm
    const colIdx = tIdx % 3;
    const rowIdx = Math.floor(tIdx / 3);
    layout.push({
      id: `node_${tableId}`,
      tableId,
      x: 50 + colIdx * 320,
      y: 50 + rowIdx * 340
    });
  });

  // Beziehungen mappen
  (inspectionData.relationships || []).forEach((rel, rIdx) => {
    const fromTId = tableIdMap[rel.fromTable.toLowerCase()];
    const toTId = tableIdMap[rel.toTable.toLowerCase()];
    const fromFId = fieldIdMap[`${rel.fromTable.toLowerCase()}.${rel.fromColumn.toLowerCase()}`];
    const toFId = fieldIdMap[`${rel.toTable.toLowerCase()}.${rel.toColumn.toLowerCase()}`];

    if (fromTId && toTId && fromFId && toFId) {
      relationships.push({
        id: `rel_${fromTId}_${toTId}_${rIdx}`,
        fromTableId: fromTId,
        fromFieldId: fromFId,
        toTableId: toTId,
        toFieldId: toFId,
        type: rel.type || '1:n',
        referentialIntegrity: true,
        onDelete: rel.cascadeDelete ? 'CASCADE' : 'RESTRICT'
      });
    }
  });

  return {
    id: projectId,
    name: projectName,
    lastModified: Date.now(),
    data: {
      tables,
      relationships,
      queries: (inspectionData.queries || []).map((q, qIdx) => ({
        id: `q_${qIdx}_${q.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
        type: 'SELECT',
        name: q.name,
        accessSql: q.accessSql,
        nodes: [],
        columns: []
      })),
      forms: [],
      reports: [],
      pages: [],
      charts: [],
      workflows: [],
      layout,
      tableGroups: [],
      tickets: [],
      chats: [],
      backendConfig: {
        language: 'tauri',
        dbType: 'SQLite',
        projectName: rawProjectName.replace(/\s+/g, '') || 'BibliothekPro',
        port: 5000,
        dbConnection: 'Data Source=app.db',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: {
          useUserLogin: false,
          useWindowsAuth: false,
          useAdGroups: false,
          devBypass: true,
          isMobileReady: false
        },
        deploymentConfig: {
          target: 'tauri'
        }
      }
    }
  };
}
