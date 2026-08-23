import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateElectronFiles = (config: BackendConfig, root: string, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (target === 'electron') {
        const mainJs = `const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const distDir = path.join(__dirname, 'dist');
  const indexPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  if (!fs.existsSync(indexPath)) {
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
  }

  win.loadFile(indexPath);
}

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
        files.push({
            name: 'main.js',
            path: `${root}/main.js`,
            content: mainJs,
            language: 'javascript'
        });

        files.push({
            name: 'preload.js',
            path: `${root}/preload.js`,
            content: `// Preload script
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose safe APIs here
});
`,
            language: 'javascript'
        });

        // initial dist/index.html
        const initialHtml = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Electron App - Dist-Inhalt bereitstellen</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #121214;
            color: #e1e1e6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .card {
            background: #202024;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            max-width: 500px;
            border: 1px solid #29292e;
        }
        h1 {
            color: #00adb5;
        }
        p {
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Willkommen bei Ihrer Electron-Anwendung</h1>
        <p>Dies ist die Standard-Informationsseite im Verzeichnis <strong>dist/</strong>.</p>
        <p>Sobald Sie Ihr Frontend kompilieren (z.B. mit <code>npm run build</code>) und die Dateien in diesen <strong>dist/</strong> Ordner kopieren, wird Electron Ihr Frontend anzeigen.</p>
    </div>
</body>
</html>`;

        files.push({
            name: 'index.html',
            path: `${root}/dist/index.html`,
            content: initialHtml,
            language: 'html'
        });

        const packageJsonContent = `{
  "name": "${config.projectName.toLowerCase()}-desktop",
  "version": "1.0.0",
  "description": "Desktop version of ${config.projectName}",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "electron:dev": "npm run build && electron .",
    "build": "node copy-dist.js",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
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
  },
  "devDependencies": {
    "electron": "^33.3.0",
    "electron-builder": "^24.13.3",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0",
    "cross-env": "^7.0.3"
  }
}`;

        const copyDistJsContent = `const { execSync } = require('child_process');
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

try {
  console.log('[Electron Build] Transpiling Frontend in ../../Frontend...');
  let frontendDir = path.join(__dirname, '..', '..', 'Frontend');
  if (!fs.existsSync(frontendDir)) {
    frontendDir = path.join(__dirname, '..', '..', 'AngularFrontend');
  }
  
  if (fs.existsSync(frontendDir)) {
    const hasLocalModules = fs.existsSync(path.join(frontendDir, 'node_modules'));
    const hasParentModules = fs.existsSync(path.join(frontendDir, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, 'node_modules'));
    if (!hasLocalModules && !hasParentModules) {
      console.log('[Electron Build] Running npm install in ' + frontendDir + '...');
      try {
        execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
      } catch (e) {
        console.log('[Electron Build] npm install warning (continuing):', e.message);
      }
    } else {
      console.log('[Electron Build] node_modules folder detected, skipping npm install...');
    }
    console.log('[Electron Build] Running npm run build in ' + frontendDir + '...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
    
    const srcDist = path.join(frontendDir, 'dist');
    const targetDist = path.join(__dirname, 'dist');
    
    if (fs.existsSync(srcDist)) {
      let actualSrc = srcDist;
      
      if (!fs.existsSync(path.join(srcDist, 'index.html'))) {
        try {
          const subdirs = fs.readdirSync(srcDist, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
          
          for (const sub of subdirs) {
            const subPath = path.join(srcDist, sub);
            if (fs.existsSync(path.join(subPath, 'index.html'))) {
              actualSrc = subPath;
              break;
            }
            const browserPath = path.join(subPath, 'browser');
            if (fs.existsSync(path.join(browserPath, 'index.html'))) {
              actualSrc = browserPath;
              break;
            }
          }
        } catch (e) {
          console.log('[Electron Build] Warning scanning subdirs:', e.message);
        }
      }

      if (fs.existsSync(targetDist)) {
        fs.rmSync(targetDist, { recursive: true, force: true });
      }
      
      console.log('[Electron Build] Copying dist from ' + actualSrc + ' to ' + targetDist + '...');
      copyDir(actualSrc, targetDist);
      console.log('[Electron Build] Copy completed successfully (index.html verified)!');
    } else {
      console.error('[Electron Build] Error: Frontend dist folder not found at ' + srcDist);
    }
  } else {
    console.error('[Electron Build] Error: Frontend directory not found!');
  }
} catch (error) {
  console.error('[Electron Build] Build failed:', error);
  process.exit(1);
}
`;

        files.push({
            name: 'package.json',
            path: `${root}/package.json`,
            content: packageJsonContent,
            language: 'json'
        });

        files.push({
            name: 'copy-dist.js',
            path: `${root}/copy-dist.js`,
            content: copyDistJsContent,
            language: 'javascript'
        });

        files.push({
            name: 'README_ELECTRON.md',
            path: `${root}/README_ELECTRON.md`,
            content: `# Electron Setup
To build the application as a desktop app:

1. Install dependencies: \`npm install --save-dev electron electron-builder\`
2. Add these to your \`package.json\`:
   \`\`\`json
   "main": "main.js",
   "scripts": {
     "start": "electron .",
     "electron:dev": "npm run build && electron .",
     "electron:build": "npm run build && electron-builder"
   },
   "build": {
     "appId": "com.${config.projectName.toLowerCase()}.app",
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
   }
   \`\`\`
3. Run \`npm run electron:start\` or \`npm start\` to launch Electron locally.
4. Run \`npm run electron:build\` to build the standalone executable.
`,
            language: 'markdown'
        });

        // Add run.bat and run.sh launcher scripts for Electron deployment
        const batContent = `@echo off
title Electron Manager
cls

:MENU
cls
echo =================================================
echo   Electron Desktop Manager
echo =================================================
echo.
echo  [1] Dependencies installieren (inkl. Frontend)
echo  [2] Frontend transpilieren (dist)
echo  [3] Electron App starten (npm start)
echo  [4] Desktop Executable erstellen (npm run electron:build)
echo  [5] Beenden
echo.
set /p choice="Auswahl (1-5): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto BUILDFE
if "%choice%"=="3" goto START
if "%choice%"=="4" goto BUILD
if "%choice%"=="5" exit

goto MENU

:INSTALL
cls
echo Installiere Electron-Dependencies...
call npm install
if exist ..\\..\\Frontend (
    echo Installiere Frontend-Dependencies...
    cd ..\\..\\Frontend
    call npm install
    cd ..\\Backend\\${config.projectName}
)
echo.
pause
goto MENU

:BUILDFE
cls
echo Transpiliere Frontend und kopiere Assets...
call npm run build
echo.
pause
goto MENU

:START
cls
echo Starte Electron App...
call npm start
pause
goto MENU

:BUILD
cls
echo Baue native Desktop App mit Electron...
call npm run electron:build
pause
goto MENU
`;

        const shContent = `#!/bin/bash
# Electron Desktop Manager

show_menu() {
  clear
  echo "================================================="
  echo "  Electron Desktop Manager"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren (inkl. Frontend)"
  echo "  [2] Frontend transpilieren (dist)"
  echo "  [3] Electron App starten (npm start)"
  echo "  [4] Desktop Executable erstellen (npm run electron:build)"
  echo "  [5] Beenden"
  echo ""
  read -p "Auswahl (1-5): " choice
  case $choice in
    1) 
      npm install
      if [ -d "../../Frontend" ]; then
        cd ../../Frontend
        npm install
        cd "../Backend/${config.projectName}"
      fi
      ;;
    2) npm run build ;;
    3) npm start ;;
    4) npm run electron:build ;;
    5) exit 0 ;;
    *) show_menu ;;
  esac
}

show_menu
`;

        files.push({
            name: 'run.bat',
            path: `${root}/run.bat`,
            content: batContent,
            language: 'text'
        });

        files.push({
            name: 'run.sh',
            path: `${root}/run.sh`,
            content: shContent,
            language: 'text'
        });
    }
    return files;
};
