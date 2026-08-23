# DB Studio Pro - API & Datenbank-Spezifikation (IndexedDB / SQL / MySQL)

Diese Spezifikation beschreibt die Architektur der Datenhaltung von **DB Studio Pro**. Um maximale Zuverlässigkeit, Offline-Fähigkeit und Performance im Browser zu gewährleisten, hat **IndexedDB** oberste Priorität. Gleichzeitig sind die Datenmodelle und Schnittstellen so konzipiert, dass ein Wechsel zu relationalen Server-Datenbanken (z. B. PostgreSQL, MySQL, SQLite) oder die Synchronisation mit diversen Backends ohne aufwendiges Refactoring möglich ist.

---

## 1. Datenbank-Architektur & Priorisierung

### Primärer Speicher (Client-Side): **IndexedDB**
- **Warum IndexedDB?** Bietet asynchronen, transaktionalen Speicher im Browser für große Datenmengen und ist unempfindlich gegenüber Browser-Cache-Purges (im Gegensatz zu `localStorage`).
- **Abstraktionsschicht:** Der Zugriff erfolgt über ein einheitliches Repository-Muster (`storageService`), welches im Hintergrund IndexedDB anspricht.
- **Transaktions-Sicherheit:** Alle Operationen werden transaktionsbasiert ausgeführt, um Datenkorruption bei plötzlichen Verbindungsabbrüchen zu verhindern.

### Sekundärer/Server-Speicher (SQL, MySQL, etc.)
- Das Datenbankschema in IndexedDB spiegelt eine relationale Struktur wider (normalisierte Tabellen, Fremdschlüssel-Beziehungen).
- APIs und Repositories nutzen asynchrone Schnittstellen (Promises), um nahtlos durch API-Calls (REST/GraphQL) an ein relationales MySQL/PostgreSQL-Backend ausgetauscht werden zu können.

---

## 2. IndexedDB Schema-Definition (Object Stores)

Die IndexedDB nutzt folgende Object Stores unter der Datenbank `db_studio_pro_db`:

### Store: `projects`
Speichert die kompletten Metadaten des relationalen Modellierungsprojekts.

