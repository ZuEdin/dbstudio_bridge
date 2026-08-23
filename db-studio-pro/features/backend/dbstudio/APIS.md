# DB Studio Pro - API & Database Architecture Specifications

This document outlines the API specifications, database design, and synchronization patterns for DB Studio Pro. The architecture is engineered to be offline-first using **IndexedDB**, with seamless migration pathways to relational databases like **PostgreSQL**, **MySQL**, and **SQLite**.

---

## 1. Database Architecture Overview

```
                      ┌──────────────────────┐
                      │  IndexedDB (Browser) │
                      │  - projects_data     │
                      │  - schema_metadata   │
                      └──────────┬───────────┘
                                 │
                        [ Live Sync Bridge ]
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Self-Host Backend API │
                     │ (Node.js / .NET / Go) │
                     └───────────┬───────────┘
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  PostgreSQL  │          │    MySQL     │          │    SQLite    │
│  - RLS/Tenant│          │  - Standard  │          │  - Local     │
└──────────────┘          └──────────────┘          └──────────────┘
```

---

## 2. Core Metadatabase Schema (SQL & Drizzle)

The central schema used by DB Studio Pro to persist and collaborate on table designs, custom queries, relationship maps, and team sync history.

### Table: `sys_projects`
```sql
CREATE TABLE sys_projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  db_type VARCHAR(50) DEFAULT 'SQLite',
  language VARCHAR(50) DEFAULT 'nodejs',
  is_cloud INTEGER DEFAULT 0,
  owner_id VARCHAR(100) DEFAULT 'admin',
  last_modified BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `sys_project_payloads`
Stores full-state JSON dumps from IndexedDB to guarantee backup reliability.
```sql
CREATE TABLE sys_project_payloads (
  project_id VARCHAR(36) PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);
```

### Table: `sys_tables`
```sql
CREATE TABLE sys_tables (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_api_import INTEGER DEFAULT 0,
  api_config_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);
```

### Table: `sys_fields`
```sql
CREATE TABLE sys_fields (
  id VARCHAR(36) PRIMARY KEY,
  table_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_primary_key INTEGER DEFAULT 0,
  is_auto_increment INTEGER DEFAULT 0,
  is_unique INTEGER DEFAULT 0,
  is_nullable INTEGER DEFAULT 1,
  default_value VARCHAR(255),
  comment TEXT,
  FOREIGN KEY (table_id) REFERENCES sys_tables(id) ON DELETE CASCADE
);
```

### Table: `sys_sync_history`
```sql
CREATE TABLE sys_sync_history (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- 'LOCAL_TO_CLOUD' | 'CLOUD_TO_LOCAL'
  implementation_prompt TEXT,
  metadata_payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);
```

---

## 3. Server-Bridge API Endpoint Specifications

The following endpoints manage schema deployment, live synchronization, and runtime database management on the self-host backend.

### 3.1. Health & Auto-Detection
* **Endpoint:** `GET /api/health`
* **Description:** Diagnostic hook used by DB Studio Pro to auto-detect active backends and determine connectivity status.
* **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "DB Studio Self-Host",
  "version": "1.0.0",
  "timestamp": "2026-07-28T07:30:00Z"
}
```

### 3.2. List Projects
* **Endpoint:** `GET /api/projects`
* **Description:** Retrieve all active design projects.
* **Response (200 OK):**
```json
[
  {
    "id": "proj_billing",
    "name": "Kunden- & Rechnungsverwaltung",
    "description": "Zentrales Rechnungsprojekt des Finanz-Teams",
    "db_type": "PostgreSQL",
    "is_cloud": 1,
    "owner_id": "zuboedin@gmail.com"
  }
]
```

