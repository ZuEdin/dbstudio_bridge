import { Query, Table, Relationship, SelectQuery, QueryColumn } from '../types/index';

// Helper to evaluate criteria
const matchesCriteria = (value: any, criteria: string): boolean => {
  if (!criteria || criteria.trim() === '') return true;
  
  const strValue = String(value).toLowerCase();
  const crit = criteria.trim().toLowerCase();

  // Between
  if (crit.startsWith('zwischen') || crit.includes(' and ')) {
    const parts = crit.replace('zwischen', '').split('und');
    if (parts.length === 2) {
      const min = parseFloat(parts[0].trim());
      const max = parseFloat(parts[1].trim());
      const numVal = parseFloat(value);
      return !isNaN(numVal) && !isNaN(min) && !isNaN(max) && numVal >= min && numVal <= max;
    }
  }

  // Operators
  if (crit.startsWith('>=')) return parseFloat(value) >= parseFloat(crit.substring(2).trim());
  if (crit.startsWith('<=')) return parseFloat(value) <= parseFloat(crit.substring(2).trim());
  if (crit.startsWith('>')) return parseFloat(value) > parseFloat(crit.substring(1).trim());
  if (crit.startsWith('<')) return parseFloat(value) < parseFloat(crit.substring(1).trim());
  if (crit.startsWith('!=')) return String(value) != crit.substring(2).trim();
  if (crit.startsWith('=')) return String(value) == crit.substring(1).trim();

  // Like / Wildcards
  if (crit.startsWith('wie') || crit.includes('*') || crit.includes('%') || crit.includes('?')) {
    const rawPattern = crit.replace(/^wie\s+/i, '').replace(/^wie/i, '').trim();
    const escaped = rawPattern
      .replace(/[-\/\\^$+.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/%/g, '.*')
      .replace(/\?/g, '.');
    try {
      const regex = new RegExp(`^${escaped}$`, 'i');
      return regex.test(strValue);
    } catch (e) { return false; }
  }

  // Exact match (default)
  // Check if string literal
  if ((crit.startsWith('"') && crit.endsWith('"')) || (crit.startsWith("'") && crit.endsWith("'"))) {
    return strValue === crit.substring(1, crit.length - 1);
  }
  
  // Numeric compare if possible
  if (!isNaN(Number(crit)) && !isNaN(Number(value))) {
      return Number(value) === Number(crit);
  }

  return strValue === crit;
};

// Helper to resolve calculated fields
const resolveExpression = (row: Record<string, any>, expression: string): any => {
  if (!expression) return null;
  
  // Simple regex to replace {{Table.Field}} with values
  // Warning: This is a basic implementation. A real parser is safer and more robust.
  let result = expression;
  const matches = expression.match(/\{\{([^}]+)\}\}/g);
  
  if (matches) {
    matches.forEach(match => {
      const key = match.substring(2, match.length - 2).trim(); // remove {{ }}
      const val = row[key] !== undefined ? row[key] : '';
      result = result.replace(match, String(val));
    });
  }

  // Basic JS evaluation for string concat ( & ) or math
  // Replacing SQL style & with + for JS eval, handling quotes
  // Security Note: Eval is dangerous. In a real app, use a math parser library.
  // We will do a very limited replacement for string concatenation
  try {
      if (result.includes('&')) {
          const parts = result.split('&').map(p => {
              p = p.trim();
              if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
                  return p.substring(1, p.length - 1);
              }
              return p; // Was already replaced value
          });
          return parts.join('');
      }
      return result;
  } catch (e) {
      return "#ERROR";
  }
};

