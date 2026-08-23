import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Database, FolderOpen, RefreshCw, Upload } from 'lucide-react';
import { DbType, Project, BackendLanguage, AuthConfig, BackendConfig, ProjectData } from '../../types/index';
import { sanitizeProjectName } from '../../utils/nameUtils';
import { getAllProjects, deleteProjectFromStorage, saveProjectToStorage, getProjectById } from '../../services/storageService';
import { cloudService } from '../../services/cloudService';
import { getTemplates } from '../../data/templates/index';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { getApiUrl } from '../../stores/useConfigStore';

// Subcomponents imports
import { WhoAmIStatus } from './components/selector/WhoAmIStatus';
import { TeamCloudAuth } from './components/selector/TeamCloudAuth';
import { ProjectList } from './components/selector/ProjectList';
import { ManageMembersModal } from './components/selector/ManageMembersModal';
import { NewProjectForm } from './components/selector/NewProjectForm';
import { ProjectActionDialogs } from './components/selector/ProjectActionDialogs';

interface ProjectSelectionViewProps {
  onSelectProject: (project: Project) => void;
  onCreateNew: (type: DbType, name: string, config?: BackendConfig, initialData?: Partial<ProjectData>) => void;
}

export const DatabaseSelector: React.FC<ProjectSelectionViewProps> = ({ onSelectProject, onCreateNew }) => {
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [cloudProjects, setCloudProjects] = useState<Project[]>([]);
  const [activeSource, setActiveSource] = useState<'local' | 'cloud'>('local');
  const [activeTab, setActiveTab] = useState<'create' | 'templates'>('create');
  const [loading, setLoading] = useState(false);
  
  const { t, i18n } = useTranslation();
  const { user, whoamiData, login, register } = useAuthStore();
  const templates = useMemo(() => getTemplates(i18n.language), [i18n.language]);

  // Backend & AD/LDAP configuration auto-detection state
  const [backendDetected, setBackendDetected] = useState<boolean>(false);
  const [isAdConfigured, setIsAdConfigured] = useState<boolean>(false);
  const [adServerAddress, setAdServerAddress] = useState<string>('');

  // Login form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newDbType, setNewDbType] = useState<DbType>(DbType.SQL);
  const [newLanguage, setNewLanguage] = useState<BackendLanguage>('dotnet');
  const [newProjectType, setNewProjectType] = useState<'cloud' | 'local'>('cloud');
  
  // Dialog State (to avoid native confirm/alert)
  const [dialog, setDialog] = useState<{ 
      isOpen: boolean; 
      type: 'confirm' | 'alert'; 
      title: string; 
      message: string; 
      onConfirm?: () => void; 
  } | null>(null);

  const [copyingProject, setCopyingProject] = useState<Project | null>(null);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Auth Config
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
      useWindowsAuth: false,
      useAdGroups: false,
      adGroups: '',
      useUserLogin: false,
      isMobileReady: false,
      devBypass: true
  });
  
  const [useMultiTenancy, setUseMultiTenancy] = useState(false);
  const [tenantField, setTenantField] = useState('ClubId');
  
  const [ssoProviders, setSsoProviders] = useState<string[]>([]);

  // Manage Project Members State
  const [managingMembersProject, setManagingMembersProject] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [adUsers, setAdUsers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [addingMemberRole, setAddingMemberRole] = useState('Entwickler');

  const filteredAdUsers = useMemo(() => {
    if (!memberSearchQuery) return adUsers;
    return adUsers.filter(u => 
      u.displayName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
  }, [memberSearchQuery, adUsers]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-detect live backend on mount
    const detectBackend = async () => {
      try {
        const res = await fetch(getApiUrl('/api/health'), { credentials: 'include' });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          setBackendDetected(true);
          // Auto-configure Team-Cloud mode
          setActiveSource('cloud');
          
          // Get AD status from backend
          const ldapRes = await fetch(getApiUrl('/api/auth/ldap-check'), { credentials: 'include' });
          if (ldapRes.ok && ldapRes.headers.get('content-type')?.includes('application/json')) {
            const ldapData = await ldapRes.json();
            const adActive = Boolean(ldapData.isAdConfigured);
            setIsAdConfigured(adActive);
            if (ldapData.serverAddress) setAdServerAddress(ldapData.serverAddress);
          }
          await useAuthStore.getState().checkAdSession();
        }
      } catch (err) {
        console.warn('Backend auto-detection failed:', err);
      }
    };
    
    detectBackend();
    loadProjects();
  }, []);

  const handleLoginSubmit = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    setLoginSubmitting(true);
    setLoginError('');
    try {
      if (isRegistering) {
        const success = await register(loginEmail, loginPassword, loginName);
        if (success) {
          await login(loginEmail, loginPassword);
          await loadProjects();
        } else {
          setLoginError('Registrierung fehlgeschlagen. Möglicherweise existiert der Benutzer bereits.');
        }
      } else {
        const success = await login(loginEmail, loginPassword);
        if (success) {
          await loadProjects();
        } else {
          setLoginError('Ungültige Anmeldedaten. Wenn Sie kein Domänenkonto haben, registrieren Sie sich bitte.');
        }
      }
    } catch (err) {
      setLoginError('Ein Fehler ist aufgetreten.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
        const allProjects = await getAllProjects();
        const local = allProjects.filter(p => !p.isCloud);
        const cloudFromLocal = allProjects.filter(p => p.isCloud);

        // Fetch cloud projects from server
        const cloudRemote = await cloudService.getProjects();

        const cloudMap = new Map<string, Project>();
        cloudFromLocal.forEach(p => cloudMap.set(p.id, p));
        // Server takes priority for cloud projects
        if (cloudRemote && cloudRemote.length > 0) {
            cloudMap.clear();
            cloudRemote.forEach(p => cloudMap.set(p.id, p));
        }

        setLocalProjects(local);
        setCloudProjects(Array.from(cloudMap.values()));
    } finally {
        setLoading(false);
    }
  };

  const closeDialog = () => setDialog(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDialog({
        isOpen: true,
        type: 'confirm',
        title: 'Projekt löschen',
        message: t('start.msg_delete'),
        onConfirm: async () => {
            await deleteProjectFromStorage(id);
            loadProjects();
            closeDialog();
        }
    });
  };

  const handleCopyClick = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setCopyingProject(p);
    setRenameValue(`${p.name} - Kopie`);
  };

  const handleRenameClick = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setRenamingProject(p);
    setRenameValue(p.name);
  };

  const handleManageMembers = async (p: Project) => {
    setManagingMembersProject(p);
    setMemberSearchQuery('');
    setProjectMembers((p as any).teamMembers || []);
    setAdUsers([]);
    
    try {
      const adResponse = await fetch(getApiUrl('/api/ad/users'), { credentials: 'include' });
      if (adResponse.ok) {
        const adData = await adResponse.json();
        setAdUsers(adData || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der AD-Benutzer:', err);
    }
  };

  const addProjectMember = async (adUser: any) => {
    if (!managingMembersProject) return;
    try {
      const response = await fetch(getApiUrl(`/api/team/projects/${managingMembersProject.id}/members`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'user'
        },
        body: JSON.stringify({
          userId: adUser.username,
          name: adUser.displayName || adUser.username,
          email: adUser.email,
          role: addingMemberRole
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          setProjectMembers(data.project.teamMembers || []);
          setCloudProjects(cloudProjects.map(item => item.id === data.project.id ? data.project : item));
        } else {
          setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Fehler beim Hinzufügen',
            message: data.error || 'Mitglied konnte nicht hinzugefügt werden.'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'Fehler beim Hinzufügen',
          message: errorData.error || 'Der Server hat den Zugriff verweigert.'
        });
      }
    } catch (err) {
      console.error('Fehler beim Hinzufügen des Mitglieds:', err);
    }
  };

  const removeProjectMember = async (memberId: string) => {
    if (!managingMembersProject) return;
    try {
      const response = await fetch(getApiUrl(`/api/team/projects/${managingMembersProject.id}/members/${memberId}`), {
        method: 'DELETE',
        headers: {
          'x-user-role': user?.role || 'user'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          setProjectMembers(data.project.teamMembers || []);
          setCloudProjects(cloudProjects.map(item => item.id === data.project.id ? data.project : item));
        } else {
          setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Fehler beim Entfernen',
            message: data.error || 'Mitglied konnte nicht entfernt werden.'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'Fehler beim Entfernen',
          message: errorData.error || 'Der Server hat den Zugriff verweigert.'
        });
      }
    } catch (err) {
      console.error('Fehler beim Entfernen des Mitglieds:', err);
    }
  };

  const handleCreate = () => {
    if (newProjectName.trim()) {
      let finalAuthConfig = { ...authConfig };
      if (authConfig.useWindowsAuth && authConfig.useAdGroups && authConfig.adGroups) {
          const groups = authConfig.adGroups.split(',').map(g => g.trim()).filter(g => g);
          finalAuthConfig.adMapping = groups.map(g => ({ groupName: g, roleName: 'User' }));
      }

      const config: BackendConfig = {
          language: newLanguage,
          backendVersion: newLanguage === 'dotnet' ? '10.0' : undefined,
          dbType: newDbType,
          projectName: sanitizeProjectName(newProjectName),
          port: 5000,
          dbConnection: newDbType === DbType.SQLite ? 'Data Source=app.db' 
                        : newDbType === DbType.MySQL ? 'Server=localhost;Database=mydb;User=root;Password=password;'
                        : 'Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;',
          useSwagger: true,
          frontendFramework: 'react',
          authConfig: finalAuthConfig,
          multiTenancy: useMultiTenancy ? { enabled: true, strategy: 'discriminator', tenantField } : undefined,
          integrations: ssoProviders.length > 0 ? {
              sso: ssoProviders.map(p => ({ provider: p as 'google' | 'microsoft' | 'apple' | 'github', clientId: '' })),
              storage: { provider: 'local' },
              webhooks: []
          } : undefined
      };
      const isCloud = newProjectType === 'cloud';
      const ownerName = user?.displayName || user?.name || whoamiData?.displayName || whoamiData?.username || user?.email || 'Administrator';
      const rawEmail = user?.email || whoamiData?.email;
      const ownerEmail = (rawEmail && rawEmail.includes('@') && rawEmail.includes('.'))
        ? rawEmail
        : `${ownerName.toLowerCase().replace(/[^a-z0-9.]/g, '')}@firma.de`;

      if (isCloud) {
        setActiveSource('cloud');
        cloudService.createProject({
          id: crypto.randomUUID(),
          name: newProjectName,
          lastModified: Date.now(),
          isCloud: true,
          owner: ownerName,
          ownerEmail: ownerEmail,
          data: {
            tables: [], queries: [], relationships: [], layout: [], tableGroups: [],
            backendConfig: config
          }
        } as any);
      }
      onCreateNew(newDbType, newProjectName, config, { isCloud, owner: ownerName } as any);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
          const config = tmpl.data.backendConfig!;
          onCreateNew(config.dbType, tmpl.name, config, tmpl.data);
      }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const project = JSON.parse(json) as Project;
        
        if (!project.id || !project.data || !project.data.tables) {
            throw new Error("Ungültiges Dateiformat");
        }

        const finalizeImport = async (p: Project) => {
            p.lastModified = Date.now();
            await saveProjectToStorage(p);
            await loadProjects();
            setDialog({
                isOpen: true,
                type: 'alert',
                title: 'Import',
                message: t('start.msg_import_success')
            });
        };

        const existing = localProjects.find(p => p.id === project.id);
        if (existing) {
             setDialog({
                isOpen: true,
                type: 'confirm',
                title: 'Projekt existiert',
                message: t('start.msg_overwrite', { name: project.name }),
                onConfirm: async () => {
                    await finalizeImport(project);
                    closeDialog();
                }
             });
        } else {
            await finalizeImport(project);
        }

      } catch (err) {
        setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Fehler',
            message: `${t('start.msg_import_error')}: ${err}`
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmCopy = async () => {
    if (!renameValue.trim() || !copyingProject) return;
    setLoading(true);
    try {
        const original = await getProjectById(copyingProject.id);
        if (original) {
            const newId = crypto.randomUUID();
            const cleanName = sanitizeProjectName(renameValue);
            const clone: Project = {
                ...original,
                id: newId,
                name: renameValue,
                lastModified: Date.now(),
                data: {
                    ...original.data,
                    backendConfig: {
                        ...original.data.backendConfig,
                        projectName: cleanName
                    } as BackendConfig
                }
            };
            await saveProjectToStorage(clone);
            await loadProjects();
        }
    } finally {
        setLoading(false);
        setCopyingProject(null);
    }
  };

  const handleConfirmRename = async () => {
    if (!renameValue.trim() || !renamingProject) return;
    setLoading(true);
    try {
        const original = await getProjectById(renamingProject.id);
        if (original) {
            const cleanName = sanitizeProjectName(renameValue);
            const updated: Project = {
                ...original,
                name: renameValue,
                lastModified: Date.now(),
                data: {
                    ...original.data,
                    backendConfig: {
                        ...original.data.backendConfig,
                        projectName: cleanName
                    } as BackendConfig
                }
            };
            await saveProjectToStorage(updated);
            await loadProjects();
        }
    } finally {
        setLoading(false);
        setRenamingProject(null);
    }
  };

  const projects = activeSource === 'local' ? localProjects : cloudProjects;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden relative">
      
      {/* Language Selector Top Right */}
      <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
      </div>

      {/* Left Panel: Recent / Open */}
      <div className="w-5/12 p-8 flex flex-col border-r border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Database className="text-blue-600" /> {t('app.name')}
        </h1>
        <p className="text-slate-500 mb-6 text-sm">{t('app.description')}</p>

        {/* User Session Info / Logout */}
        {user?.isAuthenticated && (
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs text-slate-700 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold uppercase text-xs border border-blue-200 shadow-sm">
                        {(user.displayName || user.name || 'U')[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-800">{user.displayName || user.name}</p>
                            {user.isAdUser && (
                                <span className="text-[8px] bg-blue-100 text-blue-700 font-extrabold px-1 rounded border border-blue-200">AD</span>
                            )}
                        </div>
                        {user.email && <p className="text-[10px] text-slate-500 mb-0.5 leading-tight">{user.email}</p>}
                    </div>
                </div>
                <button 
                    onClick={() => {
                        useAuthStore.getState().logout();
                        setActiveSource('local');
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold hover:underline transition-all cursor-pointer"
                >
                    Abmelden
                </button>
            </div>
        )}

        {/* Source Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6 self-start">
            <button 
                onClick={() => setActiveSource('local')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSource === 'local' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Database size={16}/> Lokal
            </button>
            {(user?.isAuthenticated || backendDetected) && (
                <button 
                    onClick={() => setActiveSource('cloud')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSource === 'cloud' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Database size={16}/> Team Cloud
                    {!user?.isAuthenticated && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                </button>
            )}
        </div>

        <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                <FolderOpen size={16} /> {activeSource === 'local' ? 'Lokale Projekte' : 'Team Projekte'}
                <button onClick={loadProjects} className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors" title="Liste aktualisieren">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </h2>
            <label className="cursor-pointer text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Upload size={12}/> {t('start.import')}
                <input type="file" ref={fileInputRef} accept=".dbsp" className="hidden" onChange={handleImport} />
            </label>
        </div>

        {activeSource === 'cloud' && !user?.isAuthenticated && !whoamiData?.username ? (
            <TeamCloudAuth
                isAdConfigured={isAdConfigured}
                onCheckAdSession={() => useAuthStore.getState().checkAdSession()}
                isRegistering={isRegistering}
                setIsRegistering={setIsRegistering}
                loginEmail={loginEmail}
                setLoginEmail={setLoginEmail}
                loginPassword={loginPassword}
                setLoginPassword={setLoginPassword}
                loginName={loginName}
                setLoginName={setLoginName}
                loginError={loginError}
                loginSubmitting={loginSubmitting}
                onLoginSubmit={handleLoginSubmit}
            />
        ) : (
            <ProjectList
                projects={projects}
                activeSource={activeSource}
                user={user}
                onSelectProject={onSelectProject}
                onManageMembers={handleManageMembers}
                onRenameClick={handleRenameClick}
                onCopyClick={handleCopyClick}
                onDeleteClick={handleDelete}
                t={t}
            />
        )}
      </div>

      {/* Right Panel: Create New */}
      <div className="w-7/12 p-8 bg-slate-50 flex flex-col items-center relative overflow-y-auto">
         <NewProjectForm
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isAdConfigured={isAdConfigured}
            user={user}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            newDbType={newDbType}
            setNewDbType={setNewDbType}
            newLanguage={newLanguage}
            setNewLanguage={setNewLanguage}
            newProjectType={newProjectType}
            setNewProjectType={setNewProjectType}
            authConfig={authConfig}
            setAuthConfig={setAuthConfig}
            useMultiTenancy={useMultiTenancy}
            setUseMultiTenancy={setUseMultiTenancy}
            tenantField={tenantField}
            setTenantField={setTenantField}
            onCreateEmpty={handleCreate}
            templates={templates}
            onSelectTemplate={handleTemplateSelect}
            t={t}
         />
      </div>

      {/* Manage Project Members Modal */}
      {managingMembersProject && (
          <ManageMembersModal
              project={managingMembersProject}
              onClose={() => setManagingMembersProject(null)}
              user={user}
              projectMembers={projectMembers}
              adUsers={adUsers}
              memberSearchQuery={memberSearchQuery}
              setMemberSearchQuery={setMemberSearchQuery}
              addingMemberRole={addingMemberRole}
              setAddingMemberRole={setAddingMemberRole}
              filteredAdUsers={filteredAdUsers}
              onAddMember={addProjectMember}
              onRemoveMember={removeProjectMember}
          />
      )}

      {/* Action Dialogs (Confirm, Alert, Rename, Copy) */}
      <ProjectActionDialogs
          dialog={dialog}
          onCloseDialog={closeDialog}
          copyingProject={copyingProject}
          onCloseCopyDialog={() => setCopyingProject(null)}
          renamingProject={renamingProject}
          onCloseRenameDialog={() => setRenamingProject(null)}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onConfirmCopy={handleConfirmCopy}
          onConfirmRename={handleConfirmRename}
      />

    </div>
  );
};
