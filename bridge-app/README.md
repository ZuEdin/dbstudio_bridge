# DB Studio Local Bridge (Frontend & UI Blueprint)

Dieses Verzeichnis (`/bridge-app`) ist ein **vollständig isoliertes Frontend für die lokale Bridge**. Es ist **nicht** in DB Studio integriert und dient als Referenz und Benutzeroberfläche für eine Desktop-Anwendung (z. B. via **Tauri** oder **Electron**).

---

## 🎯 Zweck der Bridge
Ermöglicht es dem Online-Webbrowser (DB Studio), generierte C# / .NET 10 WebAPIs und React-Frontends direkt auf dem lokalen Computer des Nutzers auszuführen:
1. **Workspace-Verwaltung:** Speichert Dateien in lokalen Ordnern (z. B. `C:\Users\...\DBStudio\Projects\App1`).
2. **Kompilierung & Start:** Führt `dotnet run` und `npm install && npm run dev` im Hintergrund aus.
3. **Deployment & Release Manager:** Kompiliert und veröffentlicht Releases als:
   - 📦 **Self-Contained .NET 10 Binary (`.exe`)**: Single-file Executable ohne .NET-Runtime-Abhängigkeit.
   - 🐳 **Docker Container Engine**: Baut lokale Images und startet Container.
   - 🏢 **Windows Service / Daemon**: Registriert den Server im OS Service Manager für Autostart.
   - 🌐 **Static Web Bundle**: Erzeugt produktionsreife Vite-Builds (`dist/`).
4. **Live Terminal Streaming:** Streamt Compiler-Ausgaben per WebSocket live an die Web-Oberfläche.
5. **Port- & Prozessverwaltung:** Startet, stoppt und überwacht lokale Server-Instanzen inkl. Health-Checks und Rollback-Mechanismen.

---

## 🛠️ Unterstützte Technologien & Tech-Stack

Die Bridge ist modular aufgebaut und unterstützt die Ausführung, Dependency-Wiederherstellung, Datenbank-Migration und das Deployment für folgende Technologie-Stacks:

---

### 1. ⚙️ Backend-Frameworks & Runtimes

| Backend / Framework | Versionen / Runtimes | Paketmanager & Build-Tool | Bridge-Befehle & Orchestrierung |
| :--- | :--- | :--- | :--- |
| **C# / .NET WebAPI & Minimal APIs** | .NET 10, .NET 9, .NET 8 (LTS) | NuGet / `dotnet CLI` | `dotnet restore`<br>`dotnet build`<br>`dotnet run --urls=http://localhost:5000`<br>`dotnet publish -c Release --self-contained` |
| **Node.js / Express / Fastify / NestJS** | Node.js v20.x, v22.x (LTS) | `npm`, `pnpm`, `yarn` | `npm install`<br>`npm run build`<br>`node dist/server.cjs` |
| **Go / Fiber / Gin (Optional)** | Go 1.22+ | `go modules` | `go mod download`<br>`go run main.go`<br>`go build -o server.exe` |
| **Python / FastAPI / Flask (Optional)** | Python 3.11+, 3.12+ | `pip`, `poetry`, `uv` | `pip install -r requirements.txt`<br>`uvicorn main:app --port 5000 --reload` |

---

### 2. 🖥️ Frontend-Frameworks & Bundler

| Frontend-Technologie | Tooling / Bundler | Styling & Icons | Bridge-Ausführung |
| :--- | :--- | :--- | :--- |
| **React 18 / 19 (TypeScript)** | Vite, Webpack, Turbopack | Tailwind CSS, Shadcn UI, Lucide Icons | `npm install`<br>`npm run dev -- --port 3000`<br>`npm run build` *(erzeugt statisches `dist/` Verzeichnis)* |
| **Vue 3 (Composition API / TS)** | Vite / Nuxt 3 | Tailwind CSS, PrimeVue, Lucide Vue | `npm install`<br>`npm run dev`<br>`npm run build` |
| **Angular 17 / 18** | Angular CLI / esbuild | Angular Material, Tailwind CSS | `ng serve --port 4200`<br>`ng build --configuration production` |
| **Svelte 5 / SvelteKit** | Vite | Tailwind CSS, Lucide Svelte | `npm run dev`<br>`npm run build` |
| **Vanilla HTML5 / Modern JS** | Statischer Webserver / Live-Server | Reines CSS / Tailwind CDN | Eingebetteter File-Server der Bridge auf konfiguriertem Port |

