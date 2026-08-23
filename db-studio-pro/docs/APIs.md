# Datenbank- & API-Spezifikation (IndexedDB & SQL/MySQL Abstraktion)

Diese Spezifikation beschreibt die Datenhaltungs- und API-Architektur des Projekts. Sie stellt sicher, dass das System standardmäßig vollständig offline-fähig und performant auf **IndexedDB** operiert, während die Schnittstellen so entkoppelt sind, dass ein Wechsel auf ein SQL-basiertes Backend (z. B. PostgreSQL, MySQL, SQLite) mit minimalem Aufwand realisierbar ist.

---

## 1. Datenhaltungs-Strategie

Das Projekt nutzt ein zweistufiges Modell für maximale Flexibilität:

1. **Lokale Priorität (IndexedDB)**:
   - Alle Tabellen, Schemata, Abfragen, Formulare, Seiten (Pages) sowie die tatsächlichen Nutzdaten werden über den `storageService` lokal im Browser in einer IndexedDB-Datenbank namens `DBStudioProDB` gespeichert.
   - Dies ermöglicht sofortige Ladezeiten, Offline-Unterstützung und eine sandboxierte Entwicklungsumgebung für den Benutzer.

2. **Zukünftige Cloud-Migration (SQL/MySQL/Postgres)**:
   - Die internen Datenstrukturen und Abfragen sind nach dem relationalen Datenbankmodell entworfen (mit Primärschlüsseln, Fremdschlüsseln und strukturierten Tabellendefinitionen).
   - Um auf eine SQL-Datenbank umzustellen, muss lediglich der `storageService` bzw. der API-Client gegen einen REST- oder GraphQL-Service ausgetauscht werden, der dieselben Payload-Modelle bedient.

---

## 2. API-Schnittstellen (Payloads & Endpunkte)

Nachfolgend sind die standardisierten API-Endpunkte spezifiziert, die für ein zukünftiges SQL-Backend implementiert werden können.

### 2.1. Projekte (Projects)

Verwaltet die logischen Arbeitsbereiche des Nutzers. Ein Projekt enthält Tabellen, Formulare, Queries und Pages.

#### `GET /api/projects`
Gibt eine Liste aller Projekte zurück.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "project-uuid-1",
      "name": "Kunden- & Auftragsverwaltung",
      "lastModified": 1719231259000
    }
  ]
  ```

#### `POST /api/projects`
Erstellt ein neues Projekt.
- **Request Body**:
  ```json
  {
    "name": "Personalplaner"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "new-project-uuid",
    "name": "Personalplaner",
    "lastModified": 1719231259000,
    "tables": [],
    "queries": [],
    "forms": [],
    "pages": []
  }
  ```

#### `PUT /api/projects/:id`
Speichert das vollständige Projekt-Schema und die Konfigurationen.
- **Request Body**: Vollständiges `Project`-Objekt (siehe Abschnitt 3).
- **Response (200 OK)**: `{ "status": "saved" }`

---

### 2.2. Dynamische Nutzdaten-APIs (CRUD)

Diese APIs verwalten die eigentlichen Zeilen und Spalten der vom Benutzer erstellten Tabellen. Sie mappen 1:1 auf SQL-Inserts, Updates und Deletes.

#### `GET /api/projects/:projectId/tables/:tableId/data`
Liest alle Zeilen (Datensätze) einer benutzerdefinierten Tabelle aus.
- **Query Parameter (Optional)**:
  - `_filterField`: Name der Spalte (z. B. `UserId`)
  - `_filterValue`: Wert (z. B. `123`)
- **Response (200 OK)**:
  ```json
  [
    { "Id": "1", "Vorname": "Max", "Nachname": "Mustermann", "E-Mail": "max@test.de", "UserId": "123" },
    { "Id": "2", "Vorname": "Erika", "Nachname": "Musterfrau", "E-Mail": "erika@test.de", "UserId": "456" }
  ]
  ```

#### `POST /api/projects/:projectId/tables/:tableId/data`
Fügt einen neuen Datensatz hinzu. Entspricht SQL: `INSERT INTO tableId (...) VALUES (...)`
- **Request Body**:
  ```json
  {
    "Vorname": "John",
    "Nachname": "Doe",
    "E-Mail": "john@doe.com"
  }
  ```
- **Response (201 Created)**:
  ```json
  { "Id": "3", "Vorname": "John", "Nachname": "Doe", "E-Mail": "john@doe.com" }
  ```

#### `PUT /api/projects/:projectId/tables/:tableId/data/:recordId`
Aktualisiert einen bestehenden Datensatz anhand seines Primärschlüssels. Entspricht SQL: `UPDATE tableId SET ... WHERE Id = recordId`
- **Request Body**:
  ```json
  {
    "Vorname": "John (Updated)",
    "E-Mail": "john.updated@doe.com"
  }
  ```
- **Response (200 OK)**:
  ```json
  { "Id": "3", "Vorname": "John (Updated)", "Nachname": "Doe", "E-Mail": "john.updated@doe.com" }
  ```

#### `DELETE /api/projects/:projectId/tables/:tableId/data/:recordId`
Löscht einen Datensatz. Entspricht SQL: `DELETE FROM tableId WHERE Id = recordId`
- **Response (200 OK)**:
  ```json
  { "status": "deleted", "id": "3" }
  ```

---

## 3. Einheitliches TypeScript Datenmodell (`types/index.ts`)

Dieses Modell wird im Frontend verwendet und lässt sich einfach in relationale Tabellen übersetzen:

```typescript
export interface Table {
  id: string;          // Mapped auf SQL-Tabellenname oder ID
  name: string;        // Anzeigename
  fields: Field[];     // Spaltendefinitionen (Datentypen, PK, FK)
  data: any[];         // Datensätze (In SQL: Zeilen der Tabelle)
}

