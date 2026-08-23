import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateElectronConfigs = (
  config: BackendConfig,
  root: string,
  bePort: number,
  fePort: number,
  dbTypeStr: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // package.json
  const packageJson = {
    name: `${config.projectName.toLowerCase()}-desktop`,
    version: "1.0.0",
    description: "Generated Electron Desktop Application with Portless Local IPC Access",
    main: "main.js",
    scripts: {
      "start": "electron .",
      "electron": "electron .",
      "electron:start": "electron .",
      "electron:dev": "electron .",
      "electron:build": "npm run build && electron-builder",
      "dev": "electron .",
      "build:frontend": "cd Frontend && npm run build && node copy-dist.js",
      "build:angular": "cd AngularFrontend && npm run build && node copy-dist.js",
      "build": "node build-all.js && electron-builder",
      "dist": "npm run build",
      "install-all": "npm install && cd Frontend && npm install && cd ../Backend && npm install"
    },
    devDependencies: {
      "electron": "^33.3.0",
      "electron-builder": "^25.1.8",
      "concurrently": "^9.1.0",
      "cross-env": "^7.0.3",
      "electron-is-dev": "^3.0.1"
    },
    dependencies: {
      "better-sqlite3": "^11.5.0",
      "mysql2": "^3.11.0",
      "pg": "^8.13.0",
      "mssql": "^11.0.1"
    },
    build: {
      "appId": `com.example.${config.projectName.toLowerCase()}`,
      "productName": config.projectName,
      "files": [
        "dist/**/*",
        "Backend/**/*",
        "main.js",
        "preload.js",
        "package.json"
      ],
      "directories": {
        "output": "release"
      }
    }
  };

  files.push({
    name: 'package.json',
    path: `${root}/package.json`,
    content: JSON.stringify(packageJson, null, 2),
    language: 'json'
  });

  // main.js - Portless local file loading & direct IPC file/db access
  const mainJsContent = `const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

let mainWindow;

// Transpiliert das Frontend direkt in dist/, falls noch nicht gebaut
function ensureFrontendBuilt() {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    console.log('[Electron] Frontend dist nicht gefunden. Baue Frontend...');
    try {
      execSync('node build-all.js', { cwd: __dirname, stdio: 'inherit' });
      console.log('[Electron] Frontend erfolgreich transpiliert.');
    } catch (err) {
      console.error('[Electron] Fehler beim Transpilieren des Frontends:', err);
    }
  }
}

function loadLocalFile(win) {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    ensureFrontendBuilt();
  }
  win.loadFile(indexPath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Erlaubt lokale Datei- und IPC-Schnittstellen ohne CORS/Port-Einschraenkungen
    },
    autoHideMenuBar: false,
    title: "${config.projectName} Desktop"
  });

  // Immer die lokal kompilierte HTML-Datei laden - kein Node.js/Vite Dev-Server!
  loadLocalFile(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// IPC Handler fuer portlose lokale Datei- und Datenbank-Aktionen direkt im Electron-Main-Prozess
ipcMain.handle('get-app-paths', () => {
  return {
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    temp: app.getPath('temp'),
    current: __dirname
  };
});

ipcMain.handle('fs-read-json', async (event, { filename }) => {
  try {
    const dataPath = path.join(app.getPath('userData'), filename.endsWith('.json') ? filename : filename + '.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(raw);
    }
    return null;
  } catch (err) {
    console.error('[Electron IPC Read Error]', err);
    return null;
  }
});

ipcMain.handle('fs-write-json', async (event, { filename, data }) => {
  try {
    const dataPath = path.join(app.getPath('userData'), filename.endsWith('.json') ? filename : filename + '.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, path: dataPath };
  } catch (err) {
    console.error('[Electron IPC Write Error]', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs-read-file', async (event, { filePath }) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(app.getPath('userData'), filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return null;
  } catch (err) {
    return null;
  }
});

ipcMain.handle('fs-write-file', async (event, { filePath, content }) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(app.getPath('userData'), filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
    return { success: true, path: fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

  files.push({ name: 'main.js', path: `${root}/main.js`, content: mainJsContent, language: 'javascript' });

  // preload.js - Vollstaendige IPC-Schnittstelle fuer portloses Lesen/Schreiben
  files.push({ 
    name: 'preload.js', 
    path: `${root}/preload.js`, 
    content: `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getAppPaths: () => ipcRenderer.invoke('get-app-paths'),
  readJson: (filename) => ipcRenderer.invoke('fs-read-json', { filename }),
  writeJson: (filename, data) => ipcRenderer.invoke('fs-write-json', { filename, data }),
  readFile: (filePath) => ipcRenderer.invoke('fs-read-file', { filePath }),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs-write-file', { filePath, content }),
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});`, 
    language: 'javascript' 
  });

  // copy-dist.js - Kopiert dist Ordner vom Frontend (React oder Angular) ins Electron-Hauptverzeichnis
  const copyDistJsContent = `const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function findActualDistDir(baseDist) {
  if (!fs.existsSync(baseDist)) return null;
  if (fs.existsSync(path.join(baseDist, 'index.html'))) {
    return baseDist;
  }
  const subDirs = ['angular-client/browser', 'angular-client', 'browser'];
  for (const sub of subDirs) {
    const cand = path.join(baseDist, sub);
    if (fs.existsSync(path.join(cand, 'index.html'))) return cand;
  }
  try {
    const entries = fs.readdirSync(baseDist, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const cand = path.join(baseDist, entry.name);
        if (fs.existsSync(path.join(cand, 'index.html'))) return cand;
        const candBrowser = path.join(cand, 'browser');
        if (fs.existsSync(path.join(candBrowser, 'index.html'))) return candBrowser;
      }
    }
  } catch (e) {}
  return baseDist;
}

