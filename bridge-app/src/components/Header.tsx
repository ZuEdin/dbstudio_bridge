import React from 'react';
import { Activity, Shield, Terminal, FolderGit2, Cpu, FileCode2, ExternalLink, Rocket, Settings, ListTodo, Boxes, Database } from 'lucide-react';
import { EnvironmentHealth } from '../types/bridge';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: EnvironmentHealth;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, health }) => {
  const tabs = [
    { id: 'overview', label: 'Übersicht & SDKs', icon: Activity },
    { id: 'dependencies', label: 'Pakete & Dependencies', icon: Boxes },
    { id: 'database', label: 'Datenbank & Schema', icon: Database },
    { id: 'todos', label: 'Developer TODOs', icon: ListTodo },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
    { id: 'deployments', label: 'Deployments & Releases', icon: Rocket },
    { id: 'terminal', label: 'Live Terminal & Logs', icon: Terminal },
    { id: 'workspaces', label: 'Workspaces', icon: FolderGit2 },
    { id: 'security', label: 'Sicherheit & CORS', icon: Shield },
    { id: 'api_docs', label: 'Web-Payload API', icon: FileCode2 }
  ];

  return (
    <header className="bg-[#0E1524]/90 backdrop-blur-xl border-b border-slate-800/80 shrink-0 z-30 sticky top-0 shadow-lg">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/60">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#080D17] border border-slate-700/80 flex items-center justify-center p-1.5 shadow-md shadow-emerald-950/40 glow-emerald overflow-hidden shrink-0">
            <img src="/favicon-256x256.png" alt="DB Studio Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-2">
                DB Studio Local Bridge
              </h1>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                v1.0.0 Daemon
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Lokaler Ausführungs-, Transpilations- & Build-Agent für DB Studio</p>
          </div>
        </div>

        {/* Global Bridge Status Badges & Swagger Quick Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-slate-300">
              Port: <strong className="text-emerald-400 font-semibold">{health.bridgePort}</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 shadow-inner">
            <span className="text-slate-500">OS:</span>
            <span className="text-slate-200">{health.osPlatform}</span>
          </div>

          <a 
            href="http://localhost:5000/swagger" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-950/50 hover:shadow-emerald-900/60"
          >
            <span>Swagger UI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex px-4 py-1.5 gap-1.5 overflow-x-auto bg-[#0A0F1A]/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
