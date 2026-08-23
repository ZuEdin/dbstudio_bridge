import { Table, DbType, Field } from '../../types/index';
import { resolveType, quoteIdentifier } from '../../utils/generators/common';
import { SchemaDiffChange, PreFlightReport, GeneratedMigrations, RiskLevel } from './schemaDiffTypes';
import { generateSqliteTableRebuild, buildTableFieldsDef, mapTypeToSql } from './sqliteRebuildEngine';
import { generateOrmMigrationBundle } from './ormMigrationGenerators';

export const computeSchemaDiff = (currentTables: Table[], snapshotTables: Table[] = [], dbType: DbType): {
  changes: SchemaDiffChange[];
  preFlight: PreFlightReport;
  migrations: GeneratedMigrations;
} => {
  const changes: SchemaDiffChange[] = [];
  let upSql = '';
  let downSql = '';
  let changeIndex = 1;
  let sqliteRebuildApplied = false;

  // 1. New Tables
  currentTables.forEach(curr => {
    const prev = snapshotTables.find(t => t.id === curr.id || t.name.toLowerCase() === curr.name.toLowerCase());
    const tableName = quoteIdentifier(curr.name, dbType);

    if (!prev) {
      changes.push({
        id: `change_${changeIndex++}`,
        type: 'table_add',
        tableName: curr.name,
        description: `Tabelle "${curr.name}" wird neu angelegt (${curr.fields.length} Spalten).`,
        riskLevel: 'safe'
      });

      const fieldsDef = buildTableFieldsDef(curr, dbType);
      upSql += `-- Create Table ${curr.name}\nCREATE TABLE ${tableName} (${fieldsDef});\n\n`;
      downSql += `-- Drop Table ${curr.name}\nDROP TABLE IF EXISTS ${tableName};\n\n`;
    } else {
      // 2. Check Fields in Existing Table
      let tableNeedsRebuildForSqlite = false;
      const tableChanges: SchemaDiffChange[] = [];

      curr.fields.forEach(currField => {
        const prevField = prev.fields.find(f => f.id === currField.id || f.name.toLowerCase() === currField.name.toLowerCase());
        const fieldName = quoteIdentifier(currField.name, dbType);
        const fieldType = mapTypeToSql(currField, dbType);

        if (!prevField) {
          // Added Column
          const isNotNullableWithoutDefault = !currField.allowNull && !currField.defaultValue;
          const risk: RiskLevel = isNotNullableWithoutDefault ? 'warning' : 'safe';
          
          const change: SchemaDiffChange = {
            id: `change_${changeIndex++}`,
            type: 'column_add',
            tableName: curr.name,
            columnName: currField.name,
            newType: fieldType,
            newNullable: currField.allowNull,
            description: `Spalte "${currField.name}" (${fieldType}) zu Tabelle "${curr.name}" hinzugefügt.`,
            riskLevel: risk,
            riskReason: isNotNullableWithoutDefault ? 'Spalte ist NOT NULL ohne Default-Wert. Kann bei bestehenden Zeilen fehlschlagen.' : undefined
          };
          changes.push(change);
          tableChanges.push(change);

          let constraint = !currField.allowNull ? ' NOT NULL' : '';
          if (currField.defaultValue) constraint += ` DEFAULT '${currField.defaultValue}'`;
          upSql += `ALTER TABLE ${tableName} ADD COLUMN ${fieldName} ${fieldType}${constraint};\n`;
          downSql += `ALTER TABLE ${tableName} DROP COLUMN ${fieldName};\n`;
        } else {
          // Column Type or Nullability Change
          if (currField.type !== prevField.type || currField.length !== prevField.length || currField.allowNull !== prevField.allowNull) {
            const isNarrowing = (prevField.type === 'TEXT' || prevField.type === 'VARCHAR') && (currField.type === 'VARCHAR' && (currField.length || 0) < (prevField.length || 255));
            const risk: RiskLevel = isNarrowing ? 'warning' : 'warning';

            const change: SchemaDiffChange = {
              id: `change_${changeIndex++}`,
              type: 'column_type_change',
              tableName: curr.name,
              columnName: currField.name,
              oldType: mapTypeToSql(prevField, dbType),
              newType: fieldType,
              oldNullable: prevField.allowNull,
              newNullable: currField.allowNull,
              description: `Typ/Nullability von "${curr.name}.${currField.name}" geändert: ${mapTypeToSql(prevField, dbType)} ➔ ${fieldType}`,
              riskLevel: risk,
              riskReason: 'Type-Casting / NOT-NULL Änderung kann bei inkompatiblen Werten zu Datenverlust oder Laufzeitfehlern führen.'
            };
            changes.push(change);
            tableChanges.push(change);

            if (dbType === DbType.SQLite) {
              tableNeedsRebuildForSqlite = true;
            } else if (dbType === DbType.SQL) {
              upSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} ${fieldType};\n`;
              downSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} ${mapTypeToSql(prevField, dbType)};\n`;
            } else if (dbType === DbType.MySQL) {
              upSql += `ALTER TABLE ${tableName} MODIFY COLUMN ${fieldName} ${fieldType}${currField.allowNull ? ' NULL' : ' NOT NULL'};\n`;
              downSql += `ALTER TABLE ${tableName} MODIFY COLUMN ${fieldName} ${mapTypeToSql(prevField, dbType)}${prevField.allowNull ? ' NULL' : ' NOT NULL'};\n`;
            } else if (dbType === DbType.PostgreSQL) {
              upSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} TYPE ${fieldType} USING ${fieldName}::${fieldType};\n`;
              if (currField.allowNull !== prevField.allowNull) {
                upSql += currField.allowNull 
                  ? `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} DROP NOT NULL;\n`
                  : `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} SET NOT NULL;\n`;
              }
              downSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} TYPE ${mapTypeToSql(prevField, dbType)} USING ${fieldName}::${mapTypeToSql(prevField, dbType)};\n`;
            }
          }
        }
      });

      // 3. Dropped Columns
      prev.fields.forEach(prevField => {
        const currField = curr.fields.find(f => f.id === prevField.id || f.name.toLowerCase() === prevField.name.toLowerCase());
        if (!currField) {
          const fieldName = quoteIdentifier(prevField.name, dbType);
          const change: SchemaDiffChange = {
            id: `change_${changeIndex++}`,
            type: 'column_drop',
            tableName: curr.name,
            columnName: prevField.name,
            oldType: mapTypeToSql(prevField, dbType),
            description: `Spalte "${prevField.name}" in "${curr.name}" wird GELÖSCHT (Datenverlust).`,
            riskLevel: 'critical',
            riskReason: 'Unwiederbringlicher Verlust aller Daten in dieser Spalte.'
          };
          changes.push(change);
          tableChanges.push(change);

          if (dbType === DbType.SQLite) {
            tableNeedsRebuildForSqlite = true;
          } else {
            upSql += `ALTER TABLE ${tableName} DROP COLUMN ${fieldName};\n`;
            downSql += `ALTER TABLE ${tableName} ADD COLUMN ${fieldName} ${mapTypeToSql(prevField, dbType)};\n`;
          }
        }
      });

      // Handle SQLite 3-step Table Rebuild if needed
      if (dbType === DbType.SQLite && tableNeedsRebuildForSqlite) {
        sqliteRebuildApplied = true;
        const rebuildScripts = generateSqliteTableRebuild(curr, prev, tableChanges);
        upSql += rebuildScripts.up;
        downSql += rebuildScripts.down;
      }
    }
  });

  // 4. Dropped Tables
  snapshotTables.forEach(prev => {
    const curr = currentTables.find(t => t.id === prev.id || t.name.toLowerCase() === prev.name.toLowerCase());
    if (!curr) {
      const tableName = quoteIdentifier(prev.name, dbType);
      changes.push({
        id: `change_${changeIndex++}`,
        type: 'table_drop',
        tableName: prev.name,
        description: `Tabelle "${prev.name}" wird VOLLSTÄNDIG GELÖSCHT.`,
        riskLevel: 'critical',
        riskReason: 'Komplette Tabelle und alle verknüpften Datensätze werden unwiderruflich entfernt.'
      });

      upSql += `DROP TABLE IF EXISTS ${tableName};\n`;
      const fieldsDef = buildTableFieldsDef(prev, dbType);
      downSql += `CREATE TABLE ${tableName} (${fieldsDef});\n`;
    }
  });

  // Calculate Pre-Flight Report
  const criticalCount = changes.filter(c => c.riskLevel === 'critical').length;
  const warningCount = changes.filter(c => c.riskLevel === 'warning').length;
  const safeCount = changes.filter(c => c.riskLevel === 'safe').length;

  let riskScore = 0;
  if (criticalCount > 0) riskScore += criticalCount * 40;
  if (warningCount > 0) riskScore += warningCount * 15;
  riskScore = Math.min(100, riskScore);

  const overallRisk: RiskLevel = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'safe';

  const warnings = changes.filter(c => c.riskLevel !== 'safe').map(c => ({
    title: `${c.tableName}: ${c.description}`,
    description: c.riskReason || 'Potenzielle Beeinträchtigung der Datenkonsistenz.',
    mitigation: c.type === 'column_drop' || c.type === 'table_drop'
      ? 'Erstellen Sie vorab ein vollständiges Backup oder migrieren Sie Spalten in ein Archiv.'
      : 'Prüfen Sie vorab bestehende NULL-Werte oder bereinigen Sie inkompatible Typen vor der Migration.',
    level: c.riskLevel
  }));

  const zeroDowntimeAdvice = [
    'Expand-and-Contract Pattern: Fügen Sie neue Spalten zunächst als Nullable hinzu, befüllen Sie diese im Hintergrund und setzen Sie NOT NULL erst in Phase 2.',
    'Verwenden Sie für große Tabellen (>100k Zeilen) asynchrone Indizierung (`CREATE INDEX CONCURRENTLY` in PostgreSQL).',
    'Führen Sie destruktive Spaltenlöschungen (DROP COLUMN) erst nach Abschluss des Rollouts und Code-Deployments durch.'
  ];

  if (sqliteRebuildApplied) {
    zeroDowntimeAdvice.unshift('SQLite Table-Rebuild aktiv: SQLite unterstützt kein natives DROP COLUMN / Type-Change im Live-Schema. Die Tabelle wird atomar per 3-Schritt-Verfahren neu aufgebaut.');
  }

  const preFlight: PreFlightReport = {
    riskScore,
    overallRisk,
    criticalCount,
    warningCount,
    safeCount,
    warnings,
    zeroDowntimeAdvice
  };

  // Generate Flyway & Liquibase
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const versionNum = '002';
  const migrationSlug = changes.length > 0 ? 'schema_update' : 'baseline';
  const flywayUpFilename = `V${versionNum}__${migrationSlug}.sql`;
  const flywayDownFilename = `U${versionNum}__${migrationSlug}.sql`;

  const liquibaseXml = `<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <changeSet id="${timestamp}-1" author="dbstudio">
        <sql>
${upSql ? upSql.split('\n').map(l => `            ${l}`).join('\n') : '            -- Keine Änderungen'}
        </sql>
        <rollback>
${downSql ? downSql.split('\n').map(l => `            ${l}`).join('\n') : '            -- Kein Rollback erforderlich'}
        </rollback>
    </changeSet>
</databaseChangeLog>`;

  const liquibaseYaml = `databaseChangeLog:
  - changeSet:
      id: "${timestamp}-1"
      author: "dbstudio"
      changes:
        - sql:
            sql: |
${upSql ? upSql.split('\n').map(l => `              ${l}`).join('\n') : '              -- Keine Änderungen'}
      rollback:
        - sql:
            sql: |
${downSql ? downSql.split('\n').map(l => `              ${l}`).join('\n') : '              -- Kein Rollback'}
`;

  const liquibaseSql = `--liquibase formatted sql
--changeset dbstudio:${timestamp}-1
${upSql || '-- Keine Änderungen'}

--rollback
${downSql || '-- Kein Rollback'}
`;

  // Generate Extended ORM Migrations
  const ormBundle = generateOrmMigrationBundle(changes, currentTables, snapshotTables, dbType, upSql, downSql);

  const migrations: GeneratedMigrations = {
    sqlUp: upSql || '-- Keine Schema-Änderungen festgestellt.',
    sqlDown: downSql || '-- Kein Rollback erforderlich.',
    flywayUpFilename,
    flywayDownFilename,
    flywayUpScript: `-- Flyway Migration: ${flywayUpFilename}\n-- Target Dialect: ${dbType}\n-- Generiert von DB Studio Pro am ${new Date().toLocaleString()}\n\n${upSql || '-- Keine Änderungen'}`,
    flywayDownScript: `-- Flyway Undo: ${flywayDownFilename}\n-- Target Dialect: ${dbType}\n-- Generiert von DB Studio Pro am ${new Date().toLocaleString()}\n\n${downSql || '-- Kein Rollback'}`,
    liquibaseXml,
    liquibaseYaml,
    liquibaseSql,
    prismaMigrationSql: ormBundle.prismaMigrationSql,
    efCoreUpCSharp: ormBundle.efCoreUpCSharp,
    drizzleTsUp: ormBundle.drizzleTsUp,
    knexJsUp: ormBundle.knexJsUp,
    sqliteRebuildApplied
  };

  return { changes, preFlight, migrations };
};
