import JSZip from 'jszip';
import { BridgeConfig } from '../types/bridge';
import { generateBridgeServerJsCode } from './bridge/bridgeServerTemplate';
import { generateBridgeRelayPhpCode } from './bridge/bridgeRelayTemplate';

export function generateBridgeServerCode(config: BridgeConfig): { filename: string; content: string }[] {
  const files: { filename: string; content: string }[] = [];

  // package.json for the Bridge
  const packageJson = {
    name: "dbstudio-local-bridge",
    version: "1.3.0",
    description: "Local Execution & Deployment Bridge Agent for DB Studio with Shared Dependencies management and Process Lifecycle control",
    main: "server.js",
    scripts: {
      "start": "node server.js",
      "dev": "node --watch server.js"
    },
    dependencies: {
      "express": "^4.19.2",
      "cors": "^2.8.5",
      "ws": "^8.18.0"
    },
    keywords: ["dbstudio", "bridge", "local-runner", "process-control", "shared-dependencies"],
    author: "DB Studio Pro",
    license: "MIT"
  };

  files.push({
    filename: 'package.json',
    content: JSON.stringify(packageJson, null, 2)
  });

  // server.js with robust Start, Stop, Neustart and Port Liberation
  files.push({
    filename: 'server.js',
    content: generateBridgeServerJsCode(config)
  });

  // start-bridge.bat for Windows
  const batScript = `@echo off
title DB Studio Pro - Local Execution Bridge Agent
cls
echo ============================================================
echo   DB Studio Pro - Local Execution Bridge Agent
echo ============================================================
echo.
echo Pruefe Node.js Installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [FEHLER] Node.js wurde nicht gefunden!
    echo Bitte installieren Sie Node.js von https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installiere Bridge-Abhaengigkeiten (einmalig)...
    call npm install
)

echo Starte Bridge Server auf Port ${config.port || 5050}...
echo Token: ${config.token || 'dbstudio-bridge-local-token'}
echo.
node server.js
pause
`;

  files.push({
    filename: 'start-bridge.bat',
    content: batScript
  });

  // start-bridge.sh for macOS / Linux
  const shScript = `#!/bin/bash
# DB Studio Pro - Local Execution Bridge Agent Launcher for macOS/Linux
echo "============================================================"
echo "  DB Studio Pro - Local Execution Bridge Agent"
echo "============================================================"

if ! command -v node &> /dev/null; then
    echo "[FEHLER] Node.js wurde nicht gefunden. Bitte installieren Sie Node.js."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installiere Bridge-Abhängigkeiten (einmalig)..."
    npm install
fi

echo "Starte Bridge Server auf Port ${config.port || 5050}..."
node server.js
`;

  files.push({
    filename: 'start-bridge.sh',
    content: shScript
  });

  // README.md with quickstart instructions
  const readmeMd = `# DB Studio Pro - Lokale Execution Bridge

Mit dieser Bridge können Sie in **DB Studio** erstellte Anwendungen mit einem einzigen Klick direkt auf Ihrem lokalen Computer ausführen, testen und steuern.

## 🚀 Schnellstart

1. **Starten:**
   - **Unter Windows:** Doppelklick auf \`start-bridge.bat\`
   - **Unter macOS / Linux:** \`chmod +x start-bridge.sh && ./start-bridge.sh\`
   - *Alternativ:* \`npm install && npm start\`

2. **In DB Studio:**
   - Gehen Sie ins Ribbon auf **"Bereitstellung & Generator"**.
   - Der Status schaltet automatisch auf **"Online"** (Port ${config.port || 5050}).
   - Klicken Sie auf **"Auf PC ausführen"**, um Ihre App zu übertragen und zu starten.
   - Über das Terminal können Sie den Prozess jederzeit **Stoppen** oder **Neustarten** (mit automatischer Port-Freigabe).

## 📦 Shared Dependencies Store
Die Bridge nutzt standardmäßig das Verzeichnis \`DBStudio_Workspace/Shared_Dependencies\`, um \`node_modules\` und Caches zentral bereitzustellen. Dadurch entstehen **keine doppelten Downloads** und **kein Datenmüll**.
`;

  files.push({
    filename: 'README.md',
    content: readmeMd
  });

  // bridge_relay.php for custom PHP web hosting
  files.push({
    filename: 'bridge_relay.php',
    content: generateBridgeRelayPhpCode(config)
  });

  return files;
}

export function downloadRelayPhpScript(config: BridgeConfig): void {
  const content = generateBridgeRelayPhpCode(config);
  const blob = new Blob([content], { type: 'application/x-php;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  a.href = url;
  a.download = `bridge_relay.php`;
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadBridgePackageZip(config: BridgeConfig): Promise<void> {
  const zip = new JSZip();
  const files = generateBridgeServerCode(config);

  files.forEach(f => {
    zip.file(f.filename, f.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  a.href = url;
  a.download = `dbstudio-local-bridge-port${config.port || 5050}.zip`;
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
