import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = process.env.PORT || 5050;
const PROJECTS_DIR = path.resolve('./Projects');

if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/logs' });

// 1. Universelle CORS & PNA Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json({ limit: '100mb' }));

// 2. Health & Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    bridgeType: 'NodeJS_Express_Minimal_Bridge',
    osPlatform: `${process.platform} (${process.arch})`,
    bridgePort: PORT,
    projectsDir: PROJECTS_DIR
  });
});

// 3. Deploy
app.post('/api/deploy', (req, res) => {
  const { projectId = 'Proj_' + Date.now(), files = [], startCommand = 'npm run dev' } = req.body;
  const projectDir = path.join(PROJECTS_DIR, projectId);
  
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

  for (const f of files) {
    const filePath = path.join(projectDir, f.path);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, f.content, 'utf-8');
  }

  console.log(`[Node Bridge] Starte Projekt '${projectId}' via: ${startCommand}`);
  
  // Prozess starten
  const isWin = process.platform === 'win32';
  const child = isWin 
    ? spawn('cmd.exe', ['/C', startCommand], { cwd: projectDir })
    : spawn(startCommand, { shell: true, cwd: projectDir });

  child.stdout?.on('data', d => broadcastLog(projectId, d.toString()));
  child.stderr?.on('data', d => broadcastLog(projectId, d.toString()));

  res.json({ success: true, projectId, message: 'Projekt empfangen & gestartet!' });
});

// WebSocket Logging
const wsClients = new Set();
wss.on('connection', ws => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
});

function broadcastLog(projectId, msg) {
  const payload = JSON.stringify({ projectId, timestamp: new Date().toISOString(), message: msg });
  wsClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(payload);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🚀 DB Studio Node.js Bridge läuft auf Port: ${PORT}`);
  console.log(`=================================================`);
});
