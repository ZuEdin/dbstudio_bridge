
import { Query, Table, Relationship, SelectQuery, QueryColumn } from '../../../types/index';

// Helper to extract dynamic parameters [Prompt text] from query criteria
export const extractQueryParameters = (query: SelectQuery): string[] => {
  const params: string[] = [];
  query.columns.forEach(col => {
    col.criteria.forEach(crit => {
      if (!crit) return;
      // Match square brackets that are not [Forms] or field identifiers with dots
      const matches = crit.match(/\[([^\]]+)\]/g);
      if (matches) {
        matches.forEach(m => {
          if (!m.toLowerCase().startsWith('[forms]!') && !params.includes(m)) {
            params.push(m);
          }
        });
      }
    });
  });
  return params;
};

// Helper to resolve form values from context or fallback structures
export function resolveFormValue(formName: string, fieldName: string, context?: Record<string, any>): any {
  if (!formName || !fieldName) return undefined;
  const targetForm = formName.toLowerCase();
  const targetField = fieldName.toLowerCase();

  if (context) {
    // 1. Direct forms.formName.fieldName key
    const key1 = `forms.${targetForm}.${targetField}`;
    if (context[key1] !== undefined) return context[key1];

    // 2. Case-insensitive key scan in context
    for (const k of Object.keys(context)) {
      if (k.toLowerCase() === key1) return context[k];
    }

    // 3. Check currentRecord in context
    if (context.currentRecord) {
      const rec = context.currentRecord;
      if (rec[fieldName] !== undefined) return rec[fieldName];
      for (const k of Object.keys(rec)) {
        if (k.toLowerCase() === targetField) return rec[k];
      }
    }

    // 4. Check params in context
    if (context.params) {
      if (context.params[fieldName] !== undefined) return context.params[fieldName];
      for (const k of Object.keys(context.params)) {
        if (k.toLowerCase() === targetField) return context.params[k];
      }
    }

    // 5. Check direct context keys
    if (context[fieldName] !== undefined) return context[fieldName];
    for (const k of Object.keys(context)) {
      if (k.toLowerCase() === targetField) return context[k];
    }
  }

  return undefined;
}

