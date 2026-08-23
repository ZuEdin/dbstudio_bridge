import { Table, Relationship, Query, BackendConfig, VirtualFile } from '../../../types/index';
import { generateNodeJs } from '../nodeGenerator';

export const generateElectronBackend = (
  safeTables: Table[],
  safeRelationships: Relationship[],
  safeQueries: Query[],
  config: BackendConfig,
  root: string,
  bePort: number,
  dbTypeStr: string,
  defaultDbPort: number
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const nodeFiles = generateNodeJs(safeTables, safeRelationships, safeQueries, config);

  if (Array.isArray(nodeFiles)) {
    nodeFiles.forEach(f => {
      let relativePath = f.path.replace(`Backend/${config.projectName}/`, '');
      if (f.name === 'README.md') return;

      // Update package.json to set main entry point to main.js
      if (f.name === 'package.json') {
        try {
          const pkg = JSON.parse(f.content);
          pkg.main = "main.js";
          pkg.scripts = {
            ...pkg.scripts,
            "start": "electron .",
            "electron:start": "cross-env USE_DEV_SERVER=true wait-on -t 3000 tcp:3000 || electron .",
            "electron:dev": "concurrently -k \"npm run dev\" \"npm run electron:start\"",
            "electron:build": "npm run build && electron-builder"
          };
          pkg.build = {
            "appId": "com.mgdesk.app",
            "directories": {
               "output": "release"
            },
            "files": [
               "dist/**/*",
               "Frontend/**/*",
               "Backend/**/*",
               "main.js",
               "preload.js",
               "package.json"
            ]
          };
          pkg.devDependencies = {
            ...pkg.devDependencies,
            "electron": "^33.3.0",
            "electron-builder": "^24.13.3",
            "concurrently": "^8.2.2",
            "wait-on": "^7.2.0",
            "cross-env": "^7.0.3"
          };
          f.content = JSON.stringify(pkg, null, 2);
        } catch (e) {}
      }

      // Enhance server.js to serve static frontend files from Backend/public and support local/remote DB drivers
      if (f.name === 'server.js' || f.name === 'index.js') {
        f.content = `const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || ${bePort};
const DB_TYPE = process.env.DB_TYPE || '${dbTypeStr}';

app.use(cors());
app.use(express.json());

// 1. Serve transpiled Frontend static files
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// 2. Database Connection Config
const dbConfig = {
  type: DB_TYPE,
  filename: process.env.SQLITE_PATH || path.join(process.env.USER_DATA_PATH || __dirname, '${config.projectName.toLowerCase()}.sqlite'),
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '${defaultDbPort}'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '${config.projectName.toLowerCase()}'
};

console.log(\`[Electron Backend] Database type: \${dbConfig.type}\`);
if (dbConfig.type === 'sqlite') {
  console.log(\`[Electron Backend] Local SQLite path: \${dbConfig.filename}\`);
} else {
  console.log(\`[Electron Backend] Remote \${dbConfig.type.toUpperCase()} target: \${dbConfig.host}:\${dbConfig.port}\`);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: 'Electron Embedded', 
    dbType: dbConfig.type,
    dbHost: dbConfig.type === 'sqlite' ? 'local' : \`\${dbConfig.host}:\${dbConfig.port}\` 
  });
});

app.get('/api/db-config', (req, res) => {
  res.json({
    type: dbConfig.type,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    isLocalSqlite: dbConfig.type === 'sqlite'
  });
});

// SPA Fallback: serve index.html for non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Frontend is transpiling into Backend/public...');
  }
});

function startServer(portToUse) {
  const server = app.listen(portToUse, '127.0.0.1', () => {
    console.log(\`[Electron Embedded Backend] Running on http://127.0.0.1:\${portToUse}\`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(\`Port \${portToUse} is already in use. Retrying on port \${Number(portToUse) + 1}...\`);
      startServer(Number(portToUse) + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
`;
      }

      f.path = `${root}/Backend/${relativePath}`;
      files.push(f);
    });

    // Add electron window manager main.js and preload.js inside Backend directory
    const electronMainJs = `const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Start Express Backend
try {
  require('./server.js');
} catch (err) {
  console.error('Failed to start Express backend:', err);
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const distCandidatePaths = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, '..', 'Frontend', 'dist', 'index.html'),
    path.join(__dirname, '..', '..', 'Frontend', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html')
  ];

  let loaded = false;
  for (const distPath of distCandidatePaths) {
    if (fs.existsSync(distPath)) {
      win.loadFile(distPath);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    const distDir = path.join(__dirname, 'dist');
    const indexPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    const defaultHtml = \`<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Desktop App - Dist bereitgestellt</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #0f172a;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .card {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 500px;
            border: 1px solid #334155;
        }
        h1 {
            color: #38bdf8;
            margin-top: 0;
        }
        p {
            line-height: 1.6;
            color: #cbd5e1;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Willkommen bei Ihrer Desktop-Anwendung</h1>
        <p>Der Ordner <strong>dist/</strong> wurde automatisch erstellt.</p>
        <p>Sobald Sie Ihr Frontend kompilieren (z.B. mit <code>npm run build</code>) und die Dateien in diesen <strong>dist/</strong> Ordner kopieren, wird Electron Ihr Frontend anzeigen.</p>
    </div>
</body>
</html>\`;
    fs.writeFileSync(indexPath, defaultHtml, 'utf-8');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

    const electronPreloadJs = `const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
});
`;

    files.push({
      name: 'main.js',
      path: `${root}/Backend/main.js`,
      content: electronMainJs,
      language: 'javascript'
    });

    files.push({
      name: 'preload.js',
      path: `${root}/Backend/preload.js`,
      content: electronPreloadJs,
      language: 'javascript'
    });
  }

  return files;
};