| Key (Path) | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` (KeyPath) | `string` (UUID) | Eindeutige Projekt-ID |
| `name` | `string` | Projektname (z. B. "Kundenverwaltung") |
| `lastModified` | `number` | Letzter Änderungszeitstempel (UTC Epoch) |
| `data` | `object` | Das komplette relationale Schema (siehe unten) |

#### Struktur des `data`-Objekts:
- `tables`: Array aller definierten Tabellen (mit Spalten, Primärschlüsseln, Indizes).
- `relationships`: Definitionen aller Foreign Key-Beziehungen (Tabelle A verweist auf Tabelle B).
- `queries`: Gespeicherte relationale Abfragen (z. B. SELECT-Queries mit Joins).
- `forms`: Formulardefinitionen und UI-Layouts für Dateneingabe.
- `reports`: Strukturierte Berichte und Dashboard-Widgets.
- `workflows`: Automatisierungs-Workflows (Trigger, Conditions, Actions).

---

## 3. Generische API-Schnittstellen (CRUD & Synchronisation)

Alle Service-Methoden geben standardmäßig `Promise<T>` zurück, damit die Benutzeroberfläche nicht blockiert und ein Austausch der lokalen IndexedDB-Logik durch Server-APIs (Fetch/Axios) transparent bleibt.

### 3.1 Projekt-Verwaltung

#### `GET /api/projects` (bzw. `storageService.getAllProjects()`)
Ruft alle vorhandenen Projekte ab.
- **Rückgabe:** `Promise<Project[]>`

#### `GET /api/projects/:id` (bzw. `storageService.getProjectById(id)`)
Lädt ein spezifisches Projekt anhand seiner ID.
- **Rückgabe:** `Promise<Project | null>`

#### `POST /api/projects` (bzw. `storageService.saveProject(project)`)
Erstellt oder aktualisiert ein Projekt.
- **Request-Body:** `Project` (JSON)
- **Rückgabe:** `Promise<void>`

#### `DELETE /api/projects/:id` (bzw. `storageService.deleteProject(id)`)
Löscht ein Projekt inklusive all seiner Tabellen-Strukturen.
- **Rückgabe:** `Promise<void>`

---

## 4. Daten-Schnittstellen für dynamische Tabellen (Mock & Live-Data)

Für jede im System entworfene Tabelle (z. B. `Customers`, `Orders`) stellt das System dynamische Datenschnittstellen bereit.

### 4.1 Datensätze abrufen
#### `GET /api/data/:tableId`
- **Option A (Offline/IndexedDB):** Holt die Daten direkt aus dem `data`-Array der Tabelle in der lokalen IndexedDB.
- **Option B (Server/SQL):** Entspricht `SELECT * FROM [TableName]`.
- **Rückgabe:** `Promise<Record<string, any>[]>`

### 4.2 Datensatz erstellen
#### `POST /api/data/:tableId`
- **IndexedDB:** Fügt ein neues Objekt in das Zeilen-Array hinzu. Generiert bei Bedarf auto-inkrementierende IDs.
- **SQL/MySQL:** Führt `INSERT INTO [TableName] (...) VALUES (...)` aus.
- **Request-Body:** `Record<string, any>` (Die neuen Spaltenwerte)
- **Rückgabe:** `Promise<Record<string, any>>` (Inklusive generierter ID)

### 4.3 Datensatz aktualisieren
#### `PUT /api/data/:tableId/:rowId`
- **IndexedDB:** Aktualisiert das entsprechende Objekt im Array.
- **SQL/MySQL:** Führt `UPDATE [TableName] SET ... WHERE Id = [rowId]` aus.
- **Request-Body:** `Partial<Record<string, any>>`
- **Rückgabe:** `Promise<Record<string, any>>`

### 4.4 Datensatz löschen
#### `DELETE /api/data/:tableId/:rowId`
- **IndexedDB:** Entfernt das Objekt mit der passenden ID aus dem Array.
- **SQL/MySQL:** Führt `DELETE FROM [TableName] WHERE Id = [rowId]` aus.
- **Rückgabe:** `Promise<boolean>`

---

## 5. Vorbereitung für SQL- und MySQL-Migration (Multi-Backend)

Um die Migration von der lokalen IndexedDB zu einem echten SQL- oder MySQL-Server-Backend so nahtlos wie möglich zu gestalten, wurden folgende Vorkehrungen getroffen:

1. **Relationale Datenmodellierung:** Tabellen im UI sind streng typisiert (VARCHAR, INTEGER, BOOLEAN, DATE, etc.). Das Datenmodell erzwingt Primärschlüssel und referenzielle Integrität per Foreign Key-Konfigurationen.
2. **Generischer Abfrage-Builder:** Der in der App integrierte Query-Designer generiert standardmäßigen SQL-Syntax (ANSI-SQL), welcher direkt auf PostgreSQL, MySQL oder SQLite ausgeführt werden kann.
3. **Repository-Kapselung:** Das UI spricht niemals direkt mit der IndexedDB-Instanz, sondern konsumiert ausschließlich den `useProjectStore` oder den `storageService`. Wenn Sie zu einer relationalen Datenbank migrieren, müssen Sie lediglich die Implementierung des `storageService` austauschen, während das Frontend völlig unangetastet bleibt.
4. **Referenzielle Integrität bei Feldlöschung:**
   - Sobald ein Tabellenfeld über den Designer gelöscht wird, bereinigt das System automatisch alle betroffenen Fremdschlüssel-Beziehungen, Formularelemente, Abfrage-Spalten und Workflow-Knoten.
   - Dies verhindert verwaiste Foreign Keys auf Server-Ebene, die bei echten SQL-Datenbanken zu schweren Integritätsverletzungen (`FOREIGN KEY constraint failed`) führen würden.

---

## 6. Interaktive Drag & Drop- / Kanban-Schnittstelle (Updatefähigkeit)

Für die Verwaltung von Status- und Positionierungsänderungen via Drag & Drop (z. B. auf Kanban-Boards) stellt das generierte Frontend eine hoch-performante, ereignisgesteuerte Update-Schnittstelle bereit.

### 6.1 Status-Aktualisierung bei Spaltenwechsel (Container Move)
Wenn ein Element (z. B. ein Task oder Ticket) von einem Container/Status in einen anderen gezogen wird, löst das System automatisch ein Update-Ereignis aus.

#### Client-seitiger Ablauf (Angular / Vue / React):
1. **Event Capture:** Das `drop`-Event ermittelt die ID des gezogenen Elements (`activeDragItem`) und den Ziel-Container (`targetColumn`).
2. **Local Sync:** Der Statuswert des Elements wird im lokalen Speicher (IndexedDB) aktualisiert.
3. **API Dispatch:** Ein asynchroner Aufruf wird an das Speicher-Repository gesendet, um die Änderung dauerhaft zu persistieren:
   - **IndexedDB:** `mauiIndexedDb.update(tableName, id, updatedRecord)`
   - **SQL-Server (über API):** `PUT /api/data/:tableId/:rowId` mit `{ status: targetColumn }`
4. **User Feedback:** Eine reaktive Notification-Bar zeigt dem Benutzer den genauen Zustand an ("Erfolgreich verschoben: 'Aufgabe A' von 'Offen' nach 'In Arbeit'"). Bei einem Netzwerk- oder Schreibfehler wird der Zustand automatisch auf den alten Spaltenwert zurückgesetzt (Rollback-Integrität).

### 6.2 Reihenfolge-Aktualisierung (Reordering im selben Container)
Beim Verschieben eines Elements innerhalb desselben Containers zur Änderung der Priorität oder Reihenfolge:
- **Index-Mapping:** Das System berechnet das neue Positions-Attribut (z. B. `position` oder `sort_order`).
- **Batch-Update:** Die betroffenen Zeilen werden lokal umsortiert und per Sammel-Update (Batch) aktualisiert, um übermäßige DB-Zugriffe zu vermeiden.
- **Konsistenz:** Die Sortier-API `api.update` stellt sicher, dass die neue Reihenfolge sowohl in der lokalen IndexedDB als auch im SQL-Backend identisch abgelegt wird.

---

## 7. Externe Daten, Exporte, Backups & Server-Synchronisation

Um den nahtlosen Datenaustausch zwischen verschiedenen Datenquellen (Excel, Access XML, SQL, JSON, APIs) und dem generierten Backend zu regeln, stehen folgende API-Schnittstellen zur Verfügung.

### 7.1 Import- & Dateiformate

#### A. Excel-Format (.xlsx, .xls)
- **Parser:** Client-seitig via `xlsx` (SheetJS).
- **Ablauf:** Datei-Upload &rarr; Schema-Inferenz (Smart Type Inference) &rarr; SVERWEIS-Beziehungsvorschläge &rarr; Speichern in IndexedDB.

#### B. Access XML-Format (.xml)
- **Struktur:** MS Access XML dataroot Format.
- **Parser:** `DOMParser` im Browser. Extrahiert Tag-Namen als Spaltenbezeichner und Textinhalte als Werte.
- **Beispiel XML-Schema:**
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <dataroot xmlns:od="urn:schemas-microsoft-com:officedata">
    <Kunden>
      <KundenID>1</KundenID>
      <Name>Muster GmbH</Name>
      <Ort>Berlin</Ort>
    </Kunden>
  </dataroot>
  ```

