# DB Studio Local Bridge – Master-Dokumentation & Spezifikation (Version 3.0.0)

> **Status:** Vollständig implementiert & produktionsbereit (Phasen 1 bis 9 abgeschlossen)  
> **Letzte Aktualisierung:** 23. August 2026  
> **Architektur:** Node.js Backend (Express & WebSockets) + React/Vite Desktop & Web Companion  

---

## 1. Systemarchitektur & Rollenverteilung

Das System besteht aus zwei perfekt ineinandergreifenden Komponenten:

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   GESAMTSYSTEM-ÜBERSICHT                               │
 ├───────────────────────────────────────────┬────────────────────────────────────────────┤
 │ 🎨 DB Studio Pro                          │ ⚡ DB Studio Local Bridge                   │
 │ (Web & Desktop Studio)                    │ (Lokaler Companion & Daemon)               │
 ├───────────────────────────────────────────┼────────────────────────────────────────────┤
 │ • Visueller ER-Canvas & Beziehungseditor  │ • Native Installer Builds (Tauri, Electron)│
 │ • Visueller SQL Query-Builder             │ • Access-Migration (.accdb/.mdb ➔ .dbsp)   │
 │ • Formular-, Report- & Dashboard-Designer │ • Topologischer Live Data-Sync & SQL-Dumps │
 │ • Workflows, Logic & AI Assistenten       │ • Docker Compose Multi-Container Manager   │
 │ • Projektverwaltung & Code-Generierung    │ • Git Push, FTP Upload & PHP-Relay Gateway │
 └───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 2. Kommunikations- und Netzwerkarchitektur

Die Kommunikation zwischen **DB Studio Pro** und der **Local Bridge** erfolgt über drei standardisierte Kanäle:

```
┌────────────────────────┐                    ┌──────────────────────────────────────────┐
│                        │── HTTP POST (JSON) ──>│ REST API (Port 5050)                     │
│                        │<── HTTP Response ───│ Express.js Endpunkte                     │
│     DB STUDIO PRO      │                    ├──────────────────────────────────────────┤
│ (Web / SaaS / Desktop) │<══ WS Live Logs ═══│ WebSocket Server (/logs)                 │
│                        │                    ├──────────────────────────────────────────┤
│                        │── PHP Relay POST ──>│ bridge_relay.php (HTTPS Gateway)         │
└────────────────────────┘                    └──────────────────────────────────────────┘
```

1. **Direkte HTTP REST-API (`http://127.0.0.1:5050`):**
   - Für Deployments, Prozess-Aktionen, Abhängigkeitsverwaltung und Installer-Kompilierung.
   - Unterstützt **Private Network Access (PNA)** mit `Access-Control-Allow-Private-Network: true`.
2. **Echtzeit WebSocket-Stream (`ws://127.0.0.1:5050/logs`):**
   - Streamt Terminal-Ausgaben, Compiler-Logs, Live-Fortschritt und Dateisystem-Events in Millisekunden.
3. **PHP Remote Relay Gateway (`bridge_relay.php`):**
   - Ermöglicht browserbasierten SaaS-Versionen von DB Studio die Steuerung über Firewalls hinweg via HTTPS-Polling.

---

## 3. Implementierte Kernmodule (Ist-Zustand)

### 3.1 Core Bridge Server & Port-Kollisionsschutz (Phase 1)
* **Intelligente Port-Verwaltung:** Prüft beim Start, ob Port `5050` belegt ist. Je nach Einstellung wird der belegende Prozess beendet oder ein freier Alternativport (z. B. `5051`) zugewiesen.
* **Health & Runtime Telemetry:** Liefert installierte Versionen von Node.js, NPM, .NET SDK, Rust/Cargo und Docker.
* **Windows Autostart:** Ein-Klick Konfiguration über den Windows Task Scheduler (`schtasks.exe`).

### 3.2 Native Installer Builder & Launch Daemon (Phase 2)
* **Tauri 2.0 (MSI / Exe):** Kompiliert schlanke Rust/Webview-Desktop-Apps inklusive Icon-Asset-Injektion.
* **Electron Forge (Setup.exe):** Erstellt vollständige Windows-Installer für Node.js/Chromium-Anwendungen.
* **.NET 10 (Single-File Exe):** Kompiliert Backend-Services in eigenständige Windows-Binärdateien.
* **1-Klick Start & Explorer-Öffnung:** Startet den erzeugten Installer direkt oder hebt ihn im Windows Explorer hervor.

### 3.3 Git-Integration & CI/CD Pipeline Generator (Phase 3)
* **Git Remote Management:** Testet Verbindungen zu GitHub/GitLab, erstellt Repositories und führt automatisierte `commit`- und `push`-Operationen aus.
* **Pipeline-Generator:** Generiert vorkonfigurierte `.github/workflows/deploy.yml` und `.gitlab-ci.yml`.

### 3.4 SQLite Schema Explorer & Query Console (Phase 4)
* **Projekt-Scanner:** Erkennt `.db` und `.sqlite` Datenbanken in lokalen Projekten.
* **Schema-Inspektor:** Liest Tabellenstrukturen, Indizes und Spaltentypen aus.
* **Live Query Console:** Führt `SELECT`-Abfragen aus und stellt Ergebnisse tabellarisch dar.