### 3.3. Create / Sync Project
* **Endpoint:** `POST /api/projects`
* **Description:** Push local IndexedDB metadata schema and project files to the cloud hub.
* **Payload:**
```json
{
  "id": "proj_billing",
  "name": "Kunden- & Rechnungsverwaltung",
  "description": "Zentrales Rechnungsprojekt des Finanz-Teams",
  "dbType": "PostgreSQL",
  "language": "nodejs",
  "data": {
    "tables": [],
    "queries": [],
    "relationships": [],
    "updatedAt": "2026-07-28T07:30:00Z"
  }
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "id": "proj_billing",
  "name": "Kunden- & Rechnungsverwaltung"
}
```

### 3.4. Team Management
* **Endpoint:** `POST /api/team/members`
* **Description:** Invite a developer to collaborate on the project schema.
* **Payload:**
```json
{
  "email": "sarah.web@firma.de",
  "name": "Sarah Müller",
  "role": "Entwickler",
  "source": "Lokal"
}
```
* **Response (201 Created):**
```json
{
  "email": "sarah.web@firma.de",
  "name": "Sarah Müller",
  "role": "Entwickler",
  "source": "Lokal"
}
```

### 3.5. Live Schema Push
* **Endpoint:** `POST /api/sync`
* **Description:** Submit a central DDL script and audit record detailing schema changes.
* **Payload:**
```json
{
  "projectId": "proj_billing",
  "prompt": "Einkaufslisten-Tabelle hinzufügen",
  "metadata": {
    "tablesCount": 14,
    "queriesCount": 5
  }
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "syncId": "sync_92hf83k1"
}
```

### 3.6. Database Synchronisation Controller (Auto-Sync)
Endpoints exposed on the `.NET C#` and `.NET Core` self-host setups to provide connection management, synchronization logging, and offline backup state simulation.

#### 3.6.1. Connection Status
* **Endpoint:** `GET /api/db/connection-status`
* **Description:** Checks the current state of the backend's external database server connection.
* **Response (200 OK):**
```json
{
  "connected": true,
  "config": {
    "host": "localhost",
    "database": "production_db",
    "type": "mssql"
  },
  "logsCount": 2,
  "lastSync": "2026-07-28T07:35:00Z",
  "message": "Verbindung zum externen SQL Server ist über .NET WebAPI AKTIV."
}
```

#### 3.6.2. Toggle Connection State (Offline Simulation)
* **Endpoint:** `POST /api/db/connection-toggle`
* **Description:** Forcefully simulate a transition into offline backup mode or restore connectivity.
* **Payload:**
```json
{
  "connected": false
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "connected": false
}
```

#### 3.6.3. Retrieve Sync Logs
* **Endpoint:** `GET /api/db/sync-logs`
* **Description:** Fetch the full chronological logs detailing DDL attempts, connection changes, and backup checkpoints.
* **Response (200 OK):**
```json
[
  {
    "timestamp": "2026-07-28T07:20:00Z",
    "action": "CONNECT",
    "details": "Erfolgreich mit SQL Server über .NET WebAPI verbunden",
    "status": "SUCCESS"
  },
  {
    "timestamp": "2026-07-28T07:25:00Z",
    "action": "SCHEMA_SCAN",
    "details": "Dapper/EF Core DB-Kontext initialisiert.",
    "status": "SUCCESS"
  }
]
```

#### 3.6.4. Schema Sync Trigger
* **Endpoint:** `POST /api/db/sync-all`
* **Description:** Submits the fully generated DB design schema to the database. Falls back to safe offline buffering if the SQL connection is toggled off.
* **Payload:**
```json
{}
```
* **Response (200 OK - Connected):**
```json
{
  "success": true,
  "externalConnected": true,
  "timestamp": "2026-07-28T07:35:00Z",
  "message": ".NET WebAPI Synchronisation erfolgreich!"
}
```
* **Response (200 OK - Offline Mode):**
```json
{
  "success": true,
  "externalConnected": false,
  "timestamp": "2026-07-28T07:35:00Z",
  "message": "SQL Server ist offline. .NET WebAPI puffert lokale Daten."
}
```

---

## 4. Dynamic Live Server Runner API (Port Ingress)

This module handles running isolated microservice instances on ports between `10000` and `60000`.