#### C. SQL-Schema & Insert-Dumps (.sql)
- **Import:** Unterstützt DDL-Anweisungen (`CREATE TABLE [Name] ([Feld] [Typ], ...)`) und DML (`INSERT INTO [Name] (...) VALUES (...)`).
- **Export:** Generiert vollständig kompatible ANSI-SQL DDLs und INSERT-Skripte zur direkten Ausführung in PostgreSQL, MySQL oder SQLite.

#### D. JSON-Dateien (.json)
- **Import:** Erkennt Arrays von flachen oder verschachtelten Objekten mit automatischer Inferenz.
- **Export:** Gibt die vollständige Datensatzliste als strukturiertes JSON-Array aus.

### 7.2 Backend-API Schnittstellen (Multi-Source Express Server)

Für die Synchronisation und Bereitstellung von Daten über das generierte Express-Backend werden folgende Routen verwendet:

#### `GET /api/backend-apis`
Ruft alle registrierten API-Konfigurationen und Datenquellen ab.
- **Rückgabe:** `Promise<BackendApiConfig[]>`

#### `POST /api/backend-apis`
Registriert oder aktualisiert eine API-Schnittstelle.
- **Request-Body:**
  ```json
  {
    "name": "KundenSchnittstelle",
    "url": "https://api.example.com/customers",
    "method": "GET",
    "headers": "{\"Content-Type\": \"application/json\"}",
    "queryParams": [],
    "option": "B", // A = Live-Proxy, B = Server-Cache
    "refreshInterval": 3600, // Sync-Intervall in Sekunden
    "fields": [...],
    "data": [...] // Initiale Cachedaten für Option B
  }
  ```
- **Rückgabe:** `Promise<{ success: true, config: BackendApiConfig }>`

#### `DELETE /api/backend-apis/:name`
Löscht eine registrierte Schnittstelle und bereinigt den Server-Cache.
- **Rückgabe:** `Promise<{ success: true }>`

#### `POST /api/backend-apis/:name/refresh`
Triggert eine manuelle Server-seitige Aktualisierung der API-Cachedaten. Der Server holt die Daten live von der Quell-URL und speichert sie im lokalen Dateisystem (`data/api_cache_[name].json`).
- **Rückgabe:** `Promise<{ success: true, count: number, data: any[] }>`

#### `GET /api/backend-apis/:name/data`
Gibt die Daten der registrierten Schnittstelle zurück. Bei Option A erfolgt ein Live-Proxying; bei Option B werden die serverseitig gecachten JSON-Daten ausgeliefert.
- **Rückgabe:** `Promise<any[]>`

#### `PUT /api/backend-apis/:name/data`
Ermöglicht das direkte Editieren und Überschreiben des serverseitigen Daten-Caches. Ideal für manuelle Datenkorrekturen über das Externe Daten-Hub.
- **Request-Body:** `any[]` (Komplettes Datenarray)
- **Rückgabe:** `Promise<{ success: true, count: number }>`

### 7.3 Kalender-Datenbindung & Interaktions-API (`calendar_view`)

Die Kalender-Komponente (`calendar_view`) fungiert als dynamischer Datenschnitt über Tabellen (IndexedDB) oder relationale Abfragen (Queries). Sie bietet ein vollumfängliches bidirektionales Data-Binding (Lese- und Schreibrechte für verknüpfte Tabellen) und unterstützt hochauflösende, interaktive Stunden-Wochen- und Stunden-Tagesansichten.

#### A. JSON Schema & Konfigurationsparameter:
```json
{
  "title": "Mein Terminplaner",
  "dataSourceType": "table",      // "table" oder "query" (Datenbanktabelle oder SQL-Abfrage)
  "dataSourceId": "table-uuid",   // Referenzierte Tabellen- oder Abfrage-ID
  "startDateField": "date",       // Datumsspalte für den Start (z.B. "Datum", "date")
  "endDateField": "end_date",     // Optionale Datumsspalte für das Ende
  "startTimeField": "start_time", // Optionale Spalte für die Startzeit (z.B. "Uhrzeit", "zeit")
  "endTimeField": "end_time",     // Optionale Spalte für die Endzeit (z.B. "Endzeit")
  "titleField": "name",           // Spaltenzuordnung für den Termin-Titel
  "colorField": "category_color", // Optionale Spalte für Termin-Hintergrundfarben (Hex)
  "defaultView": "month",         // Standardansicht ("month", "week", "day", "agenda")
  "views": ["month", "week", "day", "agenda"]
}
```

#### B. Daten-Lese- und Mapping-Algorithmus (Smart Time Inference):
Die Datensätze werden über den `useProjectStore` geladen. Das System verfügt über eine robuste, fehlertolerante Spaltennamen-Erkennung (Case-Insensitive und Fallback-Suche):
1. **Titel-Extraktion:** `getNestedValueCaseInsensitive(row, titleField || 'name')`
2. **Startdatum:** `getNestedValueCaseInsensitive(row, startDateField || 'date')` (Fallbacks: `datum`, `erstellt_am`)
3. **Enddatum:** `getNestedValueCaseInsensitive(row, endDateField)` (Fallback: Startdatum)
4. **Startuhrzeit (Fallback-Erkennung):** Sucht nach `startTimeField` oder den Spalten: `uhrzeit`, `zeit`, `startzeit`, `time`.
5. **Enduhrzeit (Fallback-Erkennung):** Sucht nach `endTimeField` oder den Spalten: `endzeit`, `end_time`.
6. **Farbliche Markierung:** `getNestedValueCaseInsensitive(row, colorField || 'color') || '#4f46e5'`

