# DB Studio Pro - SDUI Custom Components API-Spezifikation

Diese Spezifikation dokumentiert das JSON-basierte Konfigurationsschema der **Server-Driven UI (SDUI) Custom Components** in **DB Studio Pro**. Jede Custom Component ist so entworfen, dass sie sowohl im visuellen Designer konfiguriert als auch direkt im Browser (IndexedDB) oder über ein Server-Backend dynamisch gerendert werden kann.

---

## 1. Komponenten-Struktur (CustomComponent Schema)

Eine registrierte Custom Component besitzt die folgende Struktur:

```typescript
export interface CustomComponent {
  id: string;               // Eindeutige UUID der Komponente
  name: string;             // Name der Komponente (z. B. "UmsatzHistorie")
  description?: string;     // Beschreibung für Designer/Developer
  type: 'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board'; // Basis-Renderer-Typ
  configuration: Record<string, any>; // Dynamisches JSON-Konfigurations-Schema
}
```

---

## 2. Spezifikationen der JSON-Konfigurationen (`configuration`)

### 2.1 Tabellen- & Karten-Layouts (`table_view`)

Dieser Typ unterstützt zwei Layout-Modi: **Tabelle** (Standard-HTML-Table mit `<tr>`) und **Karten-Raster** (Visual Cards Grid).

#### JSON Schema:
```json
{
  "dataSourceType": "table",      // "table" oder "query"
  "dataSourceId": "table-uuid",    // ID der Tabelle oder Abfrage
  "layoutMode": "table",          // "table" oder "grid"
  "title": "Umsatzübersicht",     // Header-Titel (unterstützt Platzhalter)
  "pageSize": 5,                  // Anzahl der Zeilen/Karten pro Seite
  "tableStyle": "striped",        // Für Layout "table": "striped", "compact", "bordered", "flat"
  "enableSearch": true,           // Globale Suche aktivieren
  "searchPlaceholder": "Suchen...",
  
  "enableFilters": true,          // Filterleiste über Tabelle aktivieren
  "filterFields": ["Status", "Ort"], // Felder, nach denen gefiltert werden kann
  "enableSorting": true,          // Spalten-Sortierung aktivieren (Anzeige von Sortier-Icons)
  "defaultSortField": "Umsatz",   // Standardmäßig vorsortierte Spalte
  "defaultSortOrder": "desc",     // Standard-Sortierrichtung: "asc" oder "desc"

  "columns": [                    // Spalten-Definitionen (nur für Layout "table")
    {
      "field": "id",              // Feldname aus der Datenquelle
      "title": "ID",              // Spaltenüberschrift im Header
      "width": "80px",            // Feste Breite oder "auto"
      "align": "left",            // Textausrichtung: "left", "center", "right"
      "type": "text",             // Zelltyp: "text", "badge", "currency", "date", "number"
      "footerType": "none"        // Footer-Aggregat: "none", "sum", "avg", "count", "custom"
    },
    {
      "field": "Umsatz",
      "title": "Umsatz (€)",
      "width": "auto",
      "align": "right",
      "type": "currency",
      "footerType": "sum"         // Berechnet automatisch die Summe im Statischen Footer
    }
  ],

  "cardGridCols": 3,              // Für Layout "grid": Anzahl der Spalten (1-4)
  "cardShadow": "sm",             // Karten-Schatten: "none", "sm", "md", "lg"
  "cardBorder": "slate",          // Karten-Rahmen: "none", "slate", "indigo"
  "cardTemplate": [               // Struktur der wiederholten Karte (nur für Layout "grid")
    {
      "type": "badge",            // Elementtyp: "title", "subtitle", "badge", "description", "button"
      "field": "Status",          // Feldname aus der Datenquelle
      "label": "Status",          // Optionales Präfix-Label
      "style": "bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full" // Tailwind-Stil
    },
    {
      "type": "title",
      "field": "Name",
      "style": "text-sm font-bold text-slate-800"
    }
  ]
}
```

