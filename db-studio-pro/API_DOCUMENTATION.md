# 📖 DB Studio Pro - API & Storage Dokumentation

Diese Dokumentation beschreibt die Schnittstellenarchitektur, die Speicher-Engines sowie die standardisierten API-Endpunkte für die Anbindung an diverse relationale Datenbanksysteme (MySQL, PostgreSQL, MSSQL, SQLite) und Backend-Frameworks (.NET 10, Node.js/Express, PHP/Laravel, Python/FastAPI).

---

## 1. Primäre Speicher-Engine: IndexedDB (Browser-Persistenz)

Als **Standard- und Prioritätsdatenbank** fungiert **IndexedDB**. Dadurch arbeitet die gesamte Applikation 100% autark, offline-fähig und persistent im Browser des Anwenders.

### IndexedDB Schema (`DBStudioProDB`, Version 3)
* **`projects_meta`** (KeyPath: `id`): Metadaten für Schnellansichten und die DB Studio Startseite.
  ```typescript
  interface ProjectMetadata {
    id: string;             // UUID
    name: string;           // z.B. "Kundenverwaltung.dbsp"
    lastModified: number;   // Timestamp (Unix ms)
    isCloud?: boolean;
    owner?: string;
    dbType?: 'SQLite' | 'SQL' | 'MySQL' | 'PostgreSQL' | 'NoSQL';
    language?: 'csharp' | 'typescript' | 'php' | 'python';
  }
  ```
* **`projects_data`** (KeyPath: `projectId`): Vollständiges relationales Schema inklusive Tabellendefinitionen, Feldern, Datensätzen, Relationen, Formularen, Berichten und Workflows.
  ```typescript
  interface ProjectPayload {
    projectId: string;
    data: {
      tables: Table[];
      relationships: Relationship[];
      queries: Query[];
      forms: Form[];
      reports: Report[];
      charts: Chart[];
      workflows: Workflow[];
      records: Record<string, any[]>; // Tabellen-Datensätze: tableId -> rows
      backendConfig: BackendConfig;
    };
  }
  ```

### Storage-Service API (`/services/storageService.ts`)
* `saveProjectToStorage(project: Project): Promise<void>` - Sichert Projekt und Datensätze in IndexedDB.
* `getAllProjects(): Promise<Project[]>` - Lädt alle verfügbaren Datenbanken für die Startseite.
* `getProjectById(id: string): Promise<Project | undefined>` - Lädt vollständige Schemata & Records.
* `deleteProjectFromStorage(id: string): Promise<void>` - Löscht die Datenbank vollständig aus IndexedDB.

---

## 2. Einheitliche RDBMS-Abstraktionsschicht

Die Schemadefinitionen und Datentypen sind abstrahiert aufgebaut, sodass ein Wechsel von **IndexedDB** zu **MySQL**, **PostgreSQL** oder **MSSQL** ohne Umbau der UI-Komponenten möglich ist.

### Datentyp-Mapping

| DB Studio Typ | IndexedDB / JS | SQLite | MySQL / MariaDB | PostgreSQL | MS SQL Server |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `INTEGER` | `number` | `INTEGER` | `INT` | `INTEGER` | `INT` |
| `VARCHAR` | `string` | `TEXT` | `VARCHAR(255)` | `VARCHAR(255)` | `NVARCHAR(255)` |
| `TEXT` | `string` | `TEXT` | `LONGTEXT` | `TEXT` | `NVARCHAR(MAX)` |
| `DECIMAL` | `number` | `NUMERIC` | `DECIMAL(18,2)` | `NUMERIC(18,2)` | `DECIMAL(18,2)` |
| `BOOLEAN` | `boolean` | `INTEGER` (0/1) | `TINYINT(1)` | `BOOLEAN` | `BIT` |
| `DATETIME` | `string (ISO)` | `TEXT` | `DATETIME` | `TIMESTAMP` | `DATETIME2` |
| `UUID` | `string` | `TEXT` | `CHAR(36)` | `UUID` | `UNIQUEIDENTIFIER` |

---

## 3. Standardisierte REST-Backend Schnittstellen

Für externe Backends können die generierten Controller und ORM-Modelle direkt über folgende REST-Routen angesprochen werden:

### 3.1 Projekt- und Schemamanagement
* **`GET /api/projects`**
  * Liefert Liste aller Datenbankprojekte mit Metadaten.
* **`GET /api/projects/:id`**
  * Lädt das vollständige Schema und die Datensätze.
* **`POST /api/projects`**
  * Erstellt oder aktualisiert ein Projekt.
* **`DELETE /api/projects/:id`**
  * Entfernt ein Projekt aus dem Server-Speicher.

### 3.2 Generische Tabellen-CRUD-Endpunkte (Entity API)
Für jede Tabelle (z. B. `Kunden`) generiert das Backend typisierte CRUD-Routen:

* **`GET /api/data/:tableName`**
  * Query-Parameter: `?page=1&limit=50&sort=ID&order=asc&search=Müller`
  * Response: `{ items: [...], totalCount: 142, page: 1 }`
* **`GET /api/data/:tableName/:id`**
  * Liefert Einzeldatensatz anhand des Primärschlüssels.
* **`POST /api/data/:tableName`**
  * Erstellt einen neuen Datensatz (inklusive Validierung & AutoWert).
  * Payload: `{ Name: "Musterfirma GmbH", Ort: "Berlin", Umsatz: 45000 }`
* **`PUT /api/data/:tableName/:id`**
  * Aktualisiert den angegebenen Datensatz.
* **`DELETE /api/data/:tableName/:id`**
  * Löscht den Datensatz unter Berücksichtigung von Fremdschlüssel-Kaskaden.

### 3.3 Abfragen & SQL-Ausführung (Query Engine)
* **`POST /api/query/execute`**
  * Führt parametrisierte Abfragen oder dynamische SQL-Statements sicher aus.
  * Payload:
    ```json
    {
      "sql": "SELECT Kunden.Name, Aufträge.Betrag FROM Kunden INNER JOIN Aufträge ON Kunden.ID = Aufträge.KundenID WHERE Aufträge.Status = @status",
      "parameters": {
        "status": "Offen"
      }
    }
    ```

---

## 4. Unterstützte Backend-Code-Generatoren

1. **C# / .NET 10 (ASP.NET Core Web API)**
   * Entity Framework Core 10 DbContext & Models
   * Fluent API Konfiguration für Primär- und Fremdschlüssel
   * Async Controller mit Swagger / OpenAPI Dokumentation
2. **TypeScript / Node.js (Express + Prisma / Drizzle ORM)**
   * Typsichere Schema-Deklarationen
   * Zod-Validierungspipelines
3. **PHP / Laravel 11**
   * Eloquent Models & Migration Scripts
   * Resource Controller & Form Requests
4. **Python / FastAPI + SQLAlchemy 2.0**
   * Pydantic V2 Schemas & Async Session CRUD Endpoints

---

## 5. Offline-Synchronisation & Wechsel zwischen Engines

Im Menü **Datei -> Optionen** oder über das UI-Setting `config.storage` kann nahtlos zwischen:
* **`local` (IndexedDB)**: Maximale Geschwindigkeit und autarkes Arbeiten.
* **`server` (Remote REST API)**: Zentralisierte Multi-User Kollaboration.

umgeschaltet werden. Bei einem Fehlschlagen der Server-Verbindung greift die Applikation transparent auf die lokale IndexedDB zurück.
