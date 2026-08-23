import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BridgeConfig, 
  BridgeStatusResponse, 
  BridgeLogEntry, 
  BridgeDeployPayload, 
  BridgeDeployResult 
} from '../types/bridge';

interface ActiveProjectState {
  projectId?: string;
  projectName?: string;
  status: 'idle' | 'generating' | 'deploying' | 'running' | 'stopped' | 'error';
  backendUrl?: string;
  frontendUrl?: string;
  logs: BridgeLogEntry[];
  errorMessage?: string;
}

interface BridgeStoreState {
  config: BridgeConfig;
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: number | null;
  bridgeInfo: BridgeStatusResponse | null;
  activeProject: ActiveProjectState;
  isRunnerModalOpen: boolean;

  // Actions
  updateConfig: (patch: Partial<BridgeConfig>) => void;
  setRunnerModalOpen: (open: boolean) => void;
  checkHealth: () => Promise<boolean>;
  deployProject: (payload: BridgeDeployPayload) => Promise<BridgeDeployResult>;
  sendProcessAction: (projectId: string, action: 'start' | 'stop' | 'restart' | 'build_only') => Promise<boolean>;
  clearLogs: () => void;
  addLog: (entry: BridgeLogEntry) => void;
  setActiveProjectStatus: (status: ActiveProjectState['status'], error?: string) => void;
}

const defaultBridgeConfig: BridgeConfig = {
  host: 'http://127.0.0.1',
  port: 5050,
  token: 'dbstudio-bridge-local-token',
  useSharedDependencies: true, // Default to true as requested to prevent user data waste
  autoConnect: true,
  autoInstall: true,
  autoMigrateDb: true,
  autoRun: true,
  liveLogStreaming: true,
};

let activeWebSocket: WebSocket | null = null;

export function stripAnsiCodes(str: string): string {
  if (!str) return '';
  return str
    // Standard ANSI escape sequences with ESC character (\x1b or \u001b)
    .replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, '')
    .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
    // Orphaned / stripped escape fragments like [32m, [1m, [41;31m, [0m, [2K, [?25h
    .replace(/\[\??[0-9]{1,3}(?:;[0-9]{1,3})*[a-zA-Z]/g, '')
    // Strip other terminal control characters
    .replace(/\u001b\][0-9];[^\u0007]*\u0007/g, '')
    .replace(/\r+/g, '');
}

export function buildBridgeApiUrl(config: BridgeConfig, path: string): string {
  let cleanHost = (config.host || 'http://127.0.0.1').trim().replace(/\/+$/, '');
  
  // If host is provided without protocol, default to https:// for domains or http:// for IPs
  if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
    if (cleanHost.startsWith('127.0.0.1') || cleanHost.startsWith('localhost')) {
      cleanHost = `http://${cleanHost}`;
    } else {
      cleanHost = `https://${cleanHost}`;
    }
  }

  // Check if it's a PHP relay script (e.g. https://dbstudiopro.edv-knowhow.at/api/bridge_relay.php or bridge_relay.php)
  if (cleanHost.endsWith('.php')) {
    // Determine action from path (e.g. /api/status -> action=status, /api/deploy -> action=deploy)
    let action = 'status';
    if (path.includes('deploy')) action = 'deploy';
    else if (path.includes('process') || path.includes('action')) action = 'action';
    else if (path.includes('status')) action = 'status';
    else if (path.includes('pull')) action = 'pull_jobs';
    
    const separator = cleanHost.includes('?') ? '&' : '?';
    return `${cleanHost}${separator}action=${action}`;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If useCustomPort is explicitly disabled, do not append port
  if (config.useCustomPort === false) {
    return `${cleanHost}${cleanPath}`;
  }

  // If host already contains port (e.g. http://127.0.0.1:5050 or https://example.com:8443)
  if (/:\d+$/.test(cleanHost)) {
    return `${cleanHost}${cleanPath}`;
  }

  // If it's https or a remote tunnel/gateway domain without explicit port requirement
  if (cleanHost.startsWith('https://') && (!config.port || config.port === 443 || config.port === 80 || cleanHost.includes('.loca.lt') || cleanHost.includes('.ngrok') || cleanHost.includes('.trycloudflare.com') || cleanHost.includes('.run.app') || !cleanHost.includes(':5050'))) {
    return `${cleanHost}${cleanPath}`;
  }

  // Otherwise append port if specified and not 80/443
  if (config.port && config.port !== 80 && config.port !== 443) {
    return `${cleanHost}:${config.port}${cleanPath}`;
  }

  return `${cleanHost}${cleanPath}`;
}

