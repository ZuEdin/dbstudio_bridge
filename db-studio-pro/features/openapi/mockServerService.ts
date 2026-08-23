import { Table } from '../../types/index';
import { MockApiLog } from './openApiTypes';

export interface MockServerResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  durationMs: number;
}

export const executeInBrowserMockRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  tables: Table[],
  updateTable: (table: Table) => void,
  payload?: any,
  latencyMs = 80
): Promise<{ response: MockServerResponse; log: MockApiLog }> => {
  const startTime = performance.now();

  // Simulate network latency
  if (latencyMs > 0) {
    await new Promise(resolve => setTimeout(resolve, latencyMs));
  }

  // Parse path: /api/v1/{tableName} or /api/v1/{tableName}/{id}
  const cleanPath = path.split('?')[0];
  const queryStr = path.includes('?') ? path.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryStr);

  const segments = cleanPath.replace(/^\//, '').split('/');
  // Expected: ['api', 'v1', 'tableName', 'id?']
  const tableNameParam = segments[2] || '';
  const idParam = segments[3];

  const targetTable = tables.find(
    t => t.name.toLowerCase() === tableNameParam.toLowerCase() || t.id === tableNameParam
  );

  let status = 200;
  let statusText = 'OK';
  let responseData: any = null;

  if (!targetTable) {
    status = 404;
    statusText = 'Not Found';
    responseData = {
      error: 'TableNotFound',
      message: `Tabelle "${tableNameParam}" existiert nicht in der Datenbank.`
    };
  } else {
    const tableData: any[] = targetTable.data || [];
    const pkField = targetTable.fields.find(f => f.isPrimaryKey) || targetTable.fields[0];
    const pkName = pkField?.name || 'id';

    switch (method) {
      case 'GET': {
        if (idParam) {
          // Single record
          const record = tableData.find(r => String(r[pkName]) === String(idParam));
          if (record) {
            status = 200;
            statusText = 'OK';
            responseData = record;
          } else {
            status = 404;
            statusText = 'Not Found';
            responseData = { error: 'RecordNotFound', message: `Datensatz mit ID "${idParam}" nicht gefunden.` };
          }
        } else {
          // List with filter & pagination
          let filtered = [...tableData];
          const search = searchParams.get('search');
          if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter(row =>
              Object.values(row).some(v => String(v).toLowerCase().includes(lower))
            );
          }

          const limit = parseInt(searchParams.get('limit') || '50', 10);
          const offset = parseInt(searchParams.get('offset') || '0', 10);
          const paged = filtered.slice(offset, offset + limit);

          status = 200;
          statusText = 'OK';
          responseData = {
            total: filtered.length,
            limit,
            offset,
            data: paged
          };
        }
        break;
      }

      case 'POST': {
        if (!payload || typeof payload !== 'object') {
          status = 400;
          statusText = 'Bad Request';
          responseData = { error: 'InvalidPayload', message: 'JSON-Objekt im Body erforderlich.' };
        } else {
          // Auto generate PK if not supplied
          const newRecord = { ...payload };
          if (!newRecord[pkName]) {
            newRecord[pkName] = tableData.length > 0
              ? Math.max(...tableData.map(r => Number(r[pkName]) || 0)) + 1
              : 1;
          }

          const updatedTable: Table = {
            ...targetTable,
            data: [...tableData, newRecord]
          };
          updateTable(updatedTable);

          status = 201;
          statusText = 'Created';
          responseData = newRecord;
        }
        break;
      }

      case 'PUT': {
        if (!idParam) {
          status = 400;
          statusText = 'Bad Request';
          responseData = { error: 'MissingId', message: 'ID in URL-Pfad erforderlich.' };
        } else {
          const index = tableData.findIndex(r => String(r[pkName]) === String(idParam));
          if (index === -1) {
            status = 404;
            statusText = 'Not Found';
            responseData = { error: 'RecordNotFound', message: `Datensatz mit ID "${idParam}" nicht gefunden.` };
          } else {
            const updatedRecord = { ...tableData[index], ...payload, [pkName]: tableData[index][pkName] };
            const nextData = [...tableData];
            nextData[index] = updatedRecord;

            const updatedTable: Table = {
              ...targetTable,
              data: nextData
            };
            updateTable(updatedTable);

            status = 200;
            statusText = 'OK';
            responseData = updatedRecord;
          }
        }
        break;
      }

      case 'DELETE': {
        if (!idParam) {
          status = 400;
          statusText = 'Bad Request';
          responseData = { error: 'MissingId', message: 'ID in URL-Pfad erforderlich.' };
        } else {
          const index = tableData.findIndex(r => String(r[pkName]) === String(idParam));
          if (index === -1) {
            status = 404;
            statusText = 'Not Found';
            responseData = { error: 'RecordNotFound', message: `Datensatz mit ID "${idParam}" nicht gefunden.` };
          } else {
            const nextData = tableData.filter((_, i) => i !== index);
            const updatedTable: Table = {
              ...targetTable,
              data: nextData
            };
            updateTable(updatedTable);

            status = 200;
            statusText = 'OK';
            responseData = { success: true, message: `Datensatz "${idParam}" erfolgreich gelöscht.` };
          }
        }
        break;
      }
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  const response: MockServerResponse = {
    status,
    statusText,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-powered-by': 'DB-Studio-InBrowser-MockServer',
      'x-response-time': `${durationMs}ms`
    },
    data: responseData,
    durationMs
  };

  const log: MockApiLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    method,
    path,
    status,
    durationMs,
    requestPayload: payload,
    responsePayload: responseData
  };

  return { response, log };
};
