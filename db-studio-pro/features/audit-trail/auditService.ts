import { Table } from '../../types/index';
import { AuditEntry, FieldChangeDiff, AuditActionType } from './auditTypes';

export const generateSampleAuditHistory = (tables: Table[]): AuditEntry[] => {
  const users = [
    { id: 'u1', name: 'Max Mustermann', role: 'Admin' },
    { id: 'u2', name: 'Sarah Müller', role: 'Manager' },
    { id: 'u3', name: 'Tom Schmidt', role: 'Sachbearbeiter' },
    { id: 'u4', name: 'Anna Bauer', role: 'Sachbearbeiter' }
  ];

  const entries: AuditEntry[] = [];
  const now = Date.now();

  tables.forEach((table, tIdx) => {
    const records = table.data || [];
    const pk = table.fields.find(f => f.isPrimaryKey)?.name || table.fields[0]?.name || 'id';

    records.slice(0, 3).forEach((rec, rIdx) => {
      const recId = String(rec[pk] || rIdx + 1);
      const user = users[(tIdx + rIdx) % users.length];

      // 1. Initial Insert
      const insertTime = now - (1000 * 60 * 60 * (24 + (tIdx * 5) + rIdx));
      entries.push({
        id: `audit_ins_${table.id}_${recId}`,
        timestamp: new Date(insertTime).toLocaleString('de-DE'),
        unixTimestamp: insertTime,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'INSERT',
        tableId: table.id,
        tableName: table.name,
        recordId: recId,
        diffs: Object.entries(rec).map(([fieldName, newValue]) => ({
          fieldName,
          oldValue: null,
          newValue
        })),
        snapshotBefore: undefined,
        snapshotAfter: { ...rec },
        comment: `Datensatz #${recId} initial angelegt.`
      });

      // 2. Subsequent Updates for sample fields
      const modifiableFields = table.fields.filter(f => !f.isPrimaryKey && f.type !== 'ID');
      if (modifiableFields.length > 0) {
        const targetField = modifiableFields[rIdx % modifiableFields.length];
        const updateTime = now - (1000 * 60 * 30 * (rIdx + 1));
        const originalVal = rec[targetField.name];
        const prevVal = typeof originalVal === 'number' ? originalVal - 10 : `Alt: ${originalVal}`;

        entries.push({
          id: `audit_upd_${table.id}_${recId}_${Date.now()}_${rIdx}`,
          timestamp: new Date(updateTime).toLocaleString('de-DE'),
          unixTimestamp: updateTime,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'UPDATE',
          tableId: table.id,
          tableName: table.name,
          recordId: recId,
          diffs: [
            {
              fieldName: targetField.name,
              oldValue: prevVal,
              newValue: originalVal
            }
          ],
          snapshotBefore: { ...rec, [targetField.name]: prevVal },
          snapshotAfter: { ...rec },
          comment: `Feld '${targetField.name}' aktualisiert.`
        });
      }
    });
  });

  // Sort descending by timestamp
  return entries.sort((a, b) => b.unixTimestamp - a.unixTimestamp);
};

export const restoreRecordFromSnapshot = (
  table: Table,
  recordId: string,
  snapshot: Record<string, any>
): Table => {
  const pkField = table.fields.find(f => f.isPrimaryKey)?.name || table.fields[0]?.name || 'id';
  const nextData = (table.data || []).map(row => {
    if (String(row[pkField]) === String(recordId)) {
      return { ...snapshot };
    }
    return row;
  });

  return {
    ...table,
    data: nextData
  };
};

export const exportAuditLogsToCsv = (entries: AuditEntry[]): string => {
  const headers = ['ID', 'Zeitstempel', 'Benutzer', 'Rolle', 'Aktion', 'Tabelle', 'Datensatz-ID', 'Änderungen', 'Kommentar'];
  const rows = entries.map(e => [
    `"${e.id}"`,
    `"${e.timestamp}"`,
    `"${e.userName}"`,
    `"${e.userRole}"`,
    `"${e.action}"`,
    `"${e.tableName}"`,
    `"${e.recordId}"`,
    `"${e.diffs.map(d => `${d.fieldName}: ${d.oldValue} -> ${d.newValue}`).join('; ')}"`,
    `"${e.comment || ''}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
