import { Workflow, WorkflowNode, WorkflowEdge } from '../../types/index';

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  disabled?: boolean;
}

export interface N8nConnectionItem {
  node: string;
  type: string;
  index: number;
}

export interface N8nWorkflowExport {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, { main: N8nConnectionItem[][] }>;
  active: boolean;
  settings: {
    executionOrder?: 'v1';
    timezone?: string;
    saveExecutionProgress?: boolean;
    saveManualExecutions?: boolean;
  };
  versionId?: string;
  meta: {
    templateCredsSetupCompleted?: boolean;
    instanceId: string;
  };
  tags?: Array<{ id: string; name: string }>;
}

export function generateN8nWorkflow(workflow: Workflow, baseUrl = 'http://localhost:5000'): N8nWorkflowExport {
  const nodes: N8nNode[] = [];
  const connections: Record<string, { main: N8nConnectionItem[][] }> = {};

  const nodeIdToNameMap: Record<string, string> = {};
  const usedNames = new Set<string>();

  const getUniqueName = (base: string) => {
    let name = base.trim() || 'Node';
    let counter = 1;
    while (usedNames.has(name)) {
      name = `${base} ${++counter}`;
    }
    usedNames.add(name);
    return name;
  };

  // 1. Process all nodes
  (workflow.nodes || []).forEach((node: WorkflowNode, index: number) => {
    const rawLabel = node.data?.label || `Node_${index + 1}`;
    const nodeName = getUniqueName(rawLabel);
    nodeIdToNameMap[node.id] = nodeName;

    const posX = Math.round(node.position?.x ?? (index * 260 + 100));
    const posY = Math.round(node.position?.y ?? (index % 2 === 0 ? 200 : 350));

    let n8nType = 'n8n-nodes-base.httpRequest';
    let typeVersion = 1;
    let parameters: Record<string, any> = {};

    switch (node.type) {
      case 'triggerNode': {
        const trigger = node.data?.triggerConfig;
        if (trigger?.event === 'onSchedule') {
          n8nType = 'n8n-nodes-base.scheduleTrigger';
          typeVersion = 1.2;
          parameters = {
            rule: {
              interval: [
                {
                  field: trigger.cronExpression ? 'cronExpression' : 'minutes',
                  expression: trigger.cronExpression || '0 * * * *',
                  minutesInterval: trigger.intervalMinutes || 15
                }
              ]
            }
          };
        } else if (trigger?.event === 'onManual') {
          n8nType = 'n8n-nodes-base.manualTrigger';
          typeVersion = 1;
          parameters = {};
        } else {
          // Webhook trigger for DB events (onCreate, onUpdate, onDelete, onFormSubmit)
          n8nType = 'n8n-nodes-base.webhook';
          typeVersion = 2;
          const eventPath = trigger?.event || 'db-event';
          parameters = {
            httpMethod: 'POST',
            path: `db-studio/${eventPath.toLowerCase()}`,
            responseMode: 'onReceived',
            options: {
              rawBody: false
            }
          };
        }
        break;
      }

      case 'conditionNode': {
        n8nType = 'n8n-nodes-base.if';
        typeVersion = 2.2;
        const cond = node.data?.conditionConfig;
        const operatorMap: Record<string, string> = {
          eq: 'equals',
          neq: 'notEquals',
          gt: 'gt',
          gte: 'gte',
          lt: 'lt',
          lte: 'lte',
          contains: 'contains',
          notContains: 'notContains',
          isEmpty: 'empty',
          isNotEmpty: 'notEmpty',
          startsWith: 'startsWith',
          endsWith: 'endsWith'
        };

        parameters = {
          conditions: {
            options: {
              caseSensitive: true,
              leftValue: '',
              typeValidation: 'strict'
            },
            conditions: [
              {
                id: 'cond_1',
                leftValue: `={{ $json.${cond?.fieldName || 'status'} }}`,
                rightValue: cond?.value ?? 'Bezahlt',
                operator: {
                  type: 'string',
                  operation: operatorMap[cond?.operator || 'eq'] || 'equals'
                }
              }
            ],
            combinator: 'and'
          }
        };
        break;
      }

      case 'databaseActionNode': {
        const dbAction = node.data?.databaseActionConfig;
        n8nType = 'n8n-nodes-base.httpRequest';
        typeVersion = 4.2;
        const tableName = dbAction?.targetTableName?.toLowerCase() || 'records';
        const method = dbAction?.actionType === 'createRecord' ? 'POST' 
          : dbAction?.actionType === 'updateRecord' ? 'PUT' 
          : dbAction?.actionType === 'deleteRecord' ? 'DELETE' 
          : 'GET';

        parameters = {
          method,
          url: `${baseUrl}/api/data/${tableName}`,
          sendBody: method !== 'GET',
          specifyBody: 'json',
          jsonBody: '={\n  "syncedAt": "{{ $now }}",\n  "data": {{ $json }}\n}',
          options: {
            response: {
              response: {
                fullResponse: false
              }
            }
          }
        };
        break;
      }

      case 'emailActionNode': {
        const emailConfig = node.data?.emailActionConfig;
        n8nType = 'n8n-nodes-base.emailSend';
        typeVersion = 2.1;
        parameters = {
          fromEmail: 'noreply@dbstudio.local',
          toEmail: emailConfig?.to || '={{ $json.email }}',
          subject: emailConfig?.subject || 'DB Studio Workflow Benachrichtigung',
          html: emailConfig?.isHtml !== false,
          body: emailConfig?.body || 'Hallo,\n\nIhr DB Studio Workflow wurde erfolgreich ausgeführt.'
        };
        break;
      }

      case 'apiNode': {
        const api = node.data?.apiConfig;
        n8nType = 'n8n-nodes-base.httpRequest';
        typeVersion = 4.2;
        parameters = {
          method: api?.method || 'POST',
          url: api?.url || `${baseUrl}/api/event`,
          sendHeaders: !!api?.headers,
          sendBody: ['POST', 'PUT', 'PATCH'].includes(api?.method || 'POST'),
          specifyBody: 'json',
          jsonBody: api?.body || '={{ $json }}',
          options: {}
        };
        break;
      }

      case 'notificationActionNode': {
        const notify = node.data?.notificationActionConfig;
        n8nType = 'n8n-nodes-base.httpRequest';
        typeVersion = 4.2;
        parameters = {
          method: 'POST',
          url: `${baseUrl}/api/notifications`,
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            type: notify?.type || 'toast',
            toastType: notify?.toastType || 'success',
            title: notify?.title || 'Workflow Event',
            message: notify?.message || 'Aktion erfolgreich ausgeführt'
          }, null, 2)
        };
        break;
      }

      case 'delayNode': {
        const delay = node.data?.delayConfig;
        n8nType = 'n8n-nodes-base.wait';
        typeVersion = 1.1;
        parameters = {
          amount: delay?.seconds || 5,
          unit: 'seconds'
        };
        break;
      }

      case 'scriptNode': {
        const script = node.data?.jsScriptConfig;
        n8nType = 'n8n-nodes-base.code';
        typeVersion = 2;
        parameters = {
          jsCode: script?.code || `// DB Studio JS Code Node
for (const item of $input.all()) {
  item.json.processedBy = "DB Studio n8n Bridge";
  item.json.timestamp = new Date().toISOString();
}
return $input.all();`
        };
        break;
      }

      case 'loopNode': {
        n8nType = 'n8n-nodes-base.splitInBatches';
        typeVersion = 3;
        parameters = {
          batchSize: 1
        };
        break;
      }

      case 'exportActionNode': {
        const exp = node.data?.exportActionConfig;
        n8nType = 'n8n-nodes-base.convertToFile';
        typeVersion = 1.1;
        parameters = {
          operation: 'toJson',
          options: {
            fileName: `${exp?.fileName || 'Export'}.${exp?.exportType || 'json'}`
          }
        };
        break;
      }

      default: {
        n8nType = 'n8n-nodes-base.code';
        typeVersion = 2;
        parameters = {
          jsCode: '// Unbekannter Knoten - Input durchreichen\nreturn $input.all();'
        };
        break;
      }
    }

    nodes.push({
      id: `n8n_${node.id}`,
      name: nodeName,
      type: n8nType,
      typeVersion,
      position: [posX, posY],
      parameters
    });
  });

  // 2. Process all edges / connections
  (workflow.edges || []).forEach((edge: WorkflowEdge) => {
    const sourceName = nodeIdToNameMap[edge.source];
    const targetName = nodeIdToNameMap[edge.target];

    if (!sourceName || !targetName) return;

    if (!connections[sourceName]) {
      connections[sourceName] = { main: [] };
    }

    const sourceNode = workflow.nodes.find(n => n.id === edge.source);
    let outputIndex = 0;

    // For Condition / IF nodes, handle 'true' vs 'false' output branch
    if (sourceNode?.type === 'conditionNode') {
      if (edge.sourceHandle === 'false' || edge.label?.toLowerCase() === 'falsch') {
        outputIndex = 1;
      } else {
        outputIndex = 0;
      }
    }

    while (connections[sourceName].main.length <= outputIndex) {
      connections[sourceName].main.push([]);
    }

    connections[sourceName].main[outputIndex].push({
      node: targetName,
      type: 'main',
      index: 0
    });
  });

  return {
    name: workflow.name || 'DB Studio Workflow',
    nodes,
    connections,
    active: workflow.active ?? false,
    settings: {
      executionOrder: 'v1',
      timezone: 'Europe/Berlin',
      saveExecutionProgress: true,
      saveManualExecutions: true
    },
    versionId: `v_${Date.now()}`,
    meta: {
      templateCredsSetupCompleted: true,
      instanceId: 'db-studio-pro-enterprise'
    },
    tags: [
      { id: 'tag_dbstudio', name: 'DB Studio Pro' },
      { id: 'tag_auto_gen', name: 'Generated' }
    ]
  };
}
