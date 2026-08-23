export interface ButtonInfoItem {
  id: string;
  label: string;
  category: 'home' | 'create' | 'external' | 'pages' | 'deploy' | 'header' | 'workspace';
  categoryLabel: string;
  iconName: string;
  description: string;
  dbAction: string; // Action related to IndexedDB / Backend
  shortcut?: string;
  actionKey: string;
  badge?: string;
}

export const BUTTON_INFO_DATA: ButtonInfoItem[] = [
  // --- HOME / START ---
  {
    id: 'relationships',
    label: 'Beziehungen',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Network',
    description: 'Öffnet den visuellen ER-Diagramm-Editor zur Verwaltung von Fremdschlüssel-Beziehungen zwischen Tabellen in IndexedDB.',
    dbAction: 'Liest und aktualisiert store.relationships in IndexedDB (Object Store: projects).',
    actionKey: 'relationships',
    badge: 'ERD'
  },
  {
    id: 'form_toggle_filter',
    label: 'Filtern',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Filter',
    description: 'Schaltet die Schnellfilter-Zeile in der aktiven Datenansicht ein oder aus.',
    dbAction: 'Führt eine reaktive In-Memory / IndexedDB Volltextsuche durch.',
    actionKey: 'form_toggle_filter'
  },
  {
    id: 'form_sort_asc',
    label: 'Aufsteigend',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'ArrowUpAZ',
    description: 'Sortiert die Datensätze der gewählten Spalte aufsteigend (A-Z, 0-9).',
    dbAction: 'In-Memory Slicing & IndexedDB Index-Order.',
    actionKey: 'form_sort_asc'
  },
  {
    id: 'form_sort_desc',
    label: 'Absteigend',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'ArrowDownZA',
    description: 'Sortiert die Datensätze der gewählten Spalte absteigend (Z-A, 9-0).',
    dbAction: 'In-Memory Slicing & IndexedDB Index-Order.',
    actionKey: 'form_sort_desc'
  },
  {
    id: 'form_clear_sort',
    label: 'Sortierung entfernen',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'RotateCcw',
    description: 'Setzt die angewendete Spaltensortierung zurück auf die ursprüngliche Reihenfolge.',
    dbAction: 'Stellt Standard-Sortierung nach Primärschlüssel (ID) her.',
    actionKey: 'form_clear_sort'
  },
  {
    id: 'form_refresh',
    label: 'Alle aktualisieren',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'RefreshCw',
    description: 'Lädt alle Tabellendaten und Ansichten neu aus dem lokalen IndexedDB-Speicher.',
    dbAction: 'Re-fetch aller Object Stores aus IndexedDB (IndexedDB -> State).',
    shortcut: 'F5 / Ctrl+R',
    actionKey: 'form_refresh'
  },
  {
    id: 'form_new_record',
    label: 'Neu (Datensatz)',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Plus',
    description: 'Erstellt einen neuen leeren Datensatz in der aktuell geöffneten Tabelle.',
    dbAction: 'Generiert auto-inkrementierte ID & schreibt Datensatz in IndexedDB.',
    shortcut: 'Ctrl+N',
    actionKey: 'form_new_record'
  },
  {
    id: 'form_save_record',
    label: 'Speichern (Datensatz)',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Save',
    description: 'Speichert ausstehende Änderungen des aktuellen Datensatzes dauerhaft in der IndexedDB.',
    dbAction: 'Transaktionaler PUT-Befehl in den Tabellen-Object-Store der IndexedDB.',
    shortcut: 'Ctrl+S',
    actionKey: 'form_save_record'
  },
  {
    id: 'form_delete_record',
    label: 'Löschen (Datensatz)',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Trash2',
    description: 'Entfernt den markierten Datensatz nach Bestätigung aus der IndexedDB.',
    dbAction: 'Transaktionales DELETE im IndexedDB Object Store.',
    shortcut: 'Entf / Del',
    actionKey: 'form_delete_record'
  },
  {
    id: 'audit_trail',
    label: 'Audit Trail',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Shield',
    description: 'Zeigt die Historie aller Datenänderungen, Logins und Transaktionen.',
    dbAction: 'Liest Protokolldaten aus dem IndexedDB Store sys_audit_log.',
    actionKey: 'audit_trail'
  },
  {
    id: 'security_manager',
    label: 'RBAC / Rechte',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'ShieldCheck',
    description: 'Öffnet den Rollen- und Rechte-Manager zur Steuerung des Zugriffs auf Tabellen und Formulare.',
    dbAction: 'Verwaltet Berechtigungsmatrizen im IndexedDB Store sys_permissions.',
    actionKey: 'security_manager'
  },
  {
    id: 'logic_designer',
    label: 'Makros & Logik',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Cpu',
    description: 'Öffnet den visuellen Designer für Automatisierungsmakros und Event-Trigger.',
    dbAction: 'Speichert Makro-Knoten in IndexedDB.',
    actionKey: 'logic_designer'
  },
  {
    id: 'dbstudio_backend',
    label: 'Backend & API',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'Code',
    description: 'Verwaltet die Schnittstellen für die Synchronisation zwischen IndexedDB und relationalen SQL/MySQL Backends.',
    dbAction: 'Steuert REST/GraphQL Endpunkte und Dateisystem-Caches.',
    actionKey: 'dbstudio_backend'
  },
  {
    id: 'tickets_board',
    label: 'Kanban-Board',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'ClipboardList',
    description: 'Öffnet das interaktive Task- & Ticket-Board mit Drag & Drop Spaltenwechsel.',
    dbAction: 'Status-Update per mauiIndexedDb.update(...) in IndexedDB.',
    actionKey: 'tickets_board'
  },
  {
    id: 'version_control',
    label: 'Git-Schema',
    category: 'home',
    categoryLabel: 'Start / Home',
    iconName: 'History',
    description: 'Verwaltet Schema-Versionen und Snapshots der Datenbank im Zeitverlauf.',
    dbAction: 'Erstellt Snapshots im IndexedDB Store sys_snapshots.',
    actionKey: 'version_control'
  },

  // --- ERSTELLEN / CREATE ---
  {
    id: 'create_table',
    label: 'Tabelle',
    category: 'create',
    categoryLabel: 'Erstellen',
    iconName: 'Table',
    description: 'Erstellt eine neue leere Datenbank-Tabelle mit Standard-Feldern in IndexedDB.',
    dbAction: 'Legt ein neues Schema & Object Store in IndexedDB an.',
    actionKey: 'create_table'
  },
  {
    id: 'create_table_designer',
    label: 'Tabellen-Entwurf',
    category: 'create',
    categoryLabel: 'Erstellen',
    iconName: 'Layout',
    description: 'Öffnet den visuellen Designer zur Definition von Feldern, Datentypen und Indizes.',
    dbAction: 'Aktualisiert die Schema-Metadaten der IndexedDB.',
    actionKey: 'create_table_designer'
  },
  {
    id: 'create_query',
    label: 'Abfrage-Entwurf',
    category: 'create',
    categoryLabel: 'Erstellen',
    iconName: 'Search',
    description: 'Erstellt eine neue relationale Abfrage (SELECT, JOIN, Filter) auf IndexedDB-Tabellen.',
    dbAction: 'Generiert ANSI-SQL kompatible Query-Objekte.',
    actionKey: 'create_query'
  },
  {
    id: 'query_wizard_duplicate',
    label: 'Duplikat-Assistent',
    category: 'create',
    categoryLabel: 'Erstellen',
    iconName: 'Wand2',
    description: 'Findet doppelte Datensätze in ausgewählten Feldern einer IndexedDB-Tabelle.',
    dbAction: 'Führt eine automatisierte Gruppenanalyse über IndexedDB aus.',
    actionKey: 'query_wizard_duplicate'
  },
  {
    id: 'create_form',
    label: 'Formular',
    category: 'create',
    categoryLabel: 'Erstellen',
    iconName: 'FileText',
    description: 'Erstellt ein neues Eingabeformular für eine spezifische Tabelle.',
    dbAction: 'Speichert Formular-Layouts im IndexedDB-Projekt.',
    actionKey: 'create_form'
  },
  {
    id: 'create_report',
    label: 'Bericht',
    category: 'create',
    categoryLabel: 'Erstellen',
    iconName: 'Printer',
    description: 'Erstellt einen druckfähigen Bericht oder ein Export-Dokument.',
    dbAction: 'Speichert Berichtsdefinitionen in IndexedDB.',
    actionKey: 'create_report'
  },

  // --- EXTERNE DATEN ---
  {
    id: 'excel_import',
    label: 'Excel Import',
    category: 'external',
    categoryLabel: 'Externe Daten',
    iconName: 'FileSpreadsheet',
    description: 'Importiert .xlsx / .xls Dateien mit automatischer Datentyp-Erkennung und SVERWEIS-Beziehungsvorschlägen.',
    dbAction: 'Parsiverfahren via SheetJS -> Speichern in neue IndexedDB Tables.',
    actionKey: 'excel_import'
  },
  {
    id: 'access_import',
    label: 'Access XML Import',
    category: 'external',
    categoryLabel: 'Externe Daten',
    iconName: 'Database',
    description: 'Lieste MS Access XML dataroot Dateien und wandelt sie in relationale IndexedDB Tabellen um.',
    dbAction: 'DOMParser -> Bulk INSERT in IndexedDB.',
    actionKey: 'access_import'
  },
  {
    id: 'dummy_data_wizard',
    label: 'Dummy-Daten',
    category: 'external',
    categoryLabel: 'Externe Daten',
    iconName: 'Sparkles',
    description: 'Generiert zufällige Test-Datensätze (Namen, Daten, Zahlen) für Tabellen.',
    dbAction: 'Füllt IndexedDB Object Stores mit Testdaten.',
    actionKey: 'dummy_data_wizard'
  },
  {
    id: 'export_excel',
    label: 'Excel Export',
    category: 'external',
    categoryLabel: 'Externe Daten',
    iconName: 'Download',
    description: 'Exportiert die ausgewählte Tabelle als strukturierte .xlsx Datei.',
    dbAction: 'Liest Daten aus IndexedDB -> Generiert Binary Blob Download.',
    actionKey: 'export_excel'
  },

  // --- PAGES & SDUI ---
  {
    id: 'new_page',
    label: 'Neue Custom-Page',
    category: 'pages',
    categoryLabel: 'Pages & SDUI',
    iconName: 'LayoutGrid',
    description: 'Erstellt eine neue, frei gestaltbare Server-Driven-UI Seite mit dynamischer Datenbindung.',
    dbAction: 'Speichert Page-Trees im IndexedDB Store.',
    actionKey: 'new_page'
  },
  {
    id: 'calendar_view',
    label: 'Kalender',
    category: 'pages',
    categoryLabel: 'Pages & SDUI',
    iconName: 'Calendar',
    description: 'Öffnet den interaktiven Terminplaner mit Tag-/Woche-/Monatsansicht und Zeitraster.',
    dbAction: 'Bi-direktionales Data-Binding mit Termin-Tabellen in IndexedDB.',
    actionKey: 'calendar_view'
  },

  // --- BEREITSTELLUNG ---
  {
    id: 'project_backup',
    label: 'Projekt-Backup',
    category: 'deploy',
    categoryLabel: 'Bereitstellung',
    iconName: 'HardDrive',
    description: 'Exportiert das komplette Datenbank-Projekt inklusive aller Tabellendaten und Layouts als JSON-Datei.',
    dbAction: 'Vollständiger Dump aller IndexedDB Object Stores.',
    shortcut: 'Ctrl+B',
    actionKey: 'project_backup'
  },
  {
    id: 'whitelabel_settings',
    label: 'Whitelabel & Branding',
    category: 'deploy',
    categoryLabel: 'Bereitstellung',
    iconName: 'Sparkles',
    description: 'Passt App-Name, Logos, Farbschemata und Lizenzierungs-Texte an.',
    dbAction: 'Aktualisiert sys_config im IndexedDB-Projekt.',
    actionKey: 'whitelabel_settings'
  }
];
