# DB Studio Pro – Systemarchitektur & Backend-Integrations-Roadmap

Dieses Dokument dient als detaillierte Referenz für **Antigravity** (oder zukünftige Entwickler-Agenten), um den aktuellen Zustand der Anwendung zu verstehen und zu wissen, welche Module und Datenflüsse noch an ein produktionsreifes Cloud-Backend angebunden werden müssen.

---

## 🏗️ 1. Derzeitige Systemarchitektur (Bestandsaufnahme)

DB Studio Pro ist als hochgradig interaktiver, relationaler Schema-Designer und Prototyping-Workspace konzipiert. Es vereint Werkzeuge zur Datenbankmodellierung (ERD), Aufgabenverwaltung (Kanban-Tickets), Teamarbeit (Chat & Cursors) und Integrationssteuerung (Externe APIs, Server Driven UI).

### 📂 Projektverzeichnis & Dateistruktur

*   **`/components`**: Wiederverwendbare Oberflächen-Komponenten des Studios (z. B. `AppHeader`, `Ribbon`, `Sidebar`, `ChatPanel`, `TicketBoard`).
*   **`/features`**: Eigenständige Werkzeuge und Detailbereiche, wie:
    *   `/features/projects/components/SQLiteManager.tsx` (Schema-Übersetzer in SQL-Skripte).
    *   `/features/pages/CustomComponentDesigner.tsx` (SDUI Code-Builder & JSON-Validierer).
    *   `/features/tools/VersionControlView.tsx` (Git-Simulation).
*   **`/hooks`**:
    *   `useAppController.ts`: Zentraler Orchestrator. Simuliert Backend-Antworten, Auto-Saves und automatisierte Trigger (z. B. simulierte Chat-Reaktionen bei Schema-Änderungen).
    *   `useChatState.ts` & `useTicketState.ts`: Verwalten die clientseitigen States für Kollaborations-Module.
*   **`/services`**:
    *   `chatStorageService.ts` & `ticketStorageService.ts`: Clientseitige Persistenz-Schnittstellen (LocalStorage / IndexedDB).
*   **`/stores`**:
    *   `useProjectStore.ts` (Zustand von Tabellen, Spalten/Feldern, Relationen, Queries).
    *   `useUIStore.ts` (Globale Theme- und Layout-Einstellungen).
*   **`server.ts`**: Ein schlankes, funktionales Express-Backend (Port 3000), welches statische Assets ausliefert, externe APIs proxiet/cached und AI-Refactoring anbietet.

---

## 💻 2. Vorhandene Features & Datenflüsse (Frontend / Local State)

### A. Navigation & Benachrichtigungssystem (Zuletzt optimiert)
*   **Reihenfolge der Tabs im Ribbon-Menü** (`components/Ribbon.tsx`):
    1.  **Erstellen** (Tabellendesigner & Schema-Modellierung)
    2.  **Externe Daten** (API-Schnittstellen Option A/B)
    3.  **Pages & SDUI** (Server-Driven UI-Komponentendesigner)
    4.  **Projekte** (Projektverwaltung & DB-Typen)
    5.  **Bereitstellung & Generator** (Deployment-Schnittstellen)
*   **Badge-Benachrichtigungen** (`components/AppHeader.tsx` & `components/ChatPanel.tsx`):
    *   Der Header-Button **"Chat & Tickets"** besitzt ein rotes, dynamisches Badge, welches die Summe aus **ungelesenen Chat-Nachrichten** und **aktiven (Todo) Tickets** anzeigt.
    *   In den Unter-Tabs des `ChatPanel` signalisiert ein rotes Badge im **"Team Chat"-Tab** die Anzahl ungelesener Nachrichten. Ein blaues Badge im **"Tickets"-Tab** zeigt die Anzahl offener Aufgaben an.
    *   Die störenden modalen Toasts bei jeder eintreffenden Chatnachricht wurden zugunsten der dezenten Badges deaktiviert, um den Arbeitsfluss nicht zu stören.

### B. Das Express-Backend (`server.ts`)
Das Backend implementiert wichtige Proxy- und AI-Schnittstellen:
1.  **API Manager & Caching (Option A & B)**:
    *   **Option A (Live-Proxy)**: Leitet API-Aufrufe direkt an externe Dienste weiter, um CORS-Restriktionen zu umgehen.
    *   **Option B (Server-Cache)**: Ruft externe JSON- oder XML-Schnittstellen (z. B. SharePoint-Feeds) auf, parst diese serverseitig in ein standardisiertes JSON und speichert sie im lokalen Ordner `/data`. Ermöglicht manuelles Editieren des Caches direkt über das Backend (`PUT /api/backend-apis/:name/data`).
    *   **Auth-Support**: Unterstützt API-Keys (Header/Query), Bearer Tokens und Basic Auth.
