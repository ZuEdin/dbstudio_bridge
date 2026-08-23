# API-zu-Tabelle-Importer API-Dokumentation

Dieses Dokument beschreibt die Funktionalität und Datenstrukturen des in der Software integrierten **API-zu-Tabelle-Importer**-Features. Er ermöglicht das automatische Auslesen beliebiger JSON REST-APIs, das Ablegen der generierten Tabellenstruktur in IndexedDB und das Generieren von produktivem Backend-Code für MS SQL Server, PostgreSQL oder MySQL.

---

## 1. Lokale Schnittstelle zur API-Schema-Analyse

Der Importer ermittelt die Struktur einer API anhand einer JSON-Struktur oder einer Live-Abfrage. 

### Primärschlüssel-Erkennung & -Konfiguration
Um redundante Spalten zu vermeiden und vorhandene Identifikatoren optimal zu nutzen, verfügt der Importer über eine intelligente Primärschlüssel-Steuerung:

1. **Automatische Erkennung**: Beim Laden einer API sucht der Importer automatisch im Datensatz nach Spalten wie `id` (case-insensitiv) oder solchen, die auf `id` oder `_id` enden (z. B. `userId`, `customer_id`). Wird eine solche Spalte gefunden, wird sie automatisch als Primärschlüssel vorausgewählt.
2. **Benutzerdefinierter PK**: Der Benutzer kann beim Speichern einer Tabelle oder Registrieren einer Backend-API flexibel wählen:
   - **Eigener PK**: Eine beliebige detektierte Spalte aus dem API-Response wird als Primärschlüssel definiert (`isPrimaryKey: true`). In diesem Fall wird **keine** zusätzliche, künstliche `id`-Spalte generiert oder mitgelistet.
   - **Automatische ID**: Ist kein passendes Feld im Datensatz vorhanden oder wünscht der Nutzer eine künstliche ID, generiert das System eine automatische, fortlaufende `id`-Spalte.

### Typ-Inferenz (`inferFieldType`)
Der Importer analysiert die Datentypen der erhaltenen JSON-Keys und weist ihnen SQL-kompatible Typen zu:

| JSON Datentyp | Kriterium | Zugeordneter Datentyp |
| :--- | :--- | :--- |
| `Number` (Integer) | Wert > 631152000 (Timestamp-Test) | `DATETIME` |
| `Number` (Integer) | Standard Ganzzahl | `INTEGER` |
| `Number` (Float) | Kommazahl | `DECIMAL` |
| `Boolean` | `true` oder `false` | `BOOLEAN` |
| `String` | Gültiges Datum (YYYY-MM-DD) | `DATE` |
| `String` | ISO-8601 Zeitstempel / Date-Parse | `DATETIME` |
| `String` | Zeitangabe (HH:MM:SS) | `TIME` |
| `String` | Jeder andere String | `VARCHAR` |
| `Array` / `Object` | Verschachtelt | `TEXT` (oder JSON-flachgelegt) |

### API-Authentifizierung (Authentifizierungsmöglichkeiten)
Der Importer unterstützt standardmäßig vier gängige Authentifizierungsverfahren, um gesicherte Enterprise- und Public-APIs sicher abzufragen und zu integrieren:

1. **Keine Authentifizierung (None)**: Standardmodus für öffentlich zugängliche Schnittstellen.
2. **Bearer Token (JWT / OAuth2)**:
   - Fügt automatisch den Header `Authorization: Bearer <token>` zu jeder ausgehenden Anfrage hinzu.
   - Ideal für gesicherte APIs, die über temporäre oder statische OAuth-Token verfügen.
3. **API-Key (Schlüssel-Wert-Paare)**:
   - Ermöglicht das Senden eines API-Schlüssels auf zwei Wegen:
     - **Header**: Ein benutzerdefinierter Header (z. B. `X-API-Key` oder `apikey`) wird mit einem optionalen Präfix gesendet.
     - **Query-Parameter (URL)**: Der Schlüssel wird als URL-Parameter (z. B. `?api_key=secret_value`) an die Anfrage angehängt.