### 3.5 Dependency Manager & Shared Dependencies (Phase 5)
* **NPM & NuGet Paketmanager:** Installieren, Deinstallieren, Aktualisieren und Wiederherstellen (`restore`) von Abhängigkeiten.
* **Symlink Relinking Engine:** Verlinkt identische Pakete aus einem globalen Shared-Cache, um Festplattenplatz zu sparen.

### 3.6 PHP Remote Relay Gateway (Phase 6)
* **Zero-Config PHP-Skript:** `bridge_relay.php` fungiert als bidirektionales HTTPS-Gateway auf Standard-Webhosting-Servern.
* **1-Klick Explorer-Download:** Speichert das Skript direkt im Windows `Downloads`-Ordner und öffnet den Explorer.
* **Live Connection Test:** Sendet sofortige Heartbeats zur Validierung der Verbindung.

### 3.7 Docker Compose Multi-Container Orchestrierung (Phase 7)
* **Vordefinierte Presets:** MySQL 8.0, PostgreSQL 16, Redis 7 und Mailpit.
* **1-Klick Compose:** Generiert `docker-compose.yml` und steuert `docker compose up -d` / `down`.

### 3.8 Microsoft Access Migration Engine (.accdb & .mdb) (Phase 8)
* **Drag & Drop Upload:** Liest Access 97–2024 Dateien über moderne 64-Bit OLEDB-Treiber (`Microsoft.ACE.OLEDB.16.0`) aus.
* **DDL- & Datentyp-Transpiler:** Übersetzt Tabellen und Typen (`AutoWert`, `Währung`, `Datum`, `Ja/Nein`) in PostgreSQL, MySQL, SQLite und T-SQL.
* **Abfragen- & VBA-Transpiler:** Transpiliert `NZ()`, `IIF()`, `Format()`, `Date()`, `Now()`, `CDate()`, `Left()`/`Mid()` in ANSI-SQL.
* **Natives .dbsp Projekt-Format:** Erzeugt vollständige DB Studio Projektdateien (`.dbsp`) inkl. Tabellen, Spalten, Datensätzen, visualisierten ER-Layout-Nodes, 1:n Beziehungen und Backend-Konfiguration zum direkten Import in DB Studio Pro.

### 3.9 Live Data-Sync & Batch Migration Bridge (Phase 9)
* **Topologische Sortierung (Dependency Graph):** Berechnet die korrekte Einfügereihenfolge (`Kategorie` ➔ `Buecher` ➔ `Schueler` ➔ `Verleih`), um Foreign-Key Verletzungen bei `INSERT`s auszuschließen.
* **Batch Data Extraction in Chunks:** Liest tausende Datensätze performant aus Access aus.
* **Vollständiger SQL Data-Dump (.sql):** Erzeugt auf Knopfdruck ein vollständiges Skript aus DDL + Multi-Row `INSERT INTO`-Blöcken für PostgreSQL, MySQL, SQLite und T-SQL.
* **Lokale SQLite-Direktmigration:** Schreibt alle Tabellen und Zeilen direkt in eine native `.db`-Datei auf der Festplatte.

---

## 4. Vollständige API-Endpunkt Referenz