const candidateDistDirs = [
  path.join(__dirname, 'Frontend', 'dist'),
  path.join(__dirname, 'AngularFrontend', 'dist'),
  path.join(__dirname, 'dist')
];

const targetDist = path.join(__dirname, 'dist');
let actualSource = null;

for (const candBase of candidateDistDirs) {
  if (candBase === targetDist && fs.existsSync(path.join(targetDist, 'index.html'))) continue;
  const found = findActualDistDir(candBase);
  if (found && fs.existsSync(path.join(found, 'index.html'))) {
    actualSource = found;
    break;
  }
}

if (actualSource) {
  if (actualSource !== targetDist) {
    if (fs.existsSync(targetDist)) {
      fs.rmSync(targetDist, { recursive: true, force: true });
    }
    console.log('[Electron Copy] Kopiere Frontend-Build von ' + actualSource + ' nach ' + targetDist + '...');
    copyDir(actualSource, targetDist);
  }
  console.log('[Electron Copy] Build-Dateien erfolgreich in dist/ indexiert (index.html verifiziert).');
} else {
  console.warn('[Electron Copy] Keine Frontend Build-Dateien mit index.html zum Kopieren gefunden!');
}
`;

  files.push({ name: 'copy-dist.js', path: `${root}/copy-dist.js`, content: copyDistJsContent, language: 'javascript' });

  // build-all.js - Kompiliert Frontends (React / Angular) falls vorhanden und kopiert sie
  const buildAllJsContent = `const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function findActualDistDir(baseDist) {
  if (!fs.existsSync(baseDist)) return null;
  if (fs.existsSync(path.join(baseDist, 'index.html'))) {
    return baseDist;
  }
  const subDirs = ['angular-client/browser', 'angular-client', 'browser'];
  for (const sub of subDirs) {
    const cand = path.join(baseDist, sub);
    if (fs.existsSync(path.join(cand, 'index.html'))) return cand;
  }
  try {
    const entries = fs.readdirSync(baseDist, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const cand = path.join(baseDist, entry.name);
        if (fs.existsSync(path.join(cand, 'index.html'))) return cand;
        const candBrowser = path.join(cand, 'browser');
        if (fs.existsSync(path.join(candBrowser, 'index.html'))) return candBrowser;
      }
    }
  } catch (e) {}
  return baseDist;
}