---

### 3. 🗄️ Datenbanken & ORM-Mapping

Die Bridge initialisiert automatisch lokale Datenbankdateien, führt Schema-Migrationen aus oder steuert Docker-Container für relationale und dokumentbasierte Systeme:

| Datenbank-System | Typ & Deployment | ORM / Migration Tools | Bridge-Aufgabe & Lifecycle |
| :--- | :--- | :--- | :--- |
| **SQLite / LocalDB** | Eingebettete dateibasierte Datenbank (`.db` Datei im Workspace) | Entity Framework Core (`Microsoft.EntityFrameworkCore.Sqlite`), Dapper, Drizzle ORM | • Erstellt Verzeichnisse & Dateirechte.<br>• Führt `dotnet ef database update` aus.<br>• Ideal für sofortige, wartungsfreie lokale Ausführung ohne Server-Setup. |
| **PostgreSQL** | Lokale Instanz (`localhost:5432`) oder Docker-Container | EF Core (`Npgsql.EntityFrameworkCore.PostgreSQL`), Prisma, Drizzle | • Prüft Datenbankverbindung (Health-Check).<br>• Startet bei Bedarf automatisch einen lokalen Docker-Container (`postgres:latest`).<br>• Führt SQL-Initialskripte und Migrationen aus. |
| **Microsoft SQL Server (MSSQL)** | LocalDB, SQL Express oder Docker | EF Core (`Microsoft.EntityFrameworkCore.SqlServer`), Dapper | • Erkennt installierte SQL Express Instanzen.<br>• Automatische Ausführung von T-SQL Skripten und EF-Migrationen. |
| **MySQL / MariaDB** | Lokale Dienst-Instanz oder Docker | EF Core (`Pomelo.EntityFrameworkCore.MySql`), Prisma | • Verbindungsaufbau und Schema-Initialisierung per SQL/ORM. |
| **MongoDB** | NoSQL Dokumenten-DB (Lokal / Container) | Official C# MongoDB Driver, Mongoose (Node.js) | • Verbindungsprüfung und Seed-Daten-Import. |
| **Redis (Cache & Event-Store)** | In-Memory Key-Value Store | StackExchange.Redis, ioredis | • Optionaler Cache-Layer & Session-Store für Micro-Frontends und Realtime-Events. |

---

## 🚀 Schnelle Vorschau & Entwicklung

```bash
cd bridge-app
npm install
npm run dev
```

---

## 🔌 Schnittstellen-Vertrag (API)

### 1. Projekt empfangen & starten
- **Methode:** `POST http://127.0.0.1:5050/api/deploy`
- **Header:** `X-Bridge-Token: <Sicherheits-Token>`
- **Body:**
```json
{
  "projectId": "proj_kunde_01",
  "projectName": "KundenVerwaltung",
  "targetFramework": "dotnet10",
  "frontendFramework": "react",
  "backendPort": 5000,
  "frontendPort": 3000,
  "autoInstall": true,
  "autoRun": true,
  "files": [
    {
      "path": "Backend/Program.cs",
      "content": "// C# Source..."
    }
  ]
}
```

### 2. Live Terminal Logs
- **WebSocket:** `ws://127.0.0.1:5050/logs`

---

## 🛠️ Tauri / Rust Einbindung (Empfohlen)

Dieses Frontend kann direkt als Benutzeroberfläche in ein **Tauri**-Projekt überführt werden:
- `src/services/bridgeApi.ts` prüft automatisch, ob `window.__TAURI__.invoke` existiert, und ruft native Rust-Funktionen (`get_environment_health`, `get_active_processes`, `deploy_project`) auf.
- Rust startet den lokalen Webserver (z. B. mit `axum` oder `actix-web`) auf Port `5050` und minimiert das Fenster bei Bedarf ins System-Tray.