#### C. Stundenbasierte Visualisierung & Interaktionen:
- **Wochen- & Tagesraster:** Stellt die Stunden von `07:00` bis `22:00` in einem präzisen CSS-Grid/Flex-Layout dar.
- **Ganztägige Einträge:** Termine ohne spezifisch erfasste Uhrzeiten werden übersichtlich im oberen Bereich unter "Ganztägig" zusammengefasst.
- **Echtzeit-Indikator:** Eine dynamische rote Zeitlinie visualisiert die aktuelle Uhrzeit im Tagesverlauf.
- **Eintrag Erstellen per Klick auf Zeitslot:** Beim Klick auf eine freie Stunde im Raster wird das Erstellungs-Modal geöffnet und füllt das Datum sowie das Zeitfeld automatisch mit dem ausgewählten Zeitslot aus (z. B. `14:00` Uhr).
- **CRUD-Vorgänge:** Vollwertige Create-, Update- und Delete-Modals schreiben Daten transaktional zurück in die lokale IndexedDB oder das SQL-Backend.

### 7.4 Projekt-Backup & Restore (Desaster Recovery)

#### `POST /api/backup/download`
Ermöglicht das Herunterladen eines vollständigen Relationalen-Schemas inkl. aller Daten, Queries und Layouts als komprimierte Sicherungsdatei.
- **Rückgabe:** JSON-Dateidownload

---

## 7.5 Client-seitige Offline-First Integration (IndexedDB-first API-Layer)

Im generierten React-Frontend (`src/services/api.ts`) ist eine hoch-performante, transaktionale **IndexedDB-Abstraktionsschicht** als primärer Datenbankspeicher integriert. Dies löst das Problem von Verbindungsabbrüchen, fehlenden Backend-Instanzen und `404 Not Found` Fehlern während der lokalen Entwicklung oder Ausführung im Browser.

### Funktionsweise & Datenfluss
1. **Automatisierte Initialisierung:**
   - Beim ersten Aufruf der Applikation im Browser wird eine IndexedDB-Datenbank namens `[Projektname]_db` angelegt.
   - Es werden automatisch **Object Stores** für alle im Datenmodell definierten Tabellen generiert. Jedes Object Store verwendet den exakten Primärschlüssel (z. B. `kundenId` oder `id`) der relationalen Tabelle als `keyPath`.
   
2. **Einheitliche CRUD-Schnittstelle:**
   - Die React-Seiten und benutzerdefinierten Komponenten (z. B. Kalender, Kanban, Listenansichten) kommunizieren unverändert über die Standard-Funktionen:
     - `get(endpoint, params)`
     - `post(endpoint, data)`
     - `put(endpoint, data)`
     - `remove(endpoint)`
   - Die Schnittstelle fängt die Pfade (z. B. `kunden`, `termin`, `termin/123`) ab und leitet sie direkt an die IndexedDB-Stores um.

3. **Unterstützung für Fortgeschrittene Features:**
   - **Paginierung:** Die `get`-Methode führt ein browserseitiges Slicing der Daten durch und gibt das standardisierte `PagedResponse<T>` Format zurück (`data`, `total`, `page`, `pageSize`, `totalPages`).
   - **Volltextsuche:** Parameter wie `?search=wert` filtern alle Datensätze lokal über alle Textfelder hinweg.
   - **Auto-Increment ID Generierung:** Beim Erstellen von neuen Datensätzen (`post`) ohne ID ermittelt die IndexedDB-Schicht den höchsten vorhandenen numerischen Schlüssel und inkrementiert diesen automatisch um `+1` (oder weicht auf einen zeitstempelbasierten Schlüssel aus), um Typkonflikte zu vermeiden.
   - **Lokale Benutzerauthentifizierung:** Der `loginUser`, `registerUser` und `changePassword` Flow wird lokal über ein `users` Object Store in IndexedDB abgebildet, wodurch die gesamte Anwendung out-of-the-box voll funktionsfähig und passwortgeschützt läuft.

4. **Zukunftssichere Backend-Migration (SQL/MySQL/PostgreSQL Ready):**
   - Da die UI-Komponenten ausschließlich mit den Abstraktionsfunktionen (`get`, `post`, `put`, `remove`) arbeiten, kann der lokale Speicher jederzeit durch ein REST- oder GraphQL-Backend ausgetauscht werden. Ein Umbau der Benutzeroberfläche ist hierfür **nicht** notwendig — es muss lediglich die Implementierung in `src/services/api.ts` angepasst werden.

5. **Fehlertolerante Case- & Trennzeichen-Mapping:**
   - Um maximale Kompatibilität mit verschiedenen Datenbanksystemen und Backend-Generatoren (wie Angular, Spring, Node) zu gewährleisten, ist die Schnittstelle vollkommen unempfindlich gegenüber unterschiedlichen Schreibweisen (`sys_users`, `sysUsers`, `sysusers`, `sys-users`). Ein zentraler Mapping-Algorithmus normalisiert und findet das passende IndexedDB-Store selbstständig.
   - **Automatisierte Daten-Seeding:** Beim ersten Anlegen der lokalen Datenbank werden alle initialen Datenbestände aus dem Projekt-Workspace automatisch eingepflegt. Dabei werden alle Feldnamen sowohl im Original-Format als auch im `camelCase`-Format abgelegt. Dies garantiert, dass Frontends, die auf unterschiedliche Casing-Varianten zugreifen, immer die korrekten Attributwerte erhalten.