export interface Field {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  foreignKeyTableId?: string;
  foreignKeyField?: string;
}

export interface CustomPage {
  id: string;
  name: string;
  layout: PageComponent;
}

export interface PageComponent {
  id: string;
  type: PageComponentType;
  props: Record<string, any>; // z.B. actionType, selectionParamName, filterParamField, subPageId, parameterMappings
  children?: PageComponent[];
}

export type PageComponentType = 
  | 'container'
  | 'text'
  | 'button'
  | 'dropdown'
  | 'table_view'
  | 'list_repeater'
  | 'subpage_container';
```

---

## 4. Sub-Page & Parameter-Passing Flow

Die Interaktion zwischen Haupt- und Unterseiten verläuft nach folgendem relationalen Prinzip:

1. **Parameter Definition**: Eine übergeordnete Seite setzt bei einer Benutzerinteraktion (z. B. Tabellen-Zeilenklick oder Button-Klick) einen Parameter:
   - Parameter: `selectedId = "row-456"`
2. **Subpage Parameter Mapping**: Der `subpage_container` empfängt die Konfiguration:
   - Mapping: `selectedId ➔ customerId`
3. **Subpage Filterung**: Auf der eingebundenen Unterseite wird eine `table_view` oder ein Repeater mit folgender Filterung platziert:
   - Filter-Feld: `CustomerId` (in der Tabelle)
   - Filter-Parameter: `customerId`
4. **Ausführung**: Die Unterseite rendert dynamisch nur diejenigen Zeilen, die zum übergebenen Kunden gehören (Master-Detail Ansicht).

---

### 4.1. Schritt-für-Schritt Anleitung: Wo wird was im Designer eingegeben?

Um das Beispiel **Standort (Tabelle) ➔ ID auswählen ➔ Subpage einblenden & Standort-Details anzeigen** im Designer umzusetzen, gehen Sie wie folgt vor:

#### Schritt 1: Hauptseite & Auslöser konfigurieren (Standort-Tabelle)
1. Platzieren Sie auf Ihrer Hauptseite eine **Tabelle** (z. B. mit Daten aus Ihrer Standort-Tabelle).
2. Klicken Sie auf die Tabelle, um die Eigenschaften im rechten Seitenmenü zu öffnen.
3. Scrollen Sie nach unten zum Bereich **Tabellen-Interaktionen**:
   - **Zeilenklick-Aktion**: Wählen Sie `Parameter setzen` aus.
   - **Parameter Name**: Geben Sie `selectedId` ein.
   - **Parameter Spalte**: Wählen Sie `id` aus.
   - **Ereignis-Trigger für Details**: Wählen Sie zwischen `Einfacher Klick` (Standard, sofortige Ausführung) oder `Doppelklick` (markiert Zeile bei Klick, öffnet Details erst bei Doppelklick).
   *Effekt:* Sobald ein Nutzer eine Zeile der Tabelle anklickt (oder doppelklickt, je nach Einstellung), wird die ID dieses Standorts im globalen Parameter `selectedId` gespeichert.

#### Schritt 2: Unterseite erstellen & Filterung einrichten (Standort-Details)
1. Erstellen Sie eine neue Seite (z. B. namens `Standort Details`).
2. Aktivieren Sie in den Seiteneinstellungen die Option **Als Unterseite (Subpage) verwenden** (damit sie nicht im Hauptmenü erscheint).
3. Platzieren Sie eine Detail-Tabelle oder Felder auf dieser Seite.
4. Klicken Sie die Detail-Tabelle an und scrollen Sie rechts zu **Daten filtern über Parameter**:
   - **Filter-Spalte**: Wählen Sie `id` (oder `standort_id` falls es sich um verknüpfte Daten handelt).
   - **Filter-Parameter Name**: Tragen Sie hier den Namen des Unterseiten-Parameters ein, z. B. `targetStandortId`.
   *Effekt:* Diese Detail-Tabelle zeigt nur noch Zeilen an, deren ID-Spalte mit dem Wert übereinstimmt, der ihr als `targetStandortId` übergeben wird.

#### Schritt 3: Unterseite auf der Hauptseite einbinden (Subpage Container)
1. Gehen Sie zurück zur Hauptseite.
2. Ziehen Sie einen **Unterseiten-Container (Sub-Page)** auf die Seite.
3. Klicken Sie den Container an, um rechts die Einstellungen zu öffnen:
   - **Eingebundene Seite (Sub-Page)**: Wählen Sie `Standort Details`.
4. Scrollen Sie im rechten Panel zum Bereich **Parameter-Mappings (Übergabe an Unterseite)**:
   - Klicken Sie auf **Mapping hinzufügen**.
   - **Parent Parameter (Quelle)**: Tragen Sie `selectedId` ein.
   - **Sub Parameter (Ziel)**: Tragen Sie `targetStandortId` ein.
   *Effekt:* Die ID aus der Hauptseite wird als Parameter an die Unterseite weitergereicht.

#### Schritt 4: Sichtbarkeit steuern (Optional)
Damit die Unterseite erst sichtbar wird, wenn tatsächlich ein Standort angeklickt wurde, konfigurieren Sie am **Unterseiten-Container (Sub-Page)** unter Sichtbarkeit:
- **Filter-Feld**: Tragen Sie `selectedId` ein.
- **Operator**: Wählen Sie `ist gesetzt (nicht leer)`.
*Effekt:* Der Container ist anfangs unsichtbar. Erst wenn ein Standort in der Tabelle angeklickt wurde und `selectedId` einen Wert erhält, blendet sich die Unterseite geschmeidig ein.

---

## 5. Schema & Project Import API Specifications

To allow users to bootstrap database structures quickly, the system supports importing raw SQL, JSON, or CSV schemas directly. These are stored locally inside **IndexedDB** for fast client-side accessibility, but can easily be bound to a REST / JSON API backend proxy.

### 5.1. Import Endpoint (Schema & Data Parsing)

#### `POST /api/projects/:projectId/import-schema`
Parses pasted text schemas (SQL DDL, JSON Schema, CSV format, or JSON lists) and registers them as new tables within the project.

- **Request Payload**:
  ```json
  {
    "inputText": "CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(255));",
    "format": "sql"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "tables": [
      {
        "id": "table-uuid-1",
        "name": "customers",
        "fields": [
          { "id": "field-uuid-1", "name": "id", "type": "INTEGER", "isPrimaryKey": true, "allowNull": false },
          { "id": "field-uuid-2", "name": "name", "type": "VARCHAR", "isPrimaryKey": false, "allowNull": true }
        ],
        "data": []
      }
    ]
  }
  ```

---

## 6. IndexedDB Storage Architecture & Backend Synchronization

To keep local development responsive, all state synchronization follows a decoupled queue pattern. Later migratable backend engines (MySQL, Postgres, etc.) can be seamlessly plugged in.

```text
+------------------------------------------+
|            Client View Layer             |
+------------------------------------------+
                     |
                     v
