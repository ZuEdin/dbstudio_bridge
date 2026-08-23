import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/tabs/OverviewTab';
import { DependenciesTab } from './components/tabs/DependenciesTab';
import { DatabaseTab } from './components/tabs/DatabaseTab';
import { DeveloperTodosTab } from './components/tabs/DeveloperTodosTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { DeploymentsTab } from './components/tabs/DeploymentsTab';
import { TerminalTab } from './components/tabs/TerminalTab';
import { WorkspacesTab } from './components/tabs/WorkspacesTab';
import { SecurityTab } from './components/tabs/SecurityTab';
import { ApiDocsTab } from './components/tabs/ApiDocsTab';
import { bridgeApi } from './services/bridgeApi';
import { EnvironmentHealth, BridgeProcess, DeploymentRecord } from './types/bridge';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [health, setHealth] = useState<EnvironmentHealth>({
    dotnetSdk: { installed: true, version: '10.0.301', path: 'C:\\Program Files\\dotnet\\dotnet.exe' },
    nodejs: { installed: true, version: 'v22.17.1', path: 'C:\\Program Files\\nodejs\\node.exe' },
    npm: { installed: true, version: '11.6.2', path: 'C:\\Program Files\\nodejs\\npm.cmd' },
    docker: { installed: false, running: false },
    bridgePort: 5050,
    isOnline: true,
    osPlatform: 'Windows (x64)'
  });

  const [processes, setProcesses] = useState<BridgeProcess[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);

  // 1. Initialer & periodischer Ladevorgang
  useEffect(() => {
    let isMounted = true;

    const loadState = async () => {
      try {
        const h = await bridgeApi.getHealth();
        if (isMounted && h) setHealth(h);
        const p = await bridgeApi.getProcesses();
        if (isMounted && p) setProcesses(p);
        const d = await bridgeApi.getDeployments();
        if (isMounted && d) setDeployments(d);
      } catch (err) {
        // Leise ignorieren
      }
    };

    loadState();
    const interval = setInterval(loadState, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Echtzeit-Push-Updates über WebSocket (Zero Latency)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://127.0.0.1:5050/logs');

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'STATE_SYNC' && Array.isArray(data.processes)) {
              setProcesses(data.processes);
            }
          } catch (e) {
            // Ignorieren
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 2000);
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connectWs, 2000);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleStartProcess = async (id: string) => {
    await bridgeApi.startProcess(id);
    const p = await bridgeApi.getProcesses();
    setProcesses(p);
  };

  const handleStopProcess = async (id: string) => {
    await bridgeApi.stopProcess(id);
    const p = await bridgeApi.getProcesses();
    setProcesses(p);
  };

  const handleRestartProcess = async (id: string) => {
    await bridgeApi.restartProcess(id);
    const p = await bridgeApi.getProcesses();
    setProcesses(p);
  };

  const handleTriggerDeploy = async (config: any) => {
    const newRecord = await bridgeApi.triggerDeployment(config);
    setDeployments([newRecord, ...deployments]);
  };

  const handleRollback = async (id: string) => {
    await bridgeApi.rollbackDeployment(id);
    setDeployments(deployments.map(d => d.id === id ? { ...d, status: 'rolled_back' } : d));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        health={health} 
      />

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            health={health}
            processes={processes}
            onStartProcess={handleStartProcess}
            onStopProcess={handleStopProcess}
            onRestartProcess={handleRestartProcess}
          />
        )}

        {activeTab === 'dependencies' && (
          <DependenciesTab />
        )}

        {activeTab === 'database' && (
          <DatabaseTab />
        )}

        {activeTab === 'todos' && (
          <DeveloperTodosTab />
        )}

        {activeTab === 'settings' && (
          <SettingsTab />
        )}

        {activeTab === 'deployments' && (
          <DeploymentsTab
            deployments={deployments}
            onTriggerDeploy={handleTriggerDeploy}
            onRollback={handleRollback}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalTab processes={processes} />
        )}

        {activeTab === 'workspaces' && (
          <WorkspacesTab />
        )}

        {activeTab === 'security' && (
          <SecurityTab />
        )}

        {activeTab === 'api_docs' && (
          <ApiDocsTab />
        )}
      </main>
    </div>
  );
};