### 4.1. Run Live Code Template
* **Endpoint:** `POST /api/deploy/run`
* **Description:** Spin up a background Node.js or .NET process on a dynamically allocated port.
* **Payload:**
```json
{
  "code": "// Code content...",
  "language": "nodejs",
  "projectName": "DB Studio Live App"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "port": 12843,
  "pid": 84210,
  "logs": [
    "[RUNNER] Initializing environment...",
    "[RUNNER] Server listening on port 12843"
  ]
}
```

### 4.2. Stop Deployed Runner
* **Endpoint:** `POST /api/deploy/stop/:port`
* **Description:** Terminate the isolated process listening on the specified port.
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Process on port 12843 stopped."
}
```

---

## 5. Active Directory (AD) Controller & User Identity APIs

These endpoints provide live integration with Windows Active Directory / LDAP servers, translating domain groups to native roles and preventing pseudo-user fallbacks when AD is active.

### 5.1. Current AD User Profile
* **Endpoint:** `GET /api/ad/me`
* **Description:** Retrieves the fully hydrated AD profile of the currently logged-in user if AD is configured.
* **Response (200 OK):**
```json
{
  "username": "firma\\zubeyr",
  "displayName": "Zubeyr",
  "email": "zuboedin@gmail.com",
  "department": "Administration",
  "groups": ["firma\\administratoren", "firma\\leitung"]
}
```

### 5.2. WhoAmI Endpoint
* **Endpoint:** `GET /api/ad/whoami`
* **Description:** Provides lightweight identity checks and security role arrays based on Active Directory domain context.
* **Response (200 OK):**
```json
{
  "username": "firma\\zubeyr",
  "userId": "ad_zubeyr",
  "isAuthenticated": true,
  "roles": ["Administrator", "Manager"]
}
```

### 5.3. AD User Search
* **Endpoint:** `GET /api/ad/search?q={query}`
* **Description:** Searches for active domain users by username, display name, or email address.
* **Response (200 OK):**
```json
[
  {
    "username": "firma\\sarah.web",
    "displayName": "Sarah Müller",
    "email": "sarah.web@firma.de",
    "department": "IT-Entwicklung",
    "groups": ["firma\\entwickler", "firma\\mitarbeiter", "firma\\coder"]
  }
]
```

---

## 6. Live Database 2-Way Sync & DDL Execution APIs

These endpoints provide live bidirectional synchronization between the local browser **IndexedDB** database and remote SQL servers (MSSQL, PostgreSQL, MySQL, SQLite).

### 6.1. Execute DDL / DML Statements on Live Server
* **Endpoint:** `POST /api/db/execute-ddl`
* **Description:** Executes raw schema definition (CREATE TABLE, ALTER) or data inserts on the remote SQL server during Upload synchronization.
* **Payload:**
```json
{
  "ddl": "CREATE TABLE [dbo].[Customers] ([Id] INT PRIMARY KEY, [Name] NVARCHAR(255));",
  "type": "mssql",
  "host": "localhost",
  "port": "1433",
  "database": "production_db",
  "username": "sa",
  "password": "Password123!",
  "ssl": false
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "DDL/DML Befehle erfolgreich auf dem SQL-Server ausgeführt!"
}
```

### 6.2. Server Introspection & Schema Extraction
* **Endpoint:** `POST /api/db/introspect`
* **Description:** Reads `information_schema.tables` and `information_schema.columns` to build live table schema representations for Download synchronization into IndexedDB.
* **Payload:**
```json
{
  "type": "postgresql",
  "connectionString": "postgresql://user:pass@localhost:5432/production_db"
}
```
* **Response (200 OK):**
```json
{
  "tables": [
    {
      "id": "tbl_customers",
      "name": "Customers",
      "fields": [
        { "name": "Id", "type": "INTEGER", "isPrimaryKey": true },
        { "name": "Name", "type": "VARCHAR", "length": 255 }
      ],
      "data": []
    }
  ]
}
```
