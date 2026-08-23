import { BridgeConfig } from '../../types/bridge';

export function generateBridgeServerJsCode(config: BridgeConfig): string {
  const port = config.port || 5050;
  const token = config.token || 'dbstudio-bridge-local-token';

  return `/**
 * DB Studio Pro - Local Execution Bridge Agent
 * 
 * Features:
 * 1. Native Desktop App runner (Tauri, Electron, .NET C#, Node.js Express, Vite)
 * 2. Reliable Process Lifecycle: Start, Stop, Neustart with Process-Tree & Port Liberation
 * 3. Realtime Two-Way Telemetry & Heartbeat Sync (Host, OS, Node, .NET, Rust, RAM, Processes)
 * 4. Bidirectional Relay Polling & Direct API (/api/status, /api/deploy, /api/process/action)
 * 5. Centralized Shared Dependencies store to prevent disk clutter & duplicate downloads
 * 6. Live log streaming via WebSockets (/logs) and Relay sync (/push_logs)
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const PORT = process.env.PORT || ${port};
const AUTH_TOKEN = process.env.BRIDGE_TOKEN || "${token}";
const RELAY_URL = process.env.RELAY_URL || "https://dbstudiopro.edv-knowhow.at/api/bridge_relay.php";

const BASE_DIR = path.resolve(__dirname, 'DBStudio_Workspace');
const PROJECTS_DIR = path.join(BASE_DIR, 'Projects');
const SHARED_DEPS_DIR = path.join(BASE_DIR, 'Shared_Dependencies');

// Ensure base directories exist
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
if (!fs.existsSync(SHARED_DEPS_DIR)) fs.mkdirSync(SHARED_DEPS_DIR, { recursive: true });

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Bridge-Token', 'bypass-tunnel-reminder']
}));
app.use(express.json({ limit: '100mb' }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/logs' });

// Active running project processes: Map<projectId, { backendProc, frontendProc, desktopProc, projectPath, stack, ports, status }>
const runningProcesses = new Map();
const recentLogsBuffer = new Map(); // projectId -> Array<LogEntry>

// ==========================================
// 1. Process Management & Port Liberation
// ==========================================

function killProcessTree(proc) {
  if (!proc) return;
  try {
    if (process.platform === 'win32' && proc.pid) {
      execSync(\`taskkill /pid \${proc.pid} /T /F\`, { stdio: 'ignore' });
    } else if (proc.pid) {
      try {
        process.kill(-proc.pid, 'SIGKILL');
      } catch (e) {
        proc.kill('SIGKILL');
      }
    } else {
      proc.kill();
    }
  } catch (e) {
    try { proc.kill(); } catch (_) {}
  }
}

function freePorts(portsList) {
  if (!portsList || !Array.isArray(portsList)) return;
  
  portsList.forEach(port => {
    if (!port || isNaN(port)) return;
    try {
      if (process.platform === 'win32') {
        const output = execSync(\`netstat -ano | findstr :\${port}\`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const lines = output.split('\\n');
        for (const line of lines) {
          if (line.includes('LISTENING') || line.includes('ABHÖREN') || line.includes(\`:\${port}\`)) {
            const parts = line.trim().split(/\\s+/);
            const pid = parts[parts.length - 1];
            if (pid && /^\\d+$/.test(pid) && parseInt(pid) > 0 && parseInt(pid) !== process.pid) {
              try { execSync(\`taskkill /pid \${pid} /F /T\`, { stdio: 'ignore' }); } catch (_) {}
            }
          }
        }
      } else {
        try {
          execSync(\`fuser -k \${port}/tcp\`, { stdio: 'ignore' });
        } catch (_) {
          try { execSync(\`lsof -ti :\${port} | xargs kill -9\`, { stdio: 'ignore' }); } catch (_) {}
        }
      }
    } catch (e) {}
  });
}

// Broadcast log to websocket clients and buffer for relay sync
function broadcastLog(projectId, logEntry) {
  const fullLog = {
    projectId: projectId || 'default',
    timestamp: logEntry.timestamp || new Date().toISOString(),
    service: logEntry.service || 'Bridge',
    type: logEntry.type || 'stdout',
    message: logEntry.message || ''
  };

  const pid = projectId || 'default';
  if (!recentLogsBuffer.has(pid)) {
    recentLogsBuffer.set(pid, []);
  }
  const buf = recentLogsBuffer.get(pid);
  buf.push(fullLog);
  if (buf.length > 250) buf.shift();

  const payload = JSON.stringify(fullLog);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      if (!client.subscribedProjectId || client.subscribedProjectId === projectId) {
        client.send(payload);
      }
    }
  });
}

// Token middleware
function requireToken(req, res, next) {
  const token = req.headers['x-bridge-token'] || req.query.token;
  if (AUTH_TOKEN && token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Ungültiges oder fehlendes X-Bridge-Token.' });
  }
  next();
}

// Helper to detect installed runtimes & SDKs
function detectRuntimes() {
  const runtimes = {};
  try { runtimes.node = execSync('node -v', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { runtimes.node = null; }
  try { runtimes.nodejs = runtimes.node; } catch {}
  try { runtimes.npm = execSync('npm -v', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { runtimes.npm = null; }
  try { runtimes.dotnet = execSync('dotnet --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { runtimes.dotnet = null; }
  try { runtimes.dotnetSdk = runtimes.dotnet; } catch {}
  try { runtimes.rust = execSync('rustc --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { runtimes.rust = null; }
  try { runtimes.cargo = execSync('cargo --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { runtimes.cargo = null; }
  try { runtimes.git = execSync('git --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { runtimes.git = null; }
  try { runtimes.docker = execSync('docker --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { runtimes.docker = null; }
  return runtimes;
}

// Get comprehensive telemetry object
function getTelemetryData() {
  const activeProcessesList = [];
  runningProcesses.forEach((val, key) => {
    activeProcessesList.push({
      projectId: key,
      backendPort: val.backendPort,
      frontendPort: val.frontendPort,
      status: val.status,
      desktopType: val.desktopType || 'none'
    });
  });

  return {
    status: 'online',
    version: '1.3.0',
    hostname: os.hostname(),
    osPlatform: \`\${os.type()} \${os.release()} (\${os.arch()})\`,
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    bridgePort: PORT,
    runtimes: detectRuntimes(),
    config: {
      projectsDir: PROJECTS_DIR,
      sharedDependenciesDir: SHARED_DEPS_DIR,
      activePort: PORT
    },
    runningProjects: activeProcessesList,
    activeProcesses: activeProcessesList
  };
}

// ==========================================
// 2. Project Architecture Launcher
// ==========================================

function launchProjectArchitecture(cleanProjectFolder, payload) {
  const { projectId, projectName, stack, ports } = payload || {};
  const backendPort = (ports && ports.backendPort) || 5000;
  const frontendPort = (ports && ports.frontendPort) || 3000;
  const backendUrl = \`http://localhost:\${backendPort}\`;
  const frontendUrl = \`http://localhost:\${frontendPort}\`;

  // Free any previous port holders to ensure clean startup
  freePorts([backendPort, frontendPort]);

  const projectEntry = {
    projectId: projectId || path.basename(cleanProjectFolder),
    projectName: projectName || projectId || path.basename(cleanProjectFolder),
    projectPath: cleanProjectFolder,
    backendPort,
    frontendPort,
    backendUrl,
    frontendUrl,
    stack: stack || {},
    status: 'RUNNING',
    desktopType: 'none',
    backendProc: null,
    frontendProc: null,
    desktopProc: null
  };

  const currentPid = projectEntry.projectId;

  // Inspect directory structure
  const srcTauriDir = path.join(cleanProjectFolder, 'src-tauri');
  const hasTauri = fs.existsSync(srcTauriDir) || fs.existsSync(path.join(cleanProjectFolder, 'Frontend', 'src-tauri'));
  const hasElectron = fs.existsSync(path.join(cleanProjectFolder, 'main.js')) || 
                      fs.existsSync(path.join(cleanProjectFolder, 'Frontend', 'main.js')) ||
                      fs.existsSync(path.join(cleanProjectFolder, 'README_ELECTRON.md'));
  const backendDir = path.join(cleanProjectFolder, 'Backend');
  const frontendDir = path.join(cleanProjectFolder, 'Frontend');

  // 1. TAURI Desktop Native Launch
  if (hasTauri) {
    projectEntry.desktopType = 'tauri';
    broadcastLog(currentPid, {
      type: 'system',
      service: 'Tauri',
      message: '🦀 TAURI Desktop-Architektur erkannt. Initialisiere natives Fenster & Dev-Pipeline...'
    });

    const targetDir = fs.existsSync(srcTauriDir) ? cleanProjectFolder : (fs.existsSync(frontendDir) ? frontendDir : cleanProjectFolder);
    const proc = spawn('npm', ['run', 'tauri', 'dev'], {
      cwd: targetDir,
      shell: true,
      env: { ...process.env, VITE_PORT: frontendPort.toString(), VITE_BACKEND_URL: backendUrl }
    });
    proc.stdout?.on('data', d => broadcastLog(currentPid, { type: 'stdout', service: 'Tauri', message: d.toString() }));
    proc.stderr?.on('data', d => broadcastLog(currentPid, { type: 'stderr', service: 'Tauri', message: d.toString() }));
    projectEntry.desktopProc = proc;
  }
  // 2. ELECTRON Desktop Native Launch
  else if (hasElectron) {
    projectEntry.desktopType = 'electron';
    broadcastLog(currentPid, {
      type: 'system',
      service: 'Electron',
      message: '⚡ ELECTRON Desktop-Architektur erkannt. Starte native Desktop-Applikation...'
    });

    const targetDir = fs.existsSync(path.join(cleanProjectFolder, 'main.js')) ? cleanProjectFolder : (fs.existsSync(frontendDir) ? frontendDir : cleanProjectFolder);
    const proc = spawn('npm', ['start'], {
      cwd: targetDir,
      shell: true,
      env: { ...process.env, PORT: frontendPort.toString() }
    });
    proc.stdout?.on('data', d => broadcastLog(currentPid, { type: 'stdout', service: 'Electron', message: d.toString() }));
    proc.stderr?.on('data', d => broadcastLog(currentPid, { type: 'stderr', service: 'Electron', message: d.toString() }));
    projectEntry.desktopProc = proc;
  }
  // 3. Web & API (.NET C# / Node.js + React/Vite)
  else {
    if (fs.existsSync(backendDir)) {
      const isDotnet = (stack && stack.backendType === 'dotnet') || 
                       fs.existsSync(path.join(backendDir, 'Program.cs')) ||
                       (fs.existsSync(backendDir) && fs.readdirSync(backendDir).some(f => f.endsWith('.csproj')));
      
      if (isDotnet) {
        broadcastLog(currentPid, {
          type: 'system',
          service: 'Backend',
          message: \`🔨 Starte .NET WebAPI via "dotnet run" auf Port \${backendPort}...\`
        });
        const proc = spawn('dotnet', ['run', '--urls', \`http://localhost:\${backendPort}\`], {
          cwd: backendDir,
          shell: true,
          env: { ...process.env, ASPNETCORE_ENVIRONMENT: 'Development' }
        });
        proc.stdout?.on('data', d => broadcastLog(currentPid, { type: 'stdout', service: 'Backend', message: d.toString() }));
        proc.stderr?.on('data', d => broadcastLog(currentPid, { type: 'stderr', service: 'Backend', message: d.toString() }));
        projectEntry.backendProc = proc;
      } else {
        broadcastLog(currentPid, {
          type: 'system',
          service: 'Backend',
          message: \`🔨 Starte Node.js Backend auf Port \${backendPort}...\`
        });
        const proc = spawn('npm', ['start'], {
          cwd: backendDir,
          shell: true,
          env: { ...process.env, PORT: backendPort.toString() }
        });
        proc.stdout?.on('data', d => broadcastLog(currentPid, { type: 'stdout', service: 'Backend', message: d.toString() }));
        proc.stderr?.on('data', d => broadcastLog(currentPid, { type: 'stderr', service: 'Backend', message: d.toString() }));
        projectEntry.backendProc = proc;
      }
    }

    if (fs.existsSync(frontendDir)) {
      broadcastLog(currentPid, {
        type: 'system',
        service: 'Frontend',
        message: \`🔨 Starte Frontend (Vite Dev-Server auf Port \${frontendPort})...\`
      });
      const proc = spawn('npm', ['run', 'dev', '--', '--port', frontendPort.toString()], {
        cwd: frontendDir,
        shell: true,
        env: { ...process.env, VITE_PORT: frontendPort.toString(), VITE_BACKEND_URL: backendUrl }
      });
      proc.stdout?.on('data', d => broadcastLog(currentPid, { type: 'stdout', service: 'Frontend', message: d.toString() }));
      proc.stderr?.on('data', d => broadcastLog(currentPid, { type: 'stderr', service: 'Frontend', message: d.toString() }));
      projectEntry.frontendProc = proc;
    }
  }

  runningProcesses.set(currentPid, projectEntry);
  broadcastLog(currentPid, {
    type: 'system',
    service: 'Bridge',
    message: \`🟢 Projekt [\${currentPid}] erfolgreich gestartet. Backend: \${backendUrl} | Frontend: \${frontendUrl}\`
  });

  return projectEntry;
}

function stopProjectProcesses(p, projectId) {
  const pid = projectId || (p && p.projectId) || 'default';
  try {
    if (p) {
      if (p.backendProc) { killProcessTree(p.backendProc); p.backendProc = null; }
      if (p.frontendProc) { killProcessTree(p.frontendProc); p.frontendProc = null; }
      if (p.desktopProc) { killProcessTree(p.desktopProc); p.desktopProc = null; }
      p.status = 'STOPPED';
    }

    // Free ports reliably
    const bPort = (p && p.backendPort) || 5000;
    const fPort = (p && p.frontendPort) || 3000;
    freePorts([bPort, fPort, 5000, 3000, 4200, 5173]);

    broadcastLog(pid, {
      type: 'system',
      service: 'Bridge',
      message: \`⏹️ Alle Prozesse für Projekt [\${pid}] wurden beendet und Ports freigegeben.\`
    });
  } catch (e) {
    console.error('Stop error:', e);
  }
}

function resolveProjectFolder(projectId) {
  if (!projectId) return null;
  const directPath = path.join(PROJECTS_DIR, projectId);
  if (fs.existsSync(directPath)) return directPath;

  // Search case-insensitively or matching subdirectories
  if (fs.existsSync(PROJECTS_DIR)) {
    const list = fs.readdirSync(PROJECTS_DIR);
    const match = list.find(f => f.toLowerCase() === projectId.toLowerCase());
    if (match) return path.join(PROJECTS_DIR, match);
    if (list.length > 0) return path.join(PROJECTS_DIR, list[0]); // fallback to first
  }
  return directPath;
}

function startProjectProcesses(p, projectId) {
  const cleanFolder = (p && p.projectPath) || resolveProjectFolder(projectId);
  if (cleanFolder && fs.existsSync(cleanFolder)) {
    launchProjectArchitecture(cleanFolder, {
      projectId: projectId || (p && p.projectId) || path.basename(cleanFolder),
      projectName: (p && p.projectName) || projectId,
      stack: (p && p.stack) || {},
      ports: { backendPort: (p && p.backendPort) || 5000, frontendPort: (p && p.frontendPort) || 3000 }
    });
  } else {
    broadcastLog(projectId, {
      type: 'stderr',
      service: 'Bridge',
      message: \`⚠️ Projekt-Verzeichnis für [\${projectId}] nicht gefunden. Bitte zuerst Bereitstellung ausführen.\`
    });
  }
}

// ==========================================
// 3. API Endpoints
// ==========================================

app.get('/api/status', (req, res) => {
  res.json(getTelemetryData());
});

app.post('/api/deploy', requireToken, async (req, res) => {
  try {
    const { projectId, projectName, stack, ports, options, files } = req.body;
    if (!projectId || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Ungültiges Deployment-Payload (projectId und files erforderlich).' });
    }

    const cleanProjectFolder = path.join(PROJECTS_DIR, projectId);
    if (!fs.existsSync(cleanProjectFolder)) {
      fs.mkdirSync(cleanProjectFolder, { recursive: true });
    }

    broadcastLog(projectId, {
      type: 'system',
      service: 'Bridge',
      message: \`📂 Schreibe \${files.length} Dateien in: \${cleanProjectFolder}...\`
    });

    for (const f of files) {
      const fullPath = path.join(cleanProjectFolder, f.path);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, f.content, 'utf8');
    }

    if (runningProcesses.has(projectId)) {
      const old = runningProcesses.get(projectId);
      stopProjectProcesses(old, projectId);
      runningProcesses.delete(projectId);
    }

    // Shared Dependencies
    const useShared = options && options.useSharedDependencies !== false;
    if (useShared) {
      const frontendDir = path.join(cleanProjectFolder, 'Frontend');
      const sharedNodeModules = path.join(SHARED_DEPS_DIR, 'node_modules');
      
      if (fs.existsSync(frontendDir)) {
        const targetNodeModules = path.join(frontendDir, 'node_modules');
        if (!fs.existsSync(targetNodeModules)) {
          try {
            if (!fs.existsSync(sharedNodeModules)) fs.mkdirSync(sharedNodeModules, { recursive: true });
            if (process.platform === 'win32') {
              execSync(\`mklink /J "\${targetNodeModules}" "\${sharedNodeModules}"\`, { stdio: 'ignore' });
            } else {
              fs.symlinkSync(sharedNodeModules, targetNodeModules, 'junction');
            }
          } catch (symlinkErr) {}
        }
      }
    }

    let projectEntry = null;
    if (options && options.autoRun !== false) {
      projectEntry = launchProjectArchitecture(cleanProjectFolder, req.body);
    }

    const backendPort = (ports && ports.backendPort) || 5000;
    const frontendPort = (ports && ports.frontendPort) || 3000;

    res.json({
      success: true,
      projectId,
      projectPath: cleanProjectFolder,
      backendUrl: \`http://localhost:\${backendPort}\`,
      frontendUrl: \`http://localhost:\${frontendPort}\`,
      message: \`Projekt \${projectName} erfolgreich empfangen und gestartet.\`
    });

  } catch (err) {
    console.error("Deploy Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Robust Process Actions (Start, Stop, Restart)
const processActionRoutes = ['/api/process/action', '/api/process/control', '/api/process', '/api/stop', '/api/restart', '/api/start'];
app.post(processActionRoutes, requireToken, (req, res) => {
  let { projectId, action } = req.body || {};
  
  // Extract action from path if called via /api/stop etc.
  if (!action) {
    if (req.path.includes('stop')) action = 'stop';
    else if (req.path.includes('restart')) action = 'restart';
    else if (req.path.includes('start')) action = 'start';
    else action = 'restart';
  }

  // If no projectId provided, fallback to any running project or default
  if (!projectId) {
    const keys = Array.from(runningProcesses.keys());
    if (keys.length > 0) projectId = keys[0];
    else projectId = 'default';
  }

  let p = runningProcesses.get(projectId);
  if (!p) {
    p = {
      projectId,
      projectPath: resolveProjectFolder(projectId),
      backendPort: 5000,
      frontendPort: 3000,
      status: 'STOPPED'
    };
    runningProcesses.set(projectId, p);
  }

  if (action === 'stop') {
    stopProjectProcesses(p, projectId);
    return res.json({ 
      success: true, 
      status: 'STOPPED', 
      projectId,
      message: 'Prozesse erfolgreich gestoppt und Ports freigegeben.' 
    });
  }

  if (action === 'start') {
    startProjectProcesses(p, projectId);
    return res.json({ 
      success: true, 
      status: 'RUNNING', 
      projectId,
      message: 'Prozesse erfolgreich gestartet.' 
    });
  }

  if (action === 'restart') {
    stopProjectProcesses(p, projectId);
    broadcastLog(projectId, {
      type: 'system',
      service: 'Bridge',
      message: '🔄 Starte Prozesse neu...'
    });
    setTimeout(() => {
      startProjectProcesses(p, projectId);
    }, 500);
    return res.json({ 
      success: true, 
      status: 'RUNNING', 
      projectId,
      message: 'Prozesse werden neu gestartet.' 
    });
  }

  res.json({ success: true, message: \`Aktion \${action} ausgeführt.\` });
});

// WebSocket Log Stream
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const projectId = url.searchParams.get('projectId');
  ws.subscribedProjectId = projectId;

  ws.send(JSON.stringify({
    type: 'system',
    timestamp: new Date().toISOString(),
    service: 'BridgeWS',
    message: \`🟢 Verbunden mit lokaler DB Studio Bridge (Port \${PORT})\`
  }));
});

// ==========================================
// 4. Two-Way Background Relay Sync Engine
// ==========================================
async function syncWithPhpRelay() {
  if (!RELAY_URL || !RELAY_URL.startsWith('http')) return;

  try {
    const telemetry = getTelemetryData();
    const payload = JSON.stringify(telemetry);
    const parsedUrl = new URL(RELAY_URL);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const pullReq = client.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: \`\${parsedUrl.pathname}?action=pull_jobs\`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bridge-Token': AUTH_TOKEN,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 3500
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const resp = JSON.parse(data);
            
            // Execute Deployment Jobs
            if (resp.jobs && Array.isArray(resp.jobs)) {
              for (const job of resp.jobs) {
                if (job.type === 'deploy' && job.payload) {
                  const p = job.payload;
                  const cleanFolder = path.join(PROJECTS_DIR, p.projectId);
                  if (!fs.existsSync(cleanFolder)) fs.mkdirSync(cleanFolder, { recursive: true });
                  
                  if (p.files && Array.isArray(p.files)) {
                    for (const f of p.files) {
                      const fullPath = path.join(cleanFolder, f.path);
                      const dir = path.dirname(fullPath);
                      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                      fs.writeFileSync(fullPath, f.content, 'utf8');
                    }
                  }
                  
                  if (runningProcesses.has(p.projectId)) {
                    stopProjectProcesses(runningProcesses.get(p.projectId), p.projectId);
                  }
                  launchProjectArchitecture(cleanFolder, p);
                }
              }
            }

            // Execute Process Actions (Start/Stop/Restart)
            if (resp.actions && Array.isArray(resp.actions)) {
              for (const act of resp.actions) {
                if (act.payload) {
                  const pid = act.payload.projectId;
                  const actionType = act.payload.action;
                  let proc = runningProcesses.get(pid);
                  if (!proc) {
                    proc = { projectId: pid, projectPath: resolveProjectFolder(pid), status: 'STOPPED' };
                    runningProcesses.set(pid, proc);
                  }
                  if (actionType === 'stop') stopProjectProcesses(proc, pid);
                  if (actionType === 'start') startProjectProcesses(proc, pid);
                  if (actionType === 'restart') {
                    stopProjectProcesses(proc, pid);
                    setTimeout(() => startProjectProcesses(proc, pid), 500);
                  }
                }
              }
            }
          }
        } catch (e) {}
      });
    });

    pullReq.on('error', () => {});
    pullReq.write(payload);
    pullReq.end();

    // Push pending logs back to Relay
    if (recentLogsBuffer.size > 0) {
      recentLogsBuffer.forEach((logs, projectId) => {
        if (logs.length === 0) return;
        const logPayload = JSON.stringify({ projectId, logs });
        recentLogsBuffer.set(projectId, []);

        const pushReq = client.request({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: \`\${parsedUrl.pathname}?action=push_logs\`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Bridge-Token': AUTH_TOKEN,
            'Content-Length': Buffer.byteLength(logPayload)
          },
          timeout: 3000
        });
        pushReq.on('error', () => {});
        pushReq.write(logPayload);
        pushReq.end();
      });
    }

  } catch (err) {}
}

setInterval(syncWithPhpRelay, 2500);

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(\`🚀 DB STUDIO LOCAL BRIDGE AGENT RUNNING ON PORT \${PORT}\`);
  console.log(\`🔑 X-Bridge-Token: \${AUTH_TOKEN}\`);
  console.log(\`📁 Projects Directory: \${PROJECTS_DIR}\`);
  console.log(\`📦 Shared Dependencies: \${SHARED_DEPS_DIR}\`);
  console.log('====================================================');
});
`;
}
