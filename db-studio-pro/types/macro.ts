export type MacroActionType =
  // Benutzeroberflächenbefehle
  | 'SHOW_TOAST'            // Notification / Toast
  | 'MESSAGE_BOX'           // Show alert dialog
  | 'CONFIRM_DIALOG'        // Show confirmation dialog
  | 'NAVIGATE'              // Navigate to page
  | 'GO_TO_CONTROL'         // Focus control
  // Datenbankobjekte
  | 'OPEN_REPORT'           // Open report
  | 'PRINT_REPORT'          // Print/Export report
  | 'OPEN_FORM'             // Open form with parameters
  | 'CLOSE_FORM'            // Close active form
  | 'OPEN_TABLE'            // Open table view
  | 'REFRESH_OBJECT'        // Refresh database object
  // Dateneingabevorgänge
  | 'SAVE_RECORD'           // Save active record
  | 'DELETE_RECORD'         // Delete active record
  | 'CALCULATE_FORMULA'     // Run formula on fields
  // Datenimport/-export
  | 'EXPORT_REPORT'        // Export report/table/query to PDF, XLSX, XML, JSON, CSV
  | 'SMART_IMPORT'          // Launch File Upload & Import Wizard
  | 'EMAIL_DATABASE_OBJECT' // Email database object
  // Fensterverwaltung
  | 'CLOSE_WINDOW'          // Close current window
  | 'MAXIMIZE_WINDOW'       // Maximize window
  | 'MINIMIZE_WINDOW'       // Minimize window
  | 'RESTORE_WINDOW'        // Restore window
  // Filter / Abfrage / Suche
  | 'EXECUTE_QUERY'         // Execute a query or update
  | 'EXECUTE_ACTION'        // Execute action query (UPDATE/INSERT/DELETE)
  | 'SET_FILTER'            // Apply filter to view
  | 'REMOVE_FILTER'         // Remove filter/sort
  | 'SEARCH_RECORD'         // Search record
  | 'REQUERY'               // Refresh data sources
  // Makrobefehle
  | 'RUN_MACRO'             // Execute another macro
  | 'EXECUTE_JS_SCRIPT'     // JS/TS Scripting Engine
  | 'SET_TEMP_VAR'          // Set temp variable
  | 'REMOVE_TEMP_VAR'       // Remove temp variable
  | 'CANCEL_EVENT'          // Cancel active event
  | 'STOP_ALL_MACROS'       // Stop macro queue
  // Systembefehle (mit Plattform-Pluralismus für .NET, PHP, Electron, Web)
  | 'SYSTEM_CURSOR_BUSY'    // Anzeigen Sanduhrzeiger / Cursor Status
  | 'SYSTEM_BEEP'           // Signalton / Audio Beep
  | 'SYSTEM_QUIT'           // Beenden Anwendung (Application.Exit / exit() / app.quit())
  | 'CLOSE_DATABASE'        // Schließen Datenbank
  | 'SYSTEM_EXEC_COMMAND'   // Systembefehl ausführen (Process.Start / shell_exec / child_process)
  | 'OPEN_MODAL';           // Open custom modal

export type ExportFormat = 'PDF' | 'XLSX' | 'XML' | 'JSON' | 'CSV' | 'HTML_PRINT';

export interface ReportExportConfig {
  sourceType: 'report' | 'table' | 'query';
  sourceId: string;
  format: ExportFormat;
  filterParams?: Record<string, any>;
  title?: string;
  autoDownload?: boolean;
}

export interface ImportFieldMapping {
  fileColumn: string;
  targetFieldId: string;
  targetFieldName: string;
}

export interface SmartImportConfig {
  targetTableId: string;
  importStrategy: 'append' | 'update_by_pk' | 'upsert';
  primaryKeyFieldId?: string;
  fieldMappings: ImportFieldMapping[];
  saveAsMacroProfile?: boolean;
  macroProfileName?: string;
}

export interface MacroStep {
  id: string;
  name: string;
  type: MacroActionType;
  exportConfig?: ReportExportConfig;
  importConfig?: SmartImportConfig;
  queryId?: string;
  formId?: string;
  reportId?: string;
  tableId?: string;
  pageId?: string;
  filterExpression?: string;
  messageText?: string;
  confirmPrompt?: string;
  jsCode?: string; // JavaScript/TypeScript Sandbox Code
  toastMessage?: string;
  toastType?: 'success' | 'info' | 'warning' | 'error';
  targetMacroId?: string;
  varName?: string;
  varValue?: string;
  sysCommand?: string; // Command line string for SYSTEM_EXEC_COMMAND (Process.Start / exec)
  sysTargetPlatform?: 'ALL' | 'DOTNET' | 'PHP' | 'ELECTRON' | 'BROWSER'; // Platform target note
  params?: Record<string, any>;
}

export interface Macro {
  id: string;
  name: string;
  description?: string;
  category?: 'REPORT_EXPORT' | 'DATA_IMPORT' | 'WORKFLOW' | 'CUSTOM';
  steps: MacroStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CalculatedFieldConfig {
  formula: string; // e.g. "[UnitPrice] * [Quantity] * (1 - [Discount] / 100)" or "[Vorname] + ' ' + [Nachname]"
  targetFieldId: string;
  label?: string;
  format?: 'number' | 'currency' | 'text' | 'percentage';
}