---

### 2.2 Diagramm-Layouts (`chart_view`)

Visualisiert Daten als interaktive Recharts- oder D3-Komponenten.

#### JSON Schema:
```json
{
  "chartType": "bar",             // "bar", "line", "area", "pie"
  "title": "Monatlicher Umsatz",
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "xAxisKey": "Month",            // Spalte für die X-Achse
  "series": [                     // Datenreihen auf der Y-Achse
    {
      "key": "Revenue",
      "label": "Umsatz (€)",
      "color": "#3b82f6"          // Hexadezimaler Farbcode
    }
  ]
}
```

---

### 2.3 Formular-Einbettung (`form_view`)

Bettet vordefinierte CRUD-Formulare nahtlos ein.

#### JSON Schema:
```json
{
  "formId": "form-uuid",          // ID des registrierten Formulars
  "formMode": "create",           // "create" (INSERT) oder "edit" (UPDATE)
  "hideHeader": false,            // Kopfzeile ausblenden
  "hideActions": false            // Aktionsbuttons ausblenden (Speichern/Abbrechen)
}
```

---

### 2.4 Dynamische Texte (`text`)

Ermöglicht das Anzeigen personalisierter oder dynamic-bound Textbeschreibungen.

#### JSON Schema:
```json
{
  "text": "Hallo {name}, Ihr aktueller Status ist: {Status}!", // Platzhalter in {}
  "fontSize": "text-lg",          // "text-xs", "text-sm", "text-base", "text-lg", "text-2xl"
  "fontWeight": "font-bold",      // "font-normal", "font-medium", "font-semibold", "font-bold"
  "colorClass": "text-indigo-900",// Textfarbe
  "alignment": "text-left"        // "text-left", "text-center", "text-right"
}
```

---

### 2.5 Aktions-Buttons (`button`)

Löst client-seitige Aktionen wie Navigationen oder Zustandsänderungen aus.

#### JSON Schema:
```json
{
  "label": "Kunde ansehen",
  "actionType": "navigate",       // "submit" (Formular-Senden), "navigate", "setParam"
  "variant": "primary",           // "primary", "secondary", "danger", "outline"
  "targetPageId": "page-uuid",    // ID der Zielseite bei "navigate"
  "targetParamKey": "customerId", // Parametername bei "setParam"
  "targetParamVal": "{id}"        // Parameterwert (unterstützt dynamische Werte)
}
```

---

### 2.6 Auswahlmenüs (`dropdown`)

Rendert ein datengebundenes Dropdown-Feld für Filterungen oder Formularauswahlen.

#### JSON Schema:
```json
{
  "label": "Kunden filtern",
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "displayField": "Name",         // Angezeigter Text der Option
  "valueField": "id",             // Übertragener Wert beim Auswählen
  "placeholder": "-- Bitte wählen --"
}
```

---

### 2.7 Kennzahl-Karten (`metric_card`)

Zeigt berechnete KPI-Werte (z.B. Summe, Anzahl oder Mittelwert) aus Tabellendaten in einer ansprechenden Bento-Grid-Karte an.

#### JSON Schema:
```json
{
  "title": "Gesamtumsatz",         // Titel der Kennzahl
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "aggType": "sum",               // Berechnungstyp: "count", "sum", "avg", "min", "max", "custom"
  "aggField": "Umsatz",           // Spalte, auf die die Aggregation angewendet wird (nur bei sum, avg, min, max)
  "customValue": "24.500",        // Statischer Wert (nur wenn aggType === "custom")
  "prefix": "€ ",                 // Text vor dem Wert
  "suffix": " EUR",               // Text nach dem Wert
  "subtext": "+12% vs Vorjahr",   // Untertitel mit Trend-Beschreibung
  "themeColor": "emerald",        // Farbschema: "indigo", "emerald", "rose", "sky", "amber", "slate"
  "iconName": "TrendingUp"        // Lucide-Icon: "TrendingUp", "Users", "DollarSign", "Activity", "Calendar", "Percent", "Award", "ShoppingCart"
}
```

