# DB Studio Pro - Button Information & Modal API Specification

Diese Dokumentation beschreibt die Datenstrukturen, IndexedDB-Mappings und API-Endpunkte für die Verwaltung und Anzeige von Schaltflächen-Informationen (Button-Dokumentation) in **DB Studio Pro**.

---

## 1. Übersicht & Zielsetzung

Die Schaltflächen-Informationen ermöglichen es Benutzern, Funktionen, Tastenkombinationen (Shortcuts) und Datenbank-Auswirkungen (IndexedDB-Transaktionen / SQL-Befehle) der einzelnen UI-Elemente direkt im Anwendungskontext abzurufen.

Die Daten werden primär im lokalen **IndexedDB**-Speicher abgelegt und können reaktiv über den `useUIStore` in einem dezimierten Modalfenster (`ButtonInfoModal`) durchsucht und gefiltert werden.

---

## 2. IndexedDB Schema-Definition (`sys_button_info`)

Die Schaltflächen-Metadaten können bei Bedarf im IndexedDB Store `sys_button_info` persistiert werden:

| Feld (KeyPath) | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` (KeyPath) | `string` | Eindeutige Kennung der Schaltfläche (z. B. `form_refresh`, `project_backup`) |
| `label` | `string` | Name/Beschriftung im UI (z. B. "Alle aktualisieren") |
| `category` | `string` | Kategorie/Tab (`home`, `create`, `external`, `pages`, `deploy`) |
| `categoryLabel` | `string` | Anzeigename der Kategorie |
| `iconName` | `string` | Lucide-React Icon Name |
| `description` | `string` | Detaillierte Funktionsbeschreibung |
| `dbAction` | `string` | Beschreibung der auslösenden IndexedDB / SQL Transaktion |
| `shortcut` | `string` (optional) | Tastaturkürzel (z. B. `Ctrl+S`, `F5`) |
| `actionKey` | `string` | Interner Action-Trigger Key |

---

## 3. Generische API-Schnittstellen

### 3.1 Abrufen aller Schaltflächen-Informationen
#### `GET /api/button-info`
- **IndexedDB**: Lädt alle Datensätze aus dem Object Store `sys_button_info` oder aus dem lokalen In-Memory Katalog `BUTTON_INFO_DATA`.
- **Rückgabe**: `Promise<ButtonInfoItem[]>`

### 3.2 Filtern nach Kategorie oder Suchbegriff
#### `GET /api/button-info?category=:category&search=:query`
- **IndexedDB**: Filtert die Datensätze lokal nach Kategorie und Suchbegriff im Titel, der Beschreibung oder dem Tastenkürzel.
- **Rückgabe**: `Promise<ButtonInfoItem[]>`

### 3.3 Ausführen einer Schaltflächen-Aktion
#### `POST /api/button-info/execute/:actionKey`
- **IndexedDB / UI**: Triggert die verknüpfte Aktion im `useUIStore` / `useProjectStore`.
- **Rückgabe**: `Promise<{ success: boolean, actionKey: string }>`

---

## 4. Migration & Multi-Backend Kompatibilität

Wenn das System von der lokalen IndexedDB zu einem relationalen MySQL-, PostgreSQL- oder SQLite-Server migriert wird:
1. `sys_button_info` wird als SQL-Tabelle `sys_button_info` angelegt.
2. Die UI-Komponente `ButtonInfoModal.tsx` bleibt unangetastet, da sie ausschließlich mit der entkoppelten Store- / API-Schicht interagiert.
