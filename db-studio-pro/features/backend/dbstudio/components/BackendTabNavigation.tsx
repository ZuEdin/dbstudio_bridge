import React from 'react';
import { Radio, FileText, PlayCircle, Shield, Activity, Layers, Users, Zap } from 'lucide-react';

interface BackendTabNavigationProps {
  mainSectionTab: 'sync' | 'migrations' | 'api_playground' | 'webhooks' | 'security' | 'monitor' | 'self_host' | 'team' | 'deploy';
  setMainSectionTab: (tab: 'sync' | 'migrations' | 'api_playground' | 'webhooks' | 'security' | 'monitor' | 'self_host' | 'team' | 'deploy') => void;
  serverHealth: { connected: boolean; service?: string; version?: string; latency?: number } | null;
  runnerStatus: 'IDLE' | 'RUNNING' | 'STOPPED' | 'ERROR';
  teamMembersCount: number;
}

export const BackendTabNavigation: React.FC<BackendTabNavigationProps> = ({
  mainSectionTab,
  setMainSectionTab,
  serverHealth,
  runnerStatus,
  teamMembersCount,
}) => {
  return (
    <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-4 shrink-0">
      <div className="flex items-center gap-1">
        <button
          id="tab_punkt_1_sync"
          onClick={() => setMainSectionTab('sync')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'sync' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Radio size={14} className={mainSectionTab === 'sync' ? 'animate-pulse text-indigo-200' : ''} />
          <span>Punkt 1: Live Sync & Server-Bridge</span>
          {serverHealth?.connected && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
        </button>

        <button
          id="tab_punkt_2_migrations"
          onClick={() => setMainSectionTab('migrations')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'migrations' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <FileText size={14} />
          <span>Punkt 2: Schema Migrations & DDL</span>
        </button>

        <button
          id="tab_punkt_3_api"
          onClick={() => setMainSectionTab('api_playground')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'api_playground' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <PlayCircle size={14} />
          <span>Punkt 3: REST API Test Suite & E2E</span>
        </button>

        <button
          id="tab_punkt_webhooks"
          onClick={() => setMainSectionTab('webhooks')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'webhooks' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Zap size={14} className={mainSectionTab === 'webhooks' ? 'text-amber-300' : 'text-amber-400'} />
          <span>⚡ Inbound Webhook Hub</span>
        </button>

        <button
          id="tab_punkt_4_security"
          onClick={() => setMainSectionTab('security')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'security' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Shield size={14} />
          <span>Punkt 4: RBAC & Dynamic RLS</span>
        </button>

        <button
          id="tab_punkt_5_monitor"
          onClick={() => setMainSectionTab('monitor')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'monitor' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Activity size={14} />
          <span>Punkt 5: Live Monitor & Audit Logs</span>
        </button>

        <button
          id="tab_punkt_arch"
          onClick={() => setMainSectionTab('self_host')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'self_host' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Layers size={14} />
          <span>Metadaten-Schema & Cloud Assistent</span>
        </button>

        <button
          id="tab_punkt_team"
          onClick={() => setMainSectionTab('team')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'team' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Users size={14} />
          <span>👥 Team & Cloud Projekte</span>
          {teamMembersCount > 0 && (
            <span className="bg-indigo-900 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ml-1">
              {teamMembersCount}
            </span>
          )}
        </button>

        <button
          id="tab_punkt_deploy"
          onClick={() => setMainSectionTab('deploy')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'deploy' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'}`}
        >
          <PlayCircle size={14} className={runnerStatus === 'RUNNING' ? 'animate-pulse text-emerald-300' : ''} />
          <span>🚀 Live Server Runner (Ports 10k-60k)</span>
          {runnerStatus === 'RUNNING' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1"></span>
          )}
        </button>
      </div>

      {serverHealth && (
        <div className="flex items-center gap-2 text-[11px] font-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
          <span className={`w-2 h-2 rounded-full ${serverHealth.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
          <span className="text-slate-300 font-semibold">{serverHealth.connected ? 'Self-Host Verbunden' : 'Server Offline'}</span>
          {serverHealth.latency !== undefined && <span className="text-slate-500">({serverHealth.latency}ms)</span>}
        </div>
      )}
    </div>
  );
};