---

### 2.8 Aufgaben-Boards (`kanban_board`)

Gruppiert Datensätze einer Tabelle anhand einer Status-Spalte in ein vollfunktionales Kanban-Task-Board.

#### JSON Schema:
```json
{
  "title": "Aufgaben-Board",       // Board-Titel
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "groupByField": "Status",       // Die Spalte, nach der die Lanes gruppiert werden (z.B. "Status", "Kategorie")
  "titleField": "Name",           // Spaltenzuordnung für den Haupttitel der Karte
  "descField": "Email",           // Spaltenzuordnung für die Beschreibung der Karte
  "cardAccentField": "Umsatz"     // Spaltenzuordnung für den farbigen Akzent-Tag der Karte
}
```

---

### 2.9 Kalender-Ansicht (`calendar_view`)

Stellt datengebundene Datensätze in einem voll interaktiven Kalender dar (Monat, Woche, Tag, Agenda) mit automatischer Datumszuordnung. Es werden sowohl kombinierte Datetime-Felder als auch separate Spalten für Datum und Uhrzeit unterstützt.

#### JSON Schema:
```json
{
  "title": "Mein Terminplaner",   // Kalender-Titel
  "dataSourceType": "table",      // "table" oder "query" (Datenbanktabelle oder benutzerdefinierte SQL-Abfrage)
  "dataSourceId": "table-uuid",   // Eindeutige ID der verknüpften Tabelle oder Abfrage
  "startDateField": "date",       // Spaltenzuordnung für das Startdatum (DATE/DATETIME)
  "endDateField": "end_date",     // Optionale Spaltenzuordnung für das Enddatum (DATE/DATETIME)
  "startTimeField": "start_time", // Optionale Spaltenzuordnung für separate Startzeit (TIME/VARCHAR)
  "endTimeField": "end_time",     // Optionale Spaltenzuordnung für separate Endzeit (TIME/VARCHAR)
  "titleField": "name",           // Spaltenzuordnung für den Namen/Titel des Termins
  "colorField": "category_color", // Optionales Spaltenfeld für Termin-Farben (Hexadezimalwerte)
  "defaultView": "month",         // Standard-Kalenderansicht: "month", "week", "work_week", "day", "agenda"
  "views": ["month", "week", "day", "agenda"] // Array der auswählbaren Ansichten im Frontend
}
```

---

## 3. Runtime Rendering & Datenbindung (LiveNode Integration)

Im Renderer `LiveNode.tsx` wird jede Custom Component wie folgt verarbeitet:
1. **Daten-Fetching**: Das System lädt asynchron die verknüpfte Tabelle oder Abfrage basierend auf `dataSourceId` und `dataSourceType`.
2. **Daten-Vorschau**: Bei leeren Tabellen generiert der Designer automatisch realistische Mock-Daten basierend auf den Spaltentypen (`VARCHAR`, `INTEGER`, `DECIMAL`, `BOOLEAN`, `DATE`).
3. **Loop-Wiederholung**:
   - **Tabelle (`table_view`)**: Nur die Zeile (`<tr>`) wird wiederholt. Der Tabellenkopf (`<thead>`) und Fuß (`<tfoot>`) verbleiben statisch. Aggregate wie Summe (`sum`), Schnitt (`avg`) und Anzahl (`count`) werden live im Footer berechnet.
   - **Karten-Raster (`grid`)**: Die gesamte Card-Vorlage wird für jeden Datensatz wiederholt und responsiv als Grid gerendert.
4. **Zustandsparameter**: Das Klicken auf ein Listenelement oder eine Karte setzt den konfigurierten `selectionParamName` (z. B. `selectedId`) und leitet optional zur `detailsPageId` weiter, was Master-Detail-Ansichten ohne Programmieraufwand ermöglicht.
