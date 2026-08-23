# FakturierungPro - API Documentation

**Base URL:** `http://localhost:5000/api`
**Backend Stack:** `tauri` | **Database:** `SQLite` | **Frontend:** `react` 

This document provides a comprehensive specification of all generated RESTful API endpoints, data models, custom queries, authentication flows, and relational schemas.

## 🔒 Authentication & Security

Authentication is currently disabled (`Public Access Mode`). All endpoints are publicly accessible.

---

## 📊 Database Tables & REST API Endpoints

### 📁 Kunden

**Base Endpoint:** `/api/kunden`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `kundenNr` | `VARCHAR` | - | Yes | - |
| `firmenname` | `VARCHAR` | - | Yes | - |
| `ansprechpartner` | `VARCHAR` | - | Yes | - |
| `email` | `VARCHAR` | - | Yes | - |
| `telefon` | `VARCHAR` | - | Yes | - |
| `strasse` | `VARCHAR` | - | Yes | - |
| `plz` | `VARCHAR` | - | Yes | - |
| `ort` | `VARCHAR` | - | Yes | - |
| `uStIdNr` | `VARCHAR` | - | Yes | - |
| `zahlungszielTage` | `INTEGER` | - | Yes | - |
| `status` | `ENUM` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/kunden`
Retrieve all records from `Kunden`.
- **Response 200:** Array of `Kunden` objects.

##### 2. GET `/api/kunden/:id`
Retrieve a single record from `Kunden` by primary key.
- **Response 200:** Single `Kunden` object.
- **Response 404:** Record not found.

##### 3. POST `/api/kunden`
Create a new record in `Kunden`.

**Example Request Payload:**
```json
{
  "kundenNr": "sample",
  "firmenname": "sample",
  "ansprechpartner": "sample",
  "email": "sample",
  "telefon": "sample",
  "strasse": "sample",
  "plz": "sample",
  "ort": "sample",
  "uStIdNr": "sample",
  "zahlungszielTage": 100,
  "status": "sample"
}
```

##### 4. PUT `/api/kunden/:id`
Update an existing record in `Kunden` by primary key.
- **Response 200:** Updated `Kunden` object.

##### 5. DELETE `/api/kunden/:id`
Delete a record from `Kunden` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Artikel

**Base Endpoint:** `/api/artikel`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `artikelNr` | `VARCHAR` | - | Yes | - |
| `bezeichnung` | `VARCHAR` | - | Yes | - |
| `kategorie` | `ENUM` | - | Yes | - |
| `einzelpreis` | `DECIMAL` | - | Yes | - |
| `steuerSatz` | `INTEGER` | - | Yes | - |
| `einheit` | `ENUM` | - | Yes | - |
| `lagerbestand` | `INTEGER` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/artikel`
Retrieve all records from `Artikel`.
- **Response 200:** Array of `Artikel` objects.

##### 2. GET `/api/artikel/:id`
Retrieve a single record from `Artikel` by primary key.
- **Response 200:** Single `Artikel` object.
- **Response 404:** Record not found.

##### 3. POST `/api/artikel`
Create a new record in `Artikel`.

**Example Request Payload:**
```json
{
  "artikelNr": "sample",
  "bezeichnung": "sample",
  "kategorie": "sample",
  "einzelpreis": 100,
  "steuerSatz": 100,
  "einheit": "sample",
  "lagerbestand": 100
}
```

##### 4. PUT `/api/artikel/:id`
Update an existing record in `Artikel` by primary key.
- **Response 200:** Updated `Artikel` object.

##### 5. DELETE `/api/artikel/:id`
Delete a record from `Artikel` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Angebote

