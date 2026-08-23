import { Table, DbType } from '../../types/index';

export type DiffChangeType = 'table_add' | 'table_drop' | 'table_rename' | 'column_add' | 'column_drop' | 'column_rename' | 'column_type_change' | 'column_null_change';

export type RiskLevel = 'safe' | 'warning' | 'critical';

export interface SchemaDiffChange {
  id: string;
  type: DiffChangeType;
  tableName: string;
  oldTableName?: string;
  columnName?: string;
  oldColumnName?: string;
  oldType?: string;
  newType?: string;
  oldNullable?: boolean;
  newNullable?: boolean;
  description: string;
  riskLevel: RiskLevel;
  riskReason?: string;
}

export interface PreFlightReport {
  riskScore: number; // 0 (Safe) - 100 (High Risk)
  overallRisk: RiskLevel;
  criticalCount: number;
  warningCount: number;
  safeCount: number;
  warnings: {
    title: string;
    description: string;
    mitigation: string;
    level: RiskLevel;
  }[];
  zeroDowntimeAdvice: string[];
}

export interface GeneratedMigrations {
  sqlUp: string;
  sqlDown: string;
  flywayUpFilename: string;
  flywayDownFilename: string;
  flywayUpScript: string;
  flywayDownScript: string;
  liquibaseXml: string;
  liquibaseYaml: string;
  liquibaseSql: string;
  // Extended ORM & Framework Migration formats
  prismaMigrationSql: string;
  efCoreUpCSharp: string;
  drizzleTsUp: string;
  knexJsUp: string;
  sqliteRebuildApplied?: boolean;
}
