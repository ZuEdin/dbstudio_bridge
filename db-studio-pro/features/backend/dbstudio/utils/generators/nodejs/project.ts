import JSZip from "jszip";

export function generateProjectFiles(
  zip: JSZip,
  normalizedSubfolder: string,
  includeWwwroot: boolean
) {
  // 1. package.json
  const packageJson = {
    name: "db-studio-pro-selfhost-backend",
    version: "1.0.0",
    description: "Self-Hosting Metadata, Dynamic Data & Sync Backend for DB Studio Pro (Node.js Express)",
    main: "server.js",
    scripts: {
      start: "node server.js",
      dev: "nodemon server.js",
      initdb: "node scripts/initdb.js"
    },
    dependencies: {
      express: "^4.19.2",
      cors: "^2.8.5",
      dotenv: "^16.4.5",
      sqlite3: "^5.1.7",
      bcryptjs: "^2.4.3",
      jsonwebtoken: "^9.0.2"
    },
    devDependencies: {
      nodemon: "^3.1.0"
    }
  };
  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  // 2. .env
  zip.file(".env", `PORT=3000
BASE_PATH=${normalizedSubfolder}
NODE_ENV=production
GEMINI_API_KEY=
JWT_SECRET=super_secret_jwt_key_1234
`);

  // 3. server.js
  zip.file("server.js", `/**
 * DB Studio Pro - Complete Self-Host Backend Server (Node.js Express)
 * Supports full Subfolder / wwwroot Base Path configuration & State synchronization.
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '${normalizedSubfolder}';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, 'dbstudio_meta.db');
const db = new sqlite3.Database(dbPath);

// Expose DB reference globally for routers
global.db = db;

// Import Routers
const authRouter = require('./routers/auth');
const projectsRouter = require('./routers/projects');
const dataRouter = require('./routers/data');
const utilityRouter = require('./routers/utility');

// Express router to handle both root and subfolder paths
const router = express.Router();

router.use('/api', authRouter);
router.use('/api', projectsRouter);
router.use('/api/data', dataRouter);
router.use('/api', utilityRouter);

app.use('/', router);
if (BASE_PATH && BASE_PATH !== '/') {
  app.use(BASE_PATH, router);
}

// Serve wwwroot static files
const wwwrootPath = path.join(__dirname, 'wwwroot');
if (fs.existsSync(wwwrootPath)) {
  app.use(express.static(wwwrootPath));
  if (BASE_PATH && BASE_PATH !== '/') {
    app.use(BASE_PATH, express.static(wwwrootPath));
  }
}

app.listen(PORT, () => {
  console.log(\`DB Studio Node.js Backend läuft auf Port \${PORT}\`);
  if (BASE_PATH) console.log(\`Unterordner / Base Path aktiv: http://localhost:\${PORT}\${BASE_PATH}\`);
});
`);

  // 4. scripts/initdb.js
  const initDbJs = `const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../dbstudio_meta.db');
const sqlPath = path.resolve(__dirname, '../schema.sql');
const db = new sqlite3.Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf8');

db.exec(sql, (err) => {
  if (err) console.error('Fehler bei der DB-Initialisierung:', err);
  else console.log('Alle DB Studio Metadaten & Data Tables erfolgreich initialisiert!');
  db.close();
});
`;
  zip.file("scripts/initdb.js", initDbJs);

  if (includeWwwroot) {
    const wwwrootIndex = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DB Studio Pro Self-Host API (Node.js)</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
        .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 560px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4); }
        h1 { color: #38bdf8; margin-top: 0; font-size: 1.6rem; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
        .subfolder-badge { background: #312e81; color: #a5b4fc; border: 1px solid #4338ca; padding: 0.35rem 0.85rem; border-radius: 0.5rem; font-family: monospace; font-weight: 600; font-size: 0.85rem; display: inline-block; margin: 1rem 0; }
        .endpoints { text-align: left; background: #0f172a; padding: 1rem; border-radius: 0.5rem; border: 1px solid #334155; font-family: monospace; font-size: 0.8rem; margin-top: 1.5rem; color: #38bdf8; }
        a { color: #38bdf8; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h1>DB Studio Pro Self-Host API (Node.js)</h1>
        <p>Das Node.js Express Backend ist online und für Ihren Unterordner konfiguriert.</p>
        ${normalizedSubfolder ? `<div class="subfolder-badge">Aktiver Unterordner: ${normalizedSubfolder}</div>` : ''}
        <div class="endpoints">
            <div style="color:#a5b4fc; font-weight:bold; margin-bottom:0.5rem;">Verfügbare API-Routen:</div>
            <div>GET  ${normalizedSubfolder}/api/health</div>
            <div>GET  ${normalizedSubfolder}/api/projects</div>
            <div>POST ${normalizedSubfolder}/api/projects</div>
            <div>GET  ${normalizedSubfolder}/api/data/:tableName</div>
            <div>POST ${normalizedSubfolder}/api/data/:tableName</div>
        </div>
        <p style="margin-top:1.5rem;"><a href="${normalizedSubfolder}/api/health" target="_blank">API Health-Check öffnen &rarr;</a></p>
    </div>
</body>
</html>`;
    zip.file("wwwroot/index.html", wwwrootIndex);

    const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="DBStudio Subfolder SPA and API Routing" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="${normalizedSubfolder ? normalizedSubfolder + '/' : ''}index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="Detailed" />
  </system.webServer>
</configuration>`;
    zip.file("wwwroot/web.config", webConfig);

    const htaccess = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${normalizedSubfolder ? normalizedSubfolder + '/' : '/'}
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . index.html [L]
</IfModule>`;
    zip.file("wwwroot/.htaccess", htaccess);
  }

  // Startup and Build Scripts
  zip.file("start.bat", `@echo off
echo Installiere node modules...
call npm install
echo Initialisiere SQLite Schema...
call npm run initdb
echo Starte Server im Dev-Modus...
call npm run dev
pause`);

  zip.file("start.sh", `#!/bin/bash
echo "Installiere node modules..."
npm install
echo "Initialisiere SQLite Schema..."
npm run initdb
echo "Starte Server im Dev-Modus..."
npm run dev`);

  zip.file("build_webserver.bat", `@echo off
echo [DB Studio Pro] Erstelle Webserver Build für Node.js Express...
call npm install --production=false
call npm run initdb
echo.
echo [OK] Webserver Build erfolgreich abgeschlossen!
pause`);

  zip.file("build_webserver.sh", `#!/bin/bash
echo "[DB Studio Pro] Erstelle Webserver Build für Node.js Express..."
npm install --production=false
npm run initdb
echo "[OK] Build abgeschlossen!"`);
}
