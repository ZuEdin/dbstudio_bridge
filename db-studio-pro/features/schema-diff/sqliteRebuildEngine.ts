import { Table, DbType, Field } from '../../types/index';
import { resolveType, quoteIdentifier } from '../../utils/generators/common';
import { SchemaDiffChange, PreFlightReport, GeneratedMigrations, RiskLevel } from './schemaDiffTypes';

export const mapTypeToSql = (field: Field, dbType: DbType): string => {
  let type = resolveType(field, 'sql');
  if (dbType === DbType.SQLite && type.toUpperCase().includes('INT') && field.isAutoIncrement) return 'INTEGER';
  if (dbType === DbType.PostgreSQL) {
    if (field.type === 'VARCHAR' && !field.length) return 'VARCHAR(255)';
    if (field.type === 'TEXT') return 'TEXT';
  }
  return type;
};

export const buildTableFieldsDef = (table: Table, dbType: DbType): string => {
  return table.fields.map(f => {
    let def = `${quoteIdentifier(f.name, dbType)} ${mapTypeToSql(f, dbType)}`;
    if (!f.allowNull && !f.isPrimaryKey) def += ' NOT NULL';
    if (f.defaultValue) def += ` DEFAULT '${f.defaultValue}'`;
    if (f.isPrimaryKey) {
      def += ' PRIMARY KEY';
      if (f.isAutoIncrement) {
        if (dbType === DbType.MySQL) def += ' AUTO_INCREMENT';
        else if (dbType === DbType.SQL) def += ' IDENTITY(1,1)';
      }
    }
    return def;
  }).join(', ');
};

/**
 * Generates an automated 3-step table rebuild script for SQLite
 * when column drops, complex type changes, or constraint alterations occur.
 */
export const generateSqliteTableRebuild = (
  table: Table,
  prevTable: Table,
  changes: SchemaDiffChange[]
): { up: string; down: string } => {
  const tblName = quoteIdentifier(table.name, DbType.SQLite);
  const tempName = quoteIdentifier(`_temp_${table.name}`, DbType.SQLite);
  
  // Matching columns existing in both versions for data preservation
  const sharedFields = table.fields.filter(cf => 
    prevTable.fields.some(pf => pf.name.toLowerCase() === cf.name.toLowerCase())
  );
  const sharedColumnsList = sharedFields.map(f => quoteIdentifier(f.name, DbType.SQLite)).join(', ');

  const currentDef = buildTableFieldsDef(table, DbType.SQLite);
  const prevDef = buildTableFieldsDef(prevTable, DbType.SQLite);

  const up = `-- SQLite 3-Step Table Rebuild for ${table.name} (Handles Non-ALTER modifications)
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- 1. Create temporary new table schema
CREATE TABLE ${tempName} (${currentDef});

-- 2. Copy preserved data
${sharedFields.length > 0 ? `INSERT INTO ${tempName} (${sharedColumnsList}) SELECT ${sharedColumnsList} FROM ${tblName};` : '-- Keine gemeinsamen Spalten zum Kopieren'}

-- 3. Drop original & rename temp table
DROP TABLE ${tblName};
ALTER TABLE ${tempName} RENAME TO ${tblName};

COMMIT;
PRAGMA foreign_keys=ON;
\n`;

  const down = `-- SQLite Rollback Rebuild for ${table.name}
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE ${tempName} (${prevDef});
${sharedFields.length > 0 ? `INSERT INTO ${tempName} (${sharedColumnsList}) SELECT ${sharedColumnsList} FROM ${tblName};` : ''}
DROP TABLE ${tblName};
ALTER TABLE ${tempName} RENAME TO ${tblName};

COMMIT;
PRAGMA foreign_keys=ON;
\n`;

  return { up, down };
};