export const executeSelectQuery = (query: SelectQuery, tables: Table[], relationships: Relationship[]): Record<string, any>[] => {
    if (query.nodes.length === 0 || query.columns.length === 0) return [];

    // 1. JOIN Logic (Basic Star Schema / Path finding is simplified here)
    let workingData: Record<string, any>[] = [];
    const queryTableIds = new Set(query.nodes.map(n => n.tableId));
    const initialTableId = query.nodes[0].tableId;
    const initialTable = tables.find(t => t.id === initialTableId);
    
    if (!initialTable || !initialTable.data) return [];

    // Flatten initial data with Table.Field keys
    workingData = initialTable.data.map(row => {
        const newRow: Record<string, any> = {};
        for (const key in row) { newRow[`${initialTable.name}.${key}`] = row[key]; }
        return newRow;
    });
    
    const joinedTables = new Set([initialTableId]);
    const relevantRels = relationships.filter(r => queryTableIds.has(r.fromTableId) && queryTableIds.has(r.toTableId));

    // Simple Iterative Join (supports linear chains and simple stars)
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
                    
                    // Hash Join Optimization
                    const table2Map = new Map<string, any[]>();
                    table2.data!.forEach(row2 => {
                        const key = String(row2[field2.name]);
                        if (!table2Map.has(key)) table2Map.set(key, []);
                        table2Map.get(key)!.push(row2);
                    });

                    workingData.forEach(row1 => {
                        const joinVal = String(row1[`${table1.name}.${field1.name}`]);
                        const matches = table2Map.get(joinVal);
                        if (matches) {
                            matches.forEach(row2 => {
                                const newRow = { ...row1 };
                                for (const key in row2) {
                                    newRow[`${table2.name}.${key}`] = row2[key];
                                }
                                newData.push(newRow);
                            });
                        }
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

    // 2. Add Calculated Fields to working data (for filtering)
    query.columns.filter(c => c.isCalculated && c.expression).forEach(col => {
        workingData.forEach(row => {
            row[`CALC_${col.id}`] = resolveExpression(row, col.expression!);
        });
    });

    // 3. Filter
    let filteredData = workingData.filter(row => {
        for (const col of query.columns) {
            const validCriteria = col.criteria.filter(c => c && c.trim() !== '');
            if (validCriteria.length > 0) {
                let cellValue;
                if (col.isCalculated) {
                    cellValue = row[`CALC_${col.id}`];
                } else {
                    cellValue = row[`${col.tableName}.${col.fieldName}`];
                }

                const orConditionsMet = validCriteria.some(crit => matchesCriteria(cellValue, crit));
                if (!orConditionsMet) return false;
            }
        }
        return true;
    });

    // 4. Aggregation / Grouping
    const hasAggregation = query.columns.some(c => c.aggregate && c.aggregate !== 'EXPRESSION');
    if (hasAggregation) {
        const groups: Record<string, any[]> = {};
        const groupByCols = query.columns.filter(c => c.aggregate === 'GROUP_BY');
        
        filteredData.forEach(row => {
            const groupKey = groupByCols.map(c => {
                 return c.isCalculated ? row[`CALC_${c.id}`] : row[`${c.tableName}.${c.fieldName}`];
            }).join('|||'); // Delimiter
            
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
        });

        filteredData = Object.values(groups).map(groupRows => {
            const resultRow: Record<string, any> = {};
            // For columns in the query:
            query.columns.forEach(col => {
                const key = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
                
                if (col.aggregate === 'GROUP_BY') {
                    resultRow[key] = groupRows[0][key];
                } else if (col.aggregate === 'COUNT') {
                    resultRow[key] = groupRows.length;
                } else if (col.aggregate === 'SUM') {
                    resultRow[key] = groupRows.reduce((sum, r) => sum + (parseFloat(r[key]) || 0), 0);
                } else if (col.aggregate === 'AVG') {
                    const sum = groupRows.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0);
                    resultRow[key] = groupRows.length ? sum / groupRows.length : 0;
                } else if (col.aggregate === 'MIN') {
                    resultRow[key] = groupRows.reduce((min, r) => (r[key] < min ? r[key] : min), groupRows[0][key]);
                } else if (col.aggregate === 'MAX') {
                    resultRow[key] = groupRows.reduce((max, r) => (r[key] > max ? r[key] : max), groupRows[0][key]);
                } else {
                     // If not aggregated but present (usually First/Last logic in SQL, here we take first)
                     resultRow[key] = groupRows[0][key]; 
                }
            });
            return resultRow;
        });
    }

    // 5. Projection (Select fields and handle aliases) & Sorting
    // Sort *before* map if possible, but simpler to sort result objects if we map keys correctly.
    // Let's sort filteredData (which still has long keys) first.
    
    if (query.columns.some(c => c.sort)) {
        filteredData.sort((a, b) => {
            for (const col of query.columns) {
                if (col.sort) {
                    const key = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
                    const valA = a[key]; 
                    const valB = b[key];
                    const direction = col.sort.toUpperCase() === 'DESC' ? -1 : 1;
                    if (valA < valB) return -1 * direction;
                    if (valA > valB) return 1 * direction;
                }
            }
            return 0;
        });
    }

    // Map to final structure with Aliases
    const finalData = filteredData.map(row => {
        const newRow: Record<string, any> = {};
        query.columns.filter(c => c.show).forEach(col => {
           const sourceKey = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
           // Use Alias if present, else fieldName
           const outputKey = col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName;
           newRow[outputKey] = row[sourceKey];
        });
        return newRow;
    });

    return finalData;
};

// ... Append and Delete logic would go here similarly, simplified for brevity
