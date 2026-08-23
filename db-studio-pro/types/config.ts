
export type AppMode = 'DEMO' | 'REGISTERED';
export type StorageTarget = 'local' | 'server';

export interface AppConfig {
  mode: AppMode;
  storage: StorageTarget;
  apiUrl: string;
  isConfigured: boolean;
}

export interface ConfigStore {
  config: AppConfig;
  updateConfig: (patch: Partial<AppConfig>) => void;
  resetConfig: () => void;
}
