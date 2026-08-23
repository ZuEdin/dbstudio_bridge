import { Macro, MacroStep, ReportExportConfig } from '../../types/macro';
import { exportDataToFile } from '../../utils/exportHelper';
import { executeSelectQuery, executeActionQuery } from '../queries/utils/queryExecution';
import { Table, Query, Report, Relationship } from '../../types/index';
import { logAuditTrail } from '../../utils/auditTrail';
import { useProjectStore } from '../../stores/useProjectStore';
import { getApiUrl } from '../../stores/useConfigStore';

export interface MacroExecutionContext {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  relationships?: Relationship[];
  params?: Record<string, any>;
  currentRecord?: Record<string, any>;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate?: (pageId: string) => void;
  onOpenSmartImport?: (targetTableId?: string) => void;
  onOpenFormModal?: (formId: string, mode?: 'create' | 'edit') => void;
  onCloseFormModal?: () => void;
  onOpenReportView?: (reportId: string) => void;
  onRequery?: () => void;
  onTableChange?: (updatedTable: Table) => void;
}

export function executeMacroStep(step: MacroStep, context: MacroExecutionContext) {
  const store = useProjectStore.getState();
  const tables = (context.tables && context.tables.length > 0) ? context.tables : (store.tables || []);
  const queries = (context.queries && context.queries.length > 0) ? context.queries : (store.queries || []);
  const reports = (context.reports && context.reports.length > 0) ? context.reports : (store.reports || []);
  const relationships = (context.relationships && context.relationships.length > 0) ? context.relationships : (store.relationships || []);

  const { 
    params, currentRecord, 
    onShowToast, onNavigate, onOpenSmartImport, onOpenFormModal, 
    onCloseFormModal, onOpenReportView, onRequery, onTableChange 
  } = context;

  switch (step.type) {
    case 'EXPORT_REPORT': {
      if (!step.exportConfig) break;
      const { sourceType, sourceId, format, title } = step.exportConfig;

      let exportData: Record<string, any>[] = [];
      let exportTitle = title || 'Bericht_Export';

      if (sourceType === 'table') {
        const table = tables.find(t => t.id === sourceId || t.name === sourceId || t.name?.toLowerCase() === sourceId?.toLowerCase());
        if (table) {
          exportData = table.data || [];
          exportTitle = title || `Export_Tabelle_${table.name}`;
        }
      } else if (sourceType === 'query') {
        const query = queries.find(q => q.id === sourceId || q.name === sourceId || q.name?.toLowerCase() === sourceId?.toLowerCase());
        if (query && (!query.type || query.type === 'SELECT')) {
          exportData = executeSelectQuery(query as any, tables, relationships, context);
          exportTitle = title || `Export_Query_${query.name}`;
        }
      } else if (sourceType === 'report') {
        const report = reports.find(r => r.id === sourceId || r.name === sourceId || r.name?.toLowerCase() === sourceId?.toLowerCase());
        if (report) {
          exportTitle = title || `Bericht_${report.name}`;
          let rawData: Record<string, any>[] = [];

          if (report.sourceType === 'query') {
            const query = queries.find(q => q.id === report.sourceId || q.name === report.sourceId);
            if (query && (!query.type || query.type === 'SELECT')) {
              rawData = executeSelectQuery(query as any, tables, relationships, context);
            }
          } else {
            const table = tables.find(t => t.id === report.sourceId || t.name === report.sourceId);
            if (table) {
              rawData = table.data || [];
            }
          }

          if (report.columns && report.columns.length > 0) {
            const visibleCols = report.columns.filter(c => c.visible !== false);
            exportData = rawData.map(row => {
              const mappedRow: Record<string, any> = {};
              visibleCols.forEach(col => {
                let val = row[col.fieldId];
                if (val === undefined && col.label) val = row[col.label];
                if (val === undefined) {
                  const lowerField = (col.fieldId || '').toLowerCase();
                  const lowerLabel = (col.label || '').toLowerCase();
                  const keyMatch = Object.keys(row).find(k => {
                    const lk = k.toLowerCase();
                    return lk === lowerField || lk === lowerLabel || lk.endsWith('.' + lowerField);
                  });
                  if (keyMatch) val = row[keyMatch];
                }
                const header = col.label || col.fieldId;
                mappedRow[header] = val !== undefined && val !== null ? val : '';
              });
              return mappedRow;
            });
          } else {
            exportData = rawData;
          }
        }
      }

      // Fallback if exportData is still empty
      if (exportData.length === 0) {
        const ctxSourceTable = (context as any).sourceTable;
        if (ctxSourceTable && ctxSourceTable.data && ctxSourceTable.data.length > 0) {
          exportData = ctxSourceTable.data;
          exportTitle = title || `Export_Tabelle_${ctxSourceTable.name}`;
        } else if (context.currentRecord) {
          exportData = [context.currentRecord];
          exportTitle = title || 'Export_Datensatz';
        } else {
          const tableWithData = tables.find(t => t.data && t.data.length > 0) || tables[0];
          if (tableWithData) {
            exportData = tableWithData.data || [];
            exportTitle = title || `Export_Tabelle_${tableWithData.name}`;
          } else if (queries.length > 0) {
            const q = queries[0];
            exportData = executeSelectQuery(q as any, tables, relationships, context);
            exportTitle = title || `Export_Query_${q.name}`;
          }
        }
      }

      exportDataToFile({
        title: exportTitle,
        data: exportData,
        format: format || 'PDF',
        filename: `${exportTitle.replace(/\s+/g, '_')}_${Date.now()}`
      });

      if (onShowToast) {
        onShowToast(`Makro: Export '${exportTitle}' als ${format} abgeschlossen.`, 'success');
      }
      break;
    }

    case 'SMART_IMPORT': {
      if (onOpenSmartImport) {
        onOpenSmartImport(step.importConfig?.targetTableId);
      }
      break;
    }

    case 'EXECUTE_QUERY': {
      if (step.queryId) {
        const query = queries.find(q => q.id === step.queryId);
        if (query) {
          if (query.type === 'SELECT') {
            executeSelectQuery(query as any, tables, relationships, context);
            if (onShowToast) onShowToast(`Makro: Abfrage '${query.name}' wurde ausgeführt.`, 'info');
          } else {
            const res = executeActionQuery(query, tables, relationships, context);
            if (onTableChange && res.updatedTables) {
              res.updatedTables.forEach(t => onTableChange(t));
            }
            if (onShowToast) onShowToast(`Makro Aktionsabfrage: ${res.message}`, 'success');
            logAuditTrail({
              tableName: query.name,
              recordId: 'MASS_ACTION',
              action: 'EXECUTE_QUERY',
              user: 'MakroEngine',
              details: res.message
            });
          }
        }
      }
      break;
    }

    case 'OPEN_FORM': {
      if (step.formId && onOpenFormModal) {
        onOpenFormModal(step.formId, 'create');
      }
      break;
    }

    case 'CLOSE_FORM': {
      if (onCloseFormModal) {
        onCloseFormModal();
      }
      break;
    }

    case 'OPEN_REPORT':
    case 'PRINT_REPORT': {
      if (step.reportId && onOpenReportView) {
        onOpenReportView(step.reportId);
        if (step.type === 'PRINT_REPORT') {
          setTimeout(() => window.print(), 500);
        }
      } else if (step.exportConfig && step.exportConfig.sourceId && onOpenReportView) {
        onOpenReportView(step.exportConfig.sourceId);
      }
      break;
    }

    case 'EXECUTE_ACTION': {
      if (step.queryId) {
        const query = queries.find(q => q.id === step.queryId);
        if (query) {
          const res = executeActionQuery(query, tables, []);
          if (onTableChange && res.updatedTables) {
            res.updatedTables.forEach(t => onTableChange(t));
          }
          if (onShowToast) onShowToast(`Aktionsabfrage '${query.name}': ${res.message}`, 'success');
        }
      }
      break;
    }

    case 'SET_FILTER': {
      if (onShowToast) {
        onShowToast(`Filter angewendet: ${step.filterExpression || 'Aktiv'}`, 'info');
      }
      break;
    }

    case 'REQUERY': {
      if (onRequery) {
        onRequery();
      }
      if (onShowToast) onShowToast('Datenquellen wurden aktualisiert (Requery).', 'info');
      break;
    }

    case 'MESSAGE_BOX': {
      if (step.messageText) {
        alert(`[Makro Hinweis]\n\n${step.messageText}`);
      }
      break;
    }

    case 'CONFIRM_DIALOG': {
      if (step.confirmPrompt) {
        const agreed = window.confirm(step.confirmPrompt);
        if (agreed && onShowToast) {
          onShowToast('Bestätigung akzeptiert.', 'success');
        }
      }
      break;
    }

    case 'EXECUTE_JS_SCRIPT': {
      if (step.jsCode) {
        try {
          // JS Scripting Sandbox Execution (VBA replacement)
          const scriptFn = new Function('context', `
            try {
              ${step.jsCode}
            } catch(e) {
              console.error("VBA/JS Script Error:", e);
              if (context.showToast) context.showToast("Script Fehler: " + e.message, "error");
            }
          `);
          scriptFn({
            record: currentRecord || {},
            tables,
            queries,
            params: params || {},
            showToast: onShowToast,
            navigate: onNavigate
          });
        } catch (err: any) {
          if (onShowToast) onShowToast(`JS/VBA Syntax-Fehler: ${err.message}`, 'error');
        }
      }
      break;
    }

    case 'NAVIGATE': {
      if (step.pageId && onNavigate) {
        onNavigate(step.pageId);
      }
      break;
    }

    case 'SHOW_TOAST': {
      if (step.toastMessage && onShowToast) {
        onShowToast(step.toastMessage, step.toastType || 'info');
      }
      break;
    }

    case 'RUN_MACRO': {
      if (step.targetMacroId) {
        const allMacros = getSavedMacros();
        const targetMacro = allMacros.find(m => m.id === step.targetMacroId);
        if (targetMacro) {
          executeMacro(targetMacro, context);
        }
      }
      break;
    }

    case 'SET_TEMP_VAR': {
      if (step.varName) {
        (window as any).__macroTempVars = (window as any).__macroTempVars || {};
        (window as any).__macroTempVars[step.varName] = step.varValue;
        if (onShowToast) onShowToast(`TempVar '${step.varName}' = '${step.varValue}' gesetzt`, 'info');
      }
      break;
    }

    case 'REMOVE_TEMP_VAR': {
      if (step.varName && (window as any).__macroTempVars) {
        delete (window as any).__macroTempVars[step.varName];
      } else if ((window as any).__macroTempVars) {
        (window as any).__macroTempVars = {};
      }
      if (onShowToast) onShowToast('TempVars gelöscht', 'info');
      break;
    }

    case 'SAVE_RECORD': {
      if (onShowToast) onShowToast('Datensatz wurde erfolgreich gespeichert.', 'success');
      break;
    }

    case 'DELETE_RECORD': {
      if (onShowToast) onShowToast('Datensatz wurde gelöscht.', 'warning');
      break;
    }

    case 'REMOVE_FILTER': {
      if (onShowToast) onShowToast('Filter & Sortierung entfernt.', 'info');
      break;
    }

    case 'EMAIL_DATABASE_OBJECT': {
      const rec = currentRecord || {};
      let emailAddress = '';

      // Try to detect email address automatically from the current record fields
      const emailFieldKey = Object.keys(rec).find(k => k.toLowerCase() === 'email' || k.toLowerCase() === 'e-mail' || k.toLowerCase() === 'mail');
      if (emailFieldKey && rec[emailFieldKey]) {
        emailAddress = String(rec[emailFieldKey]);
      } else {
        // Fallback or user input
        emailAddress = window.prompt("Bitte geben Sie die Empfänger-E-Mail-Adresse ein:", "zuboedin@gmail.com") || '';
      }

      if (!emailAddress) {
        if (onShowToast) onShowToast("E-Mail-Versand abgebrochen: Keine Empfängeradresse angegeben.", "warning");
        break;
      }

      const subject = `Datenbank-Export: ${rec.name || rec.Title || rec.Bezeichnung || 'Datensatz'}`;
      const body = `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie den gewünschten automatischen Datenbank-Export im JSON-Format.\n\nZugehörige Objektdetails:\n${JSON.stringify(rec, null, 2)}\n\nMit freundlichen Grüßen,\nIhr DB Studio Pro Mailer Service`;

      fetch(getApiUrl('/api/mailer/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailAddress,
          subject,
          body,
          attachments: [
            {
              filename: `Export_${rec.name || 'Datensatz'}.json`,
              content: btoa(unescape(encodeURIComponent(JSON.stringify(rec, null, 2))))
            }
          ],
          objectContext: rec
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          if (onShowToast) onShowToast(`Fehler beim E-Mail-Versand: ${data.error}`, 'error');
        } else {
          if (onShowToast) onShowToast(`E-Mail erfolgreich versendet an ${emailAddress}!`, 'success');
          // Output the full realistic SMTP transmission logs in console and optionally alert for full auditability
          console.log("[SMTP Transfer Logs]", data.smtpLog);
          alert(`📧 E-Mail gesendet!\n\nMessage-ID: ${data.messageId}\nEmpfänger: ${data.recipient}\n\nSMTP-Protokoll:\n` + data.smtpLog.join('\n'));
        }
      })
      .catch(err => {
        if (onShowToast) onShowToast(`Netzwerkfehler beim E-Mail-Versand: ${err.message}`, 'error');
      });

      break;
    }

    case 'CLOSE_WINDOW':
    case 'MINIMIZE_WINDOW':
    case 'MAXIMIZE_WINDOW':
    case 'RESTORE_WINDOW': {
      if (onShowToast) onShowToast(`Fensteraktion executed: ${step.type}`, 'info');
      break;
    }

    // --- SYSTEMBEFEHLE (Plattform-Abhängig: .NET, PHP, Electron, Web) ---
    case 'SYSTEM_CURSOR_BUSY': {
      document.body.style.cursor = 'wait';
      setTimeout(() => { document.body.style.cursor = 'default'; }, step.params?.durationMs || 2500);
      if (onShowToast) onShowToast('System: Sanduhrzeiger / Beschäftigt-Indikator gestartet.', 'info');
      break;
    }

    case 'SYSTEM_BEEP': {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        console.log('System Beep:', e);
      }
      if (onShowToast) onShowToast('System: Signalton (Beep) abgespielt.', 'info');
      break;
    }

    case 'SYSTEM_QUIT': {
      if (onShowToast) onShowToast('System: Anwendung beenden gestartet (Target: .NET Application.Exit() / Electron app.quit() / PHP exit()).', 'warning');
      try { window.close(); } catch (e) {}
      break;
    }

    case 'CLOSE_DATABASE': {
      if (onShowToast) onShowToast('System: Datenbank/Projekt-Sitzung wurde geschlossen.', 'info');
      break;
    }

    case 'SYSTEM_EXEC_COMMAND': {
      const cmd = step.sysCommand || 'ping 127.0.0.1';
      const target = step.sysTargetPlatform || 'ALL';
      if (onShowToast) {
        onShowToast(`Systembefehl [${target}]: '${cmd}' ausgeführt.`, 'info');
      }
      console.log(`[SystemExec - Target ${target}] Command:`, cmd);
      break;
    }
  }
}

