export type ProcessStatus = 'idle' | 'installing' | 'building' | 'running' | 'stopped' | 'failed';

export interface BridgeProcess {
  id: string;
  name: string;
  type: 'backend_csharp' | 'backend_nodejs' | 'frontend_react' | 'desktop_tauri' | 'desktop_electron' | 'container_docker' | 'database' | 'custom' | string;
  status: ProcessStatus;
  pid?: number;
  port?: number;
  workingDirectory: string;
  command: string;
  startedAt?: string;
  cpuUsage?: number;
  memoryUsageMb?: number;
}

export interface EnvironmentHealth {
  dotnetSdk: { installed: boolean; version?: string; path?: string };
  nodejs: { installed: boolean; version?: string; path?: string };
  npm: { installed: boolean; version?: string; path?: string };
  docker: { installed: boolean; running: boolean; version?: string; serverVersion?: string; hint?: string };
  bridgePort: number;
  isOnline: boolean;
  osPlatform: string;
}

export interface ProjectPayloadFile {
  path: string;
  content: string;
}

export interface DeploymentPayload {
  projectId: string;
  projectName: string;
  targetFramework: 'dotnet10' | 'dotnet9' | 'nodejs' | 'custom';
  frontendFramework: 'react' | 'vue' | 'angular' | 'none';
  backendPort: number;
  frontendPort: number;
  files: ProjectPayloadFile[];
  autoInstall: boolean;
  autoRun: boolean;
  authToken?: string;
}

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  stream: 'stdout' | 'stderr' | 'system';
  message: string;
  processId?: string;
}

export type DeploymentTarget = 'self_contained_binary' | 'docker_container' | 'windows_service' | 'local_dev' | 'static_bundle';
export type DeploymentStatus = 'pending' | 'compiling' | 'migrating_db' | 'deploying' | 'healthy' | 'failed' | 'rolled_back';

export interface DeploymentPipelineStep {
  id: string;
  name: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'failed';
  durationMs?: number;
  logExcerpt?: string;
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  projectName: string;
  version: string;
  target: DeploymentTarget;
  status: DeploymentStatus;
  startedAt: string;
  completedAt?: string;
  duration?: string;
  port?: number;
  liveUrl?: string;
  artifactPath?: string;
  artifactSizeMb?: number;
  steps: DeploymentPipelineStep[];
  autoRollbackOnError: boolean;
  environmentVariables: Record<string, string>;
  triggeredBy: string;
}

export interface GitSettings {
  enabled: boolean;
  activeProvider?: 'github' | 'gitlab' | 'both' | 'custom';
  autoInit: boolean;
  autoCommit: boolean;
  autoCreateRemoteRepo?: boolean;
  commitMessageTemplate: string;
  defaultRemote: string;
  personalAccessToken: string;
  github?: {
    enabled?: boolean;
    token: string;
    defaultOrg?: string;
    autoCreateRepo?: boolean;
    isPrivate?: boolean;
  };
  gitlab?: {
    enabled?: boolean;
    token: string;
    serverUrl?: string;
    defaultNamespace?: string;
    autoCreateRepo?: boolean;
    isPrivate?: boolean;
  };
}

export interface FtpSettings {
  enabled: boolean;
  protocol: 'ftp' | 'sftp' | 'ftps';
  host: string;
  port: number;
  username: string;
  password?: string;
  remotePath: string;
  uploadScope?: 'auto' | 'web_dist' | 'dotnet_publish' | 'clean_source';
  autoDeployOnBuild: boolean;
  cleanRemoteBeforeUpload?: boolean;
}

export interface RelaySettings {
  enabled: boolean;
  relayUrl: string;
}

export interface BridgeSettings {
  projectsDir: string;
  sharedDependenciesDir: string;
  bridgeServerPort: number;
  defaultBackendPort: number;
  defaultFrontendPort: number;
  portConflictStrategy: 'auto_increment' | 'warn' | 'kill_existing';
  allowedOrigins: string[];
  allowPublicOrigin: boolean;
  securityToken: string;
  relay?: RelaySettings;
  git: GitSettings;
  ftp: FtpSettings;
  autoStartOnBoot: boolean;
  minimizeToTray: boolean;
  enableRealtimeTelemetry: boolean;
}

export interface DeveloperTodo {
  id: string;
  title: string;
  category: string;
  priority: 'Kritisch' | 'Hoch' | 'Mittel' | 'Niedrig';
  status: 'Offen' | 'In Bearbeitung' | 'Erledigt';
  assignee: string;
  description: string;
}

export interface LocalProject {
  id: string;
  name: string;
  path: string;
  framework: string;
  lastDeployed: string;
  size: string;
}

export interface InstalledDependency {
  name: string;
  version: string;
  type: 'production' | 'development';
  manager: 'npm' | 'nuget' | 'cargo';
}

export interface DependencySubTarget {
  id: string;
  name: string;
  subPath: string;
  fullPath: string;
}

export interface DependencyTarget {
  id: string;
  name: string;
  type: 'global_shared' | 'project';
  path: string;
  subTargets: DependencySubTarget[];
}

export interface NpmPackageDetails {
  name: string;
  version: string;
  dependencies: InstalledDependency[];
  devDependencies: InstalledDependency[];
  totalCount: number;
  nodeModulesInstalled: boolean;
  isSymlinked: boolean;
  scripts: string[];
  error?: string;
}

export interface NugetPackageDetails {
  projectName: string;
  packages: InstalledDependency[];
  totalCount: number;
}

export interface CargoPackageDetails {
  cargoFile: string;
  crates: InstalledDependency[];
  totalCount: number;
}

export interface DirectoryDependenciesResponse {
  dirPath: string;
  npm: NpmPackageDetails | null;
  nuget: NugetPackageDetails | null;
  cargo: CargoPackageDetails | null;
  error?: string;
}

export interface AccessColumn {
  name: string;
  accessType: string;
  charLength?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

export interface AccessTable {
  name: string;
  rowCount: number;
  columns: AccessColumn[];
}

export interface AccessQuery {
  name: string;
  accessSql: string;
}

export interface AccessRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: string;
  cascadeDelete: boolean;
  recommendation: string;
}

export interface AccessInspectionResult {
  success: boolean;
  fileName: string;
  filePath: string;
  fileSizeFormatted: string;
  extension: string;
  tableCount: number;
  tables: AccessTable[];
  queryCount: number;
  queries: AccessQuery[];
  relationships: AccessRelationship[];
  error?: string;
}

export interface TranspiledQueryItem {
  name: string;
  originalAccessSql: string;
  transpiledSql: string;
}

export interface AccessTranspileResult {
  success: boolean;
  dialect: 'postgres' | 'mysql' | 'sqlite' | 'sqlserver';
  ddl: string;
  queries: TranspiledQueryItem[];
  error?: string;
}

export interface ExecutionPlanItem {
  order: number;
  tableName: string;
  rowCount: number;
  columnCount: number;
  hasPrimaryKey: boolean;
}

export interface SyncPreviewResult {
  success: boolean;
  totalTables: number;
  totalRows: number;
  executionPlan: ExecutionPlanItem[];
  error?: string;
}

export interface SqlDumpResult {
  success: boolean;
  dialect: string;
  fileName: string;
  totalTables: number;
  totalRows: number;
  sqlDump: string;
  error?: string;
}

export interface SqliteSyncResult {
  success: boolean;
  targetDbPath: string;
  targetFileName: string;
  totalTables: number;
  totalRows: number;
  sortedTables: { name: string; rowCount: number }[];
  error?: string;
}