**Base Endpoint:** `/api/angebote`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `angebotsNr` | `VARCHAR` | - | Yes | - |
| `kundenId` | `INTEGER` | - | Yes | - |
| `datum` | `DATE` | - | Yes | - |
| `gueltigBis` | `DATE` | - | Yes | - |
| `status` | `ENUM` | - | Yes | - |
| `nettoBetrag` | `DECIMAL` | - | Yes | - |
| `bruttoBetrag` | `DECIMAL` | - | Yes | - |
| `bemerkung` | `TEXT` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/angebote`
Retrieve all records from `Angebote`.
- **Response 200:** Array of `Angebote` objects.

##### 2. GET `/api/angebote/:id`
Retrieve a single record from `Angebote` by primary key.
- **Response 200:** Single `Angebote` object.
- **Response 404:** Record not found.

##### 3. POST `/api/angebote`
Create a new record in `Angebote`.

**Example Request Payload:**
```json
{
  "angebotsNr": "sample",
  "kundenId": 100,
  "datum": "2026-01-01T12:00:00Z",
  "gueltigBis": "2026-01-01T12:00:00Z",
  "status": "sample",
  "nettoBetrag": 100,
  "bruttoBetrag": 100,
  "bemerkung": "sample"
}
```

##### 4. PUT `/api/angebote/:id`
Update an existing record in `Angebote` by primary key.
- **Response 200:** Updated `Angebote` object.

##### 5. DELETE `/api/angebote/:id`
Delete a record from `Angebote` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Angebotspositionen

**Base Endpoint:** `/api/angebotspositionen`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `angebotsId` | `INTEGER` | - | Yes | - |
| `artikelId` | `INTEGER` | - | Yes | - |
| `menge` | `DECIMAL` | - | Yes | - |
| `einzelpreis` | `DECIMAL` | - | Yes | - |
| `rabattProzent` | `DECIMAL` | - | Yes | - |
| `gesamtNetto` | `DECIMAL` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/angebotspositionen`
Retrieve all records from `Angebotspositionen`.
- **Response 200:** Array of `Angebotspositionen` objects.

##### 2. GET `/api/angebotspositionen/:id`
Retrieve a single record from `Angebotspositionen` by primary key.
- **Response 200:** Single `Angebotspositionen` object.
- **Response 404:** Record not found.

##### 3. POST `/api/angebotspositionen`
Create a new record in `Angebotspositionen`.

**Example Request Payload:**
```json
{
  "angebotsId": 100,
  "artikelId": 100,
  "menge": 100,
  "einzelpreis": 100,
  "rabattProzent": 100,
  "gesamtNetto": 100
}
```

##### 4. PUT `/api/angebotspositionen/:id`
Update an existing record in `Angebotspositionen` by primary key.
- **Response 200:** Updated `Angebotspositionen` object.

##### 5. DELETE `/api/angebotspositionen/:id`
Delete a record from `Angebotspositionen` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Auftraege

**Base Endpoint:** `/api/auftraege`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `auftragsNr` | `VARCHAR` | - | Yes | - |
| `angebotsId` | `INTEGER` | - | Yes | - |
| `kundenId` | `INTEGER` | - | Yes | - |
| `auftragsDatum` | `DATE` | - | Yes | - |
| `lieferDatum` | `DATE` | - | Yes | - |
| `status` | `ENUM` | - | Yes | - |
| `nettoBetrag` | `DECIMAL` | - | Yes | - |
| `bruttoBetrag` | `DECIMAL` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/auftraege`
Retrieve all records from `Auftraege`.
- **Response 200:** Array of `Auftraege` objects.

##### 2. GET `/api/auftraege/:id`
Retrieve a single record from `Auftraege` by primary key.
- **Response 200:** Single `Auftraege` object.
- **Response 404:** Record not found.

##### 3. POST `/api/auftraege`
Create a new record in `Auftraege`.

**Example Request Payload:**
```json
{
  "auftragsNr": "sample",
  "angebotsId": 100,
  "kundenId": 100,
  "auftragsDatum": "2026-01-01T12:00:00Z",
  "lieferDatum": "2026-01-01T12:00:00Z",
  "status": "sample",
  "nettoBetrag": 100,
  "bruttoBetrag": 100
}
```

##### 4. PUT `/api/auftraege/:id`
Update an existing record in `Auftraege` by primary key.
- **Response 200:** Updated `Auftraege` object.

##### 5. DELETE `/api/auftraege/:id`
Delete a record from `Auftraege` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Auftragspositionen

**Base Endpoint:** `/api/auftragspositionen`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `auftragsId` | `INTEGER` | - | Yes | - |
| `artikelId` | `INTEGER` | - | Yes | - |
| `menge` | `DECIMAL` | - | Yes | - |
| `einzelpreis` | `DECIMAL` | - | Yes | - |
| `gesamtNetto` | `DECIMAL` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/auftragspositionen`
Retrieve all records from `Auftragspositionen`.
- **Response 200:** Array of `Auftragspositionen` objects.

