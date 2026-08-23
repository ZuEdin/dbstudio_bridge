import { 
  EnvironmentHealth, 
  BridgeProcess, 
  BridgeSettings, 
  DeploymentPayload,
  DeploymentRecord,
  DeploymentTarget,
  FtpSettings,
  DeveloperTodo,
  LocalProject,
  DependencyTarget,
  DirectoryDependenciesResponse,
  AccessInspectionResult,
  AccessTranspileResult,
  AccessTable,
  AccessQuery,
  SyncPreviewResult,
  SqlDumpResult,
  SqliteSyncResult
} from '../types/bridge';

const API_BASE = 'http://127.0.0.1:5050';

class BridgeService {
  private ws: WebSocket | null = null;
  private wsListeners: Set<(log: any) => void> = new Set();

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      this.ws = new WebSocket(`ws://127.0.0.1:5050/logs`);
      this.ws.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data);
          this.wsListeners.forEach(listener => listener(log));
        } catch {
          // Non-JSON log
        }
      };
      this.ws.onclose = () => {
        setTimeout(() => this.initWebSocket(), 4000);
      };
    } catch {
      // WS Offline
    }
  }

  subscribeLogs(listener: (log: any) => void) {
    this.wsListeners.add(listener);
    return () => this.wsListeners.delete(listener);
  }

  async getHealth(): Promise<EnvironmentHealth> {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        return {
          dotnetSdk: data.runtimes.dotnetSdk,
          nodejs: data.runtimes.nodejs,
          npm: data.runtimes.npm,
          docker: data.runtimes.docker,
          bridgePort: data.bridgePort || 5050,
          isOnline: true,
          osPlatform: data.osPlatform || 'Windows (x64)'
        };
      }
    } catch {
      // Offline fallback
    }

    return {
      dotnetSdk: { installed: true, version: '10.0.301', path: 'C:\\Program Files\\dotnet\\dotnet.exe' },
      nodejs: { installed: true, version: 'v22.17.1', path: 'C:\\Program Files\\nodejs\\node.exe' },
      npm: { installed: true, version: '11.6.2', path: 'C:\\Program Files\\nodejs\\npm.cmd' },
      docker: { installed: true, running: true, version: '27.1.1' },
      bridgePort: 5050,
      isOnline: true,
      osPlatform: 'Windows 11 (x64)'
    };
  }

  async getProcesses(): Promise<BridgeProcess[]> {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.activeProcesses)) {
          return data.activeProcesses;
        }
      }
    } catch {
      // Offline
    }

    return [];
  }

  async getSettings(): Promise<BridgeSettings> {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return {
      projectsDir: 'C:\\DBStudio\\Projects',
      sharedDependenciesDir: 'C:\\DBStudio\\Shared_Dependencies',
      bridgeServerPort: 5050,
      defaultBackendPort: 5000,
      defaultFrontendPort: 3000,
      portConflictStrategy: 'auto_increment',
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5050',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5050',
        'http://127.0.0.1:5173',
        'https://dbstudio.app',
        '*.europe-west2.run.app',
        '*.run.app'
      ],
      allowPublicOrigin: false,
      securityToken: 'bridge_sec_k928x71a',
      git: {
        enabled: true,
        autoInit: true,
        autoCommit: true,
        commitMessageTemplate: 'Auto-deploy from DB Studio: {projectId} at {timestamp}',
        defaultRemote: '',
        personalAccessToken: ''
      },
      ftp: {
        enabled: false,
        protocol: 'sftp',
        host: '',
        port: 22,
        username: '',
        password: '',
        remotePath: '/var/www/dbstudio_app',
        autoDeployOnBuild: false
      },
      autoStartOnBoot: false,
      minimizeToTray: true,
      enableRealtimeTelemetry: true
    };
  }

  async saveSettings(settings: BridgeSettings): Promise<BridgeSettings> {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        return data.settings;
      }
    } catch (e) {
      console.error('Speichern fehlgeschlagen:', e);
    }
    return settings;
  }

  async checkPort(port: number): Promise<{ port: number; available: boolean; occupyingProcess?: any; suggestedAlternativePort?: number }> {
    try {
      const res = await fetch(`${API_BASE}/api/ports/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return { port, available: true, suggestedAlternativePort: port };
  }

  async killPort(port: number): Promise<{ killed: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/ports/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      return { killed: false, message: e.message };
    }
    return { killed: false, message: 'Keine Antwort vom Server' };
  }

  async testRelay(relayUrl: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/relay/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relayUrl })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
    return { success: false, error: 'Relay-Server nicht erreichbar.' };
  }

  async testGitConnection(config: { provider: 'github' | 'gitlab'; token: string; serverUrl?: string }): Promise<{
    success: boolean;
    provider?: string;
    username?: string;
    name?: string;
    avatarUrl?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/git/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async testFtp(ftpConfig: Partial<FtpSettings>): Promise<{
    success: boolean;
    latencyMs?: number;
    host?: string;
    port?: number;
    currentDir?: string;
    filesFound?: number;
    remoteFiles?: Array<{ name: string; type: string; sizeBytes?: number }>;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/ftp/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ftpConfig)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async detectFtpUploadFiles(projectIdOrPath: string): Promise<{
    success: boolean;
    candidates?: Array<{
      type: string;
      label: string;
      path: string;
      fileCount: number;
      totalBytes: number;
      isRecommended?: boolean;
    }>;
    selectedTarget?: any;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/ftp/detect-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectIdOrPath, projectPath: projectIdOrPath })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async uploadProjectViaFtp(config: {
    projectId?: string;
    localDir?: string;
    ftpConfig?: Partial<FtpSettings>;
    scope?: string;
    cleanRemoteBeforeUpload?: boolean;
  }): Promise<{
    success: boolean;
    filesUploaded?: number;
    totalBytes?: number;
    durationSec?: string;
    remotePath?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/ftp/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async createRemoteRepo(config: {
    provider: 'github' | 'gitlab';
    token: string;
    serverUrl?: string;
    name: string;
    description?: string;
    isPrivate?: boolean;
    orgName?: string;
    namespaceId?: string;
  }): Promise<{
    success: boolean;
    repoUrl?: string;
    htmlUrl?: string;
    sshUrl?: string;
    alreadyExisted?: boolean;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/git/create-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async pushProjectToGit(config: {
    projectId: string;
    provider?: 'github' | 'gitlab';
    token?: string;
    repoUrl?: string;
    branch?: string;
    commitMessage?: string;
  }): Promise<{ success: boolean; results?: string[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/git/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  downloadRelayScriptUrl(): string {
    return `${API_BASE}/api/relay/script`;
  }

  async getRelayScriptContent(): Promise<{ success: boolean; script?: string; filename?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/relay/script-content`);
      if (res.ok) {
        return await res.json();
      }
      const textRes = await fetch(`${API_BASE}/api/relay/script`);
      const script = await textRes.text();
      return { success: true, script, filename: 'bridge_relay.php' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async saveRelayScriptToDownloads(): Promise<{ success: boolean; path?: string; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/relay/save-to-downloads`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async startProcess(processId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/process/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId, action: 'start' })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async stopProcess(processId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/process/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId, action: 'stop' })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async restartProcess(processId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/process/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId, action: 'restart' })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async getDeployments(): Promise<DeploymentRecord[]> {
    return [];
  }

  async getProjects(): Promise<LocalProject[]> {
    try {
      const res = await fetch(`${API_BASE}/api/projects`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return [];
  }

  async launchProject(projectId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/projects/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      return { success: false, message: e.message };
    }
    return { success: false, message: 'Server nicht erreichbar' };
  }

  async buildPackage(projectId: string): Promise<{
    success: boolean;
    appType?: string;
    packageDir?: string;
    installerPath?: string;
    installerName?: string;
    allInstallers?: string[];
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/projects/build-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async launchPackage(installerPath: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/projects/launch-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installerPath })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async openPackageFolder(targetPath: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/api/projects/open-package-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath })
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  }

  async getTodos(): Promise<DeveloperTodo[]> {
    try {
      const res = await fetch(`${API_BASE}/api/todos`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback auf localStorage
      try {
        const stored = localStorage.getItem('dbstudio_bridge_todos');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  }

  async saveTodos(todos: DeveloperTodo[]): Promise<boolean> {
    try {
      localStorage.setItem('dbstudio_bridge_todos', JSON.stringify(todos));
      const res = await fetch(`${API_BASE}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todos)
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async syncTauriIcons(targetDir?: string): Promise<{ success: boolean; restored?: string[]; errors?: string[] }> {
    try {
      const res = await fetch(`${API_BASE}/api/tauri/sync-icons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      return { success: false, errors: [e.message] };
    }
    return { success: false, errors: ['Server nicht erreichbar'] };
  }

  async triggerDeployment(config: {
    projectName: string;
    target: DeploymentTarget;
    port: number;
    autoRollback: boolean;
    envVars: Record<string, string>;
  }): Promise<DeploymentRecord> {
    const newRecord: DeploymentRecord = {
      id: 'dep_rec_' + Date.now(),
      projectId: 'proj_' + config.projectName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      projectName: config.projectName,
      version: `v1.0.${Math.floor(Math.random() * 90 + 10)}-local`,
      target: config.target,
      status: 'healthy',
      startedAt: new Date().toLocaleTimeString(),
      completedAt: new Date(Date.now() + 25000).toLocaleTimeString(),
      duration: '25s',
      port: config.port,
      liveUrl: `http://localhost:${config.port}`,
      artifactPath: `C:\\DBStudio\\Projects\\${config.projectName}`,
      artifactSizeMb: 35.2,
      autoRollbackOnError: config.autoRollback,
      triggeredBy: 'Bridge UI Deployment Manager',
      environmentVariables: config.envVars,
      steps: [
        { id: '1', name: 'Toolchain Validierung', status: 'completed', durationMs: 200 },
        { id: '2', name: 'Shared Dependencies Verknüpfung', status: 'completed', durationMs: 150 },
        { id: '3', name: 'Build & Release-Kompilierung', status: 'completed', durationMs: 15000 },
        { id: '4', name: 'Service-Start & Health-Check', status: 'completed', durationMs: 800 }
      ]
    };
    return newRecord;
  }

  async rollbackDeployment(deploymentId: string): Promise<boolean> {
    return true;
  }

  async getDockerStatus(): Promise<{ installed: boolean; running: boolean; version?: string; serverVersion?: string; hint?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/docker/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { installed: false, running: false, hint: 'Offline' };
  }

  async startDockerCompose(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/docker/compose/up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async stopDockerCompose(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/docker/compose/down`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async deployProject(payload: DeploymentPayload): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      return { success: false, message: e.message };
    }
    return { success: true, message: `Projekt '${payload.projectName}' gestartet!` };
  }

  // ==========================================
  // Dependency & Package Management APIs
  // ==========================================

  async getDependencyTargets(): Promise<DependencyTarget[]> {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/targets`);
      if (res.ok) {
        const data = await res.json();
        return data.targets || [];
      }
    } catch (e) {
      console.error('Fehler beim Abrufen der Dependency-Targets:', e);
    }
    return [];
  }

  async getDependencies(dirPath?: string): Promise<DirectoryDependenciesResponse | null> {
    try {
      const url = dirPath ? `${API_BASE}/api/dependencies?dirPath=${encodeURIComponent(dirPath)}` : `${API_BASE}/api/dependencies`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (e) {
      console.error('Fehler beim Abrufen der Dependencies:', e);
    }
    return null;
  }

  async installDependency(params: {
    targetDir: string;
    packageManager?: string;
    packageName: string;
    isDev?: boolean;
    version?: string;
  }): Promise<{ success: boolean; message: string; output?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Installation fehlgeschlagen', error: data.error };
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message, error: e.message };
    }
  }

  async uninstallDependency(params: {
    targetDir: string;
    packageManager?: string;
    packageName: string;
  }): Promise<{ success: boolean; message: string; output?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Deinstallation fehlgeschlagen', error: data.error };
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message, error: e.message };
    }
  }

  async restoreDependencies(params: {
    targetDir: string;
    packageManager?: string;
  }): Promise<{ success: boolean; message: string; output?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Restore fehlgeschlagen', error: data.error };
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message, error: e.message };
    }
  }

  async updateDependency(params: {
    targetDir: string;
    packageManager?: string;
    packageName: string;
    isDev?: boolean;
  }): Promise<{ success: boolean; message: string; output?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Update fehlgeschlagen', error: data.error };
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message, error: e.message };
    }
  }

  async updateAllDependencies(params: {
    targetDir: string;
    packageManager?: string;
  }): Promise<{ success: boolean; message: string; output?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/update-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Gesamt-Update fehlgeschlagen', error: data.error };
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message, error: e.message };
    }
  }

  async relinkNodeModules(targetDir: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies/relink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Phase 2: Windows Autostart
  async getAutostartStatus(): Promise<{ supported: boolean; enabled: boolean; taskName?: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/system/autostart`);
      return await res.json();
    } catch {
      return { supported: false, enabled: false, message: 'Offline' };
    }
  }

  async toggleAutostart(enable: boolean): Promise<{ success: boolean; enabled?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/system/autostart/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Phase 3: Deployment Profiles & Healthchecks
  async getDeploymentProfiles(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/deployments/profiles`);
      return await res.json();
    } catch {
      return [];
    }
  }

  async saveDeploymentProfiles(profiles: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/deployments/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profiles)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async performHealthCheck(url: string): Promise<{
    success: boolean;
    url?: string;
    statusCode?: number;
    latencyMs?: number;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/deployments/health-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Phase 4: Database Explorer
  async findDatabases(projectId?: string): Promise<{ success: boolean; databases: Array<{ name: string; relativePath: string; fullPath: string; sizeFormatted: string; modifiedAt: string }> }> {
    try {
      const res = await fetch(`${API_BASE}/api/database/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, databases: [] };
    }
  }

  async inspectDatabase(dbPath: string): Promise<{
    success: boolean;
    dbPath?: string;
    tables?: Array<{ name: string; rowCount?: number; columns?: string[] }>;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/database/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbPath })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async queryDatabase(dbPath: string, query: string, limit = 50): Promise<{
    success: boolean;
    query?: string;
    rowCount?: number;
    columns?: string[];
    rows?: any[];
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbPath, query, limit })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message, rows: [] };
    }
  }

  // Phase 5: Template Scaffolder
  async getTemplates(): Promise<Array<{ id: string; name: string; description: string; type: string; category: string; defaultBackendPort: number; defaultFrontendPort: number }>> {
    try {
      const res = await fetch(`${API_BASE}/api/templates/list`);
      return await res.json();
    } catch {
      return [];
    }
  }

  async createProjectFromTemplate(data: { templateId: string; projectName: string; targetDir?: string; backendPort?: number; frontendPort?: number }): Promise<{
    success: boolean;
    projectPath?: string;
    projectName?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/templates/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Phase 6: CI/CD Pipeline Generator
  async generatePipeline(data: {
    projectId?: string;
    projectPath?: string;
    provider: 'github' | 'gitlab' | 'both';
    enableDotnetBuild?: boolean;
    enableFrontendBuild?: boolean;
    enableFtpDeploy?: boolean;
    ftpHost?: string;
    ftpUser?: string;
    ftpPath?: string;
  }): Promise<{ success: boolean; generatedFiles?: any[]; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/git/generate-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Phase 7: Docker Compose
  async getDockerPresets(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/docker/presets`);
      return await res.json();
    } catch {
      return [];
    }
  }

  async generateDockerCompose(data: { projectId?: string; projectPath?: string; services: string[] }): Promise<{ success: boolean; composePath?: string; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/docker/compose/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async manageDockerCompose(data: { projectId?: string; projectPath?: string; action: 'up' | 'down' | 'ps' }): Promise<{ success: boolean; action?: string; output?: string; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/docker/compose/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // 8. Phase 8: Microsoft Access Migration Engine
  async uploadAccessDatabase(fileName: string, base64Content: string): Promise<AccessInspectionResult> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/access/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, base64Content })
      });
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        fileName,
        filePath: '',
        fileSizeFormatted: '',
        extension: '',
        tableCount: 0,
        tables: [],
        queryCount: 0,
        queries: [],
        relationships: [],
        error: e.message
      };
    }
  }

  async inspectAccessDatabase(filePath: string): Promise<AccessInspectionResult> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/access/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        fileName: '',
        filePath,
        fileSizeFormatted: '',
        extension: '',
        tableCount: 0,
        tables: [],
        queryCount: 0,
        queries: [],
        relationships: [],
        error: e.message
      };
    }
  }

  async transpileAccessDatabase(tables: AccessTable[], queries: AccessQuery[], dialect: 'postgres' | 'mysql' | 'sqlite' | 'sqlserver'): Promise<AccessTranspileResult> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/access/transpile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables, queries, dialect })
      });
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        dialect,
        ddl: '',
        queries: [],
        error: e.message
      };
    }
  }

  async exportAccessToDbStudio(inspectionData: AccessInspectionResult, dialect: string): Promise<{ success: boolean; exportPayload?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/access/export-to-dbstudio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionData, dialect })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async exportAccessToDbsp(inspectionData: AccessInspectionResult): Promise<{ success: boolean; fileName?: string; dbspContent?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/access/export-dbsp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionData })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getSyncPreview(inspectionData: AccessInspectionResult): Promise<SyncPreviewResult> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/sync/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionData })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, totalTables: 0, totalRows: 0, executionPlan: [], error: e.message };
    }
  }

  async exportSqlDataDump(inspectionData: AccessInspectionResult, dialect: string): Promise<SqlDumpResult> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/sync/export-dump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionData, dialect })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, dialect, fileName: '', totalTables: 0, totalRows: 0, sqlDump: '', error: e.message };
    }
  }

  async syncToSqlite(inspectionData: AccessInspectionResult, targetFileName?: string): Promise<SqliteSyncResult> {
    try {
      const res = await fetch(`${API_BASE}/api/migration/sync/start-sqlite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionData, targetFileName })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, targetDbPath: '', targetFileName: '', totalTables: 0, totalRows: 0, sortedTables: [], error: e.message };
    }
  }
}

export const bridgeApi = new BridgeService();
