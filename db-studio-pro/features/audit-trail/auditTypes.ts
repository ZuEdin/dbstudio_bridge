export type AuditActionType = 'INSERT' | 'UPDATE' | 'DELETE' | 'SCHEMA_CHANGE' | 'RESTORE';

export interface FieldChangeDiff {
  fieldName: string;
  oldValue: any;
  newValue: any;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  unixTimestamp: number;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditActionType;
  tableId: string;
  tableName: string;
  recordId: string;
  diffs: FieldChangeDiff[];
  snapshotBefore?: Record<string, any>;
  snapshotAfter?: Record<string, any>;
  comment?: string;
}

export interface AuditFilter {
  search: string;
  tableId: string;
  action: string;
  user: string;
}
