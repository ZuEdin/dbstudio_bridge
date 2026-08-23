import React from 'react';
import { 
  Database, Plus, Users, HardDrive, Cloud, Code, Shield, 
  Briefcase, Package, Layout, Monitor, PlayCircle 
} from 'lucide-react';
import { DbType, BackendLanguage, AuthConfig } from '../../../../types/index';

interface NewProjectFormProps {
  activeTab: 'create' | 'templates';
  setActiveTab: (tab: 'create' | 'templates') => void;
  isAdConfigured: boolean;
  user: any;
  newProjectName: string;
  setNewProjectName: (val: string) => void;
  newDbType: DbType;
  setNewDbType: (val: DbType) => void;
  newLanguage: BackendLanguage;
  setNewLanguage: (val: BackendLanguage) => void;
  newProjectType: 'cloud' | 'local';
  setNewProjectType: (val: 'cloud' | 'local') => void;
  authConfig: AuthConfig;
  setAuthConfig: (config: AuthConfig) => void;
  useMultiTenancy: boolean;
  setUseMultiTenancy: (val: boolean) => void;
  tenantField: string;
  setTenantField: (val: string) => void;
  onCreateEmpty: () => void;
  templates: any[];
  onSelectTemplate: (templateId: string) => void;
  t: any;
}

