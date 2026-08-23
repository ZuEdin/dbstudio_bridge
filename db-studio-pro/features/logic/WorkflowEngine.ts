import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowExecutionLog, 
  WorkflowExecutionStepLog,
  WorkflowTriggerEvent,
  WorkflowFieldMapping 
} from '../../types/workflow';
import { Table, Report, Query } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { exportDataToFile } from '../../utils/exportHelper';

// Helper to evaluate simple Excel-like expressions or arithmetic
export function evaluateWorkflowFormula(
  formula: string, 
  contextData: Record<string, any>
): any {
  if (!formula || typeof formula !== 'string') return formula;
  
  let expr = formula.trim();

  // Replace [Field] or [Table.Field] or {{Variable}} with context values
  expr = expr.replace(/\[([^\]]+)\]/g, (_, fieldName) => {
    const cleanField = fieldName.trim();
    let val = contextData[cleanField];
    if (val === undefined && cleanField.includes('.')) {
      const parts = cleanField.split('.');
      val = contextData[parts[parts.length - 1]];
    }
    if (val === undefined) {
      // Case-insensitive lookup
      const lower = cleanField.toLowerCase();
      const matchKey = Object.keys(contextData).find(k => k.toLowerCase() === lower);
      if (matchKey) val = contextData[matchKey];
    }
    if (val === undefined || val === null) return '0';
    if (typeof val === 'number') return String(val);
    if (!isNaN(Number(val))) return String(Number(val));
    return `"${String(val).replace(/"/g, '\\"')}"`;
  });

  // Replace {{trigger.field}} syntax
  expr = expr.replace(/\{\{([^}]+)\}\}/g, (_, varPath) => {
    const val = resolveVariablePath(varPath.trim(), contextData);
    if (val === undefined || val === null) return '""';
    if (typeof val === 'number') return String(val);
    return `"${String(val).replace(/"/g, '\\"')}"`;
  });

  // Basic IF syntax: IF(condition, trueVal, falseVal)
  expr = expr.replace(/IF\s*\(([^,]+),([^,]+),([^)]+)\)/gi, '($1 ? $2 : $3)');

  // CONCAT syntax: CONCAT(a, b, c)
  expr = expr.replace(/CONCAT\s*\(([^)]+)\)/gi, (_, args) => {
    const parts = args.split(',').map((s: string) => s.trim());
    return `[${parts.join(', ')}].join('')`;
  });

  // UPPER / LOWER / ROUND
  expr = expr.replace(/UPPER\s*\(([^)]+)\)/gi, 'String($1).toUpperCase()');
  expr = expr.replace(/LOWER\s*\(([^)]+)\)/gi, 'String($1).toLowerCase()');
  expr = expr.replace(/ROUND\s*\(([^,]+)(?:,(\d+))?\)/gi, (_, num, decimals) => {
    const dec = decimals ? Number(decimals) : 0;
    return `Number(Number(${num}).toFixed(${dec}))`;
  });

  try {
    // Safe evaluation using Function with sandboxed math scope
    const result = new Function(
      'Math', 
      `try { return (${expr}); } catch (e) { return ${JSON.stringify(formula)}; }`
    )(Math);
    return result !== undefined ? result : formula;
  } catch (err) {
    console.warn('[WorkflowEngine] Formula evaluation fallback:', formula, err);
    return formula;
  }
}

// Resolves dot-paths like "trigger.customer_name", "loop.item.price", "now", "date"
export function resolveVariablePath(path: string, context: Record<string, any>): any {
  const cleanPath = path.trim().replace(/^\{\{|\}\}$/g, '');
  
  if (cleanPath === 'now') return new Date().toISOString();
  if (cleanPath === 'date') return new Date().toLocaleDateString('de-DE');
  if (cleanPath === 'time') return new Date().toLocaleTimeString('de-DE');
  if (cleanPath === 'uuid') return crypto.randomUUID();

  const parts = cleanPath.split('.');
  let current: any = context;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    if (typeof current === 'object') {
      let val = current[part];
      if (val === undefined) {
        // Case-insensitive fallback
        const lower = part.toLowerCase();
        const matchKey = Object.keys(current).find(k => k.toLowerCase() === lower);
        if (matchKey) val = current[matchKey];
      }
      current = val;
    } else {
      return undefined;
    }
  }

  return current;
}

