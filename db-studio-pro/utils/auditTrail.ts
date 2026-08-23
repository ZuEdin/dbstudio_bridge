export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tableName: string;
  recordId: string | number;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'EXECUTE_QUERY' | 'LOGIN';
  user: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
}

const STORAGE_KEY = 'db_studio_audit_log';

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const logAuditTrail = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  try {
    const logs = getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    const updated = [newEntry, ...logs].slice(0, 1000); // Keep last 1000 logs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log audit trail:', e);
  }
};

export const clearAuditLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};
