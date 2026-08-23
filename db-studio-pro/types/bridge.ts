export type BridgeRuntimeDetail = string | {
  installed: boolean;
  version?: string;
  running?: boolean;
};

export interface BridgeRuntimeInfo {
  node?: BridgeRuntimeDetail;
  nodejs?: BridgeRuntimeDetail;
  npm?: BridgeRuntimeDetail;
  dotnet?: BridgeRuntimeDetail;
  dotnetSdk?: BridgeRuntimeDetail;
  docker?: BridgeRuntimeDetail;
  git?: BridgeRuntimeDetail;
  rust?: BridgeRuntimeDetail;
  [key: string]: BridgeRuntimeDetail | undefined;
}

export interface BridgeRunningProject {
  projectId: string;
  backendPort: number;
  frontendPort: number;
  status: 'RUNNING' | 'STOPPED' | 'BUILDING' | 'ERROR';
}

export interface BridgeStatusResponse {
  status: 'online' | 'offline' | 'waiting_for_bridge';
  version?: string;
  hostname?: string;
  osPlatform?: string;
  freeMemoryMb?: number;
  totalMemoryMb?: number;
  bridgePort?: number;
  bridgeConnected?: boolean;
  relayType?: string;
  serverTime?: string;
  projectStatus?: {
    status: string;
    lastAction?: string;
    timestamp?: number;
  } | null;
  runtimes?: BridgeRuntimeInfo;
  config?: {
    projectsDir?: string;
    sharedDependenciesDir?: string;
    activePort?: number;
  };
  runningProjects?: BridgeRunningProject[];
  activeProcesses?: Array<{
    projectId: string;
    backendPort?: number;
    frontendPort?: number;
    status?: string;
  }>;
}

export interface BridgeConfig {
  host: string;
  port: number;
  useCustomPort?: boolean;
  token: string;
  useSharedDependencies: boolean;
  autoConnect: boolean;
  autoInstall: boolean;
  autoMigrateDb: boolean;
  autoRun: boolean;
  liveLogStreaming: boolean;
}

export interface BridgeLogEntry {
  type: 'stdout' | 'stderr' | 'system' | 'status_change';
  timestamp: string;
  service: string;
  message: string;
}

export interface BridgeDeployPayload {
  projectId: string;
  projectName: string;
  stack: {
    backendType: string;
    frontendType: string;
    databaseType: string;
  };
  ports: {
    backendPort: number;
    frontendPort: number;
  };
  options: {
    useSharedDependencies: boolean;
    autoInstall: boolean;
    autoMigrateDb: boolean;
    autoRun: boolean;
    gitInit?: boolean;
    gitRemote?: string;
    ftpDeployOnBuild?: boolean;
  };
  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface BridgeDeployResult {
  success: boolean;
  projectId?: string;
  projectPath?: string;
  backendUrl?: string;
  frontendUrl?: string;
  message?: string;
  error?: string;
}
