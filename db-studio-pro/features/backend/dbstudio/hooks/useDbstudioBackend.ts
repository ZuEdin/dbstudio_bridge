import React, { useState, useEffect, useRef } from 'react';
import { Table, Query, Relationship } from '../../../../types/index';
import { useConfigStore, getApiUrl } from '../../../../stores/useConfigStore';
import { useProjectStore } from '../../../../stores/useProjectStore';
import { handleDownloadSelfHostZip } from '../utils/zipGenerator';
import { FkError, RbacRole, AuditLog, TeamProject, TeamMember, SystemTable } from '../types';

interface UseDbstudioBackendProps {
  tables: Table[];
  relationships: Relationship[];
  queries: Query[];
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const useDbstudioBackend = ({
  tables,
  relationships,
  queries,
  showMessage,
}: UseDbstudioBackendProps) => {
  const { config, updateConfig } = useConfigStore();
  const backendConfig = useProjectStore((state) => state.backendConfig);
  const [activeMode, setActiveMode] = useState<'local' | 'cloud'>('local');

  const [selectedTables, setSelectedTables] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tables.forEach((t) => {
      initial[t.id] = true;
    });
    return initial;
  });

  const [selectedQueries, setSelectedQueries] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    queries.forEach((q) => {
      initial[q.id] = true;
    });
    return initial;
  });

  const [implementGoal, setImplementGoal] = useState('Kundenverwaltung und Rechnungs-Abfragen im Team bereitstellen');
  const [genCrud, setGenCrud] = useState(true);
  const [genTypes, setGenTypes] = useState(true);
  const [enableRls, setEnableRls] = useState(true);
  const [backendTemplate, setBackendTemplate] = useState<'express' | 'nestjs'>('express');
  const [authProvider, setAuthProvider] = useState<'jwt' | 'google' | 'github'>('jwt');
  const [selfHostLang, setSelfHostLang] = useState<'nodejs' | 'csharp' | 'php' | 'python'>('nodejs');
  const [subfolderPath, setSubfolderPath] = useState<string>('');
  const [includeWwwroot, setIncludeWwwroot] = useState<boolean>(true);
  const [showSelfHostConfigModal, setShowSelfHostConfigModal] = useState<boolean>(false);

  const [mainSectionTab, setMainSectionTab] = useState<'sync' | 'migrations' | 'api_playground' | 'webhooks' | 'security' | 'monitor' | 'self_host' | 'team' | 'deploy'>('sync');

  // --- DEPLOY Tab States ---
  const [deployedPort, setDeployedPort] = useState<number | null>(null);
  const [deployedPid, setDeployedPid] = useState<number | null>(null);
  const [runnerStatus, setRunnerStatus] = useState<'IDLE' | 'RUNNING' | 'STOPPED' | 'ERROR'>('IDLE');
  const [runnerLogs, setRunnerLogs] = useState<string[]>([]);
  const [isDeployingServer, setIsDeployingServer] = useState<boolean>(false);

  // --- SYNC Tab States ---
  const [remoteServerUrl, setRemoteServerUrl] = useState<string>(() => {
    const configApiUrl = useConfigStore.getState().config.apiUrl;
    if (configApiUrl) return configApiUrl;
    return 'http://localhost:5000';
  });
  const [serverHealth, setServerHealth] = useState<{ connected: boolean; service?: string; version?: string; latency?: number } | null>(null);
  const [isTestingServer, setIsTestingServer] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [liveSyncStatus, setLiveSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [liveSyncStatusMsg, setLiveSyncStatusMsg] = useState<string>('');

  // SQL Server background states
  const [externalSqlConnected, setExternalSqlConnected] = useState<boolean>(true);
  const [externalSqlLogs, setExternalSqlLogs] = useState<any[]>([]);
  const [isSyncingSql, setIsSyncingSql] = useState<boolean>(false);

  // --- MIGRATIONS Tab States ---
  const [migrationDialect, setMigrationDialect] = useState<'sql' | 'drizzle' | 'knex' | 'prisma'>('sql');

  // --- API PLAYGROUND Tab States ---
  const [apiSpecTab, setApiSpecTab] = useState<'playground' | 'e2e_tests' | 'openapi' | 'postman'>('playground');
  const [playgroundTable, setPlaygroundTable] = useState<string>(tables[0]?.name || 'sys_projects');
  const [playgroundMethod, setPlaygroundMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [playgroundPayload, setPlaygroundPayload] = useState<string>('{\n  "name": "Neuer Testeintrag",\n  "status": "AKTIV"\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState<{ status: number; statusText: string; timeMs: number; data: any } | null>(null);
  const [isExecutingApiReq, setIsExecutingApiReq] = useState<boolean>(false);

  // --- SECURITY Tab States ---
  const [rbacRoles, setRbacRoles] = useState<Array<{ name: string; description: string; permissions: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }> }>>([
    {
      name: 'ADMIN',
      description: 'Vollzugriff auf alle Tabellen und System-Metadaten',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: true, create: true, update: true, delete: true } }), {})
    },
    {
      name: 'EDITOR',
      description: 'Kann Inhalte lesen, erstellen und bearbeiten, aber nicht löschen',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: true, create: true, update: true, delete: false } }), {})
    },
    {
      name: 'VIEWER',
      description: 'Nur Lesezugriff auf freigegebene Tabellen',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: true, create: false, update: false, delete: false } }), {})
    },
    {
      name: 'GUEST',
      description: 'Eingeschränkter anonymer Zugriff',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: false, create: false, update: false, delete: false } }), {})
    }
  ]);
  const [selectedRole, setSelectedRole] = useState<string>('EDITOR');
  const [jwtExpiry, setJwtExpiry] = useState<string>('15m');
  const [rateLimitMax, setRateLimitMax] = useState<number>(120);
  const [corsOrigins, setCorsOrigins] = useState<string>('http://localhost:5000, http://localhost:3000, https://app.mydomain.com');

  // --- MONITOR Tab States ---
  const [qpsCount, setQpsCount] = useState<number>(24);
  const [avgLatency, setAvgLatency] = useState<number>(3.2);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; action: string; user: string; role: string; details: string; latencyMs: number; status: 'SUCCESS' | 'WARN' | 'ERROR' }>>([
    { id: 'log_1', timestamp: new Date(Date.now() - 3000).toLocaleTimeString(), action: 'SELECT', user: 'admin_user', role: 'ADMIN', details: `SELECT * FROM ${tables[0]?.name || 'sys_projects'} LIMIT 50`, latencyMs: 1.8, status: 'SUCCESS' },
    { id: 'log_2', timestamp: new Date(Date.now() - 9000).toLocaleTimeString(), action: 'INSERT', user: 'editor_1', role: 'EDITOR', details: `INSERT INTO ${tables[0]?.name || 'sys_projects'} (name) VALUES ('Neu')`, latencyMs: 4.2, status: 'SUCCESS' },
    { id: 'log_3', timestamp: new Date(Date.now() - 18000).toLocaleTimeString(), action: 'UPDATE', user: 'editor_1', role: 'EDITOR', details: `UPDATE ${tables[0]?.name || 'sys_projects'} SET status = 'AKTIV' WHERE id = 1`, latencyMs: 3.1, status: 'SUCCESS' },
    { id: 'log_4', timestamp: new Date(Date.now() - 32000).toLocaleTimeString(), action: 'SECURITY_CHECK', user: 'guest_user', role: 'GUEST', details: `ACCESS DENIED: DELETE FROM ${tables[0]?.name || 'sys_projects'}`, latencyMs: 0.9, status: 'WARN' }
  ]);

  // --- SYNC / UPLOAD STATES ---
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'generating' | 'uploading' | 'completed' | 'error'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // --- FK VALIDATION STATES ---
  const [fkErrors, setFkErrors] = useState<FkError[]>([]);
  const [showFkValidationModal, setShowFkValidationModal] = useState(false);

  // --- SYSTEM METADATA SCHEMA EXPLORER ACTIVE TABLE ---
  const [selectedSystemTable, setSelectedSystemTable] = useState<string>('sys_projects');

  // --- BACKEND-DETEKTOR & COLLABORATION STATES ---
  const [backendDetected, setBackendDetected] = useState<boolean>(false);
  const [adConnected, setAdConnected] = useState<boolean>(true);
  const [adServerAddress, setAdServerAddress] = useState<string>('ldap://ads.firma.local:389');
  const [adBaseDn, setAdBaseDn] = useState<string>('DC=firma,DC=local');
  const [adServiceAccountUsername, setAdServiceAccountUsername] = useState<string>('');
  const [adServiceAccountPassword, setAdServiceAccountPassword] = useState<string>('');
  const [adGroupMappings, setAdGroupMappings] = useState<{ id: string; adGroup: string; appRole: string }[]>([
    { id: '1', adGroup: 'firma\\administratoren', appRole: 'Administrator' },
    { id: '2', adGroup: 'firma\\manager', appRole: 'Manager' },
    { id: '3', adGroup: 'firma\\coder', appRole: 'Manager' }
  ]);
  const [teamProjects, setTeamProjects] = useState<TeamProject[]>([
    { id: "proj_billing", name: "Kunden- & Rechnungsverwaltung", description: "Zentrales Rechnungsprojekt des Finanz-Teams", status: "AKTIV", memberCount: 3 },
    { id: "proj_inventory", name: "Lagerbestand & Logistik", description: "Echtzeit-Tracking für das Hauptlager", status: "ENTWURF", memberCount: 2 }
  ]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { email: "zuboedin@gmail.com", role: "Administrator", name: "Zubeyr", source: "Lokal" },
    { email: "sarah.web@firma.de", role: "Entwicklerin", name: "Sarah Müller", source: "AD / Active Directory" },
    { email: "tom.db@firma.de", role: "Architekt", name: "Tom Schmidt", source: "AD / Active Directory" }
  ]);
  const [activeTeamProjectId, setActiveTeamProjectId] = useState<string>("proj_billing");
  
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('Entwickler');
  const [editingMember, setEditingMember] = useState<any | null>(null);

  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjDesc, setNewProjDesc] = useState<string>('');
  const [showNewProjModal, setShowNewProjModal] = useState<boolean>(false);
  const [showTeamChatModal, setShowTeamChatModal] = useState<boolean>(false);

  // Sync config.apiUrl when remoteServerUrl changes
  useEffect(() => {
    if (remoteServerUrl && remoteServerUrl !== config.apiUrl) {
      updateConfig({ apiUrl: remoteServerUrl });
    }
  }, [remoteServerUrl]);

  // Auto-detect backend on mount
  useEffect(() => {
    const detectBackend = async () => {
      const configApiUrl = useConfigStore.getState().config.apiUrl;
      const detectUrl = configApiUrl || 'http://localhost:5000';
      try {
        const res = await fetch(`${detectUrl}/api/health`);
        const isJsonRes = res.ok && res.headers.get('content-type')?.includes('application/json');
        if (isJsonRes) {
          const data = await res.json();
          setBackendDetected(true);
          setRemoteServerUrl(detectUrl);
          setServerHealth({
            connected: true,
            service: data.Service || "Enterprise Backend",
            version: data.Version || "2.1.0",
            latency: 5
          });
          if (config.mode === 'REGISTERED') {
            setActiveMode('cloud');
            showMessage("Schnittstelle Erkannt", "DB Studio Pro wurde automatisch mit dem laufenden Enterprise-Backend gekoppelt.", "success");
          } else {
            setActiveMode('local');
            showMessage("Simulation Aktiv", "Lokaler Simulations-Modus aktiv. Enterprise-Backend wurde erkannt, ist aber in den Einstellungen nicht auf PRODUKTIV gesetzt.", "info");
          }
          
          try {
            const pRes = await fetch(`${detectUrl}/api/team/projects`);
            if (pRes.ok && pRes.headers.get('content-type')?.includes('application/json')) {
              const pData = await pRes.json();
              if (Array.isArray(pData)) setTeamProjects(pData);
            }
            
            const mRes = await fetch(`${detectUrl}/api/auth/ldap-check`);
            if (mRes.ok && mRes.headers.get('content-type')?.includes('application/json')) {
              const mData = await mRes.json();
              setAdConnected(Boolean(mData.isAdConfigured));
              if (mData.serverAddress) setAdServerAddress(mData.serverAddress);
              if (mData.baseDn) setAdBaseDn(mData.baseDn);
              if (Array.isArray(mData.users)) setTeamMembers(mData.users);
            }
          } catch (e) {
            console.error("Fehler beim Laden der Live-Daten:", e);
          }
        }
      } catch (err) {
        console.log("Kein lokales Live-Backend detektiert. DB Studio läuft im Offline-Modus (Simulation aktiv).");
      }
    };
    detectBackend();
  }, []);

  // Background Auto-Sync Effect
  useEffect(() => {
    const targetUrl = remoteServerUrl ? (remoteServerUrl.endsWith('/') ? remoteServerUrl.slice(0, -1) : remoteServerUrl) : getApiUrl('');
    
    // 1. Initial fetch
    const fetchStatusAndLogs = async () => {
      try {
        const connQuery = `connectionString=${encodeURIComponent(backendConfig?.dbConnection || '')}&dbType=${encodeURIComponent(backendConfig?.dbType || '')}`;
        const res = await fetch(`${targetUrl}/api/db/connection-status?${connQuery}`);
        if (res.ok) {
          const data = await res.json();
          setExternalSqlConnected(data.connected);
        }
        const logsRes = await fetch(`${targetUrl}/api/db/sync-logs`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setExternalSqlLogs(logsData);
        }
      } catch (e) {
        console.warn('Fehler beim Abrufen des SQL Hintergrund-Status:', e);
      }
    };
    fetchStatusAndLogs();

    // 2. Continuous interval
    const interval = setInterval(async () => {
      // Poll connection status
      try {
        const connQuery = `connectionString=${encodeURIComponent(backendConfig?.dbConnection || '')}&dbType=${encodeURIComponent(backendConfig?.dbType || '')}`;
        const res = await fetch(`${targetUrl}/api/db/connection-status?${connQuery}`);
        if (res.ok) {
          const data = await res.json();
          setExternalSqlConnected(data.connected);
        }
        const logsRes = await fetch(`${targetUrl}/api/db/sync-logs`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setExternalSqlLogs(logsData);
        }
      } catch (e) {
        console.warn('Fehler beim Hintergrund-Poll:', e);
      }

      // If autoSync is enabled, run high-performance schema synchronization
      if (autoSyncEnabled) {
        setIsSyncingSql(true);
        try {
          let host = 'localhost';
          let database = 'production_db';
          let type = 'mssql';

          const connStr = backendConfig?.dbConnection || '';
          if (connStr) {
            if (connStr.includes('://')) {
              try {
                const url = new URL(connStr);
                host = url.hostname;
                database = url.pathname.replace(/^\//, '');
                type = url.protocol.replace(':', '');
              } catch (e) {
                // ignore
              }
            } else {
              const parts = connStr.split(';');
              for (const part of parts) {
                const eqIndex = part.indexOf('=');
                if (eqIndex > 0) {
                  const key = part.substring(0, eqIndex).trim().toLowerCase();
                  const val = part.substring(eqIndex + 1).trim();
                  if (key === 'server' || key === 'host' || key === 'data source' || key === 'datasource') {
                    host = val;
                  } else if (key === 'database' || key === 'initial catalog' || key === 'db') {
                    database = val;
                  }
                }
              }
              if (connStr.toLowerCase().includes('sqlite') || connStr.toLowerCase().includes('.db')) {
                type = 'sqlite';
              } else if (connStr.toLowerCase().includes('port=') || connStr.toLowerCase().includes('postgresql')) {
                type = 'postgresql';
              }
            }
          }

          const activeTables = tables.filter(t => selectedTables[t.id]);
          const syncPayload: any = {
            tables: activeTables,
            queries,
            relationships
          };
          if (backendConfig?.dbConnection) {
            syncPayload.connection = {
              host,
              database,
              type
            };
          }
          const syncRes = await fetch(`${targetUrl}/api/db/sync-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload)
          });

          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.externalConnected === false) {
              setLiveSyncStatus('error');
              setLiveSyncStatusMsg("SQL-Server offline. Lokale IndexedDB dient als sichere Backupdatei.");
            } else {
              setLiveSyncStatus('success');
              setLiveSyncStatusMsg(`Hintergrund Auto-Sync erfolgreich durchgeführt um ${new Date().toLocaleTimeString()}!`);
            }
          }
        } catch (e) {
          console.warn('Fehler im Auto-Sync Push:', e);
          setLiveSyncStatus('error');
          setLiveSyncStatusMsg("Server-Schnittstelle nicht erreichbar. Lokale Offline-Kopie aktiv.");
        } finally {
          setIsSyncingSql(false);
        }
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, tables, queries, relationships, remoteServerUrl, selectedTables, backendConfig]);

  const generateFullProjectCode = () => {
    if (selfHostLang === 'csharp') {
      return `// .NET C# Enterprise Backend API - Generated by DB Studio Pro
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseRouting();
app.UseAuthorization();

${tables.map(t => `// API Endpoint: /api/${t.name.toLowerCase()}
app.MapGet("/api/${t.name.toLowerCase()}", () => Results.Ok(new[] { new { Id = 1, Status = "Live Active Entity from .NET Runner" } }));`).join('\n')}

app.Run();`;
    }

    return `// Node.js Express Enterprise API - Generated by DB Studio Pro
const express = require('express');
const app = express();
app.use(express.json());

${tables.map(t => `app.get('/api/${t.name.toLowerCase()}', (req, res) => {
  res.json({ success: true, data: [{ id: 1, name: "${t.name} Item", status: "Live Active Entity from Node Runner" }] });
});`).join('\n')}

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", service: "DB Studio Dynamic Runner", timestamp: new Date().toISOString() });
});

module.exports = app;`;
  };

  const handleDeployServer = async () => {
    setIsDeployingServer(true);
    try {
      const codeToDeploy = generateFullProjectCode();
      const res = await fetch(getApiUrl('/api/deploy/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToDeploy,
          language: selfHostLang,
          projectName: 'DB Studio Live App'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDeployedPort(data.port);
        setDeployedPid(data.pid);
        setRunnerStatus('RUNNING');
        setRunnerLogs(data.logs || []);
        showMessage("Server Scharf Gestartet!", `Backend läuft aktiv auf internem Port ${data.port} (PID ${data.pid}).`, "success");
      } else {
        const err = await res.json();
        showMessage("Bereitstellungsfehler", err.error || "Server konnte nicht gestartet werden.", "error");
      }
    } catch (e: any) {
      showMessage("Netzwerkfehler", "Server-Deployment fehlgeschlagen: " + e.message, "error");
    } finally {
      setIsDeployingServer(false);
    }
  };

  const handleStopDeployedServer = async () => {
    if (!deployedPort) return;
    try {
      const res = await fetch(getApiUrl(`/api/deploy/stop/${deployedPort}`), { method: 'POST' });
      if (res.ok) {
        setRunnerStatus('STOPPED');
        setRunnerLogs(prev => [...prev, `[SYSTEM] Process on port ${deployedPort} stopped by user.`]);
        showMessage("Server Gestoppt", `Server auf Port ${deployedPort} wurde beendet.`, "info");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleExternalConnection = async (connected: boolean) => {
    try {
      const targetUrl = remoteServerUrl ? (remoteServerUrl.endsWith('/') ? remoteServerUrl.slice(0, -1) : remoteServerUrl) : getApiUrl('');
      const res = await fetch(`${targetUrl}/api/db/connection-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected })
      });
      if (res.ok) {
        const data = await res.json();
        setExternalSqlConnected(data.connected);
        if (connected) {
          showMessage("SQL Server Online", "Verbindung zum externen SQL Server wurde erfolgreich aktiviert.", "success");
        } else {
          showMessage("Offline Modus aktiv", "SQL Server getrennt. Die lokale IndexedDB wird als Sicherungskopie verwendet.", "warning");
        }
        
        // Refresh logs immediately
        const logsRes = await fetch(`${targetUrl}/api/db/sync-logs`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setExternalSqlLogs(logsData);
        }
      }
    } catch (e) {
      console.warn('Failed to toggle connection:', e);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole, source: "Lokal" })
        });
        if (res.ok) {
          const newMember = await res.json();
          setTeamMembers(prev => [...prev, newMember]);
          setInviteEmail('');
          setInviteName('');
          showMessage("Mitglied hinzugefügt", `${newMember.name} wurde erfolgreich registriert.`, "success");
        } else {
          const errData = await res.json();
          showMessage("Fehler", errData.error || "Eintrag konnte nicht gespeichert werden.", "error");
        }
      } catch (e) {
        showMessage("Fehler", "Verbindung zum Backend unterbrochen.", "error");
      }
    } else {
      if (teamMembers.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
        showMessage("Fehler", "Diese E-Mail existiert bereits im Team.", "warning");
        return;
      }
      const newMember = {
        email: inviteEmail,
        name: inviteName || inviteEmail.split("@")[0],
        role: inviteRole,
        source: "Lokal"
      };
      setTeamMembers(prev => [...prev, newMember]);
      setInviteEmail('');
      setInviteName('');
      showMessage("Mitglied hinzugefügt", "Teammitglied wurde lokal hinzugefügt.", "success");
    }
  };

  const handleUpdateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/members/${encodeURIComponent(editingMember.email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: inviteName, 
            role: inviteRole,
            source: editingMember.source
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setTeamMembers(prev => prev.map(m => m.email.toLowerCase() === editingMember.email.toLowerCase() ? updated : m));
          setEditingMember(null);
          setInviteEmail('');
          setInviteName('');
          showMessage("Mitglied aktualisiert", `${updated.name} wurde erfolgreich aktualisiert.`, "success");
        } else {
          const errData = await res.json();
          showMessage("Fehler", errData.error || "Aktualisierung fehlgeschlagen.", "error");
        }
      } catch (e) {
        showMessage("Fehler", "Verbindung zum Backend unterbrochen.", "error");
      }
    } else {
      setTeamMembers(prev => prev.map(m => m.email.toLowerCase() === editingMember.email.toLowerCase() ? {
        ...m,
        name: inviteName,
        role: inviteRole
      } : m));
      setEditingMember(null);
      setInviteEmail('');
      setInviteName('');
      showMessage("Mitglied aktualisiert", "Teammitglied wurde lokal aktualisiert.", "success");
    }
  };

  const handleDeleteTeamMember = async (email: string) => {
    if (!window.confirm(`Möchten Sie das Mitglied ${email} wirklich entfernen?`)) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/members/${encodeURIComponent(email)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setTeamMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
          if (editingMember && editingMember.email.toLowerCase() === email.toLowerCase()) {
            setEditingMember(null);
            setInviteEmail('');
            setInviteName('');
          }
          showMessage("Mitglied gelöscht", "Teammitglied wurde erfolgreich entfernt.", "success");
        } else {
          const errData = await res.json();
          showMessage("Fehler", errData.error || "Löschen fehlgeschlagen.", "error");
        }
      } catch (e) {
        showMessage("Fehler", "Verbindung zum Backend unterbrochen.", "error");
      }
    } else {
      setTeamMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
      if (editingMember && editingMember.email.toLowerCase() === email.toLowerCase()) {
        setEditingMember(null);
        setInviteEmail('');
        setInviteName('');
      }
      showMessage("Mitglied gelöscht", "Teammitglied wurde lokal entfernt.", "success");
    }
  };

  const handleCreateTeamProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newProjName, description: newProjDesc })
        });
        if (res.ok) {
          const newProj = await res.json();
          setTeamProjects(prev => [...prev, newProj]);
          setActiveTeamProjectId(newProj.id);
          setNewProjName('');
          setNewProjDesc('');
          setShowNewProjModal(false);
          showMessage("Projekt Gestartet", `Das Team-Projekt '${newProj.name}' wurde erfolgreich initiiert.`, "success");
        }
      } catch (e) {
        showMessage("Fehler", "Konnte Projekt nicht im Backend anlegen.", "error");
      }
    } else {
      const newProj = {
        id: "proj_" + Math.random().toString(36).substring(2, 9),
        name: newProjName,
        description: newProjDesc || "Keine Beschreibung.",
        status: "AKTIV",
        memberCount: 1
      };
      setTeamProjects(prev => [...prev, newProj]);
      setActiveTeamProjectId(newProj.id);
      setNewProjName('');
      setNewProjDesc('');
      setShowNewProjModal(false);
      showMessage("Projekt Gestartet", `Das Team-Projekt '${newProj.name}' wurde lokal gestartet.`, "success");
    }
  };

  const handleToggleTable = (id: string) => {
    setSelectedTables(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleQuery = (id: string) => {
    setSelectedQueries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const validateForeignKeys = (tablesToValidate: Record<string, boolean>) => {
    const errors: FkError[] = [];
    
    relationships.forEach(rel => {
      const fromTab = tables.find(t => t.id === rel.fromTableId);
      const toTab = tables.find(t => t.id === rel.toTableId);
      
      if (fromTab && tablesToValidate[fromTab.id]) {
        const fromFld = fromTab.fields.find(f => f.id === rel.fromFieldId);
        
        if (!toTab) {
          errors.push({
            id: rel.id,
            type: 'missing_table',
            message: `Tabelle '${fromTab.name}' verweist auf eine gelöschte oder nicht existierende Tabelle.`,
            fromTable: fromTab.name,
            fromField: fromFld?.name || '?',
            toTable: '?',
            toField: '?',
            fixable: false
          });
          return;
        }
        
        if (!tablesToValidate[toTab.id]) {
          errors.push({
            id: rel.id,
            type: 'missing_table',
            message: `Referenz-Tabelle '${toTab.name}' ist nicht für den Upload ausgewählt, was die referenzielle Integrität verletzt.`,
            fromTable: fromTab.name,
            fromField: fromFld?.name || '?',
            toTable: toTab.name,
            toField: '?',
            fixable: true,
            toTableId: toTab.id
          });
        } else {
          const toFld = toTab.fields.find(f => f.id === rel.toFieldId);
          if (!toFld) {
            errors.push({
              id: rel.id,
              type: 'missing_field',
              message: `Referenziertes Feld existiert nicht in Tabelle '${toTab.name}'.`,
              fromTable: fromTab.name,
              fromField: fromFld?.name || '?',
              toTable: toTab.name,
              toField: '?',
              fixable: false
            });
          } else {
            if (fromFld && fromFld.type !== toFld.type) {
              errors.push({
                id: rel.id,
                type: 'type_mismatch',
                message: `Datentyp-Konflikt: '${fromTab.name}.${fromFld.name}' (${fromFld.type}) referenziert '${toTab.name}.${toFld.name}' (${toFld.type}). Spaltentypen müssen übereinstimmen.`,
                fromTable: fromTab.name,
                fromField: fromFld.name,
                toTable: toTab.name,
                toField: toFld.name,
                fixable: false
              });
            }
          }
        }
      }
    });
    
    return errors;
  };

  const handleFixFkError = (toTableId: string) => {
    const updatedTables = { ...selectedTables, [toTableId]: true };
    setSelectedTables(updatedTables);
    const newErrors = validateForeignKeys(updatedTables);
    setFkErrors(newErrors);
    if (newErrors.length === 0) {
      setShowFkValidationModal(false);
    }
    showMessage("Referenz-Fehler behoben", "Die referenzierte Tabelle wurde automatisch ausgewählt.", "success");
  };

  const handleFixAllFkErrors = () => {
    const updatedTables = { ...selectedTables };
    fkErrors.forEach(err => {
      if (err.type === 'missing_table' && err.toTableId) {
        updatedTables[err.toTableId] = true;
      }
    });
    setSelectedTables(updatedTables);
    const newErrors = validateForeignKeys(updatedTables);
    setFkErrors(newErrors);
    if (newErrors.length === 0) {
      setShowFkValidationModal(false);
    }
    showMessage("Alle Referenz-Fehler behoben", "Alle abhängigen Tabellen wurden automatisch für den Upload ausgewählt.", "success");
  };

  const executeUploadSimulation = () => {
    const selectedTableCount = Object.values(selectedTables).filter(Boolean).length;
    const selectedQueryCount = Object.values(selectedQueries).filter(Boolean).length;

    setSyncStatus('testing');
    setSyncLogs([]);

    const logs: string[] = [];
    const addLog = (msg: string, delay: number) => {
      setTimeout(() => {
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
      }, delay);
    };

    addLog("Verbindungsaufbau zur Team-Cloud-Infrastruktur...", 300);
    addLog("🔒 Lokale SQLite-Datenbank verschlüsselt exportiert.", 1000);
    addLog(`🔍 Analysiere Schema-Abweichungen für ${selectedTableCount} Tabellen und ${selectedQueryCount} Queries...`, 1800);
    
    setTimeout(() => {
      setSyncStatus('generating');
    }, 2500);

    addLog("🧠 AI-Copilot verarbeitet Ihren Implementierungswunsch: '" + implementGoal + "'", 2600);
    
    if (backendTemplate === 'express') {
      addLog("⚡ Generiere relationale SQL-Migrations-Skripte für PostgreSQL...", 3400);
      if (genCrud) {
        addLog("🛠️ Erzeuge Express/NodeJS API-Routen inklusive Input-Validierung...", 4200);
      }
    } else {
      addLog("⚡ Generiere relationale NestJS Modul-Schnittstellen und Service-Klassen...", 3400);
      if (genCrud) {
        addLog("🛠️ Erzeuge NestJS Controller mit Dependency-Injection und Swagger-Annotationen...", 4200);
      }
    }

    if (authProvider === 'jwt') {
      addLog("🔑 Konfiguriere JWT Authentifizierungs-Schnittstellen und Bearer Token Validation...", 4600);
    } else if (authProvider === 'google') {
      addLog("🔐 Konfiguriere OAuth2 Passport-Strategie für Google SSO...", 4600);
    } else if (authProvider === 'github') {
      addLog("🔐 Konfiguriere OAuth2 Passport-Strategie für GitHub SSO...", 4600);
    }

    if (enableRls) {
      addLog("🛡️ Generiere Row-Level Security (RLS) Policies für Team-Zugriffsschutz (Tenant-Isolation)...", 5000);
    }

    setTimeout(() => {
      setSyncStatus('uploading');
    }, 5500);

    addLog("☁️ Übertrage Schema-Änderungen in die Team-Cloud...", 5600);
    addLog("📡 Aktualisiere sys_sync_history in der Cloud-Datenbank...", 6300);
    addLog("👥 Sende Echtzeit-WebSocket Benachrichtigungen an Online-Teammitglieder...", 7000);

    setTimeout(() => {
      setSyncStatus('completed');
      showMessage("Synchronisierung erfolgreich!", `${selectedTableCount} Tabellen und ${selectedQueryCount} Abfragen wurden erfolgreich in die Team Cloud geladen und implementiert.`, "success");
    }, 7800);
  };

  const runSyncSimulation = () => {
    const selectedTableCount = Object.values(selectedTables).filter(Boolean).length;
    const selectedQueryCount = Object.values(selectedQueries).filter(Boolean).length;

    if (selectedTableCount === 0 && selectedQueryCount === 0) {
      showMessage("Auswahl leer", "Bitte wählen Sie mindestens eine Tabelle oder Abfrage für den Upload in die Team Cloud aus.", "warning");
      return;
    }

    const errors = validateForeignKeys(selectedTables);
    if (errors.length > 0) {
      setFkErrors(errors);
      setShowFkValidationModal(true);
      return;
    }

    executeUploadSimulation();
  };

  const handleTestServerConnection = async () => {
    setIsTestingServer(true);
    const start = Date.now();
    try {
      const res = await fetch(`${remoteServerUrl}/api/health`, { method: 'GET' });
      const latency = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        setServerHealth({ connected: true, service: data.service || 'DB Studio Self-Host', version: data.version || '1.0.0', latency });
        showMessage("Verbindung Erfolgreich", `Self-Host Backend ist erreichbar unter ${remoteServerUrl} (${latency}ms).`, "success");
      } else {
        setServerHealth({ connected: false });
        showMessage("Verbindungsfehler", `Server antwortete mit Status ${res.status}. Stellt sicher, dass das Backend läuft.`, "warning");
      }
    } catch (err: any) {
      setServerHealth({ connected: false });
      showMessage("Server Nicht Erreichbar", `Konnte keine Verbindung zu ${remoteServerUrl} herstellen. Modus bleibt auf lokal/offline.`, "error");
    } finally {
      setIsTestingServer(false);
    }
  };

  const handlePushLiveSync = async () => {
    setIsUploading(true);
    setLiveSyncStatus('idle');
    try {
      const activeTables = tables.filter(t => selectedTables[t.id]);
      const payload = {
        id: 'proj_default',
        name: 'DB Studio Active Project',
        description: implementGoal,
        dbType: 'SQLite',
        language: selfHostLang,
        data: {
          tables: activeTables,
          queries,
          relationships,
          updatedAt: new Date().toISOString()
        }
      };

      const res = await fetch(`${remoteServerUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetch(`${remoteServerUrl}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: 'proj_default',
            prompt: implementGoal,
            metadata: { tablesCount: activeTables.length, queriesCount: queries.length }
          })
        });

        const nowStr = new Date().toLocaleTimeString();
        setLastSyncedTime(nowStr);
        setServerHealth(prev => prev ? { ...prev, connected: true } : { connected: true, service: 'Self-Host Backend' });
        setLiveSyncStatus('success');
        setLiveSyncStatusMsg(`Schema erfolgreich an ${remoteServerUrl} übertragen (${nowStr}).`);
        showMessage("Live Sync Erfolgreich", `Metadaten & Schema wurden live an ${remoteServerUrl} übertragen (${nowStr}).`, "success");
      } else {
        setLiveSyncStatus('error');
        setLiveSyncStatusMsg(`Übertragung fehlgeschlagen. Server-Status: ${res.status}`);
        showMessage("Sync Fehlgeschlagen", `Server gab HTTP ${res.status} zurück.`, "error");
      }
    } catch (err: any) {
      setLiveSyncStatus('error');
      setLiveSyncStatusMsg(`Verbindung zu ${remoteServerUrl} fehlgeschlagen.`);
      showMessage("Sync Fehler", `Verbindung zu ${remoteServerUrl} fehlgeschlagen. Ist das Backend gestartet?`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePullMetadata = async () => {
    setIsDownloading(true);
    setLiveSyncStatus('idle');
    try {
      const targetUrl = remoteServerUrl ? (remoteServerUrl.endsWith('/') ? remoteServerUrl.slice(0, -1) : remoteServerUrl) : getApiUrl('');
      const res = await fetch(`${targetUrl}/api/projects`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        let projectToLoad: any = null;

        if (Array.isArray(data) && data.length > 0) {
          projectToLoad = data[0];
        } else if (data && typeof data === 'object') {
          projectToLoad = data.project || data;
        }

        // If project entry exists but has no .data or .Data, try fetching detail via GET /api/projects/:id
        const projId = projectToLoad?.id || projectToLoad?.Id;
        if (projectToLoad && !projectToLoad.data && !projectToLoad.Data && projId) {
          try {
            const detailRes = await fetch(`${targetUrl}/api/projects/${projId}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData) {
                projectToLoad = detailData.project || detailData;
              }
            }
          } catch (e) {
            console.warn('Fehler beim Abrufen der Projekt-Details:', e);
          }
        }

        // Parse JSON strings if dataJson/DataJson present
        if (projectToLoad && typeof projectToLoad.dataJson === 'string') {
          try { projectToLoad.data = JSON.parse(projectToLoad.dataJson); } catch (e) {}
        }
        if (projectToLoad && typeof projectToLoad.DataJson === 'string') {
          try { projectToLoad.data = JSON.parse(projectToLoad.DataJson); } catch (e) {}
        }

        // Extract schema data (supporting various naming conventions)
        const schemaData = projectToLoad?.data || projectToLoad?.Data || (
          projectToLoad?.tables || projectToLoad?.Tables ? {
            tables: projectToLoad.tables || projectToLoad.Tables,
            queries: projectToLoad.queries || projectToLoad.Queries || [],
            relationships: projectToLoad.relationships || projectToLoad.Relationships || []
          } : null
        );

        if (projectToLoad && schemaData) {
          const store = useProjectStore.getState();
          const targetTables = schemaData.tables || schemaData.Tables || [];
          const targetQueries = schemaData.queries || schemaData.Queries || [];
          
          store.loadProject({
            id: store.projectId || projectToLoad.id || projectToLoad.Id || 'proj_default',
            name: store.projectName || projectToLoad.name || projectToLoad.Name || 'Server Master Database',
            lastModified: Date.now(),
            data: {
              tables: targetTables,
              queries: targetQueries,
              relationships: schemaData.relationships || schemaData.Relationships || [],
              forms: store.forms && store.forms.length > 0 ? store.forms : (schemaData.forms || schemaData.Forms || []),
              reports: store.reports && store.reports.length > 0 ? store.reports : (schemaData.reports || schemaData.Reports || []),
              charts: store.charts && store.charts.length > 0 ? store.charts : (schemaData.charts || schemaData.Charts || []),
              pages: store.pages && store.pages.length > 0 ? store.pages : (schemaData.pages || schemaData.Pages || []),
              customComponents: store.customComponents && store.customComponents.length > 0 ? store.customComponents : (schemaData.customComponents || schemaData.CustomComponents || []),
              workflows: store.workflows && store.workflows.length > 0 ? store.workflows : (schemaData.workflows || schemaData.Workflows || []),
              layout: store.layout && store.layout.length > 0 ? store.layout : (schemaData.layout || schemaData.Layout || []),
              tableGroups: store.tableGroups && store.tableGroups.length > 0 ? store.tableGroups : (schemaData.tableGroups || schemaData.TableGroups || []),
              backendConfig: store.backendConfig ? { ...store.backendConfig, ...(schemaData.backendConfig || schemaData.BackendConfig || {}) } : (schemaData.backendConfig || schemaData.BackendConfig || { type: 'sqlite', name: 'MasterDB', language: 'csharp', auth: { enabled: true, provider: 'windows_ad' } })
            }
          });
          await store.saveProject();

          const tablesCount = targetTables.length;
          const queriesCount = targetQueries.length;
          const statusMsg = `Server-Metadaten (${tablesCount} Tabellen, ${queriesCount} Abfragen) erfolgreich in lokale IndexedDB importiert.`;
          
          setLiveSyncStatus('success');
          setLiveSyncStatusMsg(statusMsg);
          showMessage("Live Sync Erfolgreich", statusMsg, "success");
        } else if (Array.isArray(data) && data.length === 0) {
          // If no saved projects exist on server yet, trigger live SQL server introspection on the server!
          try {
            const introspectRes = await fetch(`${targetUrl}/api/db/introspect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'mssql', host: 'localhost', port: 1433, database: 'production_db' })
            });

            if (introspectRes.ok) {
              const introspectData = await introspectRes.json();
              const introspectedProj = introspectData.project;
              if (introspectedProj && introspectedProj.data) {
                const store = useProjectStore.getState();
                const targetTables = introspectedProj.data.tables || [];
                const targetQueries = introspectedProj.data.queries || [];
                const targetRelationships = introspectedProj.data.relationships || [];

                store.loadProject({
                  id: store.projectId || introspectedProj.id || 'proj_default',
                  name: store.projectName || introspectedProj.name || 'Server Master Database',
                  lastModified: Date.now(),
                  data: {
                    tables: targetTables,
                    queries: targetQueries,
                    relationships: targetRelationships,
                    forms: store.forms && store.forms.length > 0 ? store.forms : (introspectedProj.data.forms || []),
                    reports: store.reports && store.reports.length > 0 ? store.reports : (introspectedProj.data.reports || []),
                    charts: store.charts && store.charts.length > 0 ? store.charts : (introspectedProj.data.charts || []),
                    pages: store.pages && store.pages.length > 0 ? store.pages : (introspectedProj.data.pages || []),
                    customComponents: store.customComponents && store.customComponents.length > 0 ? store.customComponents : (introspectedProj.data.customComponents || []),
                    workflows: store.workflows && store.workflows.length > 0 ? store.workflows : (introspectedProj.data.workflows || []),
                    layout: store.layout && store.layout.length > 0 ? store.layout : (introspectedProj.data.layout || []),
                    tableGroups: store.tableGroups && store.tableGroups.length > 0 ? store.tableGroups : (introspectedProj.data.tableGroups || []),
                    backendConfig: store.backendConfig ? { ...store.backendConfig, ...(introspectedProj.data.backendConfig || {}) } : (introspectedProj.data.backendConfig || { type: 'sqlite', name: 'MasterDB', language: 'csharp', auth: { enabled: true, provider: 'windows_ad' } })
                  }
                });
                await store.saveProject();

                const tCount = introspectedProj.data.tables?.length || 0;
                const statusMsg = `SQL-Server Introspection erfolgreich! ${tCount} Tabellen & Live-Datensätze von ${targetUrl} heruntergeladen und in IndexedDB gespeichert.`;
                setLiveSyncStatus('success');
                setLiveSyncStatusMsg(statusMsg);
                showMessage("SQL Server Introspection Erfolgreich", statusMsg, "success");
                return;
              }
            }
          } catch (e) {
            console.warn('Introspection Versuch fehlgeschlagen:', e);
          }

          const emptyInfo = `Der Server (${targetUrl}) ist online und antwortet, hat aber aktuell noch keine Projekte/Schemas gespeichert (Antwort: []).\n\nTipp: Nutzen Sie "Schema auf Server hochladen (Push)", um Ihr lokales DB-Studio Schema auf den Server zu pushen oder führen Sie eine Live Introspection durch.`;
          setLiveSyncStatus('error');
          setLiveSyncStatusMsg(emptyInfo);
          showMessage("Keine Daten auf Server", emptyInfo, "info");
        } else {
          // Construct informative error details with raw JSON response preview
          const rawPreview = JSON.stringify(data, null, 2);
          const truncatedPreview = rawPreview.length > 600 ? rawPreview.slice(0, 600) + '\n...' : rawPreview;
          const detailedMsg = `Keine gültigen Metadaten auf dem Server (${targetUrl}) gefunden.\n\nEmpfangene Server-Antwort:\n${truncatedPreview}`;

          setLiveSyncStatus('error');
          setLiveSyncStatusMsg(detailedMsg);
          showMessage("Sync Fehler", detailedMsg, "error");
        }
      } else {
        const errText = await res.text().catch(() => '');
        const detailedMsg = `Download fehlgeschlagen. Server HTTP-Status: ${res.status} ${res.statusText}\n${errText ? 'Server-Antwort: ' + errText.slice(0, 300) : ''}`;
        setLiveSyncStatus('error');
        setLiveSyncStatusMsg(detailedMsg);
        showMessage("Sync Fehler", detailedMsg, "error");
      }
    } catch (err: any) {
      const detailedMsg = `Verbindung zu ${remoteServerUrl} fehlgeschlagen: ${err?.message || err}`;
      setLiveSyncStatus('error');
      setLiveSyncStatusMsg(detailedMsg);
      showMessage("Sync Fehler", detailedMsg, "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSimulateTraffic = () => {
    const actions = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'SECURITY_CHECK'];
    const roles = ['ADMIN', 'EDITOR', 'VIEWER', 'GUEST'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomTable = tables[Math.floor(Math.random() * tables.length)]?.name || 'sys_projects';
    const latency = parseFloat((Math.random() * 8 + 0.5).toFixed(1));
    
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: randomAction,
      user: `${randomRole.toLowerCase()}_user`,
      role: randomRole,
      details: randomAction === 'SECURITY_CHECK' ? `CHECK RBAC FOR ${randomTable}` : `${randomAction} FROM ${randomTable} (${latency}ms)`,
      latencyMs: latency,
      status: randomAction === 'SECURITY_CHECK' && randomRole === 'GUEST' ? 'WARN' as const : 'SUCCESS' as const
    };

    setAuditLogs(prev => [newLog, ...prev.slice(0, 19)]);
    setQpsCount(Math.floor(Math.random() * 20 + 15));
    setAvgLatency(parseFloat((Math.random() * 3 + 1.5).toFixed(1)));
    showMessage("Traffic Simuliert", `Neuer DB Audit Event (${randomAction} on ${randomTable}) protokolliert.`, "info");
  };

  const executeDownloadZip = () => {
    handleDownloadSelfHostZip(
      selfHostLang,
      tables,
      selectedTables,
      queries,
      selectedQueries,
      relationships,
      showMessage,
      adServerAddress,
      adBaseDn,
      adGroupMappings,
      adServiceAccountUsername,
      adServiceAccountPassword,
      subfolderPath,
      includeWwwroot
    );
  };

  const systemSchema: Record<string, SystemTable> = {
    sys_projects: {
      name: 'sys_projects',
      description: 'Speichert alle DB-Studio-Projekte mit Metadaten und Datenbank-Verbindungseinstellungen.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Projektname (z.B. Kundenportal)' },
        { name: 'db_type', type: 'VARCHAR(50)', comment: 'Dialekt (PostgreSQL, MySQL, SQLite, etc.)' },
        { name: 'is_cloud', type: 'BOOLEAN', comment: 'Gibt an, ob das Projekt im Team-Cloud-Speicher liegt' },
        { name: 'owner_id', type: 'VARCHAR(100)', comment: 'Benutzer-ID des Projektbesitzers' },
        { name: 'created_at', type: 'TIMESTAMP', comment: 'Erstellungszeitpunkt' }
      ]
    },
    sys_tables: {
      name: 'sys_tables',
      description: 'Metadaten für alle Tabellen des entworfenen Schemas.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'project_id', type: 'UUID (FK)', isKey: true, comment: 'Referenz auf sys_projects.id' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Tabellenname in der Zieldatenbank' },
        { name: 'description', type: 'TEXT', comment: 'Optionale Beschreibung der Tabelle' }
      ]
    },
    sys_fields: {
      name: 'sys_fields',
      description: 'Detaillierte Felddefinitionen für jede Tabelle im Schema.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'table_id', type: 'UUID (FK)', isKey: true, comment: 'Zugehörige Tabelle (sys_tables.id)' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Spaltenname in der Tabelle' },
        { name: 'type', type: 'VARCHAR(50)', comment: 'Datentyp (INTEGER, VARCHAR, TIMESTAMP, etc.)' },
        { name: 'is_primary_key', type: 'BOOLEAN', comment: 'Wahr, wenn Teil des Primärschlüssels' },
        { name: 'is_nullable', type: 'BOOLEAN', comment: 'Gibt an, ob NULL-Werte erlaubt sind' },
        { name: 'default_value', type: 'VARCHAR(255)', comment: 'Standardwert für dieses Feld' }
      ]
    },
    sys_queries: {
      name: 'sys_queries',
      description: 'Gespeicherte benutzerdefinierte Abfragen und Abfragen aus dem Query Designer.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'project_id', type: 'UUID (FK)', isKey: true, comment: 'Referenz auf sys_projects.id' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Name der Abfrage im Query Designer' },
        { name: 'raw_sql', type: 'TEXT', comment: 'Das generierte ausführbare SQL-Statement' }
      ]
    },
    sys_sync_history: {
      name: 'sys_sync_history',
      description: 'Historie und Audit-Log aller Synchronisationen zwischen lokalem Rechner und Team Cloud.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'project_id', type: 'UUID (FK)', isKey: true, comment: 'Referenz auf sys_projects.id' },
        { name: 'user_id', type: 'VARCHAR(100)', comment: 'Wer hat die Synchronisation ausgelöst' },
        { name: 'sync_type', type: 'VARCHAR(50)', comment: 'Art der Synchronisation (LOCAL_TO_CLOUD / CLOUD_TO_LOCAL)' },
        { name: 'metadata_payload', type: 'JSON', comment: 'Payload mit den übertragenen Tabellen/Queries' },
        { name: 'implementation_prompt', type: 'TEXT', comment: 'Fragebogen-Antwort: Was soll implementiert werden?' },
        { name: 'created_at', type: 'TIMESTAMP', comment: 'Zeitpunkt der Synchronisation' }
      ]
    }
  };

  return {
    config,
    updateConfig,
    activeMode,
    setActiveMode,
    selectedTables,
    setSelectedTables,
    selectedQueries,
    setSelectedQueries,
    implementGoal,
    setImplementGoal,
    genCrud,
    setGenCrud,
    genTypes,
    setGenTypes,
    enableRls,
    setEnableRls,
    backendTemplate,
    setBackendTemplate,
    authProvider,
    setAuthProvider,
    selfHostLang,
    setSelfHostLang,
    subfolderPath,
    setSubfolderPath,
    includeWwwroot,
    setIncludeWwwroot,
    showSelfHostConfigModal,
    setShowSelfHostConfigModal,
    mainSectionTab,
    setMainSectionTab,
    deployedPort,
    deployedPid,
    runnerStatus,
    runnerLogs,
    setRunnerLogs,
    isDeployingServer,
    remoteServerUrl,
    setRemoteServerUrl,
    serverHealth,
    setServerHealth,
    isTestingServer,
    autoSyncEnabled,
    setAutoSyncEnabled,
    lastSyncedTime,
    isUploading,
    isDownloading,
    liveSyncStatus,
    liveSyncStatusMsg,
    externalSqlConnected,
    externalSqlLogs,
    isSyncingSql,
    migrationDialect,
    setMigrationDialect,
    apiSpecTab,
    setApiSpecTab,
    playgroundTable,
    setPlaygroundTable,
    playgroundMethod,
    setPlaygroundMethod,
    playgroundPayload,
    setPlaygroundPayload,
    playgroundResponse,
    setPlaygroundResponse,
    isExecutingApiReq,
    setIsExecutingApiReq,
    rbacRoles,
    setRbacRoles,
    selectedRole,
    setSelectedRole,
    jwtExpiry,
    setJwtExpiry,
    rateLimitMax,
    setRateLimitMax,
    corsOrigins,
    setCorsOrigins,
    qpsCount,
    avgLatency,
    auditLogs,
    syncStatus,
    syncLogs,
    fkErrors,
    showFkValidationModal,
    setShowFkValidationModal,
    selectedSystemTable,
    setSelectedSystemTable,
    backendDetected,
    setBackendDetected,
    adConnected,
    setAdConnected,
    adServerAddress,
    setAdServerAddress,
    adBaseDn,
    setAdBaseDn,
    adServiceAccountUsername,
    setAdServiceAccountUsername,
    adServiceAccountPassword,
    setAdServiceAccountPassword,
    adGroupMappings,
    setAdGroupMappings,
    teamProjects,
    setTeamProjects,
    teamMembers,
    setTeamMembers,
    activeTeamProjectId,
    setActiveTeamProjectId,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    inviteRole,
    setInviteRole,
    editingMember,
    setEditingMember,
    newProjName,
    setNewProjName,
    newProjDesc,
    setNewProjDesc,
    showNewProjModal,
    setShowNewProjModal,
    showTeamChatModal,
    setShowTeamChatModal,
    handleToggleExternalConnection,
    handleDeployServer,
    handleStopDeployedServer,
    handleAddTeamMember,
    handleUpdateTeamMember,
    handleDeleteTeamMember,
    handleCreateTeamProject,
    handleToggleTable,
    handleToggleQuery,
    handleFixFkError,
    handleFixAllFkErrors,
    runSyncSimulation,
    handleTestServerConnection,
    handlePushLiveSync,
    handlePullMetadata,
    handleSimulateTraffic,
    executeDownloadZip,
    executeUploadSimulation,
    systemSchema,
  };
};