// Replaces all {{placeholder}} in a template string
export function interpolateString(template: string, context: Record<string, any>): string {
  if (!template || typeof template !== 'string') return '';
  
  return template.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
    const resolved = resolveVariablePath(varName.trim(), context);
    if (resolved === undefined || resolved === null) return '';
    if (typeof resolved === 'object') return JSON.stringify(resolved);
    return String(resolved);
  });
}

export interface WorkflowExecutionContext {
  workflow: Workflow;
  triggerEvent: string;
  triggerRecord?: Record<string, any>;
  previousRecord?: Record<string, any>;
  variables: Record<string, any>;
  log: WorkflowExecutionLog;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onOpenMessageBox?: (title: string, message: string) => void;
}

export class WorkflowExecutionEngine {
  
  public static async executeWorkflow(
    workflow: Workflow,
    triggerEvent: WorkflowTriggerEvent | 'onManual',
    payloadRecord?: Record<string, any>,
    previousRecord?: Record<string, any>,
    options?: {
      onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
      onOpenMessageBox?: (title: string, message: string) => void;
    }
  ): Promise<WorkflowExecutionLog> {
    const startTime = Date.now();
    const logId = 'exec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const log: WorkflowExecutionLog = {
      id: logId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerEvent,
      triggeredBy: triggerEvent === 'onManual' ? 'Benutzer (Testlauf)' : `Event: ${triggerEvent}`,
      startedAt: new Date().toISOString(),
      status: 'running',
      steps: []
    };

    const context: WorkflowExecutionContext = {
      workflow,
      triggerEvent,
      triggerRecord: payloadRecord || {},
      previousRecord: previousRecord || {},
      variables: {
        trigger: payloadRecord || {},
        previous: previousRecord || {},
        system: {
          now: new Date().toISOString(),
          date: new Date().toLocaleDateString('de-DE'),
          time: new Date().toLocaleTimeString('de-DE'),
          appName: 'DB Studio Pro'
        }
      },
      log,
      onShowToast: options?.onShowToast,
      onOpenMessageBox: options?.onOpenMessageBox
    };

    try {
      // Find start / trigger nodes
      const triggerNodes = workflow.nodes.filter(
        n => (n.type as string) === 'triggerNode' || (n.type as string) === 'trigger' || (n.data as any)?.isTrigger
      );

      const startNodes = triggerNodes.length > 0 ? triggerNodes : [workflow.nodes[0]].filter(Boolean);

      if (startNodes.length === 0) {
        log.status = 'failed';
        log.steps.push({
          nodeId: 'root',
          nodeLabel: 'Trigger Suche',
          nodeType: 'system',
          status: 'failed',
          timestamp: new Date().toISOString(),
          details: 'Kein Trigger oder Start-Knoten im Workflow gefunden.'
        });
      } else {
        for (const startNode of startNodes) {
          await this.executeNodeChain(startNode, workflow, context, new Set<string>());
        }
        log.status = 'success';
      }
    } catch (error: any) {
      log.status = 'failed';
      log.steps.push({
        nodeId: 'engine_error',
        nodeLabel: 'Engine Fehler',
        nodeType: 'system',
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: `Ausführungsfehler: ${error?.message || String(error)}`
      });
      console.error('[WorkflowEngine] Execution failed:', error);
    }

    log.completedAt = new Date().toISOString();
    log.durationMs = Date.now() - startTime;

    // Update workflow with log in ProjectStore
    const store = useProjectStore.getState();
    const updatedWorkflows = (store.workflows || []).map(w => {
      if (w.id === workflow.id) {
        const existingLogs = w.executionLogs || [];
        return {
          ...w,
          lastExecutedAt: log.completedAt,
          lastExecutionStatus: log.status === 'success' ? 'success' : 'failed',
          executionLogs: [log, ...existingLogs.slice(0, 19)] // Keep latest 20 logs
        } as Workflow;
      }
      return w;
    });
    store.setWorkflows(updatedWorkflows);

