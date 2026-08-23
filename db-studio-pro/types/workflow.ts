import React from 'react';

export type WorkflowTriggerEvent = 
  | 'onCreate' 
  | 'onUpdate' 
  | 'onDelete' 
  | 'onFieldChange' 
  | 'onManual' 
  | 'onSchedule' 
  | 'onFormSubmit';

export interface WorkflowFieldMapping {
  fieldId: string;
  fieldName?: string;
  valueMode: 'static' | 'variable' | 'formula';
  staticValue?: any;
  variableName?: string; // e.g. {{trigger.customer_name}} or {{loop.item.price}}
  formulaExpression?: string; // e.g. [Menge] * [Preis] or UPPER([Name])
}

export interface WorkflowTriggerConfig {
  event: WorkflowTriggerEvent;
  tableId?: string;
  fieldId?: string; // For onFieldChange
  cronExpression?: string; // For onSchedule (e.g. 0 0 * * *)
  intervalMinutes?: number;
  description?: string;
}

export interface WorkflowConditionConfig {
  fieldId?: string;
  fieldName?: string;
  sourceTableId?: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty';
  value?: string;
  useVariable?: boolean;
}

export interface WorkflowDatabaseActionConfig {
  actionType: 'createRecord' | 'updateRecord' | 'deleteRecord' | 'filterRecords' | 'calculateField';
  targetTableId?: string;
  targetTableName?: string;
  // Criteria to identify records for update / delete / filter
  filterCondition?: {
    fieldId?: string;
    operator?: string;
    value?: string;
  };
  filterAllMatching?: boolean;
  fieldMappings?: WorkflowFieldMapping[];
  // For calculateField:
  targetFieldId?: string;
  formula?: string;
}

export interface WorkflowEmailActionConfig {
  to: string; // e.g. "admin@company.com" or "{{trigger.email}}"
  cc?: string;
  replyTo?: string;
  subject: string;
  body: string; // supports markdown and placeholders {{trigger.id}}, {{trigger.name}}, etc.
  isHtml?: boolean;
  includeAttachment?: boolean;
  attachmentType?: 'pdf_report' | 'table_export' | 'custom_csv';
  attachmentReportId?: string;
  attachmentTableId?: string;
}

export interface WorkflowExportActionConfig {
  exportType: 'pdf' | 'excel' | 'csv' | 'json';
  sourceType: 'table' | 'report' | 'query';
  sourceId: string;
  fileName?: string;
  autoDownload?: boolean;
}

export interface WorkflowNotificationActionConfig {
  type: 'toast' | 'messageBox' | 'sound';
  toastType?: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  confirmText?: string;
}

export interface WorkflowApiConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string> | string;
  body?: string; // JSON or raw with variables {{trigger.id}}
  authBearerToken?: string;
  saveResponseToVar?: string;
}

export interface WorkflowLoopConfig {
  tableId?: string;
  queryId?: string;
  sourceName?: string;
  variableName?: string;
  maxIterations?: number;
}

export interface WorkflowDelayConfig {
  seconds: number;
  message?: string;
}

export interface WorkflowJsScriptConfig {
  code: string;
  description?: string;
}

export interface WorkflowNodeData {
  label: string;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'failed' | 'skipped';
  lastRunResult?: string;
  
  // Specific configurations
  triggerConfig?: WorkflowTriggerConfig;
  conditionConfig?: WorkflowConditionConfig;
  databaseActionConfig?: WorkflowDatabaseActionConfig;
  emailActionConfig?: WorkflowEmailActionConfig;
  exportActionConfig?: WorkflowExportActionConfig;
  notificationActionConfig?: WorkflowNotificationActionConfig;
  apiConfig?: WorkflowApiConfig;
  loopConfig?: WorkflowLoopConfig;
  delayConfig?: WorkflowDelayConfig;
  jsScriptConfig?: WorkflowJsScriptConfig;

  // Legacy fallback configs for backwards compatibility
  actionConfig?: {
    actionType: 'sendEmail' | 'updateRecord' | 'createRecord' | 'deleteRecord';
    emailTo?: string;
    emailSubject?: string;
  };
  fileUploadConfig?: {
    tableId?: string;
    fileTypes?: string;
    maxSizeBytes?: number;
  };

  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: 
    | 'triggerNode' 
    | 'databaseActionNode' 
    | 'emailActionNode' 
    | 'exportActionNode' 
    | 'notificationActionNode' 
    | 'conditionNode' 
    | 'loopNode' 
    | 'apiNode' 
    | 'delayNode' 
    | 'scriptNode'
    | 'actionNode' 
    | 'uploadNode';
  position: { x: number; y: number };
  data: WorkflowNodeData;
  parentId?: string;
  extent?: 'parent';
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
  type?: string;
  style?: React.CSSProperties;
}

export interface WorkflowExecutionStepLog {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: 'success' | 'failed' | 'skipped' | 'info';
  timestamp: string;
  details: string;
  output?: any;
}

export interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerEvent: string;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  steps: WorkflowExecutionStepLog[];
  emailSentPreview?: {
    to: string;
    subject: string;
    body: string;
    attachmentName?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  lastExecutedAt?: string;
  lastExecutionStatus?: 'success' | 'failed' | 'idle';
  executionLogs?: WorkflowExecutionLog[];
}