### 7.6 Dynamische Datenbindung & Parameter-Filterung in generierten Custom-Pages (React & Angular)

Um die reaktive Datenanzeige und datenquellenübergreifende Filterung in den generierten Custom-Pages von **React** und **Angular** zu vereinheitlichen, nutzen beide Codegeneratoren ein standardisiertes, hierarchisches Context-Mapping. Dies stellt sicher, dass tief verschachtelte Layout-Strukturen (wie z. B. Cards innerhalb von Containers, die wiederum in List-Repeaters eingebettet sind) stets korrekte Datenbindungskontexte auflösen.

#### A. React-seitiges Context- & State-Mapping
Im generierten React-Code (`[PageName]Page.tsx`) werden für jeden Layout-Knoten mit Datenquellen-Anbindung (z. B. ein Datenquellen-gesteuerter Container oder ein List-Repeater) atomare States, Lade-Indikatoren und reaktive `useMemo`-Filter registriert:
1. **Zustand & Datenabruf:**
   - Ein primärer State `data_xxx` hält die ungefilterten Daten aus IndexedDB / API.
   - Ein `useEffect`-Hook lädt die Daten asynchron über die `get`-Methode beim Mounten.
2. **Reaktive URL-Filterung:**
   - Eine `useMemo`-Funktion `finalData_xxx` lauscht auf Änderungen von `data_xxx` und den Browser-`searchParams`.
   - Bei gesetzten Parametern (`filterParamField` und `filterParamName`) filtert der Code die Datensätze direkt im Client-Zustand.
3. **Kontext-Weitergabe:**
   - Ein Container-Knoten stellt das erste Element des gefilterten Arrays als Kontext-Zustand `containerContext_xxx` bereit.
   - Verschachtelte Text- oder Titelknoten greifen über die `compilePlaceholders`-Pipeline auf diesen hierarchischen Kontext zu.

#### B. Angular-seitiges Context- & State-Mapping
Im generierten Angular-Code (`[kebab-name]-custom.component.ts` & `.html`) wird die Datenbindung unter Ausnutzung der Angular Change Detection und lokaler Template-Variablen gelöst:
1. **Automatisierte Query-Parameter Erfassung:**
   - Jede Custom-Page abonniert standardmäßig in `ngOnInit` die aktiven URL-Query-Parameter:
     `this.route.queryParams.subscribe(params => { this.queryParams = params; });`
2. **Datenabruf via ApiService:**
   - Die Daten werden über die generische `api.getAll(url, page, limit)`-Methode des Service-Layers geladen und reaktiv im Klassenattribut abgelegt.
3. **Change-Detection-gesteuerte Getters (Filterung & Kontext):**
   - Ein Typ-sicherer Getter `get finalData_xxx(): any[]` wertet reaktiv die Query-Parameter-Filterung aus, sobald sich die URL ändert.
   - Ein Getter `get containerContext_xxx(): any` stellt das aktive Detail-Objekt bereit.
4. **HTML Template & Lokale Variablen:**
   - Für Repeater wird das native `*ngFor="let row_xxx of finalData_xxx"` verwendet.
   - Textknoten binden sich mittels Angular-Interpolation `{{ row_xxx?.['FeldName'] }}` direkt an die hierarchischen Kontexte oder fallen bei fehlendem Wert nahtlos auf die globalen `queryParams` zurück.


## 8. Active Directory & Enterprise Identity APIs (C# Web API & Frontend Integration)

Um Enterprise-Anwender nahtlos in Firmennetzwerken zu authentifizieren und Rollen basierend auf AD-Gruppen zuzuweisen, wurde eine strukturierte Active Directory (AD) Integration geschaffen.

### 8.1 API-Schnittstellen (AD Controller)

#### `GET /api/ad/me`
Ruft die detaillierten AD-Benutzerinformationen des aktuell angemeldeten Domänen-Benutzers ab.
- **Rückgabe:** `Promise<AdUserInfo>`
- **Response-Schema:**
  ```json
  {
    "username": "s.mueller",
    "displayName": "Stefan Müller",
    "email": "s.mueller@firma.local",
    "department": "IT Infrastructure",
    "groups": [
      "firma\\Domain Users",
      "firma\\digitaltool admin",
      "firma\\administratoren"
    ]
  }
  ```

#### `GET /api/ad/whoami`
Ermittelt einfache Claims-Informationen der aktuellen Web-Session.
- **Rückgabe:**
  ```json
  {
    "username": "Zubovic.Edin",
    "displayName": "Zubovic.Edin",
    "email": "zubovic.edin@firma.local",
    "userId": "zubovic.edin@firma.local",
    "isAuthenticated": true,
    "roles": ["Administrator", "Manager", "Developer", "User", "Guest"]
  }
  ```

#### `GET /api/ad/search?q=:query` (bzw. `?search=:query`)
Sucht Domänen-Benutzer nach Name, E-Mail oder SamAccountName im konfigurierten Verzeichnisdienst.
- **Parameter:** `q` oder `search` (Mindestens 2 Zeichen)
- **Rückgabe:** `Promise<AdUserInfo[]>` (Maximal 20 Ergebnisse)

---