+------------------------------------------+
|          stores/useProjectStore          |
+------------------------------------------+
                     |
       +-------------+-------------+
       |                           | (Async Sync)
       v                           v
+--------------+           +---------------+
|  IndexedDB   |           |  SQL Backend  |
|  (Priority)  |           | (Optional API)|
+--------------+           +---------------+
```

All table structural changes trigger `saveProjectToStorage()` or `addTable()`, operating asynchronously with IndexedDB as the source of truth, offering instantaneous state restores and offline compatibility.

---

## 7. Collaborative Tickets & Tasks API Specifications

To allow designers and developers to coordinate schema adjustments, query tuning, and reports, the system supports a Kanban Ticket Board.

### 7.1. SQL Database Table Schema (`sys_tickets`)

For direct integration with relational backends (PostgreSQL, MySQL, SQLite), the following DDL describes the storage format:

```sql
CREATE TABLE sys_tickets (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    priority VARCHAR(10) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    assigned_to VARCHAR(50) NOT NULL DEFAULT 'all', -- ID or 'all'
    assigned_to_name VARCHAR(100) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    created_by_name VARCHAR(100) NOT NULL,
    created_at BIGINT NOT NULL
);
```

### 7.2. REST API Endpoints

#### `GET /api/tickets`
Fetches all task tracking cards.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "ticket-1",
      "title": "Datenbankschema für Kunden & Rechnungen anlegen",
      "description": "Bitte erstelle die Tabelle sys_customers mit Primärschlüssel.",
      "status": "todo",
      "priority": "high",
      "assignedTo": "u2",
      "assignedToName": "Sarah Lee",
      "createdBy": "u1",
      "createdByName": "Me",
      "createdAt": 1719631200000
    }
  ]
  ```

