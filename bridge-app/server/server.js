import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { loadSettings, saveSettings } from './config.js';
import { isPortAvailable, findAvailablePort, killProcessOnPort, getProcessOnPort } from './portManager.js';
import { initSharedStore, linkSharedNodeModules } from './sharedDependencyManager.js';
import { writeProjectFiles, adaptProject } from './projectAdapter.js';
import { ensureTauriIcons } from './tauriIconManager.js';
import { buildInstallationPackage, launchInstallerPackage, openInstallerFolder } from './packageBuilder.js';
import { processManager } from './processManager.js';
import { handleGitIntegration, testFtpConnection, uploadToFtp, detectProjectUploadFiles, testGitProviderConnection, createRemoteRepo, pushToRemoteRepo } from './gitFtpManager.js';
import { startRelayPoller } from './relayPoller.js';
import { ensureDockerCompose, startDockerContainers, stopDockerContainers, checkDockerStatus, getProjectContainers } from './dockerManager.js';
import { getDependenciesForDirectory, getAllDependencyTargets, installPackage, uninstallPackage, restoreAllDependencies, updatePackage, updateAllPackages } from './dependencyManager.js';
import { workspaceWatcher } from './workspaceWatcher.js';
import { getWindowsAutostartStatus, toggleWindowsAutostart } from './windowsServiceManager.js';
import { getDeploymentProfiles, saveDeploymentProfiles, performDeployHealthCheck } from './deploymentProfileManager.js';
import { findProjectDatabases, inspectSqliteDatabase, querySqliteDatabase } from './databaseExplorer.js';
import { TEMPLATES, scaffoldProjectFromTemplate } from './templateScaffolder.js';
import { generatePipelineFiles } from './pipelineGenerator.js';
import { CONTAINER_PRESETS, generateDockerCompose, manageDockerCompose } from './dockerComposeGenerator.js';
import { inspectAccessDatabase, transpileAccessSchema, transpileAccessQuery, generateDbStudioExportPayload, generateDbStudioNativeDbsp } from './accessMigrationEngine.js';
import { sortTablesTopologically, generateFullSqlDataDump, syncToLocalSqliteDatabase } from './dataSyncEngine.js';

const execPromise = util.promisify(exec);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/logs' });

export function broadcastLog(stream, message) {
  processManager.broadcastLog({
    stream: typeof stream === 'string' ? stream : 'system',
    message: typeof message === 'string' ? message : (message?.message || JSON.stringify(message)),
    timestamp: new Date().toISOString()
  });
}

// 1. CORS & Private Network Access (PNA) Middleware - MUST BE FIRST
app.use((req, res, next) => {
  const settings = loadSettings();
  const origin = req.headers.origin;

  const allowed = isOriginAllowed(origin, settings.allowedOrigins, settings.allowPublicOrigin);

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-Bridge-Token, Access-Control-Request-Private-Network, *');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Preflight sofort mit Status 200 beantworten
  if (req.method === 'OPTIONS') {
    return allowed ? res.status(200).end() : res.status(403).end();
  }
  next();
});

// 2. Body Parsers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Helper for wildcard and flexible origin matching
function isOriginAllowed(origin, allowedOrigins, allowPublicOrigin) {
  if (allowPublicOrigin || !origin) return true;
  const lower = origin.toLowerCase();
  // Local bridge UI origins are ALWAYS allowed
  if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('tauri')) {
    return true;
  }
  return allowedOrigins.some(allowed => {
    if (allowed === '*' || allowed === origin) return true;
    if (allowed.includes('*')) {
      const regexPattern = '^' + allowed
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*') + '$';
      return new RegExp(regexPattern, 'i').test(origin);
    }
    if (lower.includes(allowed.toLowerCase())) return true;
    return false;
  });
}

// Security Token Validation (Optional bei lokalen UI-Aufrufen, aber aktiv für externe Anfragen)
const validateToken = (req, res, next) => {
  const settings = loadSettings();
  const token = req.headers['x-bridge-token'] || req.query.token;

  // Wenn vom lokalen UI (Port 5050 / 5173 / 3000) ohne Token aufgerufen, erlauben
  const isLocalOrigin = !req.headers.origin || req.headers.origin.includes('localhost') || req.headers.origin.includes('127.0.0.1');
  if (isLocalOrigin && !token) {
    return next();
  }

  if (settings.securityToken && token !== settings.securityToken) {
    return res.status(403).json({ error: 'Ungültiger oder fehlender Sicherheits-Token (X-Bridge-Token).' });
  }
  next();
};

// WebSocket Verbindung registrieren
wss.on('connection', (ws) => {
  processManager.registerWsClient(ws);
});

// --- REST ENDPUNKTE ---

import { collectSystemTelemetry } from './telemetry.js';

/**
 * 1. Health & Status
 */
app.get('/api/status', async (req, res) => {
  const telemetry = await collectSystemTelemetry();
  res.json(telemetry);
});

/**
 * 2. Einstellungen (Get / Save)
 */