### 8.2 Konfiguration (`appsettings.json`)
Die Active Directory-Anbindung, Standard-Domänen sowie Fallback-Rollen werden dynamisch über die `appsettings.json` parametrisiert:
```json
{
  "ActiveDirectory": {
    "DomainName": "firma.local",
    "DefaultEmailDomain": "firma.local",
    "Container": "DC=firma,DC=local",
    "ServiceAccountUsername": "",
    "ServiceAccountPassword": "",
    "DefaultRoles": ["Administrator", "Manager", "Developer", "User", "Guest"]
  }
}
```
*Hinweis: Domänen-Defaults (`DomainName`, `DefaultEmailDomain`) und Rollen (`DefaultRoles`) werden in `ActiveDirectoryController.cs`, `AdController.cs`, `ProjectsController.cs` und `AdRoleTransformer.cs` direkt aus der Configuration geladen.*

---

### 8.3 Claims Transformation & Rollen-Mapping (`AdRoleTransformer`)
Um AD-Sicherheitsgruppen auf Anwendungsrollen abzubilden, transformiert der `IClaimsTransformation`-Transformer eingehende Windows-Identitäten:
- `firma\digitaltool admin` &rarr; Rolle `Administrator`
- `firma\administratoren` &rarr; Rolle `Administrator`
- `firma\manager` &rarr; Rolle `Manager`
- `firma\coder` &rarr; Rolle `Manager`


### 8.4 Frontend-seitige automatische Sitzungssynchronisation (Zustand & UI-Mapping)

Um den Authentifizierungsprozess für Anwender in einer Domänenumgebung vollständig zu automatisieren, führt das React-Frontend beim Starten der Anwendung eine automatische Erkennung durch:

1. **Automatischer Authentifizierungs-Check:**
   - Beim Laden der Anwendung (`App.tsx`) wird über die `checkAdSession`-Aktion in `useAuthStore` der Status vom Endpoint `/api/ad/whoami` abgefragt.
   - Liefert der Endpoint `isAuthenticated: true` zurück, wird direkt das vollständige Benutzerprofil über `/api/ad/me` geladen.

2. **Automatisches Login-State Mapping:**
   - Aus den Active Directory-Daten wird dynamisch ein `User`-Objekt generiert, welches als aktiv im Store registriert wird:
     ```typescript
     {
       id: whoami.userId,
       name: adMe.displayName || adMe.username,
       email: adMe.email,
       role: whoami.roles?.includes('Administrator') ? 'admin' : 'user',
       isAuthenticated: true,
       isAdUser: true
     }
     ```

3. **Reaktives UI-Mapping:**
   - **Titelzeile (`AppHeader.tsx`):** Der traditionelle "Anmelden"-Button wird ausgeblendet. Stattdessen wird direkt der Benutzername und die E-Mail-Adresse des Domänen-Benutzers in einer gestapelten Ansicht mit einem markanten **AD**-Badge dargestellt.
   - **Team-Cloud Startseite (`DatabaseSelector.tsx`):** Das manuelle Anmeldeformular wird durch eine übersichtliche, benutzerfreundliche Status-Card ersetzt, die die aktive Verbindung zum Active Directory visualisiert. Der Benutzer hat sofort Zugriff auf seine Cloud-Projekte, ohne Anmeldeinformationen eingeben zu müssen.


## 9. Dynamische API-Umleitung (Selbstgehostetes Backend & Localhost)

Um eine nahtlose Kopplung mit einem externen, selbstgehosteten Backend (z. B. auf `http://localhost:5000`) zu ermöglichen und die Anzeige simulierter Dummy-Daten (z. B. `zuboedin@gmail.com`) zu umgehen, wurde ein intelligentes, globales API-Routing implementiert.

### 9.1 Die `getApiUrl`-Schnittstelle
Alle Frontend-Schnittstellen (Authentifizierung, Team-Mitglieder, Active Directory-Suche und Synchronisation) nutzen den globalen URL-Mapper `getApiUrl(path: string)`.

- **Funktionsweise:**
  - Der Mapper prüft den Zustand von `config.apiUrl` im persistenten `useConfigStore`.
  - Ist eine benutzerdefinierte Server-URL hinterlegt (z. B. `http://localhost:5000`), leitet das Frontend alle Anfragen direkt dorthin um, statt das lokale Mock-Backend auf Port `3000` aufzurufen.
  - Falls keine URL eingetragen ist, fällt das System automatisch auf das lokale Origin `/api` zurück.

- **Automatische Normalisierung:**
  - Verhindert doppelte Pfadsegmente (z. B. `/api/api/health` bei gesetztem `/api`-Suffix).
  - Ergänzt fehlende Protokoll-Deklarationen (`http://` oder `https://`) automatisch.

### 9.2 Verwendung im Code
```typescript
import { getApiUrl } from '../stores/useConfigStore';

// Beispiel für dynamische Umleitung
const res = await fetch(getApiUrl('/api/ad/whoami'));
```

### 9.3 Konfiguration & Live-Kopplung
1. Öffnen Sie die **Einstellungen & Synchronisation** (Sync-Reiter im Backend-Bereich).
2. Geben Sie unter **API Endpoint / Server URL** Ihre gewünschte Adresse ein (z. B. `http://localhost:5000`).
3. Nach dem Speichern lädt die Applikation alle AD-Profile, Berechtigungen und Team-Projekte direkt live von Ihrem angegebenen Server. Die lokalen Dummy-Daten (Zubeyr) werden vollständig ausgeblendet.