#### `POST /api/tickets`
Creates a new task.
- **Request Body**:
  ```json
  {
    "title": "Query-Tuning",
    "description": "Index auf Kunden-ID hinzufügen.",
    "priority": "high",
    "assignedTo": "u3"
  }
  ```
- **Response (201 Created)**: Created ticket object with status `'todo'`.

#### `PATCH /api/tickets/:id/status`
Updates a ticket's kanban stage (To Do, In Progress, Done).
- **Request Body**:
  ```json
  {
    "status": "in_progress"
  }
  ```
- **Response (200 OK)**: `{ "status": "updated" }`

#### `DELETE /api/tickets/:id`
Deletes an task.
- **Response (200 OK)**: `{ "status": "deleted" }`

---

## 8. IndexedDB Local Storage Specifications

As prioritized, all collaborative elements are backed by standard **IndexedDB** databases directly in the browser to enable instantaneous state restoration, offline-first reliability, and seamless scaling.

### 8.1. Tickets Storage
- **Database Name**: `DBStudioProTickets`
- **Object Store**: `tickets`
- **Key Path**: `id`
- **Fallback Seeding**: Provided automatically on the first load to populate realistic database schema designer, index-optimization, and validation tasks.

### 8.2. Chats & Messages Storage
- **Database Name**: `DBStudioProChats`
- **Object Store**: `chats`
- **Key Path**: `id`
- **Schema Shape**:
  ```typescript
  interface Chat {
      id: string;
      type: 'private' | 'group';
      name: string;
      participants: string[];
      messages: ChatMessage[];
      unreadCount?: number;
      isOnline?: boolean;
  }
  ```
- **Updates**: Any sent message is instantly pushed into the local object store asynchronously before updating local React state, minimizing the risk of data loss.

---

## 9. Premium Backend-API Proxy & Cache-Manager (Option A & Option B)

Um CORS-Fehler im Browser zu vermeiden, sensible API-Schlüssel/Credentials sicher zu verbergen und Offline-Betrieb zu garantieren, verfügt das System über eine integrierte Premium-Schnittstelle im Node.js-Backend.

Diese verwaltet registrierte externe APIs im Dateisystem unter `data/backend_api_configs.json` und unterstützt zwei flexible Betriebsmodi:

