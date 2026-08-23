import { exportDataToFile, ExportFormat } from '../utils/exportHelper';
import { get } from './api';

const tableEndpointsMap: Record<string, string> = {
  "t_kunden": "kunden",
  "Kunden": "kunden",
  "kunden": "kunden",
  "t_artikel": "artikel",
  "Artikel": "artikel",
  "artikel": "artikel",
  "t_angebote": "angebote",
  "Angebote": "angebote",
  "angebote": "angebote",
  "t_angebotspos": "angebotspositionen",
  "Angebotspositionen": "angebotspositionen",
  "angebotspositionen": "angebotspositionen",
  "t_auftraege": "auftraege",
  "Auftraege": "auftraege",
  "auftraege": "auftraege",
  "t_auftragspos": "auftragspositionen",
  "Auftragspositionen": "auftragspositionen",
  "auftragspositionen": "auftragspositionen",
  "t_rechnungen": "rechnungen",
  "Rechnungen": "rechnungen",
  "rechnungen": "rechnungen",
  "t_rechnungspos": "rechnungspositionen",
  "Rechnungspositionen": "rechnungspositionen",
  "rechnungspositionen": "rechnungspositionen",
  "t_mahnungen": "mahnungen",
  "Mahnungen": "mahnungen",
  "mahnungen": "mahnungen",
  "t_gutschriften": "gutschriften",
  "Gutschriften": "gutschriften",
  "gutschriften": "gutschriften",
  "t_gutschriftpos": "gutschriftpositionen",
  "Gutschriftpositionen": "gutschriftpositionen",
  "gutschriftpositionen": "gutschriftpositionen"
};
const queryEndpointsMap: Record<string, string> = {
  "q_offene_rechnungen": "offeneRechnungenMahnstufen",
  "Offene Rechnungen & Mahnstufen": "offeneRechnungenMahnstufen",
  "offene rechnungen & mahnstufen": "offeneRechnungenMahnstufen",
  "offeneRechnungenMahnstufen": "offeneRechnungenMahnstufen"
};
const reportSourcesMap: Record<string, { sourceType: string; sourceId: string }> = {
  "r_rechnungsjournal": {
    "sourceType": "table",
    "sourceId": "t_rechnungen"
  },
  "rechnungsjournal & umsätze": {
    "sourceType": "table",
    "sourceId": "t_rechnungen"
  }
};
const queryParamRefs: Record<string, Array<{ formName: string; fieldName: string; paramName: string }>> = {};
const PROJECT_MACROS: Macro[] = [
  {
    "id": "macro_export_pdf",
    "name": "Bericht als PDF Exportieren",
    "description": "Generiert sofort ein formatiertes PDF-Dokument aus den aktuellen Tabellendaten",
    "category": "REPORT_EXPORT",
    "steps": [
      {
        "id": "step_pdf",
        "name": "PDF Export",
        "type": "EXPORT_REPORT",
        "exportConfig": {
          "sourceType": "report",
          "sourceId": "f2637515-1f24-419c-a23d-5a219a2d8953",
          "format": "PDF",
          "title": "DB Studio Pro Bericht"
        }
      }
    ],
    "createdAt": "2026-07-26T10:04:05.878Z",
    "updatedAt": "2026-07-26T10:42:58.859Z"
  },
  {
    "id": "macro_import_excel",
    "name": "Smart Excel/CSV Import Wizard",
    "description": "Öffnet den interaktiven Upload-Assistenten zur Aktualisierung von Tabellen",
    "category": "DATA_IMPORT",
    "steps": [
      {
        "id": "step_import",
        "name": "Smart Upload",
        "type": "SMART_IMPORT"
      }
    ],
    "createdAt": "2026-07-26T10:04:05.878Z",
    "updatedAt": "2026-07-26T10:04:05.878Z"
  },
  {
    "id": "macro_1785063123194",
    "name": "XLSX Export",
    "description": "Automatisierte Aktion und Workflow-Schritt",
    "category": "CUSTOM",
    "steps": [
      {
        "id": "step_1785063123194",
        "name": "Schritt 1: Bericht Exportieren",
        "type": "EXPORT_REPORT",
        "exportConfig": {
          "sourceType": "report",
          "sourceId": "f2637515-1f24-419c-a23d-5a219a2d8953",
          "format": "XLSX",
          "title": "Automatischer Bericht"
        }
      }
    ],
    "createdAt": "2026-07-26T10:52:03.194Z",
    "updatedAt": "2026-07-26T13:17:31.024Z"
  },
  {
    "id": "macro_1785072917955",
    "name": "Neues Makro",
    "description": "Automatisierte Aktion und Workflow-Schritt",
    "category": "CUSTOM",
    "steps": [
      {
        "id": "step_1785072917955",
        "name": "Schritt 1: Bericht Exportieren",
        "type": "EXPORT_REPORT",
        "exportConfig": {
          "sourceType": "table",
          "sourceId": "new_table_1784983613762",
          "format": "PDF",
          "title": "Automatischer Bericht"
        }
      }
    ],
    "createdAt": "2026-07-26T13:35:17.955Z",
    "updatedAt": "2026-07-26T13:35:17.955Z"
  }
];