2.  **AI Refactoring-Schnittstelle**:
    *   `/api/refactor` bündelt Prompt und Datei-Kontext und kommuniziert über das `@google/genai` SDK mit dem Modell `gemini-3.5-flash` unter Nutzung des `GEMINI_API_KEY`.
3.  **Backup-Manager**:
    *   `/api/backup/download` generiert on-the-fly validierte JSON-Projektbackups zum Herunterladen.

---

## ☁️ 3. Roadmap zur Backend-Anbindung (Durable Cloud / Production-Ready)

Um die Anwendung von einer lokalen Offline-First-Umgebung in eine echte mandantenfähige Team-Cloud zu überführen, müssen die folgenden Module an ein stabiles Cloud-Backend angebunden werden:

### A. Authentifizierung & Mandantenfähigkeit (Multi-Tenant Auth)
*   **Ist-Zustand**: Derzeit gibt es keine Benutzerkonten oder Rechtegruppen. Projektbearbeitung steht jedem offen, der die App aufruft.
*   **Backend-Soll**:
    *   Einrichtung von **Firebase Auth** oder eines JWT-basierten Auth-Services im Express-Backend.
    *   Einführung von **Rollen (RBAC)**: Admin (Schema-Änderung), Developer (Page Designer), Viewer (Nur Lesen).
    *   Zuweisung einer `project_id` und `user_id` zu jedem Datenbankeintrag, um Daten strikt auf Mandantenebene zu trennen.

### B. Datenbank-Persistenz (Migration von LocalStorage zu Firestore / PostgreSQL)
*   **Projekt-Metadaten**:
    *   *Speicherort heute*: `useProjectStore` (LocalStorage / JSON-Dateiexport).
    *   *Soll-Zustand*: Abbildung über eine relationale Struktur (`sys_projects`, `sys_tables`, `sys_fields`, `sys_relationships` – siehe ToDo-Schema) in **Cloud SQL (PostgreSQL)** oder **Firebase Firestore**.
*   **Team Chat & Tickets**:
    *   *Speicherort heute*: Chat im LocalStorage (`chatStorageService`), Tickets in der IndexedDB des Browsers (`ticketStorageService`).
    *   *Soll-Zustand*: Migration auf eine Echtzeit-Datenbank. Firebase Firestore eignet sich perfekt für Chat-Logs und das Kanban-Board, da Updates über Live-Listener sofort an alle Clients übertragen werden.

### C. Echtzeit-Kollaboration (Live Multiplayer)
*   **Ist-Zustand**: Die Cursorbewegungen und Aktivitätsindikatoren anderer Teammitglieder werden lokal per Intervalle und Timeouts in `CollaboratorCursors.tsx` simuliert.
*   **Backend-Soll**:
    *   Integration eines **Websocket-Servers** (z. B. Socket.io auf dem Express-Backend) oder **Firestore-Listeners**.
    *   Übertragung von Cursor-Koordinaten, Auswahlelementen und Sperrungen von aktiven Tabellen ("Editing Lock"), um Datenüberschreibungen im Team zu verhindern.

### D. Versionsverwaltung & Git-Integration (Git-Engine)
*   **Ist-Zustand**: Die Versionskontrolle (Branch erstellen, Commit, Push, Pull, Merge Requests) in `VersionControlView.tsx` ist vollständig im UI-State modelliert und simuliert den Git-Baum im Arbeitsspeicher.
*   **Backend-Soll**:
    *   Anbindung an die echten **GitHub / GitLab REST APIs** über OAuth-Credentials.
    *   Implementierung eines Backends-Proxys, der bei einem "Commit & Push" das generierte SQLite-Schema (oder JSON-Schema) in ein echtes Git-Repository committet.
    *   Webhooks zur Synchronisation bei externen Commits.

### E. Sicherheits- & Secrets-Härtung
*   **Ist-Zustand**: Sensible Drittanbieter-Schlüssel (z. B. für externe APIs in `backend_api_configs.json` oder der `GEMINI_API_KEY` in der Umgebung) liegen im Klartext vor. Die Endpunkte sind ungeschützt.
*   **Backend-Soll**:
    *   Alle APIs müssen durch Auth-Middlewares (JWT-Check) geschützt sein.
    *   Externe API-Schlüssel der Nutzer müssen verschlüsselt in der Cloud-Datenbank (z. B. mittels KMS oder AES-256) abgelegt werden.

---

*Dieses Dokument dient als Blaupause für die Skalierung der Plattform. Alle strukturellen Voraussetzungen (wie saubere Trennung der Module in Unterordner, einheitliche Typen-Definitionen und voneinander isolierte Hooks) sind im Frontend bereits implementiert.*