### 9.1. Betriebsmodi

*   **Option A: Live Echtzeit-Proxy**
    *   Der Server fungiert als direkter Proxy. Bei jedem Aufruf von `/api/backend-apis/:name/data` holt der Server die Daten live von der konfigurierten URL ab, fügt evtl. definierte Header oder Query-Parameter hinzu, führt sie aus und reicht das Ergebnis an das Frontend weiter.
    *   *Vorteil*: Extrem sicher (keine Credentials im Browser sichtbar) und immer top-aktuelle Daten.
*   **Option B: Server-Datenbank & Cache**
    *   Der Server zieht die Daten von der externen Quelle ab und legt sie in einer lokalen JSON-Datenbankdatei auf dem Server ab (z. B. `data/api_cache_Kunden.json`). Abfragen werden blitzschnell und ohne Netzwerklatenz direkt aus dem Cache bedient.
    *   Der Cache kann manuell aktualisiert werden oder über ein Hintergrund-Intervall (z. B. alle 10 Minuten, 30 Minuten, stündlich, täglich).
    *   *Vorteil*: Voller Offline-Betrieb, keine externen API-Ausfälle, und die gecachten Daten können direkt auf dem Server editiert und manipuliert werden.

### 9.2. API Endpunkte (Backend-APIs)

#### `GET /api/backend-apis`
Gibt eine Liste aller im Backend registrierten API-Konfigurationen zurück.
*   **Response (200 OK)**:
    ```json
    [
      {
        "name": "KundenAPI",
        "url": "https://jsonplaceholder.typicode.com/users",
        "method": "GET",
        "option": "B",
        "refreshInterval": 30,
        "lastRefreshed": "2026-07-07T15:30:00.000Z"
      }
    ]
    ```

#### `POST /api/backend-apis`
Registriert oder aktualisiert eine API-Konfiguration im Backend.
*   **Request Body**:
    ```json
    {
      "name": "KundenAPI",
      "url": "https://jsonplaceholder.typicode.com/users",
      "method": "GET",
      "headers": "{\"Authorization\": \"Bearer SECRET_TOKEN\"}",
      "queryParams": [],
      "option": "B",
      "refreshInterval": 30,
      "fields": [],
      "data": []
    }
    ```
*   **Response (200 OK)**: `{ "status": "registered", "name": "KundenAPI" }`

#### `DELETE /api/backend-apis/:name`
Löscht eine registrierte API-Konfiguration und deren gecachte Server-Datenbankdatei.
*   **Response (200 OK)**: `{ "status": "deleted", "name": "KundenAPI" }`

#### `POST /api/backend-apis/:name/refresh`
Erzwingt eine sofortige Synchronisierung des Server-Caches (holt live Daten von der externen API und aktualisiert die lokale JSON-Datenbankdatei auf dem Server).
*   **Response (200 OK)**: `{ "status": "refreshed", "records": 10 }`

#### `GET /api/backend-apis/:name/data`
Liefert die Daten der registrierten API zurück.
*   *Bei Option A*: Holt die Daten live von der externen URL und liefert sie aus.
*   *Bei Option B*: Liefert die im Server-Cache gespeicherten JSON-Daten extrem schnell und offline-fähig aus.
*   **Response (200 OK)**: Array von JSON-Objekten (Datensätze).

#### `PUT /api/backend-apis/:name/data`
Aktualisiert die im Server-Cache (Option B) gespeicherten Daten direkt auf dem Server. Dies ermöglicht es dem Benutzer, Zeilen hinzuzufügen, zu bearbeiten oder zu löschen, welche direkt auf dem Server synchronisiert werden!
*   **Request Body**: Array aller neuen/modifizierten Datenzeilen.
*   **Response (200 OK)**: `{ "status": "updated", "records": 10 }`

---

## 10. SharePoint & XML API Integration (Auto-Format-Detection)

Das System verfügt über eine integrierte **Format-Erkennung (JSON oder XML)** im Frontend und Node.js-Backend. Dadurch können sowohl standardmäßige REST-APIs als auch ältere SOAP-Dienste oder Microsoft SharePoint-Listen nahtlos angebunden werden.

