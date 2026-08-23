# 📘 Das große DB Studio Local Bridge Handbuch & Gesamterklärung

> **Version:** 3.0.0 (Vollversion)  
> **Zweck:** Vollständige Erklärung der Funktionsweise, aller Module und des nativen `.dbsp` Projekt-Workflows für **DB Studio Pro**.

---

## Inhaltsverzeichnis

1. [Was ist die DB Studio Local Bridge?](#1-was-ist-die-db-studio-local-bridge)
2. [Die perfekte Rollenverteilung: DB Studio Pro vs. Local Bridge](#2-die-perfekte-rollenverteilung-db-studio-pro-vs-local-bridge)
3. [Was kann die Bridge? (Alle 10 Kernfähigkeiten im Detail)](#3-was-kann-die-bridge-alle-10-kernfähigkeiten-im-detail)
4. [Deep Dive: Die `.dbsp`-Projektdatei & der Import in DB Studio Pro](#4-deep-dive-die-dbsp-projektdatei--der-import-in-db-studio-pro)
5. [Schritt-für-Schritt Anleitung: Microsoft Access zu DB Studio Pro](#5-schritt-für-schritt-anleitung-microsoft-access-zu-db-studio-pro)
6. [Netzwerk & Kommunikationswege (Lokal, WebSocket, PHP-Relay)](#6-netzwerk--kommunikationswege-lokal-websocket-php-relay)
7. [Vollständige Endpunkt-Übersicht](#7-vollständige-endpunkt-übersicht)

---

## 1. Was ist die DB Studio Local Bridge?

Webbasierte Entwicklungsumgebungen und No-Code-Plattformen wie **DB Studio Pro** laufen im Browser. Aus Sicherheitsgründen dürfen Webbrowser jedoch **nicht direkt auf das lokale Dateisystem, native Windows-Treiber, Compiler oder Hintergrunddienste zugreifen**.

Hier kommt die **DB Studio Local Bridge** ins Spiel:

* Die Bridge ist ein **leistungsfähiger, lokaler Hintergrunddienst (Host-Daemon)**, der auf Ihrem Windows-Entwickler-PC läuft.
* Sie fungiert als **intelligentes Bindeglied (Brücke)** zwischen der visuellen Oberfläche von **DB Studio Pro** und Ihrem Betriebssystem.
* Sie führt rechenintensive Aufgaben aus, für die native Werkzeuge erforderlich sind: **Software kompilieren**, **Windows OLEDB-Treiber ansprechen**, **Docker-Container starten**, **Git-Befehle ausführen** und **tausende Datensätze übertragen**.

```
 ┌────────────────────────┐                    ┌──────────────────────────────────────────────┐
 │     DB STUDIO PRO      │                    │           DB STUDIO LOCAL BRIDGE             │
 │  (Visuelle Web-Suite)  │                    │          (Lokaler Windows-Daemon)            │
 ├────────────────────────┤                    ├──────────────────────────────────────────────┤
 │ • ER-Modellierung      │── HTTP / Relay ───>│ • Kompiliert Tauri, Electron, .NET Installer │
 │ • Query-Designer       │<── WS Log Stream ──│ • Liest .accdb / .mdb Dateien aus            │
 │ • UI & Form-Builder    │                    │ • Generiert native .dbsp Projektdateien      │
 │ • Workflow-Engine      │                    │ • Schreibt Daten in SQLite / MySQL / Postgres│
 └────────────────────────┘                    └──────────────────────────────────────────────┘
```

---

## 2. Die perfekte Rollenverteilung: DB Studio Pro vs. Local Bridge

Um Redundanzen zu vermeiden, sind die Aufgaben im Ökosystem glasklar aufgeteilt:

| Bereich | 🎨 DB Studio Pro (Hauptanwendung) | ⚡ DB Studio Local Bridge (Daemon) |
|---|---|---|
| **Zweck** | Designen, Modellieren, Konfigurieren & No-Code UI | Ausführen, Kompilieren, Migrieren & Hardware-Zugriff |
| **Tabellen & Beziehungen** | Visueller Entity-Relationship (ER) Canvas | Extrahiert Roh-Tabellen aus Microsoft Access |
| **SQL & Abfragen** | Visueller No-Code Query-Builder & Grid | Transpiliert Access-VBA-Funktionen in ANSI-SQL |
| **Datensätze** | Daten-Grid-Anzeige & Tabellen-Bearbeitung | Topologische Batch-Übertragung (Chunked Data Sync) |
| **Projektdateien** | Öffnet, editiert und exportiert `.dbsp`-Projekte | Erzeugt native `.dbsp`-Dateien aus alten Datenbanken |
| **Kompilierung** | Erzeugt Source-Code-Payloads | Baut echte `.exe` / `.msi` Windows-Installer |
| **DevOps** | Konfiguriert Datenbanken & Deployments | Steuert Docker Compose, Git Repos & FTP-Uploads |

---

## 3. Was kann die Bridge? (Alle 10 Kernfähigkeiten im Detail)

### 1. 🗃️ Microsoft Access Migration Engine (`.accdb` & `.mdb`)
* **Drag & Drop:** Sie ziehen eine beliebige Access-Datei (Access 97 bis Access 2024 / Office 365) in die Bridge.
* **64-Bit OLEDB-Inspektion:** Die Bridge nutzt `Microsoft.ACE.OLEDB.16.0`, um alle Tabellen, Spaltentypen, Primärschlüssel, Datensätze und gespeicherten Abfragen auszulesen.
* **Vollständiger Typ-Transpiler:** Übersetzt Microsoft-Typen (`AutoWert`, `Währung`, `Memo`, `Ja/Nein`, `Datum/Uhrzeit`) automatisch in Standard-SQL für PostgreSQL, MySQL, SQLite und T-SQL.
* **VBA-Funktions-Transpiler:** Übersetzt proprietäre Access-Funktionen:
  * `NZ(feld, 0)` ➔ `COALESCE(feld, 0)`
  * `IIF(bed, wahr, falsch)` ➔ `CASE WHEN bed THEN wahr ELSE falsch END`
  * `Date()` / `Now()` ➔ `CURRENT_DATE` / `NOW()`
  * `Format(datum, 'yyyy-mm-dd')` ➔ `DATE_FORMAT(...)` / `TO_CHAR(...)`
  * `&` (String-Verkettung) ➔ `||` / `CONCAT(...)`

---

### 2. 📦 Natives `.dbsp` Projekt-Export (Direktimport für DB Studio Pro)
* Generiert mit **einem einzigen Klick** eine vollwertige `.dbsp`-Projektdatei (z. B. `bibliothek3.dbsp`).
* Enthält:
  1. Alle Tabellenstrukturen mit Feldern, Längen und Datentypen.
  2. Echte Datensätze für jede Tabelle zur sofortigen Vorschau.
  3. Automatisch erkannte 1:n Beziehungen mit Kaskadier-Regeln.
  4. Fertig berechnete Koordinaten (`x`/`y`), damit die Tabellen im visuellen ER-Diagramm von DB Studio Pro sofort sauber angeordnet sind.
  5. Alle gespeicherten Abfragen und die Backend-Konfiguration.

---

### 3. 🔄 Live Data-Sync & Batch-Migration
* **Topologische Sortierung (Dependency Graph):** Ermittelt die exakte mathematische Reihenfolge aller Tabellen (Elterntabellen vor Kindtabellen), damit `INSERT`-Operationen niemals an Fremdschlüssel-Constraints scheitern.
* **Vollständiger SQL Data-Dump (`.sql`):** Generiert ein Multi-Row `INSERT INTO`-Skript aller Datenzeilen für den gewählten Ziel-SQL-Dialekt.
* **1-Klick Lokale SQLite-Datenbank (`.db`):** Erstellt direkt eine einsatzbereite `.db`-Datei auf Ihrer Festplatte und befüllt sie mit allen echten Datensätzen.

---

### 4. 🔨 Nativer Desktop-Installer Builder (Tauri, Electron, .NET)
* **Tauri 2.0:** Kompiliert ultra-schlanke Windows-Installer (`.msi` / `.exe`) mit Rust und Webview2 inklusive nativer Icon-Injektion.
* **Electron Forge:** Erstellt Standard-Windows-Setups (`Setup.exe`) für Chromium-basierte Apps.
* **.NET 10 Single-File:** Kompiliert C# Web-APIs in eigenständige, sofort ausführbare Windows-Binärdateien.
* **1-Klick Start & Explorer:** Nach dem Build kann der Installer direkt gestartet oder im Windows Explorer markiert werden.

---

### 5. 📦 Dependency Management & Symlink Relinking
* Installiert, aktualisiert und repariert NPM- und NuGet-Pakete für generierte Projekte.
* **Shared Relinking:** Erkennt mehrfach genutzte Pakete und verlinkt sie per NTFS-Symlink aus einem globalen Cache, was bis zu 80 % Festplattenspeicher spart.

---

### 6. 🐳 Docker Compose Multi-Container Orchestrierung
* Vordefinierte Presets für **MySQL 8.0**, **PostgreSQL 16**, **Redis 7** und **Mailpit**.
* Generiert per Knopfdruck eine `docker-compose.yml` und steuert `docker compose up -d` und `docker compose down`.

---

### 7. 🐙 Git-Integration & CI/CD Pipeline Generator
* Authentifiziert sich bei GitHub/GitLab, erstellt Repositories und führt automatisierte `commit`- und `push`-Vorgänge durch.
* Generiert einsatzbereite Pipeline-Definitionen (`.github/workflows/deploy.yml` und `.gitlab-ci.yml`).

---

### 8. 🌐 FTP, FTPS & SFTP Deployment Engine
* Testet Server-Verbindungen und misst die Latenz.
* Erkennt automatisch kompilierte Build-Artefakte (`dist/`, `publish/`) und lädt sie per Stream auf den Webserver hoch.

---

### 9. 🛡️ PHP Remote Relay Gateway (`bridge_relay.php`)
* Ermöglicht es webbasierten SaaS-Versionen von DB Studio Pro, lokale Bridge-Dienste sicher über Firewalls und NAT-Router hinweg anzusteuern.
* Bietet 1-Klick Download direkt in den Windows `Downloads`-Ordner.

---

### 10. ⚡ Port-Kollisionsschutz & Windows Autostart
* Prüft beim Start, ob Standard-Port `5050` blockiert ist, und wechselt bei Bedarf automatisch auf freie Ausweichports.
* Bietet 1-Klick Windows Task Scheduler Autostart, damit die Bridge bei jedem Systemstart im Hintergrund bereitsteht.

---

## 4. Deep Dive: Die `.dbsp`-Projektdatei & der Import in DB Studio Pro

Die `.dbsp`-Datei ist das native JSON-Projekt- und Backup-Format von **DB Studio Pro**.

### Wie ist eine `.dbsp`-Datei aufgebaut?

```json
{
  "id": "proj_4k2t97v5-1787488429618",
  "name": "bibliothek3",
  "lastModified": 1787488429618,
  "data": {
    "tables": [
      {
        "id": "t_buecher",
        "name": "Buecher",
        "fields": [
          {
            "id": "f_t_buecher_buchnr",
            "name": "BuchNr",
            "type": "INTEGER",
            "isPrimaryKey": true,
            "isAutoIncrement": true
          },
          {
            "id": "f_t_buecher_titel",
            "name": "Titel",
            "type": "VARCHAR",
            "length": 100
          }
        ],
        "data": [
          { "BuchNr": 1, "Titel": "Moran - Die letzten Krieger der Massai", "Kategorie": "A" }
        ]
      }
    ],
    "relationships": [
      {
        "id": "rel_t_verleih_t_buecher_0",
        "fromTableId": "t_verleih",
        "fromFieldId": "f_t_verleih_buchnr",
        "toTableId": "t_buecher",
        "toFieldId": "f_t_buecher_buchnr",
        "type": "1:n",
        "referentialIntegrity": true,
        "onDelete": "RESTRICT"
      }
    ],
    "layout": [
      { "id": "node_t_buecher", "tableId": "t_buecher", "x": 50, "y": 50 },
      { "id": "node_t_kategorie", "tableId": "t_kategorie", "x": 370, "y": 50 }
    ],
    "queries": [],
    "forms": [],
    "reports": [],
    "backendConfig": {
      "language": "tauri",
      "dbType": "SQLite",
      "projectName": "bibliothek3"
    }
  }
}
```

### Was passiert beim Import in DB Studio Pro?
1. **ER-Diagramm sofort sichtbar:** Die Tabellen erscheinen sofort als visualisierte Nodes auf der Arbeitsfläche mit allen Spalten und Primärschlüsseln.
2. **Beziehungslinien verknüpft:** Die Beziehungslinien (1:n) zwischen Fremd- und Primärschlüsseln sind bereits gezogen.
3. **Echte Daten vorhanden:** Wenn Sie eine Tabelle anklicken, sehen Sie sofort die importierten Datensätze.
4. **Sofort einsatzbereit für No-Code:** Sie können sofort Formulare, Dashboards, Berichte und Abfragen über den No-Code Designer von DB Studio Pro aufbauen.

---

## 5. Schritt-für-Schritt Anleitung: Microsoft Access zu DB Studio Pro

So wandeln Sie eine bestehende Access-Datenbank (`.accdb` oder `.mdb`) in wenigen Sekunden in ein modernes DB Studio Pro Projekt um:

```
 ┌─────────────────────────┐
 │ 1. Access-Datei ablegen │  ➔ Ziehen Sie z. B. 'bibliothek3.accdb' per Drag & Drop in die Bridge
 └───────────┬─────────────┘
             │
 ┌───────────▼─────────────┐
 │ 2. Live-Analyse prüfen  │  ➔ Die Bridge analysiert Tabellen, Datentypen und Zeilenzahlen
 └───────────┬─────────────┘
             │
 ┌───────────▼─────────────┐
 │ 3. .dbsp herunterladen  │  ➔ Klicken Sie auf den Button '📦 .dbsp Projektdatei herunterladen'
 └───────────┬─────────────┘
             │
 ┌───────────▼─────────────┐
 │ 4. In DB Studio öffnen  │  ➔ Öffnen Sie DB Studio Pro und laden Sie die .dbsp-Datei hoch
 └─────────────────────────┘
```

**Ergebnis:** Ihr gesamtes Access-Projekt ist modernisiert, bereinigt und steht in DB Studio Pro zur weiteren visuellen Entwicklung bereit!

---

## 6. Netzwerk & Kommunikationswege

Die Bridge unterstützt drei nahtlose Verbindungsmodi:

1. **Localhost (Standard):**
   * URL: `http://127.0.0.1:5050`
   * DB Studio Pro sendet den Sicherheits-Header `X-Bridge-Token: <Ihr-Token>`.
   * Höchste Geschwindigkeit und direkte Hardware-Kompilierung.
2. **WebSocket Live-Stream:**
   * URL: `ws://127.0.0.1:5050/logs`
   * Überträgt Build-Fortschritte, Konsolen-Meldungen und Datei-Änderungen in Echtzeit.
3. **PHP Remote Relay Gateway:**
   * URL: `https://ihredomain.de/api/bridge_relay.php`
   * Ermöglicht ortsunabhängige Steuerung über Firewalls hinweg via HTTPS-Tunneling.

---

## 7. Vollständige Endpunkt-Übersicht

```
┌──────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ HTTP-Methode & Pfad                  │ Funktion & Beschreibung                                │
├──────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ GET  /api/status                     │ Systemgesundheit, aktive Prozesse, Ports, Runtimes     │
│ GET  /api/settings                   │ Bridge-Einstellungen abrufen                           │
│ POST /api/settings                   │ Bridge-Einstellungen speichern                         │
│ POST /api/deploy                     │ Projekt-Payload aus DB Studio Pro empfangen & starten  │
│ POST /api/process/action             │ Prozess starten, stoppen oder neustarten               │
│ GET  /api/projects                   │ Liste aller lokalen Projekte im Workspace              │
│ POST /api/projects/build-package     │ Native Desktop-Installer (Tauri, Electron, .NET) bauen │
│ POST /api/projects/launch-package    │ Kompilierten Installer direkt starten                 │
│ POST /api/packages/install           │ NPM- / NuGet-Paket installieren                        │
│ POST /api/packages/uninstall         │ Paket deinstallieren                                   │
│ POST /api/packages/update            │ Paket aktualisieren                                    │
│ POST /api/packages/restore-all       │ Alle Projektabhängigkeiten wiederherstellen            │
│ POST /api/dependencies/relink        │ Symlink-Relinking ausführen (Speicherplatz sparen)     │
│ POST /api/git/test-connection        │ GitHub / GitLab Zugangsdaten prüfen                    │
│ POST /api/git/create-repo            │ Neues Remote-Repository anlegen                        │
│ POST /api/git/push                   │ Code committen und pushen                              │
│ POST /api/ftp/test                   │ FTP / SFTP Serververbindung testen                     │
│ POST /api/ftp/detect-files           │ Kompilierte Upload-Dateien erkennen                    │
│ POST /api/ftp/upload                 │ Build-Dateien auf den Webserver übertragen             │
│ GET  /api/relay/script               │ bridge_relay.php Datei herunterladen                   │
│ POST /api/relay/save-to-downloads   │ bridge_relay.php im Downloads-Ordner ablegen & Explorer│
│ POST /api/relay/test                 │ Relay-Verbindung testen inkl. Live-Heartbeat           │
│ GET  /api/system/autostart           │ Windows Autostart Status prüfen                        │
│ POST /api/system/autostart/toggle    │ Windows Autostart aktivieren / deaktivieren            │
│ POST /api/database/find              │ Nach .db / .sqlite Dateien suchen                      │
│ POST /api/database/inspect           │ SQLite-Tabellenschemata auslesen                       │
│ POST /api/database/query             │ SQL-Abfragen gegen lokale Datenbanken ausführen        │
│ POST /api/docker/compose/generate    │ docker-compose.yml aus Presets erzeugen                │
│ POST /api/docker/compose/action      │ Docker Container starten (up -d) oder stoppen (down)   │
│ POST /api/migration/access/upload    │ .accdb / .mdb Datei empfangen                          │
│ POST /api/migration/access/inspect   │ Access-Schema, Tabellen und Abfragen auslesen          │
│ POST /api/migration/access/transpile │ Access-Schema nach PostgreSQL/MySQL/SQLite übersetzen  │
│ POST /api/migration/access/export-dbsp│ Native .dbsp Projektdatei für DB Studio Pro erzeugen  │
│ POST /api/migration/sync/preview     │ Topologische Einfügereihenfolge berechnen              │
│ POST /api/migration/sync/export-dump │ Vollständigen SQL Data-Dump (.sql) generieren          │
│ POST /api/migration/sync/start-sqlite│ Daten direkt in lokale SQLite-Datei (.db) schreiben    │
│ GET  /api-docs                       │ Interaktive Swagger OpenAPI Dokumentation              │
│ WS   /logs                           │ Echtzeit WebSocket-Stream für Logs und Ereignisse      │
└──────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

*DB Studio Local Bridge – Das native Fundament für moderne No-Code & Full-Stack Entwicklung.*