##### 2. GET `/api/auftragspositionen/:id`
Retrieve a single record from `Auftragspositionen` by primary key.
- **Response 200:** Single `Auftragspositionen` object.
- **Response 404:** Record not found.

##### 3. POST `/api/auftragspositionen`
Create a new record in `Auftragspositionen`.

**Example Request Payload:**
```json
{
  "auftragsId": 100,
  "artikelId": 100,
  "menge": 100,
  "einzelpreis": 100,
  "gesamtNetto": 100
}
```

##### 4. PUT `/api/auftragspositionen/:id`
Update an existing record in `Auftragspositionen` by primary key.
- **Response 200:** Updated `Auftragspositionen` object.

##### 5. DELETE `/api/auftragspositionen/:id`
Delete a record from `Auftragspositionen` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Rechnungen

**Base Endpoint:** `/api/rechnungen`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `rechnungsNr` | `VARCHAR` | - | Yes | - |
| `auftragsId` | `INTEGER` | - | Yes | - |
| `kundenId` | `INTEGER` | - | Yes | - |
| `rechnungsDatum` | `DATE` | - | Yes | - |
| `faelligDatum` | `DATE` | - | Yes | - |
| `zahlungsStatus` | `ENUM` | - | Yes | - |
| `nettoBetrag` | `DECIMAL` | - | Yes | - |
| `mwStBetrag` | `DECIMAL` | - | Yes | - |
| `bruttoBetrag` | `DECIMAL` | - | Yes | - |
| `offenerBetrag` | `DECIMAL` | - | Yes | - |
| `skontoProzent` | `DECIMAL` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/rechnungen`
Retrieve all records from `Rechnungen`.
- **Response 200:** Array of `Rechnungen` objects.

##### 2. GET `/api/rechnungen/:id`
Retrieve a single record from `Rechnungen` by primary key.
- **Response 200:** Single `Rechnungen` object.
- **Response 404:** Record not found.

##### 3. POST `/api/rechnungen`
Create a new record in `Rechnungen`.

**Example Request Payload:**
```json
{
  "rechnungsNr": "sample",
  "auftragsId": 100,
  "kundenId": 100,
  "rechnungsDatum": "2026-01-01T12:00:00Z",
  "faelligDatum": "2026-01-01T12:00:00Z",
  "zahlungsStatus": "sample",
  "nettoBetrag": 100,
  "mwStBetrag": 100,
  "bruttoBetrag": 100,
  "offenerBetrag": 100,
  "skontoProzent": 100
}
```

##### 4. PUT `/api/rechnungen/:id`
Update an existing record in `Rechnungen` by primary key.
- **Response 200:** Updated `Rechnungen` object.

##### 5. DELETE `/api/rechnungen/:id`
Delete a record from `Rechnungen` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Rechnungspositionen

**Base Endpoint:** `/api/rechnungspositionen`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `rechnungsId` | `INTEGER` | - | Yes | - |
| `artikelId` | `INTEGER` | - | Yes | - |
| `positionNr` | `INTEGER` | - | Yes | - |
| `menge` | `DECIMAL` | - | Yes | - |
| `einzelpreis` | `DECIMAL` | - | Yes | - |
| `steuerSatz` | `INTEGER` | - | Yes | - |
| `gesamtNetto` | `DECIMAL` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/rechnungspositionen`
Retrieve all records from `Rechnungspositionen`.
- **Response 200:** Array of `Rechnungspositionen` objects.

##### 2. GET `/api/rechnungspositionen/:id`
Retrieve a single record from `Rechnungspositionen` by primary key.
- **Response 200:** Single `Rechnungspositionen` object.
- **Response 404:** Record not found.

##### 3. POST `/api/rechnungspositionen`
Create a new record in `Rechnungspositionen`.

**Example Request Payload:**
```json
{
  "rechnungsId": 100,
  "artikelId": 100,
  "positionNr": 100,
  "menge": 100,
  "einzelpreis": 100,
  "steuerSatz": 100,
  "gesamtNetto": 100
}
```

