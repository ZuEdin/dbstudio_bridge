import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.resolve(__dirname, '../../bridge_settings.json');

const DEFAULT_SETTINGS = {
  // Pfade
  projectsDir: path.resolve(__dirname, '../../Projects'),
  sharedDependenciesDir: path.resolve(__dirname, '../../Shared_Dependencies'),
  
  // Ports & Netzwerk
  bridgeServerPort: 5050,
  defaultBackendPort: 5000,
  defaultFrontendPort: 3000,
  portConflictStrategy: 'auto_increment', // 'auto_increment' | 'warn' | 'kill_existing'
  
  // Sicherheit & Hosts
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:5050',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5050',
    'http://127.0.0.1:5173',
    'https://dbstudio.app'
  ],
  allowPublicOrigin: false,
  securityToken: 'bridge_sec_' + Math.random().toString(36).substring(2, 12),
  
  // Git Integration
  git: {
    enabled: true,
    activeProvider: 'github', // 'github' | 'gitlab' | 'both' | 'custom'
    autoInit: true,
    autoCommit: true,
    autoCreateRemoteRepo: true,
    commitMessageTemplate: 'Auto-deploy from DB Studio: {projectId} at {timestamp}',
    defaultRemote: '',
    personalAccessToken: '',
    github: {
      enabled: true,
      token: '',
      defaultOrg: '',
      autoCreateRepo: true,
      isPrivate: true
    },
    gitlab: {
      enabled: false,
      token: '',
      serverUrl: 'https://gitlab.com',
      defaultNamespace: '',
      autoCreateRepo: true,
      isPrivate: true
    }
  },
  
  // FTP / SFTP Integration
  ftp: {
    enabled: false,
    protocol: 'sftp', // 'ftp' | 'sftp'
    host: '',
    port: 22,
    username: '',
    password: '',
    remotePath: '/var/www/dbstudio_app',
    autoDeployOnBuild: false
  },
  
  // Allgemein
  autoStartOnBoot: false,
  minimizeToTray: true,
  enableRealtimeTelemetry: true
};

export function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Fehler beim Laden der Einstellungen:', err);
  }
  // Speichere Defaults falls Datei nicht existiert
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function saveSettings(newSettings) {
  try {
    const merged = { ...loadSettingsRaw(), ...newSettings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('Fehler beim Speichern der Einstellungen:', err);
    throw err;
  }
}

function loadSettingsRaw() {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}