4. **Basic Auth (Benutzername & Passwort)**:
   - Führt im Browser und auf dem Server eine Base64-Codierung von `username:password` durch.
   - Fügt den Header `Authorization: Basic <base64>` hinzu.

Sämtliche Authentifizierungseinstellungen werden in der lokalen IndexedDB-Tabellenkonfiguration (`Table.apiConfig`) und bei Registrierung als Backend-API auch gesichert in der Server-Konfiguration (`api-configs.json`) gespeichert, sodass automatisierte Hintergrund-Synchronisierungen (Option B) oder Live-Proxies (Option A) reibungslos autorisiert werden können.

---

## 2. Unterstützte Test-APIs (Presets)

Damit Sie das Feature sofort ohne eigene API testen können, sind folgende bewährte REST-Endpunkte direkt in der Benutzeroberfläche integriert:

### A. Benutzer-Daten (JSONPlaceholder)
* **URL:** `https://jsonplaceholder.typicode.com/users`
* **Methode:** `GET`
* **Datenstruktur (Auszug):**
  ```json
  [
    {
      "id": 1,
      "name": "Leanne Graham",
      "username": "Bret",
      "email": "Sincere@april.biz",
      "phone": "1-770-736-8031 x56442",
      "website": "hildegard.org"
    }
  ]
  ```

### B. Todo-Liste (JSONPlaceholder)
* **URL:** `https://jsonplaceholder.typicode.com/todos`
* **Methode:** `GET`
* **Datenstruktur (Auszug):**
  ```json
  [
    {
      "userId": 1,
      "id": 1,
      "title": "delectus aut autem",
      "completed": false
    }
  ]
  ```

### C. Produkt-Katalog (DummyJSON)
* **URL:** `https://dummyjson.com/products`
* **Methode:** `GET`
* **Datenstruktur (Auszug):**
  ```json
  {
    "products": [
      {
        "id": 1,
        "title": "Essence Mascara Lash Princess",
        "description": "The Essence Mascara Lash Princess...",
        "category": "beauty",
        "price": 9.99,
        "stock": 94,
        "rating": 4.94
      }
    ]
  }
  ```

---

## 3. Generierte Backend-Schnittstellen (für Ihren SQL Server)

Sobald eine Struktur erfolgreich importiert wurde, kann das System automatisch den passenden SQL Server Sync-Code für drei große Backends ausgeben.

### 1. .NET C# (Entity Framework Core)
Der generierte C# Controller stellt einen `POST /api/[TableName]Sync/sync` Endpunkt bereit, der die Daten direkt von der Quelle liest, die lokale SQL Server Tabelle leert (`TRUNCATE`) und die neuen Einträge speichert.

### 2. Node.js (Express + Prisma / Drizzle)
Stellt einen `POST /api/sync-[tablename]` Endpunkt zur Verfügung, der Axios für den HTTP-Request nutzt und über ein Prisma-Modell performant in SQL Server schreibt.

### 3. PHP (Laravel Eloquent)
Bietet eine Laravel Migration und einen Sync-Controller unter `POST /api/[tablename]/sync` unter Verwendung des Laravel Http-Clients (`Http::get()`) und Database Transactions.

---

## 4. Lokale IndexedDB Integration

Nach dem erfolgreichen Datenabruf wird eine neue Tabelle im `useProjectStore` hinzugefügt:

```typescript
const newTable: Table = {
    id: crypto.randomUUID(),
    name: cleanTableName,
    displayName: tableName,
    isApiImport: true, // Markiert als API-Importierte Tabelle
    columns: inferredFields, // Detektierte Spalten mit Typen
    rows: processedRows // Die tatsächlichen Zeilendaten aus der API
};
```
Die Daten stehen sofort für Formulare, Charts, Queries und Reports in der Benutzeroberfläche zur Verfügung.