##### 4. PUT `/api/rechnungspositionen/:id`
Update an existing record in `Rechnungspositionen` by primary key.
- **Response 200:** Updated `Rechnungspositionen` object.

##### 5. DELETE `/api/rechnungspositionen/:id`
Delete a record from `Rechnungspositionen` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Mahnungen

**Base Endpoint:** `/api/mahnungen`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `mahnungsNr` | `VARCHAR` | - | Yes | - |
| `rechnungsId` | `INTEGER` | - | Yes | - |
| `kundenId` | `INTEGER` | - | Yes | - |
| `mahnDatum` | `DATE` | - | Yes | - |
| `mahnstufe` | `ENUM` | - | Yes | - |
| `mahngebuehr` | `DECIMAL` | - | Yes | - |
| `verzugszinsen` | `DECIMAL` | - | Yes | - |
| `faelligBis` | `DATE` | - | Yes | - |
| `status` | `ENUM` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/mahnungen`
Retrieve all records from `Mahnungen`.
- **Response 200:** Array of `Mahnungen` objects.

##### 2. GET `/api/mahnungen/:id`
Retrieve a single record from `Mahnungen` by primary key.
- **Response 200:** Single `Mahnungen` object.
- **Response 404:** Record not found.

##### 3. POST `/api/mahnungen`
Create a new record in `Mahnungen`.

**Example Request Payload:**
```json
{
  "mahnungsNr": "sample",
  "rechnungsId": 100,
  "kundenId": 100,
  "mahnDatum": "2026-01-01T12:00:00Z",
  "mahnstufe": "sample",
  "mahngebuehr": 100,
  "verzugszinsen": 100,
  "faelligBis": "2026-01-01T12:00:00Z",
  "status": "sample"
}
```

##### 4. PUT `/api/mahnungen/:id`
Update an existing record in `Mahnungen` by primary key.
- **Response 200:** Updated `Mahnungen` object.

##### 5. DELETE `/api/mahnungen/:id`
Delete a record from `Mahnungen` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Gutschriften

**Base Endpoint:** `/api/gutschriften`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `gutschriftNr` | `VARCHAR` | - | Yes | - |
| `rechnungsId` | `INTEGER` | - | Yes | - |
| `kundenId` | `INTEGER` | - | Yes | - |
| `datum` | `DATE` | - | Yes | - |
| `status` | `ENUM` | - | Yes | - |
| `nettoBetrag` | `DECIMAL` | - | Yes | - |
| `mwStBetrag` | `DECIMAL` | - | Yes | - |
| `bruttoBetrag` | `DECIMAL` | - | Yes | - |
| `grund` | `VARCHAR` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/gutschriften`
Retrieve all records from `Gutschriften`.
- **Response 200:** Array of `Gutschriften` objects.

##### 2. GET `/api/gutschriften/:id`
Retrieve a single record from `Gutschriften` by primary key.
- **Response 200:** Single `Gutschriften` object.
- **Response 404:** Record not found.

##### 3. POST `/api/gutschriften`
Create a new record in `Gutschriften`.

**Example Request Payload:**
```json
{
  "gutschriftNr": "sample",
  "rechnungsId": 100,
  "kundenId": 100,
  "datum": "2026-01-01T12:00:00Z",
  "status": "sample",
  "nettoBetrag": 100,
  "mwStBetrag": 100,
  "bruttoBetrag": 100,
  "grund": "sample"
}
```

##### 4. PUT `/api/gutschriften/:id`
Update an existing record in `Gutschriften` by primary key.
- **Response 200:** Updated `Gutschriften` object.

##### 5. DELETE `/api/gutschriften/:id`
Delete a record from `Gutschriften` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

### 📁 Gutschriftpositionen

**Base Endpoint:** `/api/gutschriftpositionen`

#### Schema Fields
| Field Name | Type | Key | Nullable | Details |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | 🔑 PK | No | Auto Increment |
| `gutschriftId` | `INTEGER` | - | Yes | - |
| `artikelId` | `INTEGER` | - | Yes | - |
| `menge` | `DECIMAL` | - | Yes | - |
| `einzelpreis` | `DECIMAL` | - | Yes | - |
| `gesamtNetto` | `DECIMAL` | - | Yes | - |

#### Endpoints