export const NewProjectForm: React.FC<NewProjectFormProps> = ({
  activeTab,
  setActiveTab,
  isAdConfigured,
  user,
  newProjectName,
  setNewProjectName,
  newDbType,
  setNewDbType,
  newLanguage,
  setNewLanguage,
  newProjectType,
  setNewProjectType,
  authConfig,
  setAuthConfig,
  useMultiTenancy,
  setUseMultiTenancy,
  tenantField,
  setTenantField,
  onCreateEmpty,
  templates,
  onSelectTemplate,
  t
}) => {
  const isCreationLocked = isAdConfigured && user?.role !== 'admin';

  if (isCreationLocked) {
    return (
      <div id="project-locked-view" className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80 text-center space-y-6 animate-in fade-in max-w-xl w-full mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
          <Shield size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800">Projekt-Erstellung gesperrt</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Laut Active Directory Richtlinien dürfen **nur Administratoren** neue Projekte (lokal oder Cloud) anlegen.
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 max-w-md mx-auto text-left space-y-2 text-xs text-slate-600">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200/40 pb-1.5">
            <Users size={14} className="text-blue-500" />
            Ihre aktuellen AD-Benutzerdetails:
          </div>
          <p id="ad-user-detail-name">• <strong>Name:</strong> {user?.name || 'Gast'}</p>
          <p id="ad-user-detail-email">• <strong>E-Mail:</strong> {user?.email || 'Keine E-Mail'}</p>
          <p id="ad-user-detail-role">• <strong>Rolle:</strong> <span className="capitalize bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] font-mono">{user?.role || 'user'}</span></p>
        </div>
        <p className="text-xs text-slate-400">
          Bitte kontaktieren Sie Ihren IT-Administrator, um Berechtigungen anzupassen oder ein neues Projekt erstellen zu lassen.
        </p>
      </div>
    );
  }

  return (
    <div id="project-wizard-container" className="max-w-xl w-full z-10 flex flex-col">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 justify-center">
        <button 
          onClick={() => setActiveTab('create')}
          className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {t('start.empty_project')}
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {t('start.templates')}
        </button>
      </div>

      {activeTab === 'create' ? (
        <div id="create-empty-project-form" className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80 space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Active Owner Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-sm shadow">
                {user?.name ? user.name[0] : 'Z'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">{user?.name || 'Zubeyr'}</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">ANGEMELDET</span>
                </div>
                <p className="text-[10px] text-slate-300">{user?.email || 'zuboedin@gmail.com'}</p>
              </div>
            </div>
            <span className="text-[10px] text-blue-300 font-mono bg-blue-900/60 border border-blue-700/50 px-2 py-0.5 rounded font-bold">
              PROJECT OWNER
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800">Neues leeres Projekt konfigurieren</h2>
            <p className="text-xs text-slate-500 mt-0.5">Wählen Sie den Projekt-Typ, Ihre Datenbank und das gewünschte Backend-Framework.</p>
          </div>

          {/* SCHRITT 1: Team Cloud vs. Normales Projekt */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Users size={14} className="text-blue-600" />
              1. Projekt-Typ wählen
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setNewProjectType('cloud')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${newProjectType === 'cloud' ? 'border-blue-600 bg-blue-50/70 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                    <Cloud size={16} className="text-blue-600" />
                    Team Cloud Projekt
                  </div>
                  {newProjectType === 'cloud' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Multi-User Cloud-Sync, AD Domain-Controller Anbindung & Team-Freigaben.
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  Empfohlen für Teams
                </span>
              </div>

              <div 
                onClick={() => setNewProjectType('local')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${newProjectType === 'local' ? 'border-indigo-600 bg-indigo-50/70 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <HardDrive size={16} className="text-indigo-600" />
                    Normales / Lokales Projekt
                  </div>
                  {newProjectType === 'local' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Speichert das Projekt lokal auf diesem Gerät. Ideal für isolated Demos & Tests.
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  Standalone / Offline
                </span>
              </div>
            </div>
          </div>

          {/* SCHRITT 2 & 3: Datenbank & Backend */}
          <div className="grid grid-cols-2 gap-4">
            {/* Database Selection */}
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Database size={13} className="text-emerald-600" />
                2. Datenbank
              </label>
              <div className="space-y-1.5">
                {[
                  { id: DbType.SQL, label: 'SQL Server (.NET)' },
                  { id: DbType.MySQL, label: 'MySQL / MariaDB' },
                  { id: DbType.SQLite, label: 'SQLite (Lokal)' },
                  { id: DbType.NoSQL, label: 'MongoDB / NoSQL' },
                ].map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => setNewDbType(type.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex justify-between items-center ${newDbType === type.id ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'}`}
                  >
                    <span>{type.label}</span>
                    {newDbType === type.id && <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Backend Selection */}
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Code size={13} className="text-indigo-600" />
                3. Backend-Framework
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'dotnet', label: '.NET 10 (C# Enterprise)' },
                  { id: 'nodejs', label: 'Node.js (TypeScript)' },
                  { id: 'python', label: 'Python (FastAPI)' },
                  { id: 'php', label: 'PHP / Laravel' },
                ].map((lang) => (
                  <div 
                    key={lang.id}
                    onClick={() => setNewLanguage(lang.id as BackendLanguage)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex justify-between items-center ${newLanguage === lang.id ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'}`}
                  >
                    <span>{lang.label}</span>
                    {newLanguage === lang.id && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SCHRITT 4: Projektname */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">4. Projektname</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800 shadow-sm"
              placeholder="z.B. MeinKundenPortal"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Optional Settings Accordion */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-600"/> Security, Auth & Mandantenfähigkeit</span>
              <span className="text-[10px] text-slate-400 uppercase">Optional</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:bg-slate-50">
                <input 
                  type="checkbox" 
                  checked={authConfig.useUserLogin} 
                  onChange={e => setAuthConfig({...authConfig, useUserLogin: e.target.checked})}
                  className="rounded text-blue-600"
                />
                <span>Benutzer-Login (JWT)</span>
              </label>
              {newLanguage === 'dotnet' && (
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:bg-slate-50">
                  <input 
                    type="checkbox" 
                    checked={authConfig.useWindowsAuth} 
                    onChange={e => setAuthConfig({...authConfig, useWindowsAuth: e.target.checked})}
                    className="rounded text-blue-600"
                  />
                  <span>Active Directory / Windows Auth</span>
                </label>
              )}
            </div>

            {/* Multi-Tenancy / SaaS Option */}
            <div className="border-t border-slate-200/60 pt-2 text-xs space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={useMultiTenancy} 
                  onChange={e => setUseMultiTenancy(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-600" />
                  Multi-Tenancy / Mandantenfähigkeit (SaaS / Vereins-CMS)
                </span>
              </label>
              
              {useMultiTenancy && (
                <div className="ml-6 space-y-1 animate-in fade-in">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Identifier-Feldname (Tenant Key)</label>
                  <input 
                    type="text" 
                    className="w-full max-w-xs border border-slate-300 rounded p-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={tenantField}
                    onChange={e => setTenantField(e.target.value)}
                    placeholder="z.B. TenantId, ClubId, OrganizationId"
                  />
                  <p className="text-[10px] text-slate-400">Trennstrikte Daten-Isolierung pro Mandant in allen generierten Tabellen & APIs.</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={onCreateEmpty}
            disabled={!newProjectName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            <span>Leeres Projekt Jetzt Erstellen</span>
          </button>
        </div>
      ) : (
        <div id="templates-list-view" className="space-y-4 animate-in fade-in slide-in-from-right-2 bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80">
          <p className="text-center text-slate-500 text-sm mb-4">{t('start.start_schema')}</p>
          
          <div className="grid grid-cols-1 gap-4">
            {templates.map(tmpl => {
              const Icon = tmpl.icon === 'Briefcase' ? Briefcase : tmpl.icon === 'Package' ? Package : tmpl.icon === 'Kanban' ? Layout : tmpl.icon === 'Monitor' ? Monitor : Database;
              return (
                <div 
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl.id)}
                  className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex gap-4 items-start"
                >
                  <div className={`p-3 rounded-lg shrink-0 ${tmpl.category === 'Business' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{tmpl.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">{tmpl.data.backendConfig?.language}</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">{tmpl.data.backendConfig?.dbType}</span>
                    </div>
                  </div>
                  <div className="self-center shrink-0">
                    <PlayCircle size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