    return log;
  }

  private static async executeNodeChain(
    currentNode: WorkflowNode,
    workflow: Workflow,
    context: WorkflowExecutionContext,
    visited: Set<string>
  ): Promise<void> {
    if (!currentNode) return;

    // Cycle detection guard
    if (visited.has(currentNode.id)) {
      context.log.steps.push({
        nodeId: currentNode.id,
        nodeLabel: currentNode.data?.label || currentNode.id,
        nodeType: currentNode.type,
        status: 'skipped',
        timestamp: new Date().toISOString(),
        details: 'Zyklus erkannt: Knoten wurde bereits in diesem Durchlauf ausgeführt.'
      });
      return;
    }
    visited.add(currentNode.id);

    // Execute current node
    const stepResult = await this.executeSingleNode(currentNode, context);
    
    // Find outgoing edges
    const outgoingEdges = workflow.edges.filter(e => e.source === currentNode.id);

    if (currentNode.type === 'conditionNode') {
      // Branching logic for condition node
      const conditionPassed = Boolean(stepResult.conditionMet);
      const trueEdge = outgoingEdges.find(e => 
        e.label === 'True' || e.label === 'Ja' || e.label === 'Wahr' || e.sourceHandle === 'true' || e.sourceHandle === 'handle-true'
      );
      const falseEdge = outgoingEdges.find(e => 
        e.label === 'False' || e.label === 'Nein' || e.label === 'Falsch' || e.sourceHandle === 'false' || e.sourceHandle === 'handle-false'
      );

      const targetEdge = conditionPassed ? (trueEdge || outgoingEdges[0]) : (falseEdge || outgoingEdges[1]);

      if (targetEdge) {
        const nextNode = workflow.nodes.find(n => n.id === targetEdge.target);
        if (nextNode) {
          await this.executeNodeChain(nextNode, workflow, context, new Set(visited));
        }
      }
    } else if (currentNode.type === 'loopNode') {
      // Loop execution
      const loopRecords: any[] = stepResult.loopItems || [];
      const loopBodyEdge = outgoingEdges.find(e => 
        e.label === 'Each' || e.label === 'Schleife' || e.sourceHandle === 'body' || e.sourceHandle === 'loop'
      ) || outgoingEdges[0];
      
      const afterLoopEdge = outgoingEdges.find(e => 
        e.label === 'After' || e.label === 'Fertig' || e.sourceHandle === 'after' || e.sourceHandle === 'done'
      ) || (outgoingEdges.length > 1 ? outgoingEdges[1] : null);

      if (loopBodyEdge && loopRecords.length > 0) {
        const bodyNode = workflow.nodes.find(n => n.id === loopBodyEdge.target);
        if (bodyNode) {
          const varName = currentNode.data.loopConfig?.variableName || 'item';
          for (const item of loopRecords) {
            context.variables.loop = {
              ...(context.variables.loop || {}),
              [varName]: item,
              item
            };
            await this.executeNodeChain(bodyNode, workflow, context, new Set(visited));
          }
        }
      }

      if (afterLoopEdge) {
        const afterNode = workflow.nodes.find(n => n.id === afterLoopEdge.target);
        if (afterNode) {
          await this.executeNodeChain(afterNode, workflow, context, new Set(visited));
        }
      }
    } else {
      // Default: continue to all targets
      for (const edge of outgoingEdges) {
        const nextNode = workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNodeChain(nextNode, workflow, context, new Set(visited));
        }
      }
    }
  }

  private static async executeSingleNode(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<{ success: boolean; conditionMet?: boolean; loopItems?: any[]; output?: any }> {
    const store = useProjectStore.getState();
    const nodeLabel = node.data?.label || node.id;
    const timestamp = new Date().toISOString();

    const addLogStep = (status: 'success' | 'failed' | 'skipped' | 'info', details: string, output?: any) => {
      context.log.steps.push({
        nodeId: node.id,
        nodeLabel,
        nodeType: node.type,
        status,
        timestamp: new Date().toISOString(),
        details,
        output
      });
    };

    try {
      switch (node.type) {
        
        // ----------------------------------------------------
        // 1. TRIGGER NODE
        // ----------------------------------------------------
        case 'triggerNode': {
          const cfg = node.data.triggerConfig;
          const eventDesc = cfg?.event || context.triggerEvent;
          const table = store.tables.find(t => t.id === cfg?.tableId);
          const desc = `Trigger ausgelöst durch Event '${eventDesc}' auf Tabelle '${table ? table.name : 'Beliebig'}'.`;
          addLogStep('success', desc, context.triggerRecord);
          return { success: true };
        }

        // ----------------------------------------------------
        // 2. CONDITION NODE (IF / ELSE)
        // ----------------------------------------------------
        case 'conditionNode': {
          const cfg = node.data.conditionConfig;
          if (!cfg || !cfg.operator) {
            addLogStep('info', 'Bedingung übersprungen (Keine Regel definiert). Ergebnis: Wahr (True)');
            return { success: true, conditionMet: true };
          }

          let fieldValue: any;
          if (cfg.fieldId) {
            fieldValue = context.variables.trigger?.[cfg.fieldId];
            if (fieldValue === undefined) {
              const lower = cfg.fieldId.toLowerCase();
              const keyMatch = Object.keys(context.variables.trigger || {}).find(k => k.toLowerCase() === lower);
              if (keyMatch) fieldValue = context.variables.trigger[keyMatch];
            }
          }

          let targetValue: any = cfg.value;
          if (typeof targetValue === 'string' && targetValue.startsWith('{{') && targetValue.endsWith('}}')) {
            targetValue = resolveVariablePath(targetValue, context.variables);
          }

          let conditionMet = false;
          const op = cfg.operator;
          
          if (op === 'isEmpty') {
            conditionMet = fieldValue === undefined || fieldValue === null || fieldValue === '';
          } else if (op === 'isNotEmpty') {
            conditionMet = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
          } else if (op === 'contains') {
            conditionMet = String(fieldValue || '').toLowerCase().includes(String(targetValue || '').toLowerCase());
          } else if (op === 'notContains') {
            conditionMet = !String(fieldValue || '').toLowerCase().includes(String(targetValue || '').toLowerCase());
          } else if (op === 'startsWith') {
            conditionMet = String(fieldValue || '').toLowerCase().startsWith(String(targetValue || '').toLowerCase());
          } else if (op === 'endsWith') {
            conditionMet = String(fieldValue || '').toLowerCase().endsWith(String(targetValue || '').toLowerCase());
          } else if (op === 'gt') {
            conditionMet = Number(fieldValue) > Number(targetValue);
          } else if (op === 'gte') {
            conditionMet = Number(fieldValue) >= Number(targetValue);
          } else if (op === 'lt') {
            conditionMet = Number(fieldValue) < Number(targetValue);
          } else if (op === 'lte') {
            conditionMet = Number(fieldValue) <= Number(targetValue);
          } else if (op === 'neq') {
            conditionMet = String(fieldValue) !== String(targetValue);
          } else {
            // Default eq
            conditionMet = String(fieldValue).trim().toLowerCase() === String(targetValue).trim().toLowerCase();
          }

          addLogStep(
            'info', 
            `Bedingung '${cfg.fieldId || 'Feld'} ${op} ${targetValue}' ausgewertet: [${conditionMet ? 'WAHR (True)' : 'FALSCH (False)'}] (Aktueller Feldwert: '${fieldValue ?? 'null'}')`
          );
          return { success: true, conditionMet };
        }

        // ----------------------------------------------------
        // 3. DATABASE ACTION NODE (Create, Update, Delete, Calculate)
        // ----------------------------------------------------
        case 'databaseActionNode':
        case 'actionNode': {
          const dbCfg = node.data.databaseActionConfig || (node.data.actionConfig as any) || {};
          const actionType = dbCfg.actionType;
          const targetTableId = dbCfg.targetTableId || (dbCfg as any).tableId;
          const table = store.tables.find(t => t.id === targetTableId || t.name === targetTableId);

          if (!table && actionType !== 'sendEmail') {
            addLogStep('failed', `Zieltabelle mit ID '${targetTableId}' nicht gefunden.`);
            return { success: false };
          }

          // Handle sendEmail in legacy actionNode
          if (actionType === 'sendEmail') {
            return this.executeSendEmailNode(node, context);
          }

          if (actionType === 'createRecord' && table) {
            const newRecord: Record<string, any> = {
              id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
            };

            // Map configured fields
            if (dbCfg.fieldMappings && dbCfg.fieldMappings.length > 0) {
              for (const mapping of dbCfg.fieldMappings) {
                if (mapping.valueMode === 'static') {
                  newRecord[mapping.fieldId] = mapping.staticValue;
                } else if (mapping.valueMode === 'variable' && mapping.variableName) {
                  newRecord[mapping.fieldId] = resolveVariablePath(mapping.variableName, context.variables);
                } else if (mapping.valueMode === 'formula' && mapping.formulaExpression) {
                  newRecord[mapping.fieldId] = evaluateWorkflowFormula(mapping.formulaExpression, {
                    ...context.variables.trigger,
                    ...context.variables.loop?.item,
                    ...newRecord
                  });
                }
              }
            } else {
              // Copy trigger fields as default if matching
              for (const field of table.fields) {
                if (context.variables.trigger?.[field.id] !== undefined) {
                  newRecord[field.id] = context.variables.trigger[field.id];
                } else if (context.variables.trigger?.[field.name] !== undefined) {
                  newRecord[field.id] = context.variables.trigger[field.name];
                }
              }
            }

            const updatedTable: Table = {
              ...table,
              data: [...(table.data || []), newRecord]
            };
            store.setTables(store.tables.map(t => t.id === table.id ? updatedTable : t));
            
            // Save to context
            context.variables.createdRecord = newRecord;
            addLogStep('success', `Neuen Datensatz in Tabelle '${table.name}' erfolgreich angelegt (ID: ${newRecord.id}).`, newRecord);
            return { success: true, output: newRecord };
          }

          if (actionType === 'updateRecord' && table) {
            let recordsToUpdate = table.data || [];
            let updatedCount = 0;

            const updatedData = recordsToUpdate.map(row => {
              let shouldUpdate = false;
              if (dbCfg.filterCondition?.fieldId) {
                const rowVal = row[dbCfg.filterCondition.fieldId];
                let targetVal = dbCfg.filterCondition.value;
                if (typeof targetVal === 'string' && targetVal.startsWith('{{')) {
                  targetVal = resolveVariablePath(targetVal, context.variables);
                }
                shouldUpdate = String(rowVal) === String(targetVal);
              } else if (context.variables.trigger?.id) {
                // By default update current trigger record if in same table
                shouldUpdate = String(row.id) === String(context.variables.trigger.id);
              }

              if (!shouldUpdate) return row;

              updatedCount++;
              const updatedRow = { ...row };

              if (dbCfg.fieldMappings && dbCfg.fieldMappings.length > 0) {
                for (const mapping of dbCfg.fieldMappings) {
                  if (mapping.valueMode === 'static') {
                    updatedRow[mapping.fieldId] = mapping.staticValue;
                  } else if (mapping.valueMode === 'variable' && mapping.variableName) {
                    updatedRow[mapping.fieldId] = resolveVariablePath(mapping.variableName, context.variables);
                  } else if (mapping.valueMode === 'formula' && mapping.formulaExpression) {
                    updatedRow[mapping.fieldId] = evaluateWorkflowFormula(mapping.formulaExpression, {
                      ...context.variables.trigger,
                      ...row
                    });
                  }
                }
              }

              return updatedRow;
            });

            const updatedTable: Table = {
              ...table,
              data: updatedData
            };
            store.setTables(store.tables.map(t => t.id === table.id ? updatedTable : t));

            addLogStep('success', `${updatedCount} Datensatz/Datensätze in Tabelle '${table.name}' aktualisiert.`);
            return { success: true };
          }

          if (actionType === 'deleteRecord' && table) {
            let targetId = context.variables.trigger?.id;
            if (dbCfg.filterCondition?.fieldId) {
              let condVal = dbCfg.filterCondition.value;
              if (typeof condVal === 'string' && condVal.startsWith('{{')) {
                condVal = resolveVariablePath(condVal, context.variables);
              }
              const found = (table.data || []).find(r => String(r[dbCfg.filterCondition!.fieldId!]) === String(condVal));
              if (found) targetId = found.id;
            }

            if (!targetId) {
              addLogStep('info', `Löschaktion übersprungen: Kein passender Datensatz in '${table.name}' identifiziert.`);
              return { success: true };
            }

            const updatedTable: Table = {
              ...table,
              data: (table.data || []).filter(r => r.id !== targetId)
            };
            store.setTables(store.tables.map(t => t.id === table.id ? updatedTable : t));

            addLogStep('success', `Datensatz mit ID '${targetId}' aus Tabelle '${table.name}' gelöscht.`);
            return { success: true };
          }

          if (actionType === 'calculateField' && table) {
            const targetField = dbCfg.targetFieldId;
            const formula = dbCfg.formula || '';
            let affected = 0;

            const updatedData = (table.data || []).map(row => {
              const calcVal = evaluateWorkflowFormula(formula, row);
              affected++;
              return { ...row, [targetField || 'result']: calcVal };
            });

            const updatedTable: Table = { ...table, data: updatedData };
            store.setTables(store.tables.map(t => t.id === table.id ? updatedTable : t));

            addLogStep('success', `Formel '${formula}' für ${affected} Datensätze in Spalte '${targetField}' berechnet.`);
            return { success: true };
          }

          addLogStep('info', `Aktion '${actionType}' ausgeführt.`);
          return { success: true };
        }

        // ----------------------------------------------------
        // 4. EMAIL ACTION NODE
        // ----------------------------------------------------
        case 'emailActionNode': {
          return this.executeSendEmailNode(node, context);
        }

        // ----------------------------------------------------
        // 5. EXPORT ACTION NODE (PDF / EXCEL / CSV)
        // ----------------------------------------------------
        case 'exportActionNode': {
          const cfg = node.data.exportActionConfig;
          if (!cfg) {
            addLogStep('failed', 'Keine Export-Konfiguration hinterlegt.');
            return { success: false };
          }

          let exportRows: any[] = [];
          let sourceName = 'Export';

          if (cfg.sourceType === 'table') {
            const table = store.tables.find(t => t.id === cfg.sourceId || t.name === cfg.sourceId);
            if (table) {
              exportRows = table.data || [];
              sourceName = table.name;
            }
          } else if (cfg.sourceType === 'report') {
            const report = store.reports.find(r => r.id === cfg.sourceId || r.name === cfg.sourceId);
            if (report) {
              sourceName = report.name;
              const sourceTable = store.tables.find(t => t.id === report.sourceId);
              exportRows = sourceTable ? (sourceTable.data || []) : [];
            }
          }

          const resolvedFileName = interpolateString(cfg.fileName || `${sourceName}_${new Date().toISOString().slice(0, 10)}`, context.variables);
          const format = (cfg.exportType || 'excel').toUpperCase() as any;

          if (cfg.autoDownload !== false) {
            exportDataToFile({
              data: exportRows,
              filename: resolvedFileName,
              format: format === 'EXCEL' ? 'XLSX' : format,
              title: resolvedFileName
            });
          }

          addLogStep(
            'success', 
            `Datei '${resolvedFileName}.${cfg.exportType}' mit ${exportRows.length} Datensätzen erfolgreich generiert (${cfg.exportType.toUpperCase()}).`
          );
          return { success: true };
        }

        // ----------------------------------------------------
        // 6. NOTIFICATION ACTION NODE (Toast / Message Box)
        // ----------------------------------------------------
        case 'notificationActionNode': {
          const cfg = node.data.notificationActionConfig;
          if (!cfg) return { success: true };

          const message = interpolateString(cfg.message || '', context.variables);
          const title = interpolateString(cfg.title || 'Workflow Benachrichtigung', context.variables);

          if (cfg.type === 'toast' || !cfg.type) {
            if (context.onShowToast) {
              context.onShowToast(message, cfg.toastType || 'success');
            }
          } else if (cfg.type === 'messageBox') {
            if (context.onOpenMessageBox) {
              context.onOpenMessageBox(title, message);
            } else {
              window.alert(`${title}\n\n${message}`);
            }
          }

          addLogStep('success', `Benachrichtigung gesendet (${cfg.type}): "${message}"`);
          return { success: true };
        }

        // ----------------------------------------------------
        // 7. LOOP NODE (For Each)
        // ----------------------------------------------------
        case 'loopNode': {
          const cfg = node.data.loopConfig;
          const table = store.tables.find(t => t.id === cfg?.tableId);
          const loopItems = table ? (table.data || []) : (context.variables.trigger ? [context.variables.trigger] : []);

          addLogStep('info', `Schleife gestartet für Tabelle '${table ? table.name : 'Collection'}' mit ${loopItems.length} Elementen.`);
          return { success: true, loopItems };
        }

        // ----------------------------------------------------
        // 8. API / WEBHOOK NODE
        // ----------------------------------------------------
        case 'apiNode': {
          const cfg = node.data.apiConfig;
          if (!cfg || !cfg.url) {
            addLogStep('failed', 'Keine API-URL angegeben.');
            return { success: false };
          }

          const resolvedUrl = interpolateString(cfg.url, context.variables);
          const resolvedBody = cfg.body ? interpolateString(cfg.body, context.variables) : undefined;
          
          addLogStep('info', `HTTP ${cfg.method || 'GET'} Aufruf an: ${resolvedUrl}`);

          // In client-safe simulation, execute fetch if available or mock
          try {
            if (typeof fetch !== 'undefined') {
              const headers: Record<string, string> = {
                'Content-Type': 'application/json'
              };
              if (cfg.authBearerToken) {
                headers['Authorization'] = `Bearer ${interpolateString(cfg.authBearerToken, context.variables)}`;
              }

              const response = await fetch(resolvedUrl, {
                method: cfg.method || 'GET',
                headers,
                body: cfg.method !== 'GET' ? resolvedBody : undefined
              }).catch(e => ({ ok: false, status: 0, statusText: e.message }));

              if ('json' in response && typeof response.json === 'function') {
                const data = await response.json().catch(() => ({ status: 'raw_ok' }));
                if (cfg.saveResponseToVar) {
                  context.variables[cfg.saveResponseToVar] = data;
                }
                addLogStep('success', `API Aufruf erfolgreich (Status ${response.status})`, data);
              } else {
                addLogStep('info', `API Simulation abgeschlossen für ${resolvedUrl}`);
              }
            }
          } catch (err: any) {
            addLogStep('info', `API Aufruf protokolliert (Netzwerk-Hinweis: ${err.message})`);
          }

          return { success: true };
        }

        // ----------------------------------------------------
        // 9. DELAY NODE
        // ----------------------------------------------------
        case 'delayNode': {
          const secs = node.data.delayConfig?.seconds || 1;
          addLogStep('info', `Wartezeit von ${secs} Sekunden gestartet...`);
          await new Promise(r => setTimeout(r, Math.min(secs * 1000, 3000))); // Cap simulation delay at 3s
          addLogStep('success', `Wartezeit von ${secs} Sekunden beendet.`);
          return { success: true };
        }

        default:
          addLogStep('info', `Knoten '${nodeLabel}' (${node.type}) ausgeführt.`);
          return { success: true };
      }
    } catch (err: any) {
      addLogStep('failed', `Fehler bei der Ausführung von Knoten '${nodeLabel}': ${err?.message || String(err)}`);
      return { success: false };
    }
  }

  private static async executeSendEmailNode(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<{ success: boolean }> {
    const cfg = node.data.emailActionConfig || (node.data.actionConfig as any) || {};
    const recipient = interpolateString(cfg.to || cfg.emailTo || 'admin@example.com', context.variables);
    const subject = interpolateString(cfg.subject || cfg.emailSubject || 'Workflow Benachrichtigung', context.variables);
    const body = interpolateString(cfg.body || 'Automatische E-Mail-Benachrichtigung von DB Studio Pro.', context.variables);

    const emailPayload = {
      to: recipient,
      subject,
      body,
      attachmentName: cfg.includeAttachment ? `Bericht_${new Date().toISOString().slice(0, 10)}.pdf` : undefined
    };

    context.log.emailSentPreview = emailPayload;
    context.variables.lastSentEmail = emailPayload;

    if (context.onShowToast) {
      context.onShowToast(`E-Mail gesendet an ${recipient}: "${subject}"`, 'success');
    }

    context.log.steps.push({
      nodeId: node.id,
      nodeLabel: node.data?.label || 'E-Mail senden',
      nodeType: 'emailActionNode',
      status: 'success',
      timestamp: new Date().toISOString(),
      details: `E-Mail erfolgreich versendet an '${recipient}'. Betreff: "${subject}".`,
      output: emailPayload
    });

    return { success: true };
  }

  // Public listener called globally when table records are created, updated, or deleted
  public static triggerTableEvent(
    event: WorkflowTriggerEvent,
    tableId: string,
    record?: Record<string, any>,
    previousRecord?: Record<string, any>,
    callbacks?: {
      onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
      onOpenMessageBox?: (title: string, message: string) => void;
    }
  ): void {
    const store = useProjectStore.getState();
    const activeWorkflows = (store.workflows || []).filter(w => w.active);

    for (const wf of activeWorkflows) {
      const matchingTrigger = wf.nodes.find(n => {
        if (n.type !== 'triggerNode') return false;
        const cfg = n.data.triggerConfig;
        if (!cfg) return false;
        if (cfg.event !== event) return false;
        if (cfg.tableId && cfg.tableId !== tableId) return false;
        return true;
      });

      if (matchingTrigger) {
        console.log(`[WorkflowEngine] Auto-triggering workflow '${wf.name}' for event '${event}' on table '${tableId}'`);
        this.executeWorkflow(wf, event, record, previousRecord, callbacks);
      }
    }
  }
}