app.get('/api/settings', (req, res) => {
  res.json(loadSettings());
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = saveSettings(req.body);
    // Shared Store synchronisieren
    initSharedStore(updated.sharedDependenciesDir);
    // Relay Poller neu starten falls URL geändert
    startRelayPoller();
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2.1 Relay Gateway Helper & Download
 */
app.get('/api/relay/script', (req, res) => {
  const possiblePaths = [
    path.resolve(__dirname, 'assets/bridge_relay.php'),
    path.resolve(__dirname, '../../Bridge_SDK_Templates/php-relay/bridge_relay.php'),
    path.resolve(__dirname, '../public/bridge_relay.php')
  ];

  let foundPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (foundPath) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="bridge_relay.php"');
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.download(foundPath, 'bridge_relay.php');
  }

  const fallbackScript = `<?php
/**
 * DB Studio Universal Bridge Relay Gateway (PHP)
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");
echo json_encode(["status" => "online", "message" => "DB Studio PHP Relay Gateway Active"]);
?>`;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="bridge_relay.php"');
  res.setHeader('Content-Transfer-Encoding', 'binary');
  res.send(Buffer.from(fallbackScript, 'utf-8'));
});

app.get('/api/relay/script-content', (req, res) => {
  const possiblePaths = [
    path.resolve(__dirname, 'assets/bridge_relay.php'),
    path.resolve(__dirname, '../../Bridge_SDK_Templates/php-relay/bridge_relay.php'),
    path.resolve(__dirname, '../public/bridge_relay.php')
  ];

  let phpScript = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      phpScript = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  res.json({
    success: true,
    script: phpScript,
    filename: 'bridge_relay.php'
  });
});

app.post('/api/relay/save-to-downloads', async (req, res) => {
  try {
    const possiblePaths = [
      path.resolve(__dirname, 'assets/bridge_relay.php'),
      path.resolve(__dirname, '../../Bridge_SDK_Templates/php-relay/bridge_relay.php'),
      path.resolve(__dirname, '../public/bridge_relay.php')
    ];

    let phpScript = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        phpScript = fs.readFileSync(p, 'utf-8');
        break;
      }
    }

    const downloadsDir = path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const targetPath = path.join(downloadsDir, 'bridge_relay.php');
    fs.writeFileSync(targetPath, phpScript, 'utf-8');

    // Windows Explorer highlight
    if (process.platform === 'win32') {
      const winPath = path.normalize(targetPath).replace(/\//g, '\\');
      spawn('explorer.exe', [`/select,${winPath}`], { detached: true, stdio: 'ignore' }).unref();
    }

    res.json({
      success: true,
      path: targetPath,
      message: `Datei 'bridge_relay.php' erfolgreich im Downloads-Ordner gespeichert (${targetPath})!`
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/relay/test', async (req, res) => {
  const { relayUrl } = req.body;
  if (!relayUrl) return res.status(400).json({ error: 'Relay-URL erforderlich.' });

  try {
    const settings = loadSettings();
    const token = settings.securityToken || '';
    const telemetry = await collectSystemTelemetry();

    // 1. Live Heartbeat & Telemetrie direkt an das Relay senden
    try {
      await fetch(`${relayUrl}?action=pull_jobs&token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bridge-Token': token,
          'User-Agent': 'DBStudioBridge/3.0'
        },
        body: JSON.stringify(telemetry)
      });
    } catch (e) {
      // Ignore
    }

    // 2. Status vom Relay abrufen
    const testRes = await fetch(`${relayUrl}?action=status`, {
      headers: {
        'User-Agent': 'DBStudioBridge/3.0',
        'X-Bridge-Token': token
      }
    });

    if (testRes.ok) {
      const data = await testRes.json();
      return res.json({
        success: true,
        bridgeConnected: data.bridgeConnected,
        status: data.status,
        data,
        message: 'Relay-Server antwortet einwandfrei!'
      });
    }
    res.json({ success: false, error: `Server antwortete mit HTTP-Status: ${testRes.status}` });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * 3. Port Management & Konfliktprüfung
 */
app.post('/api/ports/check', async (req, res) => {
  const { port } = req.body;
  if (!port) return res.status(400).json({ error: 'Port erforderlich.' });

  const available = await isPortAvailable(port);
  let processInfo = null;
  if (!available) {
    processInfo = await getProcessOnPort(port);
  }

  const nextFree = !available ? await findAvailablePort(port + 1) : port;

  res.json({
    port,
    available,
    occupyingProcess: processInfo,
    suggestedAlternativePort: nextFree
  });
});

app.post('/api/ports/kill', async (req, res) => {
  const { port } = req.body;
  if (!port) return res.status(400).json({ error: 'Port erforderlich.' });
  const result = await killProcessOnPort(port);
  res.json(result);
});

/**
 * 4. FTP Verbindungstest, Datei-Erkennung & Upload
 */
app.post('/api/ftp/test', async (req, res) => {
  const result = await testFtpConnection(req.body);
  res.json(result);
});

app.post('/api/ftp/detect-files', async (req, res) => {
  try {
    const { projectPath, projectId } = req.body;
    let targetDir = projectPath;
    if (!targetDir && projectId) {
      targetDir = path.join(config.projectsDir, projectId);
    }
    if (!targetDir) {
      return res.status(400).json({ success: false, error: 'Kein Projektpfad angegeben.' });
    }
    const result = await detectProjectUploadFiles(targetDir);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ftp/upload', async (req, res) => {
  try {
    const { localDir, projectId, ftpConfig, scope, cleanRemoteBeforeUpload } = req.body;
    let targetDir = localDir;
    if (!targetDir && projectId) {
      const projDir = path.join(config.projectsDir, projectId);
      const detection = await detectProjectUploadFiles(projDir, scope || 'auto');
      targetDir = detection.selectedTarget?.path || projDir;
    }
    if (!targetDir) {
      return res.status(400).json({ success: false, error: 'Kein lokales Verzeichnis für den Upload ermittelt.' });
    }

    const cfg = ftpConfig || config.ftp;
    broadcastLog('system', `[FTP Engine] Starte Upload von '${targetDir}' nach '${cfg.remotePath || '/'}' (${cfg.host}:${cfg.port || 21})...`);

    const result = await uploadToFtp(targetDir, {
      ...cfg,
      cleanRemoteBeforeUpload: !!cleanRemoteBeforeUpload
    });

    broadcastLog('stdout', `[FTP Engine] ${result.message}`);
    res.json(result);
  } catch (err) {
    broadcastLog('stderr', `[FTP Engine] Upload-Fehler: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.05 Git Provider Endpunkte (GitHub & GitLab inkl. Custom Server)
 */
app.post('/api/git/test-connection', async (req, res) => {
  try {
    const result = await testGitProviderConnection(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/git/create-repo', async (req, res) => {
  try {
    const result = await createRemoteRepo(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/git/push', async (req, res) => {
  const { projectId, provider, token, repoUrl, branch, commitMessage } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId erforderlich' });

  const settings = loadSettings();
  const projectDir = path.join(settings.projectsDir, projectId);

  if (!fs.existsSync(projectDir)) {
    return res.status(404).json({ error: `Projektverzeichnis für '${projectId}' existiert nicht.` });
  }

  try {
    const result = await pushToRemoteRepo({
      projectDir,
      provider: provider || 'github',
      token: token || (provider === 'gitlab' ? settings.git?.gitlab?.token : settings.git?.github?.token),
      repoUrl,
      branch: branch || 'main',
      commitMessage: commitMessage || `Update ${projectId} from DB Studio`
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.1 Phase 2: Windows Autostart & Service Endpunkte
 */
app.get('/api/system/autostart', async (req, res) => {
  const status = await getWindowsAutostartStatus();
  res.json(status);
});

app.post('/api/system/autostart/toggle', async (req, res) => {
  const { enable } = req.body;
  const result = await toggleWindowsAutostart(!!enable);
  res.json(result);
});

/**
 * 4.2 Phase 3: Deployment Profile & Healthchecks
 */
app.get('/api/deployments/profiles', (req, res) => {
  res.json(getDeploymentProfiles());
});

app.post('/api/deployments/profiles', (req, res) => {
  const result = saveDeploymentProfiles(req.body);
  res.json(result);
});

app.post('/api/deployments/health-check', async (req, res) => {
  const { url } = req.body;
  const result = await performDeployHealthCheck(url);
  res.json(result);
});

/**
 * 4.3 Phase 4: Datenbank Explorer (SQLite / MySQL)
 */
app.post('/api/database/find', (req, res) => {
  const { projectId, projectPath } = req.body;
  const settings = loadSettings();
  const targetDir = projectPath || (projectId ? path.join(settings.projectsDir, projectId) : settings.projectsDir);
  const databases = findProjectDatabases(targetDir);
  res.json({ success: true, databases });
});

app.post('/api/database/inspect', async (req, res) => {
  const { dbPath } = req.body;
  const result = await inspectSqliteDatabase(dbPath);
  res.json(result);
});

app.post('/api/database/query', async (req, res) => {
  const { dbPath, query, limit } = req.body;
  const result = await querySqliteDatabase(dbPath, query, limit || 50);
  res.json(result);
});

/**
 * 4.4 Phase 5: Offline Template Generator
 */
app.get('/api/templates/list', (req, res) => {
  res.json(TEMPLATES);
});

app.post('/api/templates/create', async (req, res) => {
  try {
    const settings = loadSettings();
    const { templateId, projectName, targetDir, backendPort, frontendPort } = req.body;
    const dir = targetDir || settings.projectsDir;
    const result = await scaffoldProjectFromTemplate({
      templateId,
      projectName,
      targetDir: dir,
      backendPort,
      frontendPort
    });
    broadcastLog('system', `[Scaffolder] Projekt '${projectName}' aus Vorlage '${templateId}' erstellt.`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.5 Phase 6: CI/CD Pipeline Generator
 */
app.post('/api/git/generate-pipeline', (req, res) => {
  try {
    const { projectId, projectPath, provider, enableDotnetBuild, enableFrontendBuild, enableFtpDeploy, ftpHost, ftpUser, ftpPath } = req.body;
    const settings = loadSettings();
    const dir = projectPath || (projectId ? path.join(settings.projectsDir, projectId) : null);
    if (!dir) return res.status(400).json({ success: false, error: 'Kein Projektpfad angegeben.' });

    const result = generatePipelineFiles(dir, {
      provider,
      enableDotnetBuild,
      enableFrontendBuild,
      enableFtpDeploy,
      ftpHost,
      ftpUser,
      ftpPath
    });
    broadcastLog('system', `[CI/CD Generator] Pipeline für '${dir}' generiert.`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.6 Phase 7: Docker Compose Orchestrierung
 */
app.get('/api/docker/presets', (req, res) => {
  res.json(CONTAINER_PRESETS);
});

app.post('/api/docker/compose/generate', (req, res) => {
  try {
    const { projectId, projectPath, services } = req.body;
    const settings = loadSettings();
    const dir = projectPath || (projectId ? path.join(settings.projectsDir, projectId) : null);
    if (!dir) return res.status(400).json({ success: false, error: 'Kein Projektpfad angegeben.' });

    const result = generateDockerCompose(dir, services || ['mysql', 'redis']);
    broadcastLog('system', `[Docker Compose] docker-compose.yml generiert für '${dir}'.`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/docker/compose/action', async (req, res) => {
  try {
    const { projectId, projectPath, action } = req.body;
    const settings = loadSettings();
    const dir = projectPath || (projectId ? path.join(settings.projectsDir, projectId) : null);
    if (!dir) return res.status(400).json({ success: false, error: 'Kein Projektpfad angegeben.' });

    const result = await manageDockerCompose(dir, action || 'up');
    broadcastLog('system', `[Docker Compose] Action '${action}' auf '${dir}': ${result.output || result.message}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.1 Lokale Projekte auf Festplatte auflisten
 */
app.get('/api/projects', (req, res) => {
  const settings = loadSettings();
  const projectsDir = settings.projectsDir;

  if (!projectsDir || !fs.existsSync(projectsDir)) {
    return res.json([]);
  }

  try {
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    const projectList = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projPath = path.join(projectsDir, entry.name);
        const stats = fs.statSync(projPath);

        // Framework / Stack ermitteln
        let framework = 'Generisches Projekt';
        const hasTauri = fs.existsSync(path.join(projPath, 'Backend', 'Fakturierung_WaWi_Suite', 'src-tauri')) ||
          fs.existsSync(path.join(projPath, 'src-tauri')) ||
          fs.existsSync(path.join(projPath, 'Backend', 'src-tauri'));
        const hasDotnet = fs.existsSync(path.join(projPath, 'Backend')) &&
          fs.readdirSync(path.join(projPath, 'Backend')).some(f => f.endsWith('.csproj'));
        const hasElectron = fs.existsSync(path.join(projPath, 'Backend', 'README_ELECTRON.md')) ||
          fs.existsSync(path.join(projPath, 'Backend', 'main.js'));
        const hasFrontend = fs.existsSync(path.join(projPath, 'Frontend'));

        if (hasTauri) framework = 'Tauri Desktop + React';
        else if (hasElectron) framework = 'Electron Desktop + React';
        else if (hasDotnet && hasFrontend) framework = '.NET 10 WebAPI + React';
        else if (hasDotnet) framework = '.NET 10 WebAPI';
        else if (hasFrontend) framework = 'React (Vite)';

        const mtime = new Date(stats.mtime);
        const formattedDate = mtime.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
          ' ' + mtime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        projectList.push({
          id: entry.name,
          name: entry.name,
          path: projPath,
          framework,
          lastDeployed: formattedDate,
          size: '~'
        });
      }
    }

    res.json(projectList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4.1b Lokales Projekt von Festplatte starten
 */
app.post('/api/projects/launch', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId erforderlich' });

  const settings = loadSettings();
  try {
    const result = await handleDeploymentLogic({ projectId, options: { autoRun: true } }, settings);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.1c Natives Installations-Package bauen (Tauri / Electron / .NET MSI/EXE)
 */
app.post('/api/projects/build-package', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId erforderlich' });

  const settings = loadSettings();
  try {
    const packageResult = await buildInstallationPackage(projectId, settings);
    res.json(packageResult);
  } catch (err) {
    processManager.broadcastLog({
      stream: 'stderr',
      message: `[PackageBuilder Error] ${err.message}`
    });
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.1d Erstellten Installer ausführen
 */
app.post('/api/projects/launch-package', async (req, res) => {
  const { installerPath } = req.body;
  if (!installerPath) return res.status(400).json({ error: 'installerPath erforderlich' });

  try {
    const result = await launchInstallerPackage(installerPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.1e Installer-Zielordner im Explorer öffnen
 */
app.post('/api/projects/open-package-folder', async (req, res) => {
  const { targetPath } = req.body;
  if (!targetPath) return res.status(400).json({ error: 'targetPath erforderlich' });

  try {
    const result = await openInstallerFolder(targetPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4.2 Tauri Icons manuell oder automatisch synchronisieren
 */
app.post('/api/tauri/sync-icons', async (req, res) => {
  const { targetDir } = req.body;
  const dirToUse = targetDir || loadSettings().projectsDir;
  try {
    const result = await ensureTauriIcons(dirToUse);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 4.3 Developer TODO List (Get / Save)
 */
const getTodosFilePath = () => {
  const settings = loadSettings();
  const rootDir = path.dirname(settings.projectsDir) || process.cwd();
  return path.join(rootDir, 'todo_list.json');
};

const DEFAULT_DEV_TODOS = [
  {
    id: 'todo_1',
    title: 'Automatischen Tauri-Icon Download & Fallback-Provisioning absichern',
    category: 'Tauri & Desktop',
    priority: 'Kritisch',
    status: 'Erledigt',
    assignee: 'Bridge Daemon',
    description: 'Fehlende Tauri-Icons (ico, icns, png) bei jedem Generierungs- und Startzyklus automatisch aus dem lokalen Cache oder GitHub nachladen.'
  },
  {
    id: 'todo_2',
    title: 'Hardcoded Mock-Projekte (FakturaPro) aus Übersicht & Workspaces entfernen',
    category: 'Frontend & UI',
    priority: 'Hoch',
    status: 'Erledigt',
    assignee: 'Frontend Team',
    description: 'Bereinigung von veralteten Testdaten. Zeige stattdessen einen sauberen Leere-Zustand (Momentan keine Projekte).'
  },
  {
    id: 'todo_3',
    title: 'Echtzeit-Dateisystem-Watcher für Workspace-Verzeichnis implementieren',
    category: 'Backend & Daemon',
    priority: 'Mittel',
    status: 'Offen',
    assignee: 'Backend Team',
    description: 'Erkennt Änderungen an Projektdateien auf der Festplatte sofort und benachrichtigt verbundene Clients.'
  },
  {
    id: 'todo_4',
    title: 'SFTP Deployment-Profile & Remote-Healthchecks erweitern',
    category: 'Deployments',
    priority: 'Mittel',
    status: 'Offen',
    assignee: 'DevOps',
    description: 'Unterstützung für mehrere Zielserver und automatisierte Testaufrufe nach dem FTP-Upload.'
  },
  {
    id: 'todo_5',
    title: 'SQLite In-Memory Schema Inspector in Bridge UI integrieren',
    category: 'Frontend & UI',
    priority: 'Niedrig',
    status: 'Offen',
    assignee: 'Frontend Team',
    description: 'Ermöglicht das schnelle Betrachten von Tabellen und Tabellenstrukturen direkt in der Bridge.'
  }
];

app.get('/api/todos', (req, res) => {
  try {
    const todoFile = getTodosFilePath();
    if (fs.existsSync(todoFile)) {
      const data = JSON.parse(fs.readFileSync(todoFile, 'utf-8'));
      return res.json(data);
    }
  } catch (e) { }
  res.json(DEFAULT_DEV_TODOS);
});

app.post('/api/todos', (req, res) => {
  try {
    const todos = req.body;
    const todoFile = getTodosFilePath();
    fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2), 'utf-8');
    res.json({ success: true, count: todos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export async function handleDeploymentLogic(payload, settings) {
  const projectId = payload.projectId || 'Project_' + Date.now();
  const projectDir = path.join(settings.projectsDir, projectId);

  processManager.broadcastLog({
    stream: 'system',
    message: `[Deploy] Empfange und vorbereite Projekt '${projectId}' nach ${projectDir}...`
  });

  // A. Shared Store initialisieren
  initSharedStore(settings.sharedDependenciesDir);

  // B. Dateien schreiben / ZIP entpacken
  await writeProjectFiles(projectDir, payload);

  // C. Ports ermitteln & Konflikte prüfen
  let backendPort = payload.ports?.backendPort || settings.defaultBackendPort || 5000;
  let frontendPort = payload.ports?.frontendPort || settings.defaultFrontendPort || 3000;

  const beAvailable = await isPortAvailable(backendPort);
  if (!beAvailable) {
    if (settings.portConflictStrategy === 'kill_existing') {
      await killProcessOnPort(backendPort);
    } else if (settings.portConflictStrategy === 'auto_increment') {
      backendPort = await findAvailablePort(backendPort + 1);
    }
  }

  const feAvailable = await isPortAvailable(frontendPort);
  if (!feAvailable) {
    if (settings.portConflictStrategy === 'kill_existing') {
      await killProcessOnPort(frontendPort);
    } else if (settings.portConflictStrategy === 'auto_increment') {
      frontendPort = await findAvailablePort(frontendPort + 1);
    }
  }

  // D. Projektdateien adaptieren & Shared Dependencies verknüpfen
  const modifications = await adaptProject({
    projectDir,
    projectId,
    stack: payload.stack,
    ports: { backendPort, frontendPort },
    sharedDepsDir: settings.sharedDependenciesDir,
    allowedOrigins: settings.allowedOrigins
  });

  // E. Git Integration
  const gitResult = await handleGitIntegration(projectDir, projectId, settings.git, payload.git || payload.options?.git);

  // F. Sequentielle Build-Pipeline (wie in der run.bat):
  //    Schritt 1: Frontend bauen -> dist/
  //    Schritt 2: copy-dist.js ausführen (falls Desktop App)
  //    Schritt 3: Ziel-Applikation starten
  const backendDir = path.join(projectDir, 'Backend');
  const frontendDir = path.join(projectDir, 'Frontend');

  const findFileRecursive = (dir, predicate) => {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const p = path.join(dir, f);
      if (predicate(f, p)) return p;
      if (fs.statSync(p).isDirectory() && f !== 'node_modules' && f !== '.git' && f !== 'target') {
        const res = findFileRecursive(p, predicate);
        if (res) return res;
      }
    }
    return null;
  };

  // Schritt 1: Frontend bauen (falls vorhanden)
  if (fs.existsSync(frontendDir)) {
    processManager.broadcastLog({
      stream: 'system',
      message: `[Pipeline] [1/2] Transpiliere Frontend (npm run build)...`
    });
    await linkSharedNodeModules(frontendDir, settings.sharedDependenciesDir);
    try {
      await execPromise('npm run build', { cwd: frontendDir });
      processManager.broadcastLog({
        stream: 'system',
        message: `[Pipeline] [1/2] Frontend-Build erfolgreich in dist/ abgelegt.`
      });
    } catch (buildErr) {
      processManager.broadcastLog({
        stream: 'stderr',
        message: `[Pipeline Warning] Frontend-Build: ${buildErr.message}`
      });
    }
  }

  // Schritt 2: copy-dist.js im Backend ausführen (falls vorhanden)
  if (fs.existsSync(backendDir)) {
    const copyDistFile = findFileRecursive(backendDir, f => f === 'copy-dist.js');
    if (copyDistFile) {
      try {
        processManager.broadcastLog({
          stream: 'system',
          message: `[Pipeline] [2/2] Kopiere dist/ nach Desktop-Bundle (copy-dist.js)...`
        });
        await execPromise(`node "${path.basename(copyDistFile)}"`, { cwd: path.dirname(copyDistFile) });
      } catch (copyErr) {
        // Ignorieren falls nicht benötigt
      }
    }
  }

  // Schritt 3: Ziel-Prozesse registrieren (Start erfolgt manuell durch Benutzer in der UI)
  const shouldAutoRun = payload.options?.autoRun === true;
  const registeredProcs = [];

  const isDockerTarget = payload.options?.executionTarget === 'docker' ||
    payload.stack?.executionTarget === 'docker' ||
    payload.options?.useDocker === true ||
    fs.existsSync(path.join(projectDir, 'docker-compose.yml')) ||
    fs.existsSync(path.join(projectDir, 'docker-compose.yaml'));

  // Fall 1: Docker-Container Modus
  if (isDockerTarget) {
    processManager.broadcastLog({
      stream: 'system',
      message: `[Deploy] Docker-Stack wird vorbereitet...`
    });

    await ensureDockerCompose(projectDir, payload);

    const dockerProc = {
      id: `${projectId}_docker`,
      name: `${projectId} (Docker Stack)`,
      type: 'container_docker',
      command: 'docker',
      args: ['compose', 'up', '-d'],
      cwd: projectDir,
      port: backendPort,
      status: 'stopped'
    };
    processManager.registerProcess(dockerProc);
    registeredProcs.push(dockerProc);

    // Falls Desktop App (Tauri / Electron) vorhanden ist, Desktop Frontend auf Host registrieren!
    const tauriDir = findFileRecursive(backendDir, (f, p) => f === 'src-tauri' && fs.statSync(p).isDirectory());
    if (tauriDir) {
      const tauriPackageDir = path.dirname(tauriDir);
      await ensureTauriIcons(tauriDir);
      await linkSharedNodeModules(tauriPackageDir, settings.sharedDependenciesDir);
      const tauriProc = {
        id: `${projectId}_tauri`,
        name: `${projectId} (Tauri Desktop App)`,
        type: 'desktop_tauri',
        command: 'npm',
        args: ['run', 'dev'],
        cwd: tauriPackageDir,
        port: 5173,
        status: 'stopped'
      };
      processManager.registerProcess(tauriProc);
      registeredProcs.push(tauriProc);
    }

    const electronMarker = findFileRecursive(backendDir, (f, p) => f === 'README_ELECTRON.md' || (f === 'main.js' && !p.includes('dist')));
    if (electronMarker) {
      const elecPackageDir = path.dirname(electronMarker);
      await linkSharedNodeModules(elecPackageDir, settings.sharedDependenciesDir);
      const elecProc = {
        id: `${projectId}_electron`,
        name: `${projectId} (Electron Desktop App)`,
        type: 'desktop_electron',
        command: 'npm',
        args: ['start'],
        cwd: elecPackageDir,
        port: 3000,
        status: 'stopped'
      };
      processManager.registerProcess(elecProc);
      registeredProcs.push(elecProc);
    }

    if (shouldAutoRun) {
      const dockerStatus = await checkDockerStatus();
      if (dockerStatus.installed && dockerStatus.running) {
        await startDockerContainers({
          projectId,
          projectDir,
          ports: { backendPort, frontendPort },
          name: `${projectId} (Docker Stack)`
        });
      }
      for (const p of registeredProcs) {
        if (p.id !== `${projectId}_docker`) {
          await processManager.startProcessById(p.id);
        }
      }
    }
  } else {
    // Fall 2: Native Ausführung
    let hasDesktop = false;

    // A. Tauri App Erkennung (src-tauri Ordner)
    const tauriDir = findFileRecursive(backendDir, (f, p) => f === 'src-tauri' && fs.statSync(p).isDirectory());
    if (tauriDir) {
      hasDesktop = true;
      const tauriPackageDir = path.dirname(tauriDir);
      await ensureTauriIcons(tauriDir);
      await linkSharedNodeModules(tauriPackageDir, settings.sharedDependenciesDir);

      const pkgPath = path.join(tauriPackageDir, 'package.json');
      let startCmd = ['run', 'dev'];
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          if (pkg.scripts?.['dev']) startCmd = ['run', 'dev'];
          else if (pkg.scripts?.['start']) startCmd = ['start'];
        } catch (e) { }
      }

      const tauriProc = {
        id: `${projectId}_tauri`,
        name: `${projectId} (Tauri Desktop App)`,
        type: 'desktop_tauri',
        command: 'npm',
        args: startCmd,
        cwd: tauriPackageDir,
        port: 5173,
        status: 'stopped'
      };
      processManager.registerProcess(tauriProc);
      registeredProcs.push(tauriProc);
    }

    // B. Electron Desktop App Erkennung (README_ELECTRON.md oder main.js)
    const electronMarker = findFileRecursive(backendDir, (f, p) => f === 'README_ELECTRON.md' || (f === 'main.js' && !p.includes('dist')));
    if (electronMarker) {
      hasDesktop = true;
      const elecPackageDir = path.dirname(electronMarker);
      await linkSharedNodeModules(elecPackageDir, settings.sharedDependenciesDir);

      const pkgPath = path.join(elecPackageDir, 'package.json');
      let startCmd = ['start'];
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          if (pkg.scripts?.['electron:dev']) startCmd = ['run', 'electron:dev'];
          else if (pkg.scripts?.['start']) startCmd = ['start'];
          else if (pkg.scripts?.['dev']) startCmd = ['run', 'dev'];
        } catch (e) { }
      }

      const elecProc = {
        id: `${projectId}_electron`,
        name: `${projectId} (Electron Desktop App)`,
        type: 'desktop_electron',
        command: 'npm',
        args: startCmd,
        cwd: elecPackageDir,
        port: 3000,
        status: 'stopped'
      };
      processManager.registerProcess(elecProc);
      registeredProcs.push(elecProc);
    }

    if (!hasDesktop) {
      // C. .NET C# WebAPI Backend
      const csprojFile = findFileRecursive(backendDir, f => f.endsWith('.csproj'));
      if (csprojFile) {
        const csprojDir = path.dirname(csprojFile);
        const beProc = {
          id: `${projectId}_backend`,
          name: `${projectId} (.NET WebAPI)`,
          type: 'backend_csharp',
          command: 'dotnet',
          args: ['run', `--urls=http://localhost:${backendPort}`],
          cwd: csprojDir,
          port: backendPort,
          env: {
            ASPNETCORE_URLS: `http://localhost:${backendPort}`,
            DOTNET_CLI_TELEMETRY_OPTOUT: '1'
          },
          status: 'stopped'
        };
        processManager.registerProcess(beProc);
        registeredProcs.push(beProc);
      } else {
        // D. Node.js Express / SQLite Backend
        const nodeServerFile = findFileRecursive(backendDir, (f, p) => (f === 'server.js' || f === 'app.js' || f === 'index.js') && !p.includes('dist'));
        if (nodeServerFile) {
          const nodeDir = path.dirname(nodeServerFile);
          await linkSharedNodeModules(nodeDir, settings.sharedDependenciesDir);
          const beProc = {
            id: `${projectId}_backend`,
            name: `${projectId} (Node.js Express & SQLite)`,
            type: 'backend_nodejs',
            command: 'node',
            args: [path.basename(nodeServerFile)],
            cwd: nodeDir,
            port: backendPort,
            env: {
              PORT: backendPort.toString(),
              DATABASE_URL: 'sqlite:./database.sqlite'
            },
            status: 'stopped'
          };
          processManager.registerProcess(beProc);
          registeredProcs.push(beProc);
        }
      }

      // E. Web Frontend (React Vite) falls reines Web-Projekt
      if (fs.existsSync(frontendDir)) {
        const feProc = {
          id: `${projectId}_frontend`,
          name: `${projectId} (React Vite)`,
          type: 'frontend_react',
          command: 'npm',
          args: ['run', 'dev', '--', '--port', frontendPort.toString()],
          cwd: frontendDir,
          port: frontendPort,
          status: 'stopped'
        };
        processManager.registerProcess(feProc);
        registeredProcs.push(feProc);
      }
    }

    if (shouldAutoRun) {
      for (const p of registeredProcs) {
        await processManager.startProcessById(p.id);
      }
    }
  }

  processManager.broadcastLog({
    stream: 'system',
    message: `[Pipeline] Projekt '${projectId}' erfolgreich vorbereitet. Prozesse unter 'Verwaltete Prozesse & Ports' registriert und bereit zum Starten.`
  });

  return {
    success: true,
    projectId,
    projectPath: projectDir,
    backendUrl: `http://localhost:${backendPort}`,
    frontendUrl: `http://localhost:${frontendPort}`,
    ports: { backendPort, frontendPort },
    modifications,
    gitResult,
    registeredProcesses: registeredProcs.map(p => p.id),
    autoStarted: shouldAutoRun
  };
}

/**
 * 4.9 Docker Endpunkte (Status, Compose Up, Compose Down, Templates)
 */
app.get('/api/docker/status', async (req, res) => {
  try {
    const status = await checkDockerStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/docker/compose/up', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId erforderlich' });

  const settings = loadSettings();
  const projectDir = path.join(settings.projectsDir, projectId);

  if (!fs.existsSync(projectDir)) {
    return res.status(404).json({ error: `Projektverzeichnis für '${projectId}' nicht gefunden.` });
  }

  try {
    const result = await startDockerContainers({
      projectId,
      projectDir,
      ports: { backendPort: 5000, frontendPort: 3000 }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/docker/compose/down', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId erforderlich' });

  const settings = loadSettings();
  const projectDir = path.join(settings.projectsDir, projectId);

  try {
    const result = await stopDockerContainers({ projectId, projectDir });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Projekt Deploy & Start
 */
app.post('/api/deploy', validateToken, async (req, res) => {
  const settings = loadSettings();
  try {
    const result = await handleDeploymentLogic(req.body, settings);
    res.json(result);
  } catch (err) {
    processManager.broadcastLog({
      stream: 'stderr',
      message: `[Deploy Error] ${err.message}`
    });
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. Prozess-Aktionen (Start / Stop / Restart)
 */
app.post('/api/process/action', async (req, res) => {
  const { processId, action } = req.body;
  if (!processId || !action) return res.status(400).json({ error: 'processId und action erforderlich.' });

  try {
    if (action === 'start') {
      const proc = await processManager.startProcessById(processId);
      return res.json({ success: true, process: proc });
    }
    if (action === 'stop') {
      const ok = await processManager.stopProcess(processId);
      return res.json({ success: ok });
    }
    if (action === 'restart') {
      const ok = await processManager.restartProcess(processId);
      return res.json({ success: ok });
    }
    res.status(400).json({ error: `Unbekannte Aktion '${action}'.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. Paket- & Dependency-Management Endpunkte
 */
// 7.1 Alle Targets abrufen (Shared Store & Projekte)
app.get('/api/dependencies/targets', async (req, res) => {
  try {
    const settings = loadSettings();
    const targets = await getAllDependencyTargets(settings);
    res.json({ success: true, targets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.2 Dependencies für ein bestimmtes Verzeichnis abrufen
app.get('/api/dependencies', async (req, res) => {
  const { dirPath } = req.query;
  const settings = loadSettings();
  const targetDir = dirPath ? String(dirPath) : settings.sharedDependenciesDir;

  try {
    const data = await getDependenciesForDirectory(targetDir);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.3 Paket installieren (npm, nuget, cargo)
app.post('/api/dependencies/install', async (req, res) => {
  const { targetDir, packageManager, packageName, isDev, version } = req.body;
  if (!targetDir || !packageName) {
    return res.status(400).json({ error: 'targetDir und packageName erforderlich.' });
  }

  try {
    const result = await installPackage({
      targetDir,
      packageManager: packageManager || 'npm',
      packageName,
      isDev: Boolean(isDev),
      version
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.4 Paket deinstallieren
app.post('/api/dependencies/uninstall', async (req, res) => {
  const { targetDir, packageManager, packageName } = req.body;
  if (!targetDir || !packageName) {
    return res.status(400).json({ error: 'targetDir und packageName erforderlich.' });
  }

  try {
    const result = await uninstallPackage({
      targetDir,
      packageManager: packageManager || 'npm',
      packageName
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.5 Vollständiger Restore (npm install / dotnet restore)
app.post('/api/dependencies/restore', async (req, res) => {
  const { targetDir, packageManager } = req.body;
  if (!targetDir) {
    return res.status(400).json({ error: 'targetDir erforderlich.' });
  }

  try {
    const result = await restoreAllDependencies({
      targetDir,
      packageManager: packageManager || 'npm'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.6 Paket aktualisieren (1-Klick Update)
app.post('/api/dependencies/update', async (req, res) => {
  const { targetDir, packageManager, packageName, isDev } = req.body;
  if (!targetDir || !packageName) {
    return res.status(400).json({ error: 'targetDir und packageName erforderlich.' });
  }

  try {
    const result = await updatePackage({
      targetDir,
      packageManager: packageManager || 'npm',
      packageName,
      isDev: Boolean(isDev)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.7 Alle Pakete aktualisieren (1-Klick Gesamt-Update)
app.post('/api/dependencies/update-all', async (req, res) => {
  const { targetDir, packageManager } = req.body;
  if (!targetDir) {
    return res.status(400).json({ error: 'targetDir erforderlich.' });
  }

  try {
    const result = await updateAllPackages({
      targetDir,
      packageManager: packageManager || 'npm'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.8 Symlink / Junction zum Shared Store neu knüpfen
app.post('/api/dependencies/relink', async (req, res) => {
  const { targetDir } = req.body;
  if (!targetDir) {
    return res.status(400).json({ error: 'targetDir erforderlich.' });
  }

  const settings = loadSettings();
  try {
    const result = await linkSharedNodeModules(targetDir, settings.sharedDependenciesDir);
    processManager.broadcastLog({
      stream: 'system',
      message: `[Package Manager] Shared node_modules für '${targetDir}' neu verknüpft.`
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * =============================================================================
 * 8. PHASE 8: MICROSOFT ACCESS MIGRATION ENGINE (.accdb / .mdb)
 * =============================================================================
 */

// 8.1 Access Datei hochladen & temporär speichern
app.post('/api/migration/access/upload', async (req, res) => {
  const { fileName, base64Content } = req.body;
  if (!fileName || !base64Content) {
    return res.status(400).json({ success: false, error: 'fileName und base64Content erforderlich.' });
  }

  try {
    const uploadDir = path.resolve(__dirname, '../../Projects/.access_migration');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = path.basename(fileName);
    const targetPath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(targetPath, buffer);

    broadcastLog('system', `[Access Migration Engine] Datei '${safeName}' (${(buffer.length / 1024).toFixed(1)} KB) empfangen.`);

    // Direkt inspizieren
    const inspection = await inspectAccessDatabase(targetPath);
    res.json(inspection);
  } catch (err) {
    broadcastLog('stderr', `[Access Migration Engine] Fehler beim Upload: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8.2 Access Datenbank inspizieren (Tabellen, Spalten, Datentypen, Abfragen)
app.post('/api/migration/access/inspect', async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'filePath erforderlich.' });
  }

  try {
    const inspection = await inspectAccessDatabase(filePath);
    broadcastLog('system', `[Access Migration Engine] Datenbank '${inspection.fileName}' analysiert (${inspection.tableCount} Tabellen, ${inspection.queryCount} Abfragen).`);
    res.json(inspection);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8.3 Schema & Abfragen in Zieldialekt transpilieren (PostgreSQL, MySQL, SQLite, T-SQL)
app.post('/api/migration/access/transpile', (req, res) => {
  const { tables, queries, dialect } = req.body;
  const targetDialect = dialect || 'postgres';

  try {
    const ddl = transpileAccessSchema(tables || [], targetDialect);
    const transpiledQueries = (queries || []).map(q => ({
      name: q.name,
      originalAccessSql: q.accessSql,
      transpiledSql: transpileAccessQuery(q.accessSql, targetDialect)
    }));

    res.json({
      success: true,
      dialect: targetDialect,
      ddl,
      queries: transpiledQueries
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8.4 Vollständigen DB Studio Export generieren
app.post('/api/migration/access/export-to-dbstudio', (req, res) => {
  const { inspectionData, dialect } = req.body;
  if (!inspectionData || !inspectionData.tables) {
    return res.status(400).json({ success: false, error: 'Ungültige Inspektionsdaten.' });
  }

  try {
    const exportPayload = generateDbStudioExportPayload(inspectionData, dialect || 'postgres');
    broadcastLog('system', `[Access Migration Engine] DB Studio Export-Paket für '${inspectionData.fileName}' (${dialect || 'postgres'}) generiert.`);
    res.json({
      success: true,
      exportPayload
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8.5 Natives .dbsp Projekt-Format für DB Studio generieren & herunterladen
app.post('/api/migration/access/export-dbsp', (req, res) => {
  const { inspectionData } = req.body;
  if (!inspectionData || !inspectionData.tables) {
    return res.status(400).json({ success: false, error: 'Ungültige Inspektionsdaten.' });
  }

  try {
    const dbspContent = generateDbStudioNativeDbsp(inspectionData);
    broadcastLog('system', `[Access Migration Engine] Natives DB Studio Projekt-Backup (.dbsp) für '${inspectionData.fileName}' erzeugt.`);
    res.json({
      success: true,
      fileName: `${path.basename(inspectionData.fileName, path.extname(inspectionData.fileName))}.dbsp`,
      dbspContent
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. PHASE 9: LIVE DATA-SYNC & BATCH MIGRATION
// ==========================================

// 9.1 Sync Preview & Topologische Reihenfolge ermitteln
app.post('/api/migration/sync/preview', (req, res) => {
  const { inspectionData } = req.body;
  if (!inspectionData || !inspectionData.tables) {
    return res.status(400).json({ success: false, error: 'Ungültige Inspektionsdaten.' });
  }

  try {
    const sortedTables = sortTablesTopologically(inspectionData.tables, inspectionData.relationships || []);
    const totalRows = sortedTables.reduce((acc, t) => acc + (t.rowCount || 0), 0);

    res.json({
      success: true,
      totalTables: sortedTables.length,
      totalRows,
      executionPlan: sortedTables.map((t, idx) => ({
        order: idx + 1,
        tableName: t.name,
        rowCount: t.rowCount || 0,
        columnCount: t.columns?.length || 0,
        hasPrimaryKey: t.columns?.some(c => c.isPrimaryKey) || false
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9.2 Vollständigen SQL Data-Dump generieren (Schema + alle Datenzeilen)
app.post('/api/migration/sync/export-dump', async (req, res) => {
  const { filePath, inspectionData, dialect } = req.body;
  if (!inspectionData || !inspectionData.tables) {
    return res.status(400).json({ success: false, error: 'Ungültige Inspektionsdaten.' });
  }

  const targetPath = filePath || inspectionData.filePath;
  const targetDialect = dialect || 'postgres';

  try {
    broadcastLog('system', `[DataSync Engine] Starte Batch-Dump-Generierung für '${inspectionData.fileName}' (${targetDialect})...`);
    
    const dumpResult = await generateFullSqlDataDump(targetPath, inspectionData, targetDialect, (progress) => {
      broadcastLog('system', `[DataSync Engine] ${progress.message}`);
    });

    broadcastLog('system', `[DataSync Engine] SQL Data-Dump erfolgreich abgeschlossen: ${dumpResult.totalRows} Datensätze in ${dumpResult.totalTables} Tabellen.`);

    res.json({
      success: true,
      dialect: targetDialect,
      fileName: `${path.basename(inspectionData.fileName, path.extname(inspectionData.fileName))}_full_dump_${targetDialect}.sql`,
      totalTables: dumpResult.totalTables,
      totalRows: dumpResult.totalRows,
      sqlDump: dumpResult.sqlDump
    });
  } catch (err) {
    broadcastLog('system', `[DataSync Engine] Fehler beim Erstellen des Dumps: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9.3 Direkte Synchronisation in lokale SQLite-Datenbankdatei (.db)
app.post('/api/migration/sync/start-sqlite', async (req, res) => {
  const { filePath, inspectionData, targetFileName } = req.body;
  if (!inspectionData || !inspectionData.tables) {
    return res.status(400).json({ success: false, error: 'Ungültige Inspektionsdaten.' });
  }

  const sourcePath = filePath || inspectionData.filePath;
  const baseName = path.basename(inspectionData.fileName, path.extname(inspectionData.fileName));
  const outFileName = targetFileName || `${baseName}_migrated.db`;
  const targetDbPath = path.resolve(__dirname, '../../Projects', outFileName);

  try {
    broadcastLog('system', `[DataSync Engine] Starte SQLite-Direktmigration nach '${outFileName}'...`);

    const result = await syncToLocalSqliteDatabase(sourcePath, inspectionData, targetDbPath, (progress) => {
      broadcastLog('system', `[DataSync Engine] ${progress.message}`);
    });

    broadcastLog('system', `[DataSync Engine] SQLite-Migration erfolgreich abgeschlossen: ${result.totalRows} Zeilen nach '${targetDbPath}' geschrieben.`);

    res.json({
      success: true,
      targetDbPath,
      targetFileName: outFileName,
      totalTables: result.totalTables,
      totalRows: result.totalRows,
      sortedTables: result.sortedTables
    });
  } catch (err) {
    broadcastLog('system', `[DataSync Engine] SQLite-Migrationsfehler: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server mit automatischer Port-Kollisionsprüfung
async function startServer() {
  const settings = loadSettings();
  let port = settings.bridgeServerPort || 5050;

  const isFree = await isPortAvailable(port);
  if (!isFree) {
    console.warn(`[WARNUNG] Standard-Port ${port} ist belegt!`);
    if (settings.portConflictStrategy === 'kill_existing') {
      await killProcessOnPort(port);
      console.log(`Blockierender Prozess auf Port ${port} beendet.`);
    } else {
      const altPort = await findAvailablePort(port + 1);
      console.log(`Wechsle automatisch auf freien Port ${altPort}`);
      port = altPort;
      settings.bridgeServerPort = port;
      saveSettings(settings);
    }
  }

  // Initialisiere Shared Store
  initSharedStore(settings.sharedDependenciesDir);

  // Initialisiere Workspace Realtime Watcher
  workspaceWatcher.init(settings.projectsDir, broadcastLog);

  server.listen(port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 DB Studio Bridge Daemon läuft auf Port: ${port}`);
    console.log(`📡 WebSocket Terminal Logs: ws://127.0.0.1:${port}/logs`);
    console.log(`📂 Projekte-Ordner: ${settings.projectsDir}`);
    console.log(`📦 Shared Dependencies: ${settings.sharedDependenciesDir}`);
    console.log(`🔐 Sicherheits-Token: ${settings.securityToken}`);
    console.log(`====================================================`);
  });
}

startServer();
