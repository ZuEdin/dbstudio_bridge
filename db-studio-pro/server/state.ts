import path from "path";

// State structure with default initial data
export const state = {
  teamProjects: [
    { 
      id: "proj_billing", 
      name: "Kunden- & Rechnungsverwaltung", 
      description: "Zentrales Rechnungsprojekt des Finanz-Teams", 
      status: "AKTIV", 
      memberCount: 3,
      isCloud: true,
      owner: "Zubeyr",
      ownerEmail: "zuboedin@gmail.com",
      teamMembers: [
        { id: "m1", email: "zuboedin@gmail.com", name: "Zubeyr", role: "Owner", status: "AKTIV" },
        { id: "m2", email: "sarah.web@firma.de", name: "Sarah Müller", role: "Entwicklerin", status: "AKTIV" },
        { id: "m3", email: "tom.db@firma.de", name: "Tom Schmidt", role: "Architekt", status: "AKTIV" }
      ]
    },
    { 
      id: "proj_inventory", 
      name: "Lagerbestand & Logistik", 
      description: "Echtzeit-Tracking für das Hauptlager", 
      status: "ENTWURF", 
      memberCount: 2,
      isCloud: true,
      owner: "Zubeyr",
      ownerEmail: "zuboedin@gmail.com",
      teamMembers: [
        { id: "m1", email: "zuboedin@gmail.com", name: "Zubeyr", role: "Owner", status: "AKTIV" },
        { id: "m2", email: "sarah.web@firma.de", name: "Sarah Müller", role: "Entwicklerin", status: "AKTIV" }
      ]
    }
  ] as any[],

  teamMembers: [
    { email: "zuboedin@gmail.com", role: "Administrator", name: "Zubeyr", source: "Lokal" },
    { email: "sarah.web@firma.de", role: "Entwicklerin", name: "Sarah Müller", source: "AD / Active Directory" },
    { email: "tom.db@firma.de", role: "Architekt", name: "Tom Schmidt", source: "AD / Active Directory" }
  ] as any[],

  isAdConfigured: true,
  registeredUsers: [] as any[],
  chatMessages: [] as any[],

  // Global state for live deployed server runners
  deployedRunners: new Map<number, {
    port: number;
    pid: number;
    projectName: string;
    language: string;
    status: 'RUNNING' | 'STOPPED' | 'ERROR';
    startedAt: number;
    code: string;
    logs: string[];
  }>(),

  // Projects & Sync Store
  serverProjectsStore: [] as any[],

  // External SQL Config & Logs
  externalSqlConnected: true,
  externalSqlConfig: {
    type: "mssql",
    host: "localhost",
    port: 1433,
    database: "production_db",
    username: "sa",
    ssl: true,
    lastSync: new Date().toISOString()
  },
  
  sqlSyncHistoryLogs: [
    { timestamp: new Date(Date.now() - 600000).toISOString(), action: "CONNECT", details: "Erfolgreich mit MS SQL Server localhost:1433/production_db verbunden", status: "SUCCESS" },
    { timestamp: new Date(Date.now() - 300000).toISOString(), action: "SCHEMA_SCAN", details: "Information_schema ausgelesen: 3 Tabellen gefunden.", status: "SUCCESS" }
  ] as Array<{ timestamp: string; action: string; details: string; status: string }>
};