### 9.4 Cross-Origin Resource Sharing (CORS) & Credentials
Um eine reibungslose Entwicklung und Kopplung zu ermöglichen, unterstützt das generierte C#/.NET 10 Backend eine flexible CORS-Richtlinie:
- **Dynamisches Origin-Mapping (`SetIsOriginAllowed`):** Ermöglicht Anfragen von `http://localhost:3000` (Frontend-Port) sowie beliebigen Hostumgebungen.
- **Credential-Support (`AllowCredentials`):** Ermöglicht die sichere Übertragung von Cookies und Windows-Authentifizierungs-Metadaten (NTLM/Negotiate/Kerberos) bei Cross-Origin-Anfragen.
- **Sicherheits-Header:** Kompatibel mit der `strict-origin-when-cross-origin` Referrer-Richtlinie des Browsers.

```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", p => p
        .SetIsOriginAllowed(origin => true)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});
```

### 9.5 Neue C#/.NET 10 Backend-Schnittstellen für Team & LDAP-Kopplung
Um das selbstgehostete C#-Backend voll kompatibel mit den kollaborativen Funktionen des DB Studio Frontends zu machen, wurden folgende Schnittstellen nativ in den Code-Generator integriert:

1. **LDAP / Active Directory Status-Check (`api/auth/ldap-check`):**
   - **Method:** `GET`
   - **Controller:** `AuthController`
   - **Rückgabe:** Bestätigt die Erreichbarkeit und den Status der AD/LDAP-Konfiguration, um die nahtlose Windows-Authentifizierung im Client zu aktivieren.

2. **Team Cloud Projekt-Verwaltung (`api/team/projects`):**
   - **Methoden:** `GET`, `POST`, `DELETE`
   - **Controller:** `ProjectsController` (jetzt gemappt auf beide Routen `/api/Projects` und `/api/team/projects`)
   - **Mitgliederverwaltung:** Unterstützt das Hinzufügen (`POST /api/team/projects/{id}/members`) und Entfernen (`DELETE /api/team/projects/{id}/members/{memberId}`) von Projektbeteiligten sowie dynamische Owner-Zuweisung.


## 10. Realtime Team-Chat & SignalR Hub Schnittstellen

Um die kollaborative Entwicklung und Echtzeit-Synchronisation im Entwicklerteam zu unterstützen, beinhaltet das gehostete .NET 10 / C# Backend native REST- & SignalR-Schnittstellen.

### 10.1 REST API Endpoints (`ChatController`)

#### `GET /api/chat/messages` (Aliased as `/api/chats/messages`)
Ruft den vollständigen Chatverlauf ab. Der Verlaufs-Speicher kombiniert In-Memory Caching und Datenbank-Persistenz (`sys_chats`).
Das Feld `chatId` unterscheidet dabei zwischen öffentlichen **Team-Kanälen** (z.B. `default_chat`, `schema_updates`) und **Einzelchats (1:1 Direktnachrichten)** (z.B. `dm_sarah`, `dm_tom`).
- **Response-Schema:**
  ```json
  [
    {
      "id": "a1b2c3d4",
      "chatId": "default_chat",
      "senderId": "u1",
      "senderName": "Zubovic.Edin",
      "text": "Schema-Update für sys_tables erfolgreich eingespielt.",
      "timestamp": 1700000000000
    }
  ]
  ```

#### `POST /api/chat/messages` (Aliased as `/api/chats/messages`)
Sendet eine neue Nachricht an den Chatverlauf, speichert sie in der Datenbank `sys_chats` und sendet simultan ein SignalR-Broadcast an alle verbundenen Entwickler-Clients.
- **Request Body:**
  ```json
  {
    "chatId": "default_chat",
    "senderId": "u1",
    "senderName": "Zubovic.Edin",
    "text": "Hallo Team, die neue Version läuft!",
    "timestamp": 1700000000000
  }
  ```

#### `GET /api/chat` & `POST /api/chat`
Ermöglicht das Abrufen und Speichern von spezifischen Chat-Sitzungen (`SysChat` Entitäten) inkl. JSON-Nachrichten-Payloads.

#### `POST /api/chat/broadcast`
Sendet gezielte Schema- oder Projekt-Änderungsbenachrichtigungen an eine SignalR-Projektgruppe:
- **Request Body:**
  ```json
  {
    "projectId": "proj_billing",
    "user": "Zubovic.Edin",
    "entityType": "Table",
    "action": "Updated sys_tables"
  }
  ```

---

### 10.2 SignalR Realtime Hub (`/hubs/chat`)

Der SignalR WebSockets Hub ist unter der Route `/hubs/chat` registriert und ermöglicht bidirektionale Echtzeit-Events:
- **Server Event:** `ReceiveMessage(msg)` &ndash; Wird bei jedem neuen Chat-Eintrag getriggert.
- **Server Event:** `ProjectChanged(user, entityType, action)` &ndash; Benachrichtigt alle Gruppenmitglieder über simultane Schema-Veränderungen.

## 11. SQL Server Background Auto-Sync API Specification

Um eine kontinuierliche Live-Synchronisation zwischen der lokalen IndexedDB-Datenbank des Browsers und einem externen SQL-Server (z.B. MS SQL Server, PostgreSQL, MySQL) zu gewähren, stellt das DB Studio-Backend dedizierte Synchronisations- und Statusschnittstellen bereit.

### 11.1 Connection Status & Configuration
#### `GET /api/db/connection-status`
Gibt den aktuellen Verbindungsstatus und die geladenen Parameter des externen SQL-Servers zurück.
- **Rückgabe:**
  ```json
  {
    "connected": true,
    "config": {
      "host": "localhost",
      "database": "production_db",
      "type": "mssql"
    }
  }
  ```