// Helper to evaluate criteria
const matchesCriteria = (value: any, criteria: string, context?: Record<string, any>): boolean => {
  if (!criteria) return true; 
  let crit = criteria.trim();

  // Replace Parameter prompts e.g. [Geben Sie ein Datum ein] if provided in context
  if (context && context.parameters) {
    for (const [paramKey, paramVal] of Object.entries(context.parameters)) {
      if (crit.includes(paramKey)) {
        crit = crit.replace(paramKey, String(paramVal));
      }
    }
  }

  // Support for MS Access style form references e.g., [Forms]![FormName]![FieldName] or Forms!FormName!FieldName
  if (/(?:\[?Forms\]?!)/i.test(crit)) {
      const formMatch = crit.match(/(?:\[?Forms\]?!\s*\[?([^!\]]+)\]?!\s*\[?([^!\]\s]+)\]?)/i);
      if (formMatch && formMatch.length >= 3) {
          const formName = formMatch[1];
          const fieldName = formMatch[2];
          const val = resolveFormValue(formName, fieldName, context);
          
          if (val !== undefined && val !== null) {
              const strVal = String(val);
              let opMatch = crit.match(/^(=|like |>|<|>=|<=)/i);
              let op = opMatch ? opMatch[0].trim() : '=';
              
              const rowValStr = String(value !== null && value !== undefined ? value : '');

              if (op === '=') {
                  return rowValStr.toLowerCase() === strVal.toLowerCase();
              } else if (op === '>') {
                  return Number(value) > Number(strVal);
              } else if (op === '<') {
                  return Number(value) < Number(strVal);
              } else if (op === '>=') {
                  return Number(value) >= Number(strVal);
              } else if (op === '<=') {
                  return Number(value) <= Number(strVal);
              } else if (op.toLowerCase() === 'like') {
                  const pattern = strVal.replace(/\*/g, '.*').replace(/\?/g, '.');
                  return new RegExp(`^${pattern}$`, 'i').test(rowValStr);
              }
          } else {
              // Form parameter value is empty/not found: match only if row value is also empty
              return value === null || value === undefined || String(value).trim() === '';
          }
      }
  }

  crit = crit.toLowerCase();
  if (crit === '') return true;

  const strValue = String(value !== null && value !== undefined ? value : '').toLowerCase();
  
  // DATE LOGIC
  let targetDate = new Date();
  let isDateComparison = false;
  let operator = '=';

  // Check for keywords
  if (crit.includes('today') || crit.includes('heute')) {
      isDateComparison = true;
      targetDate.setHours(0,0,0,0);
  } else if (crit.includes('yesterday') || crit.includes('gestern')) {
      isDateComparison = true;
      targetDate.setDate(targetDate.getDate() - 1);
      targetDate.setHours(0,0,0,0);
  } else if (crit.includes('tomorrow') || crit.includes('morgen')) {
      isDateComparison = true;
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(0,0,0,0);
  } else {
      const cleanDateStr = crit.replace(/(>=|<=|>|<|=)/, '').trim();
      if (cleanDateStr.match(/^\d{4}-\d{2}-\d{2}$/) || cleanDateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          isDateComparison = true;
          const iso = cleanDateStr.includes('.') ? cleanDateStr.split('.').reverse().join('-') : cleanDateStr;
          targetDate = new Date(iso);
          targetDate.setHours(0,0,0,0);
      }
  }

  if (isDateComparison) {
      if (crit.startsWith('>=')) operator = '>=';
      else if (crit.startsWith('<=')) operator = '<=';
      else if (crit.startsWith('>')) operator = '>';
      else if (crit.startsWith('<')) operator = '<';
      
      let valDate = new Date();
      if (typeof value === 'number') {
          valDate = new Date(value > 10000000000 ? value : value * 1000);
      } else {
          valDate = new Date(value);
      }
      
      if (isNaN(valDate.getTime())) return false;
      valDate.setHours(0,0,0,0);

      const t1 = valDate.getTime();
      const t2 = targetDate.getTime();

      switch(operator) {
          case '>': return t1 > t2;
          case '<': return t1 < t2;
          case '>=': return t1 >= t2;
          case '<=': return t1 <= t2;
          default: return t1 === t2;
      }
  }

  if (crit === 'is null' || crit === 'null') {
      return value === null || value === undefined || value === '' || String(value).trim() === '';
  }
  if (crit === 'is not null' || crit === 'not null') {
      return value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
  }

  // Compound criteria with UND / AND (e.g., ">= 10 und <= 50", "> 5 und < 20")
  if ((crit.includes(' und ') || crit.includes(' and ')) && !crit.startsWith('zwischen') && !crit.startsWith('between')) {
    const subCrits = crit.split(/\s+(?:und|and)\s+/i);
    return subCrits.every(sc => matchesCriteria(value, sc.trim(), context));
  }

  // BETWEEN / ZWISCHEN syntax (e.g., "Zwischen 10 Und 50", "Between 2025-01-01 And 2025-12-31", "Zwischen 'A' Und 'M'")
  if (crit.startsWith('zwischen') || crit.startsWith('between') || crit.includes(' und ') || crit.includes(' and ')) {
    const clean = crit.replace(/^(zwischen|between)\s+/i, '');
    const parts = clean.split(/\s+(?:und|and)\s+/i);
    if (parts.length === 2) {
      const p1 = parts[0].trim().replace(/^["']|["']$/g, '');
      const p2 = parts[1].trim().replace(/^["']|["']$/g, '');

      // Check if both parts are dates
      const isDate1 = p1.match(/^\d{4}-\d{2}-\d{2}$/) || p1.match(/^\d{2}\.\d{2}\.\d{4}$/) || p1.includes('heute') || p1.includes('today');
      const isDate2 = p2.match(/^\d{4}-\d{2}-\d{2}$/) || p2.match(/^\d{2}\.\d{2}\.\d{4}$/) || p2.includes('heute') || p2.includes('today');

      if (isDate1 || isDate2) {
        let valDate = new Date(typeof value === 'number' ? (value > 10000000000 ? value : value * 1000) : value);
        if (!isNaN(valDate.getTime())) {
          valDate.setHours(0,0,0,0);
          const parseD = (s: string) => {
            if (s.includes('heute') || s.includes('today')) { const d = new Date(); d.setHours(0,0,0,0); return d; }
            const iso = s.includes('.') ? s.split('.').reverse().join('-') : s;
            const d = new Date(iso); d.setHours(0,0,0,0); return d;
          };
          const d1 = parseD(p1);
          const d2 = parseD(p2);
          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            const vt = valDate.getTime();
            return vt >= Math.min(d1.getTime(), d2.getTime()) && vt <= Math.max(d1.getTime(), d2.getTime());
          }
        }
      }

      const numVal = parseFloat(value);
      const minNum = parseFloat(p1);
      const maxNum = parseFloat(p2);
      if (!isNaN(numVal) && !isNaN(minNum) && !isNaN(maxNum)) {
        return numVal >= Math.min(minNum, maxNum) && numVal <= Math.max(minNum, maxNum);
      }

      const strVal = String(value ?? '').toLowerCase();
      return strVal >= p1.toLowerCase() && strVal <= p2.toLowerCase();
    }
  }

  if (crit.startsWith('>=')) return parseFloat(value) >= parseFloat(crit.substring(2).trim());
  if (crit.startsWith('<=')) return parseFloat(value) <= parseFloat(crit.substring(2).trim());
  if (crit.startsWith('>')) return parseFloat(value) > parseFloat(crit.substring(1).trim());
  if (crit.startsWith('<')) return parseFloat(value) < parseFloat(crit.substring(1).trim());
  if (crit.startsWith('!=')) return String(value) != crit.substring(2).trim();
  if (crit.startsWith('=')) {
      const target = crit.substring(1).trim();
      if (target === '""' || target === "''") return strValue === '';
      return strValue == target.replace(/^["']|["']$/g, '').toLowerCase();
  }

  if (crit.startsWith('wie') || crit.includes('*') || crit.includes('%')) {
    const pattern = crit.replace('wie', '').trim().replace(/\*/g, '.*').replace(/%/g, '.*');
    try {
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(strValue);
    } catch (e) { return false; } 
  }

  if ((crit.startsWith('"') && crit.endsWith('"')) || (crit.startsWith("'") && crit.endsWith("'"))) {
    return strValue === crit.substring(1, crit.length - 1).toLowerCase();
  }
  
  if (!isNaN(Number(crit)) && !isNaN(Number(value))) {
      return Number(value) === Number(crit);
  }

  return strValue === crit;
};

const resolveExpression = (row: Record<string, any>, expression: string): any => {
  if (!expression) return null;
  let result = expression;
  const matches = expression.match(/\{\{([^}]+)\}\}/g);
  if (matches) {
    matches.forEach(match => {
      const key = match.substring(2, match.length - 2).trim(); // remove {{ }}
      const val = row[key] !== undefined ? row[key] : '';
      result = result.replace(match, String(val));
    });
  }
  try {
      if (result.includes('&')) {
          const parts = result.split('&').map(p => {
              p = p.trim();
              if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
                  return p.substring(1, p.length - 1);
              }
              return p; 
          });
          return parts.join('');
      }
      return result;
  } catch (e) {
      return "#ERROR";
  }
};

export const executeSelectQuery = (query: SelectQuery, tables: Table[], relationships: Relationship[], context?: Record<string, any>): Record<string, any>[] => {
    if (!query || !query.nodes || query.nodes.length === 0) return [];

    // 1. Prepare Data (Cartesian Product / Join)
    let workingData: Record<string, any>[] = [];
    const queryTableIds = new Set(query.nodes.map(n => n.tableId));
    const initialTableId = query.nodes[0].tableId;
    const initialTable = tables.find(t => t.id === initialTableId || t.name === initialTableId || t.name?.toLowerCase() === initialTableId?.toLowerCase());
    
    if (!initialTable || !initialTable.data) return [];

    // Helper to extract field value safely from working row
    const getFieldValue = (r: Record<string, any>, col: QueryColumn) => {
        if (col.isCalculated) return r[`CALC_${col.id}`];
        if (col.tableName && r[`${col.tableName}.${col.fieldName}`] !== undefined) return r[`${col.tableName}.${col.fieldName}`];
        if (r[col.fieldName] !== undefined) return r[col.fieldName];
        // Case-insensitive & suffix fallback search
        const lowerField = col.fieldName.toLowerCase();
        for (const k of Object.keys(r)) {
            const lowerK = k.toLowerCase();
            if (lowerK === lowerField || lowerK.endsWith('.' + lowerField)) {
                return r[k];
            }
        }
        return undefined;
    };

    workingData = initialTable.data.map(row => {
        const newRow: Record<string, any> = {};
        for (const key in row) {
            newRow[`${initialTable.name}.${key}`] = row[key];
            newRow[key] = row[key];
        }
        return newRow;
    });
    
    const joinedTables = new Set([initialTableId]);
    const relevantRels = relationships.filter(r => queryTableIds.has(r.fromTableId) && queryTableIds.has(r.toTableId));

    let progress = true;
    while(progress) {
        progress = false;
        for (const rel of relevantRels) {
            const join = (t1Id: string, t2Id: string, f1Id: string, f2Id: string) => {
                if (joinedTables.has(t1Id) && !joinedTables.has(t2Id)) {
                    const table1 = tables.find(t => t.id === t1Id)!;
                    const table2 = tables.find(t => t.id === t2Id)!;
                    if (!table2.data) return;
                    
                    const field1 = table1.fields.find(f => f.id === f1Id)!;
                    const field2 = table2.fields.find(f => f.id === f2Id)!;
                    
                    const newData: Record<string, any>[] = [];
                    workingData.forEach(row1 => {
                        table2.data!.forEach(row2 => {
                            const val1 = row1[`${table1.name}.${field1.name}`] ?? row1[field1.name];
                            const val2 = row2[field2.name];
                            if (val1 !== undefined && val2 !== undefined && String(val1) === String(val2)) {
                                const newRow = {...row1};
                                for (const key in row2) {
                                    newRow[`${table2.name}.${key}`] = row2[key];
                                    if (newRow[key] === undefined) newRow[key] = row2[key];
                                }
                                newData.push(newRow);
                            }
                        });
                    });
                    workingData = newData;
                    joinedTables.add(t2Id);
                    progress = true;
                }
            };
            join(rel.fromTableId, rel.toTableId, rel.fromFieldId, rel.toFieldId);
            join(rel.toTableId, rel.fromTableId, rel.toFieldId, rel.fromFieldId);
        }
    }

    // 2. Add Calculated Fields (Pre-Aggregation)
    query.columns.filter(c => c.isCalculated && c.expression).forEach(col => {
        workingData.forEach(row => {
            row[`CALC_${col.id}`] = resolveExpression(row, col.expression!);
        });
    });

    // 3. Filter (WHERE)
    let filteredData = workingData.filter(row => {
        for (const col of query.columns) {
            if (col.aggregate && col.aggregate !== 'GROUP_BY' && col.aggregate !== 'EXPRESSION') continue;

            const validCriteria = col.criteria.filter(c => c && c.trim() !== '');
            if (validCriteria.length > 0) {
                const cellValue = getFieldValue(row, col);

                const orConditionsMet = validCriteria.some(crit => matchesCriteria(cellValue, crit, context));
                if (!orConditionsMet) return false;
            }
        }
        return true;
    });

    // 4. Aggregation / Grouping
    const strictAggregation = query.columns.some(c => ['SUM','COUNT','AVG','MIN','MAX'].includes(c.aggregate || ''));

    if (strictAggregation) {
        const groups: Record<string, any[]> = {};
        const groupByCols = query.columns.filter(c => c.aggregate === 'GROUP_BY');
        
        filteredData.forEach(row => {
            const groupKey = groupByCols.length > 0 ? groupByCols.map(c => {
                 return getFieldValue(row, c);
            }).join('|||') : 'ALL';
            
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
        });

        filteredData = Object.values(groups).map(groupRows => {
            const resultRow: Record<string, any> = {};
            query.columns.forEach(col => {
                const key = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;

                if (col.aggregate === 'GROUP_BY') {
                    resultRow[key] = getFieldValue(groupRows[0], col);
                } else if (col.aggregate === 'COUNT') {
                    resultRow[key] = groupRows.length;
                } else if (col.aggregate === 'SUM') {
                    resultRow[key] = groupRows.reduce((sum, r) => sum + (parseFloat(getFieldValue(r, col)) || 0), 0);
                } else if (col.aggregate === 'AVG') {
                    const sum = groupRows.reduce((s, r) => s + (parseFloat(getFieldValue(r, col)) || 0), 0);
                    resultRow[key] = groupRows.length ? Number((sum / groupRows.length).toFixed(2)) : 0;
                } else if (col.aggregate === 'MIN') {
                    resultRow[key] = groupRows.reduce((min, r) => {
                        const val = getFieldValue(r, col);
                        return val < min ? val : min;
                    }, getFieldValue(groupRows[0], col));
                } else if (col.aggregate === 'MAX') {
                    resultRow[key] = groupRows.reduce((max, r) => {
                        const val = getFieldValue(r, col);
                        return val > max ? val : max;
                    }, getFieldValue(groupRows[0], col));
                } else if (col.aggregate === 'FIRST') {
                    resultRow[key] = getFieldValue(groupRows[0], col);
                } else if (col.aggregate === 'LAST') {
                    resultRow[key] = getFieldValue(groupRows[groupRows.length - 1], col);
                } else {
                     resultRow[key] = getFieldValue(groupRows[0], col); 
                }
            });
            return resultRow;
        });
    }

    // 5. Sorting
    if (query.columns.some(c => c.sort)) {
        filteredData.sort((a, b) => {
            for (const col of query.columns) {
                if (col.sort) {
                    const valA = getFieldValue(a, col); 
                    const valB = getFieldValue(b, col);
                    
                    if (valA === valB) continue;

                    const direction = col.sort.toUpperCase() === 'DESC' ? -1 : 1;
                    
                    if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
                        return (Number(valA) - Number(valB)) * direction;
                    }
                    if (valA < valB) return -1 * direction;
                    if (valA > valB) return 1 * direction;
                }
            }
            return 0;
        });
    }

    // 6. Projection (Aliases)
    const finalData = filteredData.map(row => {
        const newRow: Record<string, any> = {};
        const usedKeys = new Set<string>();
        query.columns.filter(c => c.show).forEach(col => {
           const val = getFieldValue(row, col);
           let outputKey = col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName;
           
           if (usedKeys.has(outputKey)) {
               if (!col.alias || col.alias.trim() === '') {
                   outputKey = `${col.tableName}_${col.fieldName}`;
               }
               let suffix = 1;
               let originalKey = outputKey;
               while (usedKeys.has(outputKey)) {
                   outputKey = `${originalKey}_${suffix}`;
                   suffix++;
               }
           }
           usedKeys.add(outputKey);
           newRow[outputKey] = val;
        });
        return newRow;
    });

    return finalData;
};

export interface ActionQueryResult {
  affectedRows: number;
  message: string;
  updatedTables: Table[];
  createdTable?: Table;
}

export const executeActionQuery = (
  query: Query,
  tables: Table[],
  relationships: Relationship[],
  context?: Record<string, any>
): ActionQueryResult => {
  if (query.type === 'SELECT') {
    const data = executeSelectQuery(query, tables, relationships, context);
    return {
      affectedRows: data.length,
      message: `${data.length} Datensätze selektiert.`,
      updatedTables: tables
    };
  }

  const updatedTables = [...tables];

  if (query.type === 'DELETE') {
    const tableIndex = updatedTables.findIndex(t => t.id === query.targetTableId);
    if (tableIndex === -1) {
      return { affectedRows: 0, message: 'Zieltabelle nicht gefunden.', updatedTables };
    }

    const targetTable = { ...updatedTables[tableIndex] };
    const initialCount = targetTable.data?.length || 0;

    targetTable.data = (targetTable.data || []).filter(row => {
      // Evaluate criteria
      for (const crit of query.criteria) {
        const field = targetTable.fields.find(f => f.id === crit.fieldId);
        if (field && crit.value) {
          const rowValue = row[field.name];
          if (matchesCriteria(rowValue, `${crit.operator} ${crit.value}`, context)) {
            return false; // delete this row
          }
        }
      }
      return true; // keep this row
    });

    const deletedCount = initialCount - targetTable.data.length;
    updatedTables[tableIndex] = targetTable;

    return {
      affectedRows: deletedCount,
      message: `${deletedCount} Datensätze erfolgreich gelöscht.`,
      updatedTables
    };
  }

  if (query.type === 'UPDATE') {
    const tableIndex = updatedTables.findIndex(t => t.id === query.targetTableId);
    if (tableIndex === -1) {
      return { affectedRows: 0, message: 'Zieltabelle nicht gefunden.', updatedTables };
    }

    const targetTable = { ...updatedTables[tableIndex] };
    let updatedCount = 0;

    targetTable.data = (targetTable.data || []).map(row => {
      // Check criteria
      let matches = true;
      for (const crit of query.criteria) {
        const field = targetTable.fields.find(f => f.id === crit.fieldId);
        if (field && crit.value) {
          if (!matchesCriteria(row[field.name], `${crit.operator} ${crit.value}`, context)) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        updatedCount++;
        const newRow = { ...row };
        for (const [fieldId, newValue] of Object.entries(query.updateMap)) {
          const field = targetTable.fields.find(f => f.id === fieldId);
          if (field) {
            newRow[field.name] = newValue;
          }
        }
        return newRow;
      }
      return row;
    });

    updatedTables[tableIndex] = targetTable;

    return {
      affectedRows: updatedCount,
      message: `${updatedCount} Datensätze erfolgreich aktualisiert.`,
      updatedTables
    };
  }

  if (query.type === 'INSERT') {
    const sourceTable = tables.find(t => t.id === query.sourceTableId);
    const targetTableIdx = updatedTables.findIndex(t => t.id === query.targetTableId);

    if (!sourceTable || targetTableIdx === -1) {
      return { affectedRows: 0, message: 'Quell- oder Zieltabelle nicht gefunden.', updatedTables };
    }

    const targetTable = { ...updatedTables[targetTableIdx] };
    const targetData = [...(targetTable.data || [])];
    let insertedCount = 0;

    (sourceTable.data || []).forEach(srcRow => {
      const newRow: Record<string, any> = { id: crypto.randomUUID() };
      for (const [targetFieldId, sourceFieldId] of Object.entries(query.fieldMapping)) {
        const targetField = targetTable.fields.find(f => f.id === targetFieldId);
        const sourceField = sourceTable.fields.find(f => f.id === sourceFieldId);
        if (targetField && sourceField) {
          newRow[targetField.name] = srcRow[sourceField.name];
        }
      }
      targetData.push(newRow);
      insertedCount++;
    });

    targetTable.data = targetData;
    updatedTables[targetTableIdx] = targetTable;

    return {
      affectedRows: insertedCount,
      message: `${insertedCount} Datensätze erfolgreich angefügt.`,
      updatedTables
    };
  }

  return { affectedRows: 0, message: 'Unbekannter Abfragetyp.', updatedTables };
};

