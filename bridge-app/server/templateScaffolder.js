import fs from 'fs';
import path from 'path';
import { ensureTauriIcons } from './tauriIconManager.js';
import { linkSharedNodeModules } from './sharedDependencyManager.js';

export const TEMPLATES = [
  {
    id: 'dotnet_react',
    name: 'ASP.NET Core 10 Web API + React 18 SPA (Vite)',
    description: 'Vollwertiger Fullstack-Stack mit C# 10 Web API und moderner React 18 TypeScript Benutzeroberfläche.',
    type: 'fullstack',
    category: 'Web & Enterprise',
    defaultBackendPort: 5000,
    defaultFrontendPort: 3000
  },
  {
    id: 'tauri_desktop',
    name: 'Tauri 1.5 Desktop App (Rust + React)',
    description: 'Extrem ressourcensparende native Desktop-Anwendung mit Rust-Backend und React/Tailwind Frontend.',
    type: 'desktop_tauri',
    category: 'Native Desktop',
    defaultBackendPort: 0,
    defaultFrontendPort: 3000
  },
  {
    id: 'electron_desktop',
    name: 'Electron Desktop App (Node.js + React)',
    description: 'Bewährte Desktop-Applikation mit Electron Chromium Engine und vollständigem Node.js API-Zugriff.',
    type: 'desktop_electron',
    category: 'Native Desktop',
    defaultBackendPort: 0,
    defaultFrontendPort: 3000
  },
  {
    id: 'dotnet_microservice',
    name: 'ASP.NET Core 10 Minimal API Microservice',
    description: 'Schlanke, ultra-performante REST & WebSocket Daemon API ohne Frontend-Ballast.',
    type: 'backend_csharp',
    category: 'Backend & Services',
    defaultBackendPort: 5000,
    defaultFrontendPort: 0
  }
];

export async function scaffoldProjectFromTemplate(options) {
  const { templateId, projectName, targetDir, backendPort = 5000, frontendPort = 3000 } = options;

  if (!projectName || !targetDir) {
    throw new Error('Projektname und Zielverzeichnis erforderlich.');
  }

  const projectPath = path.join(targetDir, projectName);

  if (fs.existsSync(projectPath) && fs.readdirSync(projectPath).length > 0) {
    throw new Error(`Verzeichnis '${projectPath}' existiert bereits und ist nicht leer.`);
  }

  fs.mkdirSync(projectPath, { recursive: true });

  switch (templateId) {
    case 'dotnet_react':
      await scaffoldDotnetReact(projectPath, projectName, backendPort, frontendPort);
      break;
    case 'tauri_desktop':
      await scaffoldTauriDesktop(projectPath, projectName, frontendPort);
      break;
    case 'electron_desktop':
      await scaffoldElectronDesktop(projectPath, projectName, frontendPort);
      break;
    case 'dotnet_microservice':
      await scaffoldDotnetMicroservice(projectPath, projectName, backendPort);
      break;
    default:
      await scaffoldDotnetReact(projectPath, projectName, backendPort, frontendPort);
      break;
  }

  // Icons injizieren
  await ensureTauriIcons(projectPath);

  return {
    success: true,
    projectPath,
    projectName,
    templateId,
    message: `Projekt '${projectName}' erfolgreich aus Vorlage '${templateId}' generiert.`
  };
}

async function scaffoldDotnetReact(projectDir, name, backendPort, frontendPort) {
  const backendDir = path.join(projectDir, 'Backend');
  const frontendDir = path.join(projectDir, 'Frontend');

  fs.mkdirSync(backendDir, { recursive: true });
  fs.mkdirSync(frontendDir, { recursive: true });

  // Backend: Program.cs & csproj
  fs.writeFileSync(path.join(backendDir, `${name}.csproj`), `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>`);

  fs.writeFileSync(path.join(backendDir, 'Program.cs'), `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(o => o.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();
app.UseCors("AllowAll");

app.MapGet("/", () => new { Status = "Online", Service = "${name} API", Framework = ".NET 10" });
app.MapGet("/api/health", () => new { Status = "Healthy", Timestamp = DateTime.UtcNow });

app.Run("http://0.0.0.0:${backendPort}");
`);

  // Frontend: package.json, index.html, App.tsx
  fs.writeFileSync(path.join(frontendDir, 'package.json'), JSON.stringify({
    name: `${name.toLowerCase()}-frontend`,
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      "dev": `vite --port ${frontendPort}`,
      "build": "tsc && vite build"
    },
    dependencies: {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "lucide-react": "^1.16.0"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.3.1",
      "typescript": "^5.4.5",
      "vite": "^5.2.11",
      "tailwindcss": "^3.4.4",
      "autoprefixer": "^10.4.19"
    }
  }, null, 2));

  fs.writeFileSync(path.join(frontendDir, 'index.html'), `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
    <link rel="icon" type="image/png" sizes="256x256" href="/favicon-256x256.png" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

  const srcDir = path.join(frontendDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  fs.writeFileSync(path.join(srcDir, 'main.tsx'), `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

  fs.writeFileSync(path.join(srcDir, 'App.tsx'), `import React, { useState, useEffect } from 'react';

export default function App() {
  const [apiStatus, setApiStatus] = useState('Verbinde mit .NET Backend...');

  useEffect(() => {
    fetch('http://localhost:${backendPort}/')
      .then(res => res.json())
      .then(data => setApiStatus(\`Verbunden: \${data.Service} (\${data.Framework})\`))
      .catch(() => setApiStatus('Backend noch nicht gestartet'));
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl max-w-lg w-full space-y-4">
        <h1 className="text-2xl font-bold text-emerald-400">${name}</h1>
        <p className="text-sm text-slate-400">Generiert mit DB Studio Local Bridge</p>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
          Status: {apiStatus}
        </div>
      </div>
    </main>
  );
}`);
}

async function scaffoldTauriDesktop(projectDir, name, frontendPort) {
  await scaffoldDotnetReact(projectDir, name, 0, frontendPort);
  const srcTauri = path.join(projectDir, 'src-tauri');
  fs.mkdirSync(srcTauri, { recursive: true });

  fs.writeFileSync(path.join(srcTauri, 'tauri.conf.json'), JSON.stringify({
    build: {
      beforeDevCommand: "npm run dev",
      beforeBuildCommand: "npm run build",
      devPath: `http://localhost:${frontendPort}`,
      distDir: "../dist"
    },
    package: {
      productName: name,
      version: "1.0.0"
    },
    tauri: {
      allowlist: { all: true },
      windows: [{ title: name, width: 1200, height: 800, center: true }]
    }
  }, null, 2));
}

async function scaffoldElectronDesktop(projectDir, name, frontendPort) {
  await scaffoldDotnetReact(projectDir, name, 0, frontendPort);
  fs.writeFileSync(path.join(projectDir, 'main.js'), `const { app, BrowserWindow } = require('electron');
function createWindow () {
  const win = new BrowserWindow({ width: 1200, height: 800 });
  win.loadURL('http://localhost:${frontendPort}');
}
app.whenReady().then(createWindow);
`);
}

async function scaffoldDotnetMicroservice(projectDir, name, backendPort) {
  fs.writeFileSync(path.join(projectDir, `${name}.csproj`), `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>`);

  fs.writeFileSync(path.join(projectDir, 'Program.cs'), `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => new { Service = "${name}", Status = "Healthy", Runtime = ".NET 10 Microservice" });
app.MapGet("/ping", () => "pong");

app.Run("http://0.0.0.0:${backendPort}");
`);
}
