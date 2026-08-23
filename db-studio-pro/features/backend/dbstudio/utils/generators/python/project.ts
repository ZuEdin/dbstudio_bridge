import JSZip from "jszip";

export function generateProjectFiles(
  zip: JSZip,
  normalizedSubfolder: string,
  includeWwwroot: boolean
) {
  // requirements.txt
  zip.file("requirements.txt", `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
requests>=2.31.0
httpx>=0.27.0
python-multipart>=0.0.9
jinja2>=3.1.3
`);

  // database helper and middleware settings
  zip.file("db_helper.py", `import sqlite3
import os

DB_PATH = "dbstudio_meta.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create default meta users table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sys_users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(150) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'User',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    # Seed admin user if empty
    cursor.execute("SELECT COUNT(*) FROM sys_users")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO sys_users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)",
            ("admin_usr_1", "admin", "admin@dbstudio.local", "$2b$10$hash_demo", "Admin")
        )
        conn.commit()
    conn.close()
`);

  // main.py file containing the lifespan startup and routing configuration
  zip.file("main.py", `import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from db_helper import init_db

# Routers
from routers.auth import router as auth_router
from routers.projects import router as projects_router
from routers.data import router as data_router
from routers.utility import router as utility_router

BASE_PATH = os.getenv("BASE_PATH", "${normalizedSubfolder}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite and seed on startup
    init_db()
    yield

app = FastAPI(
    title="DB Studio Pro Self-Host Backend (Python FastAPI)",
    description="Ein robustes, sicheres und vollstaendig vorkonfiguriertes Python Backend fuer DB Studio Pro.",
    version="1.0.0",
    root_path=BASE_PATH if BASE_PATH else "",
    lifespan=lifespan
)

# CORS setup for frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with standard dynamic prefixing
prefix = ""
app.include_router(auth_router, prefix=prefix)
app.include_router(projects_router, prefix=prefix)
app.include_router(data_router, prefix=prefix)
app.include_router(utility_router, prefix=prefix)

# Mount wwwroot SPA frontend if present
if os.path.exists("wwwroot"):
    app.mount("/wwwroot", StaticFiles(directory="wwwroot"), name="wwwroot")
    app.mount("/", StaticFiles(directory="wwwroot", html=True), name="static_root")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`);

  if (includeWwwroot) {
    const subfolderHtml = normalizedSubfolder 
      ? '<div class="subfolder-badge">Unterordner: ' + normalizedSubfolder + '</div>' 
      : '';

    zip.file("wwwroot/index.html", `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DB Studio Pro Backend (Python FastAPI)</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 0.75rem; border: 1px solid #334155; text-align: center; max-width: 480px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
        h1 { color: #38bdf8; margin-top: 0; font-size: 1.5rem; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
        .subfolder-badge { background: #312e81; color: #a5b4fc; border: 1px solid #4338ca; padding: 0.35rem 0.85rem; border-radius: 0.5rem; font-family: monospace; font-weight: 600; font-size: 0.85rem; display: inline-block; margin: 0.5rem 0; }
        .status { background: #0284c7; color: white; padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; margin-top: 1rem; display: inline-block; }
        a { color: #38bdf8; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h1>DB Studio Pro Backend (Python FastAPI)</h1>
        <p>Das Python FastAPI Self-Host Backend ist aktiv und einsatzbereit.</p>
        ${subfolderHtml}
        <p><a href="${normalizedSubfolder}/docs">Swagger API Dokumentation öffnen &rarr;</a></p>
        <div class="status">System Status: Online</div>
    </div>
</body>
</html>
`);

    zip.file("wwwroot/web.config", `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Python Subfolder Rewrite" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`);
  }

  // Startup and Build Scripts
  zip.file("start.bat", `@echo off
echo Starte DB Studio Pro Python FastAPI Enterprise Backend...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause`);

  zip.file("start.sh", `#!/bin/bash
echo "Starte DB Studio Pro Python FastAPI Enterprise Backend..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload`);

  zip.file("build_webserver.bat", `@echo off
echo [DB Studio Pro] Installiere Python Dependencies fuer Webserver Deployment...
call pip install -r requirements.txt
echo.
echo [OK] Webserver Vorbereitung abgeschlossen!
pause`);

  zip.file("build_webserver.sh", `#!/bin/bash
echo "[DB Studio Pro] Installiere Python Dependencies für Webserver..."
pip install -r requirements.txt
echo "[OK] Build abgeschlossen!"`);
}