const rootDir = __dirname;
const reactDir = path.join(rootDir, 'Frontend');
const angularDir = path.join(rootDir, 'AngularFrontend');
const targetDist = path.join(rootDir, 'dist');

let built = false;

if (fs.existsSync(reactDir)) {
  console.log('[Build] React Frontend gefunden. Starte Build...');
  try {
    execSync('npm run build', { cwd: reactDir, stdio: 'inherit' });
    const reactDistBase = path.join(reactDir, 'dist');
    const actualDist = findActualDistDir(reactDistBase);
    if (actualDist && fs.existsSync(path.join(actualDist, 'index.html'))) {
      if (fs.existsSync(targetDist)) fs.rmSync(targetDist, { recursive: true, force: true });
      console.log('[Build] Kopiere React Build von ' + actualDist + ' nach ' + targetDist + '...');
      copyDir(actualDist, targetDist);
      built = true;
    }
  } catch (err) {
    console.error('[Build] Fehler beim React-Build:', err);
  }
} else if (fs.existsSync(angularDir)) {
  console.log('[Build] Angular Frontend gefunden. Starte Build...');
  try {
    execSync('npm run build', { cwd: angularDir, stdio: 'inherit' });
    const angularDistBase = path.join(angularDir, 'dist');
    const actualDist = findActualDistDir(angularDistBase);
    if (actualDist && fs.existsSync(path.join(actualDist, 'index.html'))) {
      if (fs.existsSync(targetDist)) fs.rmSync(targetDist, { recursive: true, force: true });
      console.log('[Build] Kopiere Angular Build von ' + actualDist + ' nach ' + targetDist + '...');
      copyDir(actualDist, targetDist);
      built = true;
    }
  } catch (err) {
    console.error('[Build] Fehler beim Angular-Build:', err);
  }
}

if (built) {
  console.log('[Build] Frontend-Build und Kopieren erfolgreich abgeschlossen (dist/index.html verifiziert)!');
} else {
  console.warn('[Build] Kein Frontend zum Bauen gefunden oder Build fehlgeschlagen.');
}
`;

  files.push({ name: 'build-all.js', path: `${root}/build-all.js`, content: buildAllJsContent, language: 'javascript' });

  // dist/index.html - Initiales info-file fuer den Electron App Container
  const initialHtmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${config.projectName} - Electron Desktop Container</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
        }
        .container {
            max-width: 600px;
            background-color: #1e293b;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            border: 1px solid #334155;
        }
        h1 {
            color: #38bdf8;
            margin-top: 0;
            font-size: 24px;
        }
        p {
            line-height: 1.6;
            color: #cbd5e1;
        }
        .badge {
            display: inline-block;
            background-color: #0369a1;
            color: #bae6fd;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .instructions {
            text-align: left;
            background-color: #0f172a;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            color: #38bdf8;
            border: 1px solid #1e293b;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="badge">Electron Desktop App</span>
        <h1>Willkommen bei \${config.projectName}</h1>
        <p>Dieser Electron-Container dient als Ihr sicheres Desktop-Fenster.</p>
        <p>Er liest die lokal kompilierte Single Page Application (SPA) direkt aus dem Ordner <strong>dist/</strong> ein und läuft komplett portlos ohne Hintergrund-Webserver.</p>
        <div class="instructions">
            Sobald Sie React oder Angular kompilieren (z.B. per <code>npm run build</code>), kopiert das Tool die kompilierten Dateien direkt in das Verzeichnis <strong>dist/</strong> dieses Electron-Projekts und überschreibt diese Infoseite automatisch.
        </div>
    </div>
</body>
</html>
`;

  files.push({ name: 'index.html', path: `${root}/dist/index.html`, content: initialHtmlContent, language: 'html' });

  return files;
};
