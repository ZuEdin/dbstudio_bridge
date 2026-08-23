import React from 'react';
import { TeamProject, TeamMember } from '../types';
import { 
  Radio, RefreshCw, UserCheck, FolderPlus, PlusCircle, Cpu, Sliders, Users, Edit2, Trash2 
} from 'lucide-react';
import { useConfigStore } from '../../../../stores/useConfigStore';

interface TeamCloudTabProps {
  backendDetected: boolean;
  setBackendDetected: (val: boolean) => void;
  remoteServerUrl: string;
  setRemoteServerUrl: (val: string) => void;
  serverHealth: { connected: boolean; service?: string; version?: string; latency?: number } | null;
  setServerHealth: (val: any) => void;
  activeMode: 'local' | 'cloud';
  setActiveMode: (val: 'local' | 'cloud') => void;
  adConnected: boolean;
  setAdConnected: (val: boolean) => void;
  adServerAddress: string;
  setAdServerAddress: (val: string) => void;
  adBaseDn: string;
  setAdBaseDn: (val: string) => void;
  adServiceAccountUsername: string;
  setAdServiceAccountUsername: (val: string) => void;
  adServiceAccountPassword: string;
  setAdServiceAccountPassword: (val: string) => void;
  adGroupMappings: { id: string; adGroup: string; appRole: string }[];
  setAdGroupMappings: (val: { id: string; adGroup: string; appRole: string }[] | ((prev: { id: string; adGroup: string; appRole: string }[]) => { id: string; adGroup: string; appRole: string }[])) => void;
  teamProjects: TeamProject[];
  activeTeamProjectId: string;
  setActiveTeamProjectId: (id: string) => void;
  setShowNewProjModal: (val: boolean) => void;
  teamMembers: TeamMember[];
  editingMember: TeamMember | null;
  setEditingMember: (val: TeamMember | null) => void;
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteName: string;
  setInviteName: (val: string) => void;
  inviteRole: string;
  setInviteRole: (val: string) => void;
  handleUpdateTeamMember: (e: React.FormEvent) => void;
  handleDeleteTeamMember: (email: string) => void;
  handleAddTeamMember: (e: React.FormEvent) => void;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const TeamCloudTab: React.FC<TeamCloudTabProps> = ({
  backendDetected,
  setBackendDetected,
  remoteServerUrl,
  setRemoteServerUrl,
  serverHealth,
  setServerHealth,
  activeMode,
  setActiveMode,
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
  activeTeamProjectId,
  setActiveTeamProjectId,
  setShowNewProjModal,
  teamMembers,
  editingMember,
  setEditingMember,
  inviteEmail,
  setInviteEmail,
  inviteName,
  setInviteName,
  inviteRole,
  setInviteRole,
  handleUpdateTeamMember,
  handleDeleteTeamMember,
  handleAddTeamMember,
  showMessage,
}) => {
  const [newGroupName, setNewGroupName] = React.useState('');
  const [newAppRole, setNewAppRole] = React.useState('Administrator');

  const handleAddMapping = () => {
    if (!newGroupName.trim()) {
      showMessage("Eingabe fehlt", "Bitte geben Sie einen AD-Sicherheitsgruppennamen an.", "warning");
      return;
    }
    const exists = adGroupMappings.some(m => m.adGroup.toLowerCase() === newGroupName.trim().toLowerCase());
    if (exists) {
      showMessage("Bereits vorhanden", "Dieses Mapping existiert bereits.", "warning");
      return;
    }
    const newMap = {
      id: Date.now().toString(),
      adGroup: newGroupName.trim(),
      appRole: newAppRole
    };
    setAdGroupMappings([...adGroupMappings, newMap]);
    setNewGroupName('');
    showMessage("Mapping hinzugefügt", `Gruppe "${newMap.adGroup}" wurde erfolgreich der Rolle "${newAppRole}" zugeordnet.`, "success");
  };

  const handleDeleteMapping = (id: string) => {
    setAdGroupMappings(adGroupMappings.filter(m => m.id !== id));
    showMessage("Mapping entfernt", "Das AD-Gruppen-Mapping wurde gelöscht.", "info");
  };

  const handleScanBackend = async () => {
    const configApiUrl = useConfigStore.getState().config.apiUrl;
    const detectUrl = configApiUrl || 'http://localhost:5000';
    try {
      const res = await fetch(`${detectUrl}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendDetected(true);
        setRemoteServerUrl(detectUrl);
        setServerHealth({
          connected: true,
          service: data.Service || "Enterprise Backend",
          version: data.Version || "2.1.0",
          latency: 4
        });
        setActiveMode('cloud');
        showMessage("Schnittstelle Aktiviert", "DB Studio Pro wurde erfolgreich mit dem Live-Backend verknüpft.", "success");
      } else {
        throw new Error();
      }
    } catch (e) {
      setBackendDetected(false);
      showMessage("Scan fehlgeschlagen", "Es wurde kein laufender .NET/Node.js API-Server gefunden. Simulation aktiv.", "info");
    }
  };

  const handleToggleAd = async () => {
    try {
      const res = await fetch(`${remoteServerUrl}/api/auth/ldap-toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAdConnected(data.isAdConfigured);
        showMessage("AD Controller Status", data.isAdConfigured ? "AD Controller gekoppelt (Schnittstelle aktiv)" : "AD Controller offline", "success");
      }
    } catch (e) {
      console.error(e);
      showMessage("Fehler", "Konnte AD-Zustand nicht umschalten.", "error");
    }
  };

  return (
    <div id="team_cloud_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top row: Auto-Detector Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar Backend-Detector widget */}
        <div className="lg:col-span-2 bg-slate-900/85 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <span className={`absolute inset-0 rounded-full ${backendDetected ? 'bg-emerald-400/25 animate-ping' : 'bg-amber-400/25 animate-ping'}`}></span>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${backendDetected ? 'bg-emerald-500/10 border-emerald-500/45 text-emerald-400' : 'bg-amber-500/10 border-amber-500/45 text-amber-400'}`}>
                <Radio size={22} className={backendDetected ? 'animate-pulse' : ''} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Automatischer Backend-Detektor</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${backendDetected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                  {backendDetected ? 'API VERBUNDEN' : 'OFFLINE (LOKALE SIMULATION)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                {backendDetected 
                  ? `Ein laufendes Self-Host/Enterprise Backend wurde auf ${remoteServerUrl} erkannt. DB Studio kommuniziert nun mit echten Live-Schnittstellen.`
                  : "Keine externe Live-API auf localhost:3000 erkannt. DB Studio läuft im Offline-Modus mit simulierten In-Memory Endpunkten."
                }
              </p>
              <div className="flex items-center gap-4 mt-2.5 text-[11px] font-mono text-slate-500">
                <span>Server-Adresse: <strong className="text-slate-300">{remoteServerUrl}</strong></span>
                <span>Latenz: <strong className={backendDetected ? "text-emerald-400 font-bold" : "text-slate-400"}>{backendDetected ? "4 ms" : "0 ms (Local)"}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleScanBackend}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw size={12} className="animate-spin-slow text-indigo-400" />
              <span>Schnittstelle scannen</span>
            </button>
          </div>
        </div>

        {/* Active Directory Quick Summary widget */}
        <div className="bg-slate-900/85 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Benutzer-Schnittstelle</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>AD Controller (LDAP)</span>
                <span className={`w-2 h-2 rounded-full ${adConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {adConnected 
                  ? `Personen werden aus AD (${adServerAddress}) importiert.` 
                  : "Lokale Benutzeranmeldung aktiv (AD Controller offline)"}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg border shrink-0 ${adConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
              <UserCheck size={18} />
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">AD-Zustand:</span>
            <button
              type="button"
              onClick={handleToggleAd}
              className={`px-3 py-1 rounded font-mono text-[10px] font-bold border transition-colors cursor-pointer ${adConnected ? 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'}`}
            >
              {adConnected ? 'AD GEKOPPELT' : 'AD OFFLINE'}
            </button>
          </div>
        </div>

      </div>

      {/* Main content grid: Left Column = Projects, Right Column = Members & AD Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Team Projects */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Team Projects Panel */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus size={16} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Zentralisierte Team-Projekte</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewProjModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <PlusCircle size={12} />
                <span>Team-Projekt starten</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Diese Projekte lagern zentral in der Cloud oder im firmeneigenen Server und ermöglichen simultane, konfliktfreie Schema-Entwürfe im Team via SignalR WebSockets.
            </p>

            <div className="space-y-3">
              {teamProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => setActiveTeamProjectId(proj.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${activeTeamProjectId === proj.id ? 'bg-indigo-950/25 border-indigo-500/50 shadow-md shadow-indigo-950/30' : 'bg-slate-950/45 border-slate-800/80 hover:bg-slate-900/40'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white font-mono">{proj.name}</h4>
                      <span className="text-[9px] font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700/60">{proj.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 rounded-full ${proj.status === 'AKTIV' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{proj.status}</span>
                    </div>
                    <p className="text-xs text-slate-400">{proj.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold block">{proj.memberCount} Mitglieder</span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">SignalR gekoppelt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Synchronizer Architecture Diagram */}
          <div className="bg-slate-900/45 p-5 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">SignalR & Active Directory Live Flow</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                <div className="text-xs font-bold text-indigo-300 mb-1">1. AD-Verifizierung</div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  User loggt sich ein. .NET Core API prüft AD. Bei Erfolg wird der Login mit Rollen (Read/Write) freigeschaltet.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                <div className="text-xs font-bold text-emerald-300 mb-1">2. WebSocket Sync</div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Bei jeder Schemaänderung sendet SignalR ein Event an alle Clients der Gruppe <code className="text-indigo-400 font-mono text-[9px]">JoinProjectSession(id)</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                <div className="text-xs font-bold text-amber-300 mb-1">3. Auto Schema-Diff</div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Die API berechnet Schema-Unterschiede (sys_tables, sys_fields) und generiert konfliktfreie Migrations-Skripte.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Active Directory Configuration & Member directory */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Directory Setup form */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Directory (AD) Enterprise Setup</h3>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Parametrisieren Sie hier die Domain, optionale Service-Accounts und AD-Gruppen für die automatische C# .NET Rollenzuweisung im generierten Self-Host-ZIP.
            </p>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">AD Domain / LDAP URI</label>
                  <input
                    type="text"
                    value={adServerAddress}
                    onChange={(e) => setAdServerAddress(e.target.value)}
                    placeholder="firma.local oder ldap://ads.firma.local:389"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">Base DN / Container</label>
                  <input
                    type="text"
                    value={adBaseDn}
                    onChange={(e) => setAdBaseDn(e.target.value)}
                    placeholder="DC=firma,DC=local"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">Service-Account Username (Optional)</label>
                  <input
                    type="text"
                    value={adServiceAccountUsername}
                    onChange={(e) => setAdServiceAccountUsername(e.target.value)}
                    placeholder="z.B. service.bind"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">Service-Account Passwort (Optional)</label>
                  <input
                    type="password"
                    value={adServiceAccountPassword}
                    onChange={(e) => setAdServiceAccountPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Security Groups to App Roles Mappings */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wide">Sicherheitsgruppen & Rollenzuweisung</span>
                
                {/* Mapping list */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {adGroupMappings.length === 0 ? (
                    <div className="text-center py-3 bg-slate-950/30 rounded border border-slate-850 border-dashed text-[11px] text-slate-500">
                      Keine Gruppen-Mappings konfiguriert. Alle Benutzer erhalten Standard-Rolle.
                    </div>
                  ) : (
                    adGroupMappings.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono">
                        <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-200 truncate">{m.adGroup}</span>
                          <span className="text-[10px] text-slate-500">&rarr;</span>
                          <span className="text-indigo-400 font-semibold">{m.appRole}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMapping(m.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                          title="Mapping entfernen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add new mapping row */}
                <div className="flex gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="z.B. firma\\digitaltool admin"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="w-28">
                    <select
                      value={newAppRole}
                      onChange={(e) => setNewAppRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Manager">Manager</option>
                      <option value="User">User</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMapping}
                    className="px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-850 text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>Automatischer Fallback-Check:</strong> Findet das Backend keine Active Directory-Verbindung, greift es sicher auf lokale DB-Benutzer und Token zurück.
              </div>
            </div>
          </div>

          {/* Team Members Directory */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Teammitglieder & Herkunft ({teamMembers.length})</h3>
              </div>
            </div>

            {/* List of members */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/45 border border-slate-850 flex items-center justify-between text-xs hover:border-slate-755 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white truncate">{member.name}</span>
                      <span className="text-[10px] text-slate-400">({member.role})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${member.source === 'Lokal' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {member.source}
                    </span>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(member);
                          setInviteEmail(member.email);
                          setInviteName(member.name);
                          setInviteRole(member.role);
                        }}
                        title="Mitglied bearbeiten"
                        className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeamMember(member.email)}
                        title="Mitglied entfernen"
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invite / Edit Member form */}
            {editingMember ? (
              <form onSubmit={handleUpdateTeamMember} className="pt-3 border-t border-indigo-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Mitglied bearbeiten</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMember(null);
                      setInviteEmail('');
                      setInviteName('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Name (z.B. Tim)"
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Entwickler">Entwickler</option>
                    <option value="Architekt">Architekt</option>
                    <option value="Gast">Gast</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    disabled
                    className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 text-xs text-slate-500 cursor-not-allowed font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shrink-0 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddTeamMember} className="pt-3 border-t border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Person hinzufügen / Einladen</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Name (z.B. Tim)"
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Entwickler">Entwickler</option>
                    <option value="Architekt">Architekt</option>
                    <option value="Gast">Gast</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="mitarbeiter@firma.de"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shrink-0 cursor-pointer"
                  >
                    Eintragen
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
