# DB Studio API & Storage Architecture

## 1. Storage Services API (`/services/storageService.ts`)

Das modulare Speichersystem priorisiert die browserinterne **IndexedDB**-Engine für vollständige Offline-Autarkie und Privatsphäre, und bietet flexible Schnittstellen für Cloud-Synchronisation und relationale SQL-Datenbanken (MySQL, PostgreSQL, SQLite, MSSQL).

### Core Methods

| Methode | Parameter | Rückgabe | Beschreibung |
|---|---|---|---|
| `getAllProjects()` | - | `Promise<Project[]>` | Lädt Metadaten aller gespeicherten Projekte aus IndexedDB. |
| `getProjectById(id)` | `id: string` | `Promise<Project \| null>` | Lädt ein vollständiges Projekt inklusive Schemas und Daten. |
| `saveProjectToStorage(project)` | `project: Project` | `Promise<void>` | Speichert Projekt getrennt in Metadaten- und Payload-Store. |
| `deleteProjectFromStorage(id)` | `id: string` | `Promise<void>` | Entfernt Metadaten und Payload eines Projekts. |
| `updateProjectScope(id, isCloud)` | `id: string, isCloud: boolean` | `Promise<void>` | Ändert den Speicherbereich zwischen Privat (IndexedDB) und Cloud Workspace. |
| `exportProjectToFile(id)` | `id: string` | `Promise<void>` | Exportiert Projekt als eigenständige `.dbsp` / `.json` Datei. |
| `importProjectFromFile(file)` | `file: File` | `Promise<Project>` | Importiert und validiert eine Schema- / Projektdatei in IndexedDB. |

---

## 2. Project Scopes & Classification

1. **Privat (IndexedDB)**
   - **Kennzeichnung:** `isCloud: false`
   - **Speicherort:** Lokaler Browser-Speicher (`IDBDatabase` "DBStudioProDB")
   - **Vorteile:** 100% lokal, offline-fähig, keine Server-Konnektivität erforderlich.

2. **Cloud Workspace**
   - **Kennzeichnung:** `isCloud: true`
   - **Speicherort:** Zentralisierte Cloud-Synchronisation / Multi-User Workspace
   - **Vorteile:** Ortsunabhängiger Zugriff, geteilte Schemas und Kollaboration.

---

## 3. Backend & Relational Database APIs

Alle Datentypen und Schemas in DB Studio sind abstrahiert, sodass jederzeit ein nahtloser Wechsel zu relationalen SQL-Backends möglich ist:

- **PostgreSQL / MySQL / SQLite / MSSQL Code-Generierung**: Exportierbare DDL-Skripte und Migrationsdateien
- **REST / Swagger / GraphQL Endpunkte**: Standardisierte Schnittstellen für Entity-CRUD-Operationen
- **Offline-Sync Engine**: Bidirektionale Replikation zwischen IndexedDB und Remote SQL-Servern mit Konfliktlösung.

---

## 4. Page Designer & SDUI Component Ribbon Actions

Die visuellen Seiten- und SDUI-Designer-Komponenten kommunizieren über entkoppelte Aktions-Trigger (`pageActionTrigger`), die sowohl von der Ribbon-Menüleiste als auch von Hotkeys und externen Plugins angesteuert werden können:

| Aktion | Payload | Beschreibung |
|---|---|---|
| `page_add_component` | `{ type: PageComponentType, defaultProps?: Record<string, any> }` | Fügt ein neues UI-Element (KPI, Subform, Grid, Tabs etc.) in den selektierten Container ein. |
| `page_apply_preset` | `PageComponent` | Lädt ein vollständiges Seiten-Layout (z.B. Master-Detail 360°, KPI Dashboard). |
| `page_open_presets_modal` | - | Öffnet den visuellen Vorlagen- und Preset-Katalog. |
| `page_clear_layout` | - | Setzt das aktive Layout auf einen leeren Root-Container zurück. |
| `page_live_preview` | - | Schaltet direkt zur interaktiven Live-Vorschau der Seite um (`page_view`). |