### 11.2 Toggle Connection & Simulation Mode
#### `POST /api/db/connection-toggle`
Erlaubt das Ändern des externen Verbindungsstatus. Dies dient der Simulation von Netzwerkausfällen und dem sicheren Zurückfallen auf die lokale IndexedDB-Instanz (Offline-Fallback).
- **Request-Body:**
  ```json
  {
    "connected": false
  }
  ```
- **Rückgabe:**
  ```json
  {
    "success": true,
    "connected": false
  }
  ```

### 11.3 Sync DDL Execution Log
#### `GET /api/db/sync-logs`
Liefert das fortlaufende Protokoll aller automatischen oder manuellen Synchronisations-Vorgänge (Push- & Pull-Operationen).
- **Rückgabe:**
  ```json
  [
    {
      "timestamp": "2026-07-30T14:52:10.000Z",
      "action": "AUTO_SYNC",
      "details": "Führe DDL-Checks für Tabelle [sys_projects] aus...",
      "status": "SUCCESS"
    }
  ]
  ```

### 11.4 High-Performance Bidirectional Sync
#### `POST /api/db/sync-all`
Gleicht das gesamte lokale Schema (Tabellen, Spalten, Datentypen, Relationen und Abfragen) asynchron mit dem SQL-Server ab. Wenn eine neue Tabelle lokal erstellt wird, wird sie parallel auf dem SQL Server angelegt. Besteht keine Verbindung, wird dies im Log als `OFFLINE_FALLBACK` festgehalten.
- **Request-Body:**
  ```json
  {
    "tables": [...],
    "queries": [...],
    "relationships": [...],
    "connection": { ... }
  }
  ```
- **Rückgabe:**
  ```json
  {
    "success": true,
    "externalConnected": true,
    "pushedTablesCount": 5,
    "timestamp": "2026-07-30T14:55:00.000Z"
  }
  ```

---

## 12. Workflow & Macro Engine API (IndexedDB / REST / SQL)

Die Workflow-Engine ermöglicht die grafische Modellierung und automatisierte Ausführung von Geschäftslogik ohne Programmiercode. Datenhaltung und Ausführungsprotokolle werden prioritär in **IndexedDB** gespeichert und können nahtlos in relationale SQL-Backends migriert werden.

### 12.1 Workflow Schema in IndexedDB

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | `string` | Eindeutige Workflow-ID (UUID) |
| `name` | `string` | Bezeichnung des Workflows |
| `active` | `boolean` | Status: `true` (Aktiv / Event-Hooking) oder `false` (Entwurf) |
| `nodes` | `WorkflowNode[]` | Array der Flow-Knoten (Trigger, Actions, Conditions, Loops) |
| `edges` | `WorkflowEdge[]` | Verbindungen und Verzweigungen (True/False, Loop/Done) |
| `executionLogs` | `WorkflowExecutionLog[]` | Historie der letzten 20 Ausführungen |

### 12.2 API-Endpunkte der Workflow-Engine

#### `POST /api/workflows/execute` (bzw. `WorkflowExecutionEngine.executeWorkflow()`)
Führt einen Workflow mit einem übergebenen Datensatz aus.
- **Request-Body:**
  ```json
  {
    "workflowId": "wf_123",
    "event": "onCreate",
    "record": { "id": "ORD_100", "kunde": "Acme Corp", "betrag": 249.50 },
    "previousRecord": null
  }
  ```
- **Rückgabe (`WorkflowExecutionLog`):**
  ```json
  {
    "id": "log_987",
    "workflowId": "wf_123",
    "triggeredBy": "onCreate",
    "startedAt": "2026-08-19T08:00:00.000Z",
    "status": "success",
    "durationMs": 42,
    "steps": [
      {
        "nodeId": "node_1",
        "nodeLabel": "Datensatz erstellt",
        "nodeType": "triggerNode",
        "status": "success",
        "timestamp": "2026-08-19T08:00:00.005Z",
        "details": "Trigger auf Tabelle [bestellungen] ausgelöst."
      },
      {
        "nodeId": "node_2",
        "nodeLabel": "Formel berechnen",
        "nodeType": "databaseActionNode",
        "status": "success",
        "timestamp": "2026-08-19T08:00:00.015Z",
        "details": "Feld [gesamt_brutto] = 296.91 berechnet."
      },
      {
        "nodeId": "node_3",
        "nodeLabel": "E-Mail senden",
        "nodeType": "emailActionNode",
        "status": "success",
        "timestamp": "2026-08-19T08:00:00.030Z",
        "details": "E-Mail an 'kunde@acme.com' versendet mit Anhang 'Rechnung_ORD_100.pdf'."
      }
    ],
    "emailSentPreview": {
      "to": "kunde@acme.com",
      "subject": "Ihre Rechnung #ORD_100",
      "body": "Hallo Acme Corp,\n\nvielen Dank für Ihre Bestellung.",
      "attachmentName": "Rechnung_ORD_100.pdf"
    }
  }
  ```

#### `POST /api/workflows/trigger-event` (bzw. `triggerTableEvent()`)
Globaler Hook, der bei Tabellen-Operationen (Erstellen, Aktualisieren, Löschen) automatisch alle passenden aktiven Workflows auslöst.
- **Request-Body:**
  ```json
  {
    "tableId": "tbl_orders",
    "event": "onCreate",
    "record": { "id": "ORD_101", "kunde": "Muster AG", "summe": 500 }
  }
  ```





