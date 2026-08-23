import { Field } from '../../../types/index';
import { inferFieldType } from '../../../utils/apiImportHelper';

export const mapColumnsToFields = (
  columns: string[],
  sampleRow: any,
  primaryKeyCol: string | null,
  schemaOverrides: Record<string, any>,
  data: any[]
): { fields: Field[]; needsAutoId: boolean } => {
  let needsAutoId = false;
  if (!primaryKeyCol) {
    const hasIdColumn = columns.some(c => c.toLowerCase() === 'id');
    if (!hasIdColumn) {
      needsAutoId = true;
    }
  }

  const fields: Field[] = columns.map(col => {
    const sampleVal = sampleRow ? sampleRow[col] : null;
    const inferredType = Array.isArray(sampleVal) ? 'TEXT' : inferFieldType(sampleVal);
    const type = schemaOverrides[col] || inferredType;
    
    let isId = false;
    if (primaryKeyCol) {
      isId = col === primaryKeyCol;
    } else {
      isId = col.toLowerCase() === 'id';
    }
    
    return {
      id: crypto.randomUUID(),
      name: col,
      type: type as Field['type'],
      isPrimaryKey: isId,
      isAutoIncrement: isId && type === 'INTEGER',
      allowNull: !isId
    };
  });

  if (needsAutoId) {
    fields.unshift({
      id: crypto.randomUUID(),
      name: 'id',
      type: 'INTEGER',
      isPrimaryKey: true,
      isAutoIncrement: true,
      allowNull: false
    });
  } else if (data[0] && data[0]['_ImportId']) {
    fields.push({ id: crypto.randomUUID(), name: '_ImportId', type: 'INTEGER', allowNull: true });
  }

  return { fields, needsAutoId };
};

export const mapAndCleanData = (
  data: any[],
  needsAutoId: boolean,
  schemaOverrides: Record<string, any>
): any[] => {
  return data.map(row => {
    const newRow = { ...row };
    if (needsAutoId) {
      newRow['id'] = newRow['_ImportId'];
    }

    for (const key in newRow) {
      const override = schemaOverrides[key];
      if (Array.isArray(newRow[key])) {
        newRow[key] = JSON.stringify(newRow[key]);
      } else if (override === 'INTEGER' && newRow[key] !== null && newRow[key] !== undefined) {
        const parsed = parseInt(newRow[key], 10);
        newRow[key] = isNaN(parsed) ? null : parsed;
      } else if (override === 'REAL' && newRow[key] !== null && newRow[key] !== undefined) {
        const parsed = parseFloat(newRow[key]);
        newRow[key] = isNaN(parsed) ? null : parsed;
      } else if (override === 'BOOLEAN' && newRow[key] !== null && newRow[key] !== undefined) {
        newRow[key] = (newRow[key] === 'true' || newRow[key] === true || newRow[key] === 1 || newRow[key] === '1') ? 1 : 0;
      } else if (override === 'TEXT' && newRow[key] !== null && newRow[key] !== undefined) {
        newRow[key] = String(newRow[key]);
      }
    }
    return newRow;
  });
};