##### 1. GET `/api/gutschriftpositionen`
Retrieve all records from `Gutschriftpositionen`.
- **Response 200:** Array of `Gutschriftpositionen` objects.

##### 2. GET `/api/gutschriftpositionen/:id`
Retrieve a single record from `Gutschriftpositionen` by primary key.
- **Response 200:** Single `Gutschriftpositionen` object.
- **Response 404:** Record not found.

##### 3. POST `/api/gutschriftpositionen`
Create a new record in `Gutschriftpositionen`.

**Example Request Payload:**
```json
{
  "gutschriftId": 100,
  "artikelId": 100,
  "menge": 100,
  "einzelpreis": 100,
  "gesamtNetto": 100
}
```

##### 4. PUT `/api/gutschriftpositionen/:id`
Update an existing record in `Gutschriftpositionen` by primary key.
- **Response 200:** Updated `Gutschriftpositionen` object.

##### 5. DELETE `/api/gutschriftpositionen/:id`
Delete a record from `Gutschriftpositionen` by primary key.
- **Response 200:** `{ "success": true, "message": "Record deleted" }`

---

## 🔍 Custom Queries & Database Views

### ⚡ Offene Rechnungen & Mahnstufen (`SELECT` Query)

**Endpoint:** `GET /api/queries/offeneRechnungenMahnstufen`

#### Selected Output Columns
| Column Name | Table | Field Name | Alias |
| :--- | :--- | :--- | :--- |
| `RechnungsNr` | `Rechnungen` | `RechnungsNr` | `-` |
| `Firmenname` | `Kunden` | `Firmenname` | `-` |
| `FaelligDatum` | `Rechnungen` | `FaelligDatum` | `-` |
| `ZahlungsStatus` | `Rechnungen` | `ZahlungsStatus` | `-` |
| `OffenerBetrag` | `Rechnungen` | `OffenerBetrag` | `-` |

---

## 🔗 Database Relationships & Foreign Keys

| Primary / Source Table | Primary Key | Foreign / Child Table | Foreign Key | Type | On Delete |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Kunden` | `Id` | `Angebote` | `KundenId` | `1:n` | `NO ACTION` |
| `Kunden` | `Id` | `Auftraege` | `KundenId` | `1:n` | `NO ACTION` |
| `Kunden` | `Id` | `Rechnungen` | `KundenId` | `1:n` | `NO ACTION` |
| `Kunden` | `Id` | `Mahnungen` | `KundenId` | `1:n` | `NO ACTION` |
| `Kunden` | `Id` | `Gutschriften` | `KundenId` | `1:n` | `NO ACTION` |
| `Angebote` | `Id` | `Angebotspositionen` | `AngebotsId` | `1:n` | `CASCADE` |
| `Angebote` | `Id` | `Auftraege` | `AngebotsId` | `1:n` | `NO ACTION` |
| `Auftraege` | `Id` | `Auftragspositionen` | `AuftragsId` | `1:n` | `CASCADE` |
| `Auftraege` | `Id` | `Rechnungen` | `AuftragsId` | `1:n` | `NO ACTION` |
| `Rechnungen` | `Id` | `Rechnungspositionen` | `RechnungsId` | `1:n` | `CASCADE` |
| `Rechnungen` | `Id` | `Mahnungen` | `RechnungsId` | `1:n` | `CASCADE` |
| `Rechnungen` | `Id` | `Gutschriften` | `RechnungsId` | `1:n` | `NO ACTION` |
| `Gutschriften` | `Id` | `Gutschriftpositionen` | `GutschriftId` | `1:n` | `CASCADE` |
| `Artikel` | `Id` | `Angebotspositionen` | `ArtikelId` | `1:n` | `NO ACTION` |
| `Artikel` | `Id` | `Auftragspositionen` | `ArtikelId` | `1:n` | `NO ACTION` |
| `Artikel` | `Id` | `Rechnungspositionen` | `ArtikelId` | `1:n` | `NO ACTION` |
| `Artikel` | `Id` | `Gutschriftpositionen` | `ArtikelId` | `1:n` | `NO ACTION` |

---

## 🛠 System & Utility Endpoints

### GET `/api/health`
Health check endpoint to verify backend server status.
- **Response 200:** `{ "status": "ok", "service": "FakturierungPro" }`