### 10.1. Automatische Erkennung & Konvertierung
*   **XML-Erkennung**: Beginnt eine API-Antwort mit `<` (z. B. `<?xml` oder `<feed`), schaltet das System automatisch in den XML-Parsing-Modus um.
*   **Namensraum-Bereinigung**: XML-Element-Namensräume (z. B. `<d:Title>` oder `<m:properties>`) werden automatisch bereinigt. Im Frontend-Raster (Grid) erscheinen sie als flache, saubere Schlüssel wie `Title` oder `ID`.
*   **Listen-Extraktion**: Das System extrahiert automatisch das größte enthaltene Array (z. B. RSS `<item>`-Listen, SOAP-Arrays oder SharePoint `<entry>`-Objekte) und stellt diese als Zeilen im Grid dar.

### 10.2. SharePoint-Listen aufrufen (Anleitung)

Wenn Sie eine bestimmte Liste aus SharePoint Online importieren möchten, führen Sie folgende Schritte im **API-Laden / Import**-Tool aus:

#### 1. Die richtige SharePoint-URL konstruieren
Die SharePoint REST-API verwendet das OData-Protokoll. Verwenden Sie folgendes URL-Format:
```text
https://{ihr-unternehmen}.sharepoint.com/sites/{ihre-website}/_api/web/lists/getbytitle('{listen-name}')/items
```
*Beispiel*: `https://acme.sharepoint.com/sites/Vertrieb/_api/web/lists/getbytitle('Kundenliste')/items`

#### 2. Notwendige Header hinzufügen
Da SharePoint standardmäßig XML im Atom-Feed-Format zurückgibt, können Sie dieses entweder direkt XML-parsen lassen oder durch Angabe von Headern JSON anfordern:
*   **Für JSON-Rückgabe (Empfohlen)**:
    Fügen Sie im Header-Bereich folgenden Eintrag hinzu:
    *   `Accept`: `application/json;odata=verbose`
*   **Für XML-Rückgabe (Fallunterscheidung)**:
    Wenn Sie keine Header angeben, liefert SharePoint XML zurück. Unser Parser verarbeitet das Atom-Feed-Format automatisch, holt die `<entry>`-Elemente heraus und flacht die `<content><m:properties>` ab.

#### 3. Authentifizierung (Bearer Token oder Cookie)
SharePoint Online erfordert eine Authentifizierung. Fügen Sie einen entsprechenden Header hinzu:
*   `Authorization`: `Bearer {Ihr_OAuth_Token}`
*   Alternativ können Sie temporäre Session-Cookies im Browser mitsenden, wenn Sie im gleichen Browser bei SharePoint eingeloggt sind (`credentials: "include"`).

#### 4. Registrieren als Premium-Backend-API
Um CORS-Probleme des SharePoint-Servers im Browser zu umgehen, registrieren Sie die SharePoint-API als **Backend-API (Option A oder B)**:
1. Tragen Sie SharePoint-URL und Header ein.
2. Klicken Sie auf **"Als Tabelle speichern"** -> **"Als Backend-API speichern (Premium)"**.
3. Wählen Sie **Option A (Proxy)** oder **Option B (Server Cache)**.
4. Das Node.js-Backend übernimmt nun die sichere Kommunikation und reicht die Daten sauber an Ihr Daten-Studio weiter!

---

## 11. Erweiterter Excel-Import (Mehrere Arbeitsblätter, Auto-Enums & SVERWEIS)

Das Excel-Import-System verfügt über erstklassige, automatisierte Datenvorbereitungs- und Mapping-Features, um die Datenqualität beim Importieren massiv zu erhöhen.

### 11.1. Arbeitsblatt-Auswahl (Multiple Sheets)
*   **Automatische Erkennung**: Beim Laden einer Excel-Arbeitsmappe (`.xlsx`) wird geprüft, ob sich darin mehrere Mappenblätter (Arbeitsblätter) befinden.
*   **Visuelle Auswahlliste**: Sind mehrere Blätter vorhanden, wird dem Benutzer im ersten Schritt eine intuitive Auswahlliste präsentiert. Der Benutzer wählt das gewünschte Arbeitsblatt aus, um den Importvorgang fortzusetzen.
*   **Dynamische Umschaltung**: Im Spalten-Zuweisungsschritt kann der Benutzer jederzeit über ein Dropdown-Menü zwischen den Arbeitsblättern hin- und herwechseln. Die Tabellenvorschau und die Spaltenerkennung aktualisieren sich verzögerungsfrei.

