
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigStore, AppConfig } from '../types';

const initialConfig: AppConfig = {
  mode: 'DEMO',
  storage: 'local',
  apiUrl: 'http://localhost:5000',
  isConfigured: false
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: initialConfig,
      updateConfig: (patch) => set((state) => ({
        config: { ...state.config, ...patch, isConfigured: true }
      })),
      resetConfig: () => set({ config: initialConfig })
    }),
    {
      name: 'db-studio-config'
    }
  )
);

export function getApiUrl(path: string): string {
  const config = useConfigStore.getState().config;
  let baseUrl = (config.apiUrl || '').trim();

  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const envBase = ((import.meta as any).env?.BASE_URL || '/').replace(/\/$/, '');
  const relativeFallback = envBase ? `${envBase}${cleanPath}` : cleanPath;

  // If not explicitly configured as SELF_HOST, or if using default http://localhost:5000,
  // use relative path (respecting subfolder base if deployed under a subfolder)
  if ((config.mode as string) !== 'SELF_HOST' || !baseUrl || baseUrl === 'http://localhost:5000' || baseUrl === 'http://localhost:5000/') {
    return relativeFallback;
  }

  // If baseUrl is a relative path (e.g. /dbstudio or /subfolder/api)
  if (baseUrl.startsWith('/')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${cleanBase}${cleanPath.slice(4)}`;
    }
    return `${cleanBase}${cleanPath}`;
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `http://${baseUrl}`;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }
  return `${cleanBase}${cleanPath}`;
}