export function buildBridgeWsUrl(config: BridgeConfig, pathAndQuery: string): string {
  const httpUrl = buildBridgeApiUrl(config, pathAndQuery);
  if (httpUrl.startsWith('https://')) {
    return httpUrl.replace(/^https:\/\//, 'wss://');
  }
  return httpUrl.replace(/^http:\/\//, 'ws://');
}

export const useBridgeStore = create<BridgeStoreState>()(
  persist(
    (set, get) => ({
      config: defaultBridgeConfig,
      isOnline: false,
      isChecking: false,
      lastChecked: null,
      bridgeInfo: null,
      activeProject: {
        status: 'idle',
        logs: []
      },
      isRunnerModalOpen: false,

      updateConfig: (patch) => {
        set((state) => ({
          config: { ...state.config, ...patch }
        }));
      },

      setRunnerModalOpen: (open) => {
        set({ isRunnerModalOpen: open });
      },

      clearLogs: () => {
        set((state) => ({
          activeProject: {
            ...state.activeProject,
            logs: []
          }
        }));
      },

      addLog: (entry) => {
        const cleanedMessage = stripAnsiCodes(entry.message || '');
        set((state) => ({
          activeProject: {
            ...state.activeProject,
            logs: [...state.activeProject.logs.slice(-1000), { ...entry, message: cleanedMessage }]
          }
        }));
      },

      setActiveProjectStatus: (status, error) => {
        set((state) => ({
          activeProject: {
            ...state.activeProject,
            status,
            errorMessage: error
          }
        }));
      },

      checkHealth: async () => {
        const { config } = get();
        set({ isChecking: true });

        const url = buildBridgeApiUrl(config, '/api/status');

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'X-Bridge-Token': config.token || '',
              'bypass-tunnel-reminder': 'true'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data: BridgeStatusResponse = await response.json();
            set({
              isOnline: true,
              isChecking: false,
              lastChecked: Date.now(),
              bridgeInfo: data
            });
            return true;
          } else {
            set({
              isOnline: false,
              isChecking: false,
              lastChecked: Date.now(),
              bridgeInfo: null
            });
            return false;
          }
        } catch (err) {
          set({
            isOnline: false,
            isChecking: false,
            lastChecked: Date.now(),
            bridgeInfo: null
          });
          return false;
        }
      },

      deployProject: async (payload) => {
        const { config, addLog } = get();
        const deployUrl = buildBridgeApiUrl(config, '/api/deploy');

        set({
          activeProject: {
            projectId: payload.projectId,
            projectName: payload.projectName,
            status: 'deploying',
            logs: [
              {
                type: 'system',
                timestamp: new Date().toISOString(),
                service: 'DBStudio',
                message: `🚀 Sende Projekt "${payload.projectName}" (${payload.files.length} Dateien) an Bridge (${deployUrl})...`
              },
              {
                type: 'system',
                timestamp: new Date().toISOString(),
                service: 'DBStudio',
                message: `📦 Shared Dependencies (Zentraler Store): ${payload.options.useSharedDependencies ? 'AKTIVIERUNG BESTÄTIGT (Vermeidet Datenmüll)' : 'DEAKTIVIERT'}`
              }
            ]
          },
          isRunnerModalOpen: true
        });

        // Setup WebSocket log streaming if enabled
        if (config.liveLogStreaming) {
          try {
            if (activeWebSocket) {
              activeWebSocket.close();
              activeWebSocket = null;
            }

            const wsUrl = buildBridgeWsUrl(config, `/logs?projectId=${encodeURIComponent(payload.projectId)}`);

            const ws = new WebSocket(wsUrl);
            activeWebSocket = ws;

            ws.onopen = () => {
              addLog({
                type: 'system',
                timestamp: new Date().toISOString(),
                service: 'LiveStream',
                message: `🟢 Live-Terminal WebSocket verbunden (${wsUrl})`
              });
            };

            ws.onmessage = (event) => {
              try {
                const logData = JSON.parse(event.data);
                addLog({
                  type: logData.type || 'stdout',
                  timestamp: logData.timestamp || new Date().toISOString(),
                  service: logData.service || 'Process',
                  message: logData.message || event.data
                });

                if (logData.status === 'RUNNING') {
                  set((state) => ({
                    activeProject: {
                      ...state.activeProject,
                      status: 'running'
                    }
                  }));
                } else if (logData.status === 'STOPPED') {
                  set((state) => ({
                    activeProject: {
                      ...state.activeProject,
                      status: 'stopped'
                    }
                  }));
                }
              } catch {
                addLog({
                  type: 'stdout',
                  timestamp: new Date().toISOString(),
                  service: 'Runner',
                  message: event.data
                });
              }
            };

            ws.onerror = (err) => {
              console.warn("WebSocket Log streaming error:", err);
            };
          } catch (wsErr) {
            console.warn("Could not initiate WebSocket:", wsErr);
          }
        }

        try {
          const response = await fetch(deployUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bridge-Token': config.token || '',
              'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            let parsedError = errorText;
            try {
              const parsed = JSON.parse(errorText);
              parsedError = parsed.message || parsed.error || errorText;
            } catch {}

            addLog({
              type: 'stderr',
              timestamp: new Date().toISOString(),
              service: 'BridgeError',
              message: `❌ Fehler beim Bereitstellen: ${parsedError}`
            });

            set((state) => ({
              activeProject: {
                ...state.activeProject,
                status: 'error',
                errorMessage: parsedError
              }
            }));

            return {
              success: false,
              error: parsedError
            };
          }

          const result: BridgeDeployResult = await response.json();

          addLog({
            type: 'system',
            timestamp: new Date().toISOString(),
            service: 'Bridge',
            message: `✅ Bereitstellung erfolgreich! ${result.message || ''}`
          });

          if (result.backendUrl) {
            addLog({
              type: 'system',
              timestamp: new Date().toISOString(),
              service: 'Backend',
              message: `🔗 Backend läuft unter: ${result.backendUrl}`
            });
          }
          if (result.frontendUrl) {
            addLog({
              type: 'system',
              timestamp: new Date().toISOString(),
              service: 'Frontend',
              message: `🔗 Frontend läuft unter: ${result.frontendUrl}`
            });
          }

          set((state) => ({
            activeProject: {
              ...state.activeProject,
              status: 'running',
              backendUrl: result.backendUrl,
              frontendUrl: result.frontendUrl
            }
          }));

          return result;
        } catch (err: any) {
          const errMsg = err.message || 'Unbekannter Netzwerkfehler zur lokalen Bridge.';
          addLog({
            type: 'stderr',
            timestamp: new Date().toISOString(),
            service: 'NetworkError',
            message: `❌ Verbindung zur Bridge fehlgeschlagen (${deployUrl}): ${errMsg}`
          });

          set((state) => ({
            activeProject: {
              ...state.activeProject,
              status: 'error',
              errorMessage: errMsg
            }
          }));

          return {
            success: false,
            error: errMsg
          };
        }
      },

      sendProcessAction: async (projectId, action) => {
        const { config, addLog } = get();
        const effectivePid = projectId || get().activeProject.projectId || 'default';
        const actionUrl = buildBridgeApiUrl(config, '/api/process/action');

        const actionName = action === 'stop' ? 'STOPPEN' : action === 'restart' ? 'NEUSTART' : 'STARTEN';

        addLog({
          type: 'system',
          timestamp: new Date().toISOString(),
          service: 'Control',
          message: `⚡ Sende Prozess-Befehl: ${actionName} für Projekt "${effectivePid}"...`
        });

        // Optimistically update status for instant UI responsiveness
        if (action === 'stop') {
          set((state) => ({
            activeProject: { ...state.activeProject, status: 'stopped' }
          }));
        } else if (action === 'restart' || action === 'start') {
          set((state) => ({
            activeProject: { ...state.activeProject, status: 'running' }
          }));
        }

        try {
          const response = await fetch(actionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bridge-Token': config.token || '',
              'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ projectId: effectivePid, action })
          });

          if (response.ok) {
            let resData: any = {};
            try {
              resData = await response.json();
            } catch (_) {}

            const successMsg = resData.message || (
              action === 'stop' 
                ? '⏹️ Prozesse (Backend & Frontend) wurden erfolgreich gestoppt und Ports freigegeben.' 
                : action === 'restart' 
                ? '🔄 Prozesse wurden erfolgreich neu gestartet.' 
                : '🟢 Prozesse wurden erfolgreich gestartet.'
            );

            addLog({
              type: 'system',
              timestamp: new Date().toISOString(),
              service: 'Control',
              message: `✅ ${successMsg}`
            });

            if (resData.status === 'STOPPED' || action === 'stop') {
              set((state) => ({
                activeProject: { ...state.activeProject, status: 'stopped' }
              }));
            } else if (resData.status === 'RUNNING' || action === 'start' || action === 'restart') {
              set((state) => ({
                activeProject: { ...state.activeProject, status: 'running' }
              }));
            }
            return true;
          } else {
            let errText = '';
            try {
              const errJson = await response.json();
              errText = errJson.error || errJson.message || JSON.stringify(errJson);
            } catch (_) {
              errText = await response.text();
            }

            addLog({
              type: 'stderr',
              timestamp: new Date().toISOString(),
              service: 'Control',
              message: `⚠️ Hinweis bei ${actionName}: ${errText || 'Unbekannte Antwort von Bridge'}`
            });
            return false;
          }
        } catch (err: any) {
          // If network connection failed (e.g. bridge stopped or offline)
          addLog({
            type: 'stderr',
            timestamp: new Date().toISOString(),
            service: 'Control',
            message: `⚠️ Lokale Bridge ist nicht erreichbar (${config.host}:${config.port}). Bitte prüfen Sie, ob start-bridge.bat läuft.`
          });
          return false;
        }
      }
    }),
    {
      name: 'db-studio-bridge-config',
      partialize: (state) => ({
        config: state.config
      })
    }
  )
);