| Methode | Pfad | Bereich | Funktion |
|---|---|---|---|
| `GET` | `/api/status` | Core | Systemgesundheit, aktive Prozesse, Ports, Runtimes |
| `GET` | `/api/settings` | Core | Einstellungen laden |
| `POST` | `/api/settings` | Core | Einstellungen speichern |
| `POST` | `/api/deploy` | Core | Empfang & Ausführung von Projekt-Payloads aus DB Studio |
| `POST` | `/api/process/action` | Prozess | Starten, Stoppen, Neustarten von Prozessen |
| `GET` | `/api/projects` | Workspaces | Liste aller Projekte auf der Festplatte |
| `POST` | `/api/projects/build-package` | Installer | Erzeugt native Installer (Tauri MSI, Electron Setup, .NET Exe) |
| `POST` | `/api/projects/launch-package`| Installer | Startet den erzeugten Installer |
| `POST` | `/api/packages/install` | Dependencies | Installiert ein NPM-/NuGet-Paket |
| `POST` | `/api/packages/uninstall` | Dependencies | Deinstalliert ein Paket |
| `POST` | `/api/packages/update` | Dependencies | Aktualisiert ein Paket |
| `POST` | `/api/packages/update-all` | Dependencies | Aktualisiert alle Pakete eines Projekts |
| `POST` | `/api/packages/restore-all`| Dependencies | Vollständiger Restore aller Abhängigkeiten |
| `POST` | `/api/dependencies/relink` | Dependencies | Relinked Shared Dependencies per Symlink |
| `POST` | `/api/git/test-connection` | Git | Testet GitHub / GitLab Zugangsdaten |
| `POST` | `/api/git/create-repo` | Git | Erstellt ein Remote-Repository |
| `POST` | `/api/git/push` | Git | Führt Commit und Push durch |
| `POST` | `/api/ftp/test` | FTP | Testet FTP/FTPS/SFTP und liefert Latenz & Dateiliste |
| `POST` | `/api/ftp/detect-files` | FTP | Erkennt kompilierte Upload-Dateien (`dist/`, `publish/`) |
| `POST` | `/api/ftp/upload` | FTP | Lädt Projektdateien auf den Server |
| `GET` | `/api/relay/script` | Relay | Liefert `bridge_relay.php` als Datei-Download |
| `GET` | `/api/relay/script-content` | Relay | Liefert den PHP-Relay Quellcode als JSON |
| `POST` | `/api/relay/save-to-downloads`| Relay | Speichert `bridge_relay.php` im Downloads-Ordner & öffnet Explorer |
| `POST` | `/api/relay/test` | Relay | Testet die Erreichbarkeit des PHP-Relays inkl. Live-Heartbeat |
| `GET` | `/api/system/autostart` | Autostart | Status des Windows Task Scheduler Autostarts |
| `POST` | `/api/system/autostart/toggle` | Autostart | Aktiviert oder deaktiviert den Windows Autostart |
| `GET` | `/api/deployments/profiles` | Deployments | Gibt Staging- & Produktions-Profile zurück |
| `POST` | `/api/deployments/profiles` | Deployments | Speichert Deployment-Profile |
| `POST` | `/api/deployments/health-check`| Deployments | Führt HTTP-Healthcheck mit Latenzmessung durch |
| `POST` | `/api/database/find` | Datenbank | Sucht nach `.db` / `.sqlite` Dateien im Projekt |
| `POST` | `/api/database/inspect` | Datenbank | Liest Tabellenschemata und Spalten aus |
| `POST` | `/api/database/query` | Datenbank | Führt SQL SELECT-Abfragen aus |
| `GET` | `/api/templates/list` | Vorlagen | Listet die 4 Offline-Templates auf |
| `POST` | `/api/templates/create` | Vorlagen | Erstellt ein Projekt aus einer Vorlage |
| `POST` | `/api/git/generate-pipeline` | CI/CD | Generiert `.github/workflows` oder `.gitlab-ci.yml` |
| `GET` | `/api/docker/presets` | Docker | Liefert Docker Compose Presets |
| `POST` | `/api/docker/compose/generate` | Docker | Generiert `docker-compose.yml` |
| `POST` | `/api/docker/compose/action` | Docker | Führt Docker `up -d` oder `down` aus |
| `POST` | `/api/migration/access/upload` | Access Migration | Empfängt `.accdb`/`.mdb` Uploads zur Inspektion |
| `POST` | `/api/migration/access/inspect`| Access Migration | Liest Tabellen, Spalten, Datentypen und Abfragen |
| `POST` | `/api/migration/access/transpile`| Access Migration| Transpiliert Schema & Abfragen in Ziel-SQL-Dialekt |
| `POST` | `/api/migration/access/export-to-dbstudio`| Access Migration| Erzeugt vollständiges DB Studio Export-Paket (JSON) |
| `POST` | `/api/migration/access/export-dbsp` | Access Migration | Erzeugt native `.dbsp` Projektdatei für DB Studio |
| `POST` | `/api/migration/sync/preview` | Data-Sync | Ermittelt Ausführungsplan & Topologische Sortierung |
| `POST` | `/api/migration/sync/export-dump` | Data-Sync | Generiert vollständigen SQL-Data-Dump (.sql) |
| `POST` | `/api/migration/sync/start-sqlite` | Data-Sync | Schreibt Daten direkt in native SQLite (.db) Datei |
| `GET` | `/api-docs` | Dokumentation | Interaktive Swagger UI API-Dokumentation |
| `WS` | `/logs` | Streaming | WebSocket-Stream für Terminal-Logs & Watcher-Events |

---

## 5. Entwickler-Checkliste für DB Studio

- [x] **Private Network Access (PNA) Header:** DB Studio sendet immer `X-Bridge-Token` und respektiert Preflights (`OPTIONS`).
- [x] **Relative API-Pfade im Frontend-Code:** In generierten `vite.config.ts` und React-Komponenten Umgebungsvariablen wie `import.meta.env.VITE_API_BASE_URL || '/api'` verwenden.
- [x] **Port-Flexibilität:** In `appsettings.json` oder PHP `.env` keine festen Ports fest verdrahten, sondern die von der Bridge im Payload vergebenen Ports (`ports.backendPort`, `ports.frontendPort`) nutzen.
- [x] **Access-Migration & .dbsp Import:** Über die Bridge generierte `.dbsp`-Dateien direkt in DB Studio Pro öffnen – Schemas, Relationen, Daten und Layout-Nodes werden sofort geladen.
- [x] **Auto-Reconnect im UI:** Nach einem Neustart der Bridge automatisch alle 3 Sekunden einen Ping senden, um den Live-Status wiederherzustellen.

---

*DB Studio Local Bridge – Zuverlässig, schnell, modular und vollkommen integriert.*
