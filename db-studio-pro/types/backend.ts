import { DbType } from './database';

export type BackendLanguage = 'dotnet' | 'nodejs' | 'php' | 'laravel' | 'electron' | 'python' | 'tauri';
export type FrontendFramework = 'react' | 'angular' | 'angular-modern' | 'blazor' | 'vue' | 'electron' | 'maui' | 'maui-native' | 'none' | 'tauri';
export type StylingFramework = 'tailwind' | 'bootstrap' | 'none';

export interface AuthConfig {
  useWindowsAuth: boolean;
  useAdGroups: boolean;
  useActiveDirectoryMgmt?: boolean;
  adGroups?: string;
  adMapping?: { groupName: string; roleName: string }[];
  useUserLogin: boolean;
  devBypass: boolean;
  isMobileReady: boolean;
}

export interface ElectronSettings {
  includeBackend: boolean;
  bundleFrontend: boolean;
  targetUrl?: string;
}

export type DeploymentTarget = 'docker' | 'ftp' | 'azure' | 'aws' | 'github' | 'electron' | 'tauri' | 'offline_sync';

export interface OfflineSyncConfig {
  enabled: boolean;
  localEngine: 'sqlite' | 'sqlcipher' | 'indexeddb' | 'powersync';
  remoteEngine: 'mysql' | 'postgres' | 'mssql' | 'mariadb';
  autoAddMetadataColumns?: boolean;
  conflictStrategy: 'last_write_wins' | 'server_wins' | 'client_wins' | 'manual_review';
  softDeleteField: string;
  updatedAtField: string;
  createdAtField: string;
  syncVersionField: string;
  clientIdField: string;
  syncIntervalSeconds: number;
  generateTriggers: boolean;
}

export interface DeploymentConfig {
  target: DeploymentTarget;
  dockerImageName?: string;
  dockerPort?: number;
  ftpHost?: string;
  ftpUser?: string;
  ftpPath?: string;
  offlineSync?: OfflineSyncConfig;
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'azure';
  bucketName?: string;
  region?: string;
  accessKeyId?: string;
  connectionString?: string;
}

export interface SsoConfig {
  provider: 'google' | 'microsoft' | 'apple' | 'github';
  clientId: string;
  clientSecret?: string;
  tenantId?: string;
}

export interface WebhookConfig {
  url: string;
  events: ('create' | 'update' | 'delete')[];
  secret?: string;
}

export interface AiIntegrationConfig {
  provider: 'gemini' | 'openai' | 'ollama' | 'azure_openai';
  apiKey?: string;
  modelName?: string;
  endpointUrl?: string;
}

export interface CollaborationConfig {
  provider: 'signalr' | 'socketio' | 'pusher' | 'none';
  serverUrl?: string;
  apiKey?: string;
  hubPath?: string;
}

export interface SharePointConfig {
  siteUrl: string;
  authMethod: 'user' | 'app';
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
}

export interface IntegrationsConfig {
  storage: StorageConfig;
  sso: SsoConfig[];
  webhooks: WebhookConfig[];
  ai?: AiIntegrationConfig;
  collaboration?: CollaborationConfig;
  sharePoint?: SharePointConfig;
}

export interface EnvironmentConfig {
  name: 'Development' | 'Staging' | 'Production';
  dbConnection: string;
  apiUrl?: string;
  buildPath?: string;
  vars?: Record<string, string>;
}

export interface WhitelabelConfig {
  appName: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  fontFamily?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  customCss?: string;
  useBootstrap?: boolean;
  customNpmPackages?: string;
  darkModeColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
  emailTemplates?: {
    id: string;
    name: string;
    subject: string;
    bodyHtml: string;
  }[];
  pwaConfiguration?: {
    enabled: boolean;
    themeColor?: string;
    backgroundColor?: string;
  };
  faviconUrl?: string;
  removeBranding?: boolean;
}

export interface MultiTenancyConfig {
  enabled: boolean;
  strategy: 'discriminator' | 'database';
  tenantField: string;
}

export interface LicensingConfig {
  enabled: boolean;
  licenseKey?: string;
  validateOnline: boolean;
}

export interface NavigationItem {
  id: string;
  type: 'page' | 'folder';
  title: string;
  icon: string;
  route: string;
  requiredRoles: string[];
  targetId?: string;
  targetType?: 'table' | 'query' | 'form' | 'report' | 'custom';
  children?: NavigationItem[];
  badgeCountQuery?: string;
  translations?: { de?: string; en?: string; fr?: string };
}

export interface GlobalStateVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  defaultValue: any;
}

export interface ProductTourStep {
  targetSelector: string;
  title: string;
  content: string;
}

export interface ProductTour {
  id: string;
  name: string;
  activeOnRoute?: string;
  steps: ProductTourStep[];
}

export interface BackendConfig {
  language: BackendLanguage;
  backendVersion?: string;
  dbType: DbType;
  projectName: string;
  port: number;
  frontendPort?: number;
  dbConnection: string;
  useSwagger: boolean;
  frontendFramework: FrontendFramework;
  stylingFramework?: StylingFramework;
  protocolMode?: 'http' | 'https' | 'both';
  authConfig?: AuthConfig;
  electronSettings?: ElectronSettings;
  deploymentConfig?: DeploymentConfig;
  integrations?: IntegrationsConfig;
  environments?: EnvironmentConfig[];
  apiBaseUrl?: string;
  whitelabel?: WhitelabelConfig;
  multiTenancy?: MultiTenancyConfig;
  licensing?: LicensingConfig;
  navigationConfig?: NavigationItem[];
  navigationPreset?: 'sidebar' | 'top_nav' | 'double_rail';
  globalStates?: GlobalStateVariable[];
  productTours?: ProductTour[];
  offlineSync?: OfflineSyncConfig;
}