### 11.2. Intelligente Enum-Erkennung (Dropdowns & Datenüberprüfung)
*   **Kardinalitäts-Analyse**: Spalten, die weniger als oder genau 15 eindeutige Werte besitzen (und mindestens 3 Zeilen enthalten), werden automatisch als `ENUM`-Datentyp erkannt.
*   **Interaktiver Enum-Editor**: Im Spaltenzuweisungs-Schritt kann der Benutzer die erkannten Dropdown-Optionen einsehen, löschen oder manuell neue Optionen hinzufügen.
*   **Payload-Modell**: Enum-Werte werden im Feld-Objekt als `enumValues` vom Typ `string[]` definiert und nahtlos in der IndexedDB gespeichert.

### 11.3. SVERWEIS / Beziehungs-Vorschläge (VLOOKUP Relationships)
*   **Ähnlichkeits-Suche**: Das System vergleicht Spaltennamen automatisch mit den Namen und Primärschlüsseln aller im Projekt bereits vorhandenen Tabellen (z. B. Spalte `kunde_id` zu Tabelle `Kunden`).
*   **Verknüpfungs-Dropdown**: Wird eine Ähnlichkeit erkannt, schlägt der Assistent automatisch eine Beziehung vor. Der Benutzer kann die Beziehung manuell anpassen oder auf eine andere Tabelle verweisen.
*   **Beziehungs-Erstellung**: Nach dem Import wird die neue Tabelle mitsamt allen ausgewählten `1:n`-Beziehungen im globalen Beziehungs-Schema des Daten-Studios registriert. Diese Verknüpfungen stehen sofort in Abfragen (Queries) und im ER-Diagramm zur Verfügung.

## 12. ENUM-Felder & Dropdown-Werte (Tabellenentwurf & Datenblatt)

### 12.1. Feld-Konfiguration im Tabellenentwurf
*   **Datentyp**: Bei Auswahl des Datentyps `ENUM` im Tabellenentwurf (`TableDesigner`) wird im Bereich *Feldeigenschaften* ein visueller **ENUM-Auswahlwerte-Manager** eingeblendet.
*   **Werte-Eingabe**:
    *   **Einzeleingabe**: Wert tippen und mit `Enter` oder `+ Hinzufügen` bestätigen.
    *   **Komma-getrennte Mehrfacheingabe**: z. B. `Offen, In Bearbeitung, Erledigt, Storniert` wird automatisch in separate Auswahlwerte aufgeteilt.
    *   **Schnellvorlagen (Presets)**: Vorlagen für Anrede, Status, Priorität, Ticket, Ja/Nein, Einheiten und Zahlung per Klick sofort einsatzbereit.
    *   **Standardwert**: Ein interaktives Dropdown im Eigenschaften-Panel erlaubt die direkte Wahl des Standardwertes (`defaultValue`) aus den definierten Optionen.
*   **Persistenz**: Die Werte werden im Schema als `field.enumValues: string[]` in der lokalen **IndexedDB** gespeichert.

### 12.2. Interaktives Datenblatt (Data Grid)
*   Im Datenblatt (`TableView`) wird bei Feldern vom Typ `ENUM` automatisch eine native Dropdown-Auswahlbox gerendert, welche die Eingabe auf die definierten Enum-Optionen beschränkt und Fehleingaben verhindert.

### 12.3. Backend- & SQL-Export
*   **MySQL / MariaDB**: `ENUM('Wert1', 'Wert2', ...)`
*   **PostgreSQL**: `VARCHAR(255) CHECK (field IN ('Wert1', 'Wert2', ...))` oder `CREATE TYPE ... AS ENUM`
*   **SQLite**: `TEXT CHECK (field IN ('Wert1', 'Wert2', ...))`
*   **.NET (C#)**: `enum StatusEnum { Wert1, Wert2 }`
*   **PHP / Laravel**: `$table->enum('field', ['Wert1', 'Wert2'])`