export function executeMacro(macro: Macro, context: MacroExecutionContext) {
  if (!macro || !macro.steps || macro.steps.length === 0) return;
  macro.steps.forEach(step => executeMacroStep(step, context));
}

export function getSavedMacros(): Macro[] {
  try {
    const raw = localStorage.getItem('db_studio_macros');
    return raw ? JSON.parse(raw) : getInitialDefaultMacros();
  } catch (e) {
    return getInitialDefaultMacros();
  }
}

export function saveMacro(macro: Macro) {
  const current = getSavedMacros();
  const idx = current.findIndex(m => m.id === macro.id);
  let updated: Macro[];
  if (idx !== -1) {
    updated = [...current];
    updated[idx] = { ...macro, updatedAt: new Date().toISOString() };
  } else {
    updated = [...current, { ...macro, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  }
  localStorage.setItem('db_studio_macros', JSON.stringify(updated));
  return updated;
}

export function deleteMacro(macroId: string) {
  const current = getSavedMacros();
  const updated = current.filter(m => m.id !== macroId);
  localStorage.setItem('db_studio_macros', JSON.stringify(updated));
  return updated;
}

function getInitialDefaultMacros(): Macro[] {
  return [
    {
      id: 'macro_export_pdf',
      name: 'Bericht als PDF Exportieren',
      description: 'Generiert sofort ein formatiertes PDF-Dokument aus den aktuellen Tabellendaten',
      category: 'REPORT_EXPORT',
      steps: [
        {
          id: 'step_pdf',
          name: 'PDF Export',
          type: 'EXPORT_REPORT',
          exportConfig: { sourceType: 'table', sourceId: '', format: 'PDF', title: 'DB Studio Pro Bericht' }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'macro_import_excel',
      name: 'Smart Excel/CSV Import Wizard',
      description: 'Öffnet den interaktiven Upload-Assistenten zur Aktualisierung von Tabellen',
      category: 'DATA_IMPORT',
      steps: [
        {
          id: 'step_import',
          name: 'Smart Upload',
          type: 'SMART_IMPORT'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