export interface MacroStep {
  id: string;
  name: string;
  type: string;
  exportConfig?: {
    sourceType: 'table' | 'query' | 'report';
    sourceId: string;
    format: ExportFormat;
    title?: string;
  };
  toastMessage?: string;
  toastType?: 'success' | 'info' | 'warning' | 'error';
  messageText?: string;
  confirmPrompt?: string;
  pageId?: string;
  jsCode?: string;
  [key: string]: any;
}

export interface Macro {
  id: string;
  name: string;
  steps: MacroStep[];
  [key: string]: any;
}

export async function executeGeneratedMacro(
  macroOrId: string | Macro, 
  contextData?: any, 
  addToast?: (msg: string, type?: any) => void
) {
  let macro: Macro | null = null;
  let savedMacros: Macro[] = [];
  try {
    savedMacros = JSON.parse(localStorage.getItem('db_studio_macros') || '[]');
  } catch (e) {}

  if (typeof macroOrId === 'string') {
    macro = savedMacros.find(m => m.id === macroOrId || m.name === macroOrId || m.id?.toLowerCase() === macroOrId.toLowerCase() || m.name?.toLowerCase() === macroOrId.toLowerCase()) || null;
    if (!macro) {
      macro = PROJECT_MACROS.find(m => m.id === macroOrId || m.name === macroOrId || m.id?.toLowerCase() === macroOrId.toLowerCase() || m.name?.toLowerCase() === macroOrId.toLowerCase()) || null;
    }
  } else {
    macro = macroOrId;
  }

  if (macro && macro.steps && macro.steps.length > 0) {
    for (const step of macro.steps) {
      if ((step.type === 'EXPORT_REPORT' || step.type === 'PRINT_REPORT' || step.type === 'EXPORT_QUERY' || step.type === 'EXPORT_TABLE' || step.type === 'EXPORT' || step.type?.startsWith('EXPORT_') || step.exportConfig) && step.exportConfig) {
        const { sourceType, sourceId, format, title } = step.exportConfig;
        
        let currentSourceType = sourceType;
        let currentSourceId = sourceId;

        if (sourceType === 'report' && sourceId) {
          const reportConfig = reportSourcesMap[sourceId] || reportSourcesMap[sourceId.toLowerCase()];
          if (reportConfig) {
            currentSourceType = reportConfig.sourceType as any;
            currentSourceId = reportConfig.sourceId;
          }
        }

        let data: any[] = [];
        if (currentSourceType === 'table' && currentSourceId) {
          try {
            const mappedEndpoint = tableEndpointsMap[currentSourceId] || tableEndpointsMap[currentSourceId.toLowerCase()] || currentSourceId;
            const res = await get<any>(mappedEndpoint, { pageSize: 100000 });
            data = Array.isArray(res) ? res : (res?.data || []);
          } catch (e) {
            console.error('Error fetching table data for macro export:', e);
          }
        } else if (currentSourceType === 'query' && currentSourceId) {
          try {
            const mappedEndpoint = queryEndpointsMap[currentSourceId] || queryEndpointsMap[currentSourceId.toLowerCase()] || currentSourceId;
            const queryParams: Record<string, any> = { pageSize: 100000 };
            
            // Extract and append referenced Form parameters from contextData
            const refs = queryParamRefs[currentSourceId] || queryParamRefs[currentSourceId.toLowerCase()] || [];
            if (refs.length > 0 && contextData) {
              refs.forEach(ref => {
                const foundKey = Object.keys(contextData).find(k => k.toLowerCase() === ref.fieldName.toLowerCase());
                if (foundKey) {
                  queryParams[ref.paramName] = contextData[foundKey];
                }
              });
            }

            // Fallback: Also try to infer form name from current URL path
            try {
              const pathParts = window.location.pathname.split('/').filter(Boolean);
              const formPart = pathParts.find(p => p.toLowerCase().includes('form'));
              if (formPart && contextData) {
                const inferredFormName = formPart.toLowerCase().replace('form', '');
                Object.keys(contextData).forEach(key => {
                  const paramName = 'form_' + inferredFormName + '_' + key.toLowerCase();
                  if (queryParams[paramName] === undefined) {
                    queryParams[paramName] = contextData[key];
                  }
                });
              }
            } catch (e) {}

            const res = await get<any>('queries/' + mappedEndpoint, queryParams);
            data = Array.isArray(res) ? res : (res?.data || []);
          } catch (e) {
            console.error('Error fetching query data for macro export:', e);
          }
        }
        if (!data || data.length === 0) {
          if (Array.isArray(contextData) && contextData.length > 0) {
            data = contextData;
          } else if (contextData && typeof contextData === 'object' && Object.keys(contextData).length > 0) {
            data = [contextData];
          }
        }
        exportDataToFile({
          title: title || macro.name || 'Export',
          data,
          format: format || 'PDF'
        });
      } else if (step.type === 'SHOW_TOAST') {
        if (addToast) addToast(step.toastMessage || 'Aktion ausgeführt', step.toastType || 'info');
      } else if (step.type === 'MESSAGE_BOX') {
        alert(step.messageText || step.name || 'Hinweis');
      } else if (step.type === 'CONFIRM_DIALOG') {
        confirm(step.confirmPrompt || 'Bestätigen?');
      }
    }
    if (addToast) addToast(`Makro '${macro.name || macro.id}' wurde ausgeführt`, 'success');
    return;
  }

  // Fallback if macro object not found, or macroId is a direct command/format name
  const macroStr = typeof macroOrId === 'string' ? macroOrId.toLowerCase() : '';
  let exportFormat: ExportFormat | null = null;
  if (macroStr.includes('pdf')) exportFormat = 'PDF';
  else if (macroStr.includes('xlsx') || macroStr.includes('excel')) exportFormat = 'XLSX';
  else if (macroStr.includes('csv')) exportFormat = 'CSV';
  else if (macroStr.includes('json')) exportFormat = 'JSON';

  if (exportFormat) {
    let dataToExport = Array.isArray(contextData) ? contextData : (contextData && Object.keys(contextData).length > 0 ? [contextData] : []);
    exportDataToFile({
      title: 'Export_' + exportFormat,
      data: dataToExport,
      format: exportFormat
    });
    if (addToast) addToast(`Export als ${exportFormat} gestartet`, 'success');
  } else {
    if (addToast) addToast(`Makro '${typeof macroOrId === 'string' ? macroOrId : macroOrId.name}' ausgeführt`, 'info');
  }
}
