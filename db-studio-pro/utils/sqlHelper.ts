
import { Table, Relationship, QueryColumn, TableNode, DbType } from '../types/index';
import { quoteIdentifier, toPascalCase } from './generators/common';
import { resolveFormValue } from '../features/queries/utils/queryExecution';

export const generateSqlSelect = (nodes: TableNode[], columns: QueryColumn[], tables: Table[], relationships: Relationship[], dbType: DbType, useRawNames: boolean = false, context?: Record<string, any>): string => {
    if (nodes.length === 0) return '';
    
    const formatIdentifier = (name: string) => useRawNames ? name : toPascalCase(name);

    // 1. Assign unique aliases to each TableNode
    const nodeAliases = new Map<string, string>();
    nodes.forEach((node, idx) => {
        const table = tables.find(t => t.id === node.tableId);
        const baseName = table ? formatIdentifier(table.name) : 'Table';
        // Use a short stable alias
        nodeAliases.set(node.id, `${baseName}_${idx}`);
    });

    // 2. Map Columns to their Aliases
    const selectClause = columns.filter(c => c.show || (c.criteria && c.criteria.some(cr => cr && cr.trim() !== ''))).map(c => {
        const alias = c.alias ? formatIdentifier(c.alias) : formatIdentifier(c.fieldName);
        const quotedAlias = quoteIdentifier(alias, dbType);
        
        let fieldExpr = '';
        if (c.isCalculated) {
            fieldExpr = `(${c.expression})`;
        } else {
            // Try to find the correct node alias
            let nodeAlias = '';
            if (c.nodeId && nodeAliases.has(c.nodeId)) {
                nodeAlias = nodeAliases.get(c.nodeId)!;
            } else {
                // Fallback: find first node matching tableId
                const node = nodes.find(n => n.tableId === c.tableId);
                if (node) nodeAlias = nodeAliases.get(node.id)!;
                else nodeAlias = formatIdentifier(c.tableName);
            }
            fieldExpr = `${quoteIdentifier(nodeAlias, dbType)}.${quoteIdentifier(c.fieldName, dbType)}`;
        }

        if (c.aggregate && !['GROUP_BY', 'EXPRESSION', 'FIRST', 'LAST'].includes(c.aggregate)) {
            fieldExpr = `${c.aggregate}(${fieldExpr})`;
        }

        return `  ${fieldExpr} AS ${quotedAlias}`;
    }).join(',\n');

    // 3. Build FROM and JOINs using BFS for pathfinding
    const firstNode = nodes[0];
    const firstTable = tables.find(t => t.id === firstNode.tableId);
    if (!firstTable) return '';

    const firstAlias = nodeAliases.get(firstNode.id)!;
    let fromClause = `FROM ${quoteIdentifier(formatIdentifier(firstTable.name), dbType)} AS ${quoteIdentifier(firstAlias, dbType)}`;
    
    const joinedNodeIds = new Set([firstNode.id]);
    let joins = '';
    
    // BFS Queue
    const queue = [firstNode.id];
    
    while (queue.length > 0 && joinedNodeIds.size < nodes.length) {
        const currentNodeId = queue.shift()!;
        const currentNode = nodes.find(n => n.id === currentNodeId)!;
        const currentAlias = nodeAliases.get(currentNodeId)!;

        // Find all possible connections from this node to unjoined nodes
        for (const targetNode of nodes) {
            if (joinedNodeIds.has(targetNode.id)) continue;

            // Find relationship between currentNode.tableId and targetNode.tableId
            const rel = relationships.find(r => 
                (r.fromTableId === currentNode.tableId && r.toTableId === targetNode.tableId) ||
                (r.toTableId === currentNode.tableId && r.fromTableId === targetNode.tableId)
            );

            if (rel) {
                const targetAlias = nodeAliases.get(targetNode.id)!;
                const targetTable = tables.find(t => t.id === targetNode.tableId)!;
                
                let onClause = '';
                if (rel.fromTableId === currentNode.tableId && rel.toTableId === targetNode.tableId) {
                    const fromF = tables.find(t => t.id === rel.fromTableId)!.fields.find(f => f.id === rel.fromFieldId)!;
                    const toF = tables.find(t => t.id === rel.toTableId)!.fields.find(f => f.id === rel.toFieldId)!;
                    onClause = `${quoteIdentifier(currentAlias, dbType)}.${quoteIdentifier(fromF.name, dbType)} = ${quoteIdentifier(targetAlias, dbType)}.${quoteIdentifier(toF.name, dbType)}`;
                } else {
                    const fromF = tables.find(t => t.id === rel.toTableId)!.fields.find(f => f.id === rel.toFieldId)!;
                    const toF = tables.find(t => t.id === rel.fromTableId)!.fields.find(f => f.id === rel.fromFieldId)!;
                    onClause = `${quoteIdentifier(currentAlias, dbType)}.${quoteIdentifier(fromF.name, dbType)} = ${quoteIdentifier(targetAlias, dbType)}.${quoteIdentifier(toF.name, dbType)}`;
                }

                joins += `\nLEFT JOIN ${quoteIdentifier(formatIdentifier(targetTable.name), dbType)} AS ${quoteIdentifier(targetAlias, dbType)} ON ${onClause}`;
                joinedNodeIds.add(targetNode.id);
                queue.push(targetNode.id);
            }
        }
    }

    // 4. WHERE clause
    const whereConditions = columns.map(c => {
        if (c.aggregate && !['GROUP_BY', 'EXPRESSION'].includes(c.aggregate)) return null;
        const validCriteria = c.criteria.filter(crit => crit.trim() !== '');
        if (validCriteria.length === 0) return null;
        
        let nodeAlias = '';
        if (c.nodeId && nodeAliases.has(c.nodeId)) nodeAlias = nodeAliases.get(c.nodeId)!;
        else {
            const node = nodes.find(n => n.tableId === c.tableId);
            nodeAlias = node ? nodeAliases.get(node.id)! : formatIdentifier(c.tableName);
        }

        const fieldRef = c.isCalculated ? `(${c.expression})` : `${quoteIdentifier(nodeAlias, dbType)}.${quoteIdentifier(c.fieldName, dbType)}`;
        
        const conditions = validCriteria.map(crit => {
            let criteria = crit.trim();

            if (/(?:\[?Forms\]?!)/i.test(criteria)) {
                const formMatch = criteria.match(/(?:\[?Forms\]?!\s*\[?([^!\]]+)\]?!\s*\[?([^!\]\s]+)\]?)/i);
                if (formMatch && formMatch.length >= 3) {
                    const formName = formMatch[1];
                    const fieldName = formMatch[2];
                    const val = resolveFormValue(formName, fieldName, context);
                    if (val !== undefined && val !== null && val !== '') {
                        const opMatch = criteria.match(/^(=|like |>|<|>=|<=)/i);
                        const op = opMatch ? opMatch[0].trim() : '=';
                        const escapedVal = String(val).replace(/'/g, "''");
                        criteria = `${op} '${escapedVal}'`;
                    } else {
                        criteria = `= ''`;
                    }
                }
            }

            if (criteria === null) return null;

            if (criteria.includes('"')) criteria = criteria.replace(/"/g, "'");
            if (criteria.includes('TODAY')) {
                const todaySql = dbType === DbType.SQL ? "CAST(GETDATE() AS DATE)" : (dbType === DbType.SQLite ? "DATE('now')" : "CURDATE()");
                criteria = criteria.replace(/TODAY/g, todaySql);
            }
            const upper = criteria.toUpperCase();
            if (upper === 'NULL') return `${fieldRef} IS NULL`;
            if (upper === 'NOT NULL') return `${fieldRef} IS NOT NULL`;
            if (upper === 'IS NULL' || upper === 'IS NOT NULL') return `${fieldRef} ${criteria}`;

            const startsWithOp = /^(?:=|>|<|>=|<=|!=|<>|LIKE\s|IN\s|NOT\s|BETWEEN\s|IS\s)/i.test(criteria);
            if (!startsWithOp) {
                if (/^\d+(\.\d+)?$/.test(criteria)) {
                    criteria = `= ${criteria}`;
                } else {
                    const cleanStr = criteria.replace(/^['"]|['"]$/g, '');
                    criteria = `= '${cleanStr.replace(/'/g, "''")}'`;
                }
            }

            return `${fieldRef} ${criteria}`; 
        }).filter(Boolean);
        return conditions.length > 0 ? (conditions.length > 1 ? `(${conditions.join(' OR ')})` : conditions[0]) : null;
    }).filter(Boolean);

    const whereClause = whereConditions.length > 0 ? `\nWHERE\n  ${whereConditions.join('\n  AND ')}` : '';
    
    // 5. GROUP BY
    const hasAggregation = columns.some(c => c.aggregate && !['GROUP_BY', 'EXPRESSION'].includes(c.aggregate));
    const groupByColumns = columns.filter(c => c.aggregate === 'GROUP_BY');
    let groupByClause = '';
    if (hasAggregation) {
        let groupCols = groupByColumns;
        if (groupCols.length === 0) {
            groupCols = columns.filter(c => (c.show || c.sort) && (!c.aggregate || c.aggregate === 'GROUP_BY' || c.aggregate === 'EXPRESSION'));
        }
        if (groupCols.length > 0) {
            const groups = groupCols.map(c => {
                if (c.isCalculated) return `(${c.expression})`;
                let nodeAlias = '';
                if (c.nodeId && nodeAliases.has(c.nodeId)) nodeAlias = nodeAliases.get(c.nodeId)!;
                else {
                    const node = nodes.find(n => n.tableId === c.tableId);
                    nodeAlias = node ? nodeAliases.get(node.id)! : formatIdentifier(c.tableName);
                }
                return `${quoteIdentifier(nodeAlias, dbType)}.${quoteIdentifier(c.fieldName, dbType)}`;
            }).join(', ');
            groupByClause = `\nGROUP BY ${groups}`;
        }
    }


    // 5.5 HAVING
    const havingConditions = columns.map(c => {
        if (!c.aggregate || ['GROUP_BY', 'EXPRESSION'].includes(c.aggregate)) return null;
        const validCriteria = c.criteria.filter(crit => crit.trim() !== '');
        if (validCriteria.length === 0) return null;
        
        let fieldRef = '';
        if (c.alias && !c.isCalculated) {
            fieldRef = `"${c.alias}"`;
        } else {
            let nodeAlias = '';
            if (c.nodeId && nodeAliases.has(c.nodeId)) nodeAlias = nodeAliases.get(c.nodeId);
            else {
                const node = nodes.find(n => n.tableId === c.tableId);
                nodeAlias = node ? nodeAliases.get(node.id) : formatIdentifier(c.tableName);
            }
            fieldRef = `${c.aggregate}(${quoteIdentifier(nodeAlias, dbType)}.${quoteIdentifier(c.fieldName, dbType)})`;
        }

        const conditions = validCriteria.map(criteria => {
            if (/^=|>|<|>=|<=/.test(criteria)) return `${fieldRef} ${criteria}`;
            const upper = criteria.toUpperCase().trim();
            if (upper.startsWith('LIKE ')) return `${fieldRef} ${criteria}`;
            if (upper === 'NULL') return `${fieldRef} IS NULL`;
            if (upper === 'NOT NULL') return `${fieldRef} IS NOT NULL`;
            if (upper === 'IS NULL' || upper === 'IS NOT NULL') return `${fieldRef} ${criteria}`;
            return `${fieldRef} ${criteria}`; 
        }).filter(Boolean);
        return conditions.length > 0 ? (conditions.length > 1 ? `(${conditions.join(' OR ')})` : conditions[0]) : null;
    }).filter(Boolean);

    const havingClause = havingConditions.length > 0 ? `\nHAVING\n  ${havingConditions.join('\n  AND ')}` : '';

    // 6. ORDER BY
    const orderByCols = columns.filter(c => c.sort).map(c => {
        if (c.alias) return `${quoteIdentifier(formatIdentifier(c.alias), dbType)} ${c.sort}`;
        if (c.isCalculated) return `(${c.expression}) ${c.sort}`;
        let nodeAlias = '';
        if (c.nodeId && nodeAliases.has(c.nodeId)) nodeAlias = nodeAliases.get(c.nodeId)!;
        else {
            const node = nodes.find(n => n.tableId === c.tableId);
            nodeAlias = node ? nodeAliases.get(node.id)! : formatIdentifier(c.tableName);
        }
        return `${quoteIdentifier(nodeAlias, dbType)}.${quoteIdentifier(c.fieldName, dbType)} ${c.sort}`;
    }).join(', ');
    
    const orderByClause = orderByCols ? `\nORDER BY ${orderByCols}` : '';
    
    return `SELECT\n${selectClause || '  *'}\n${fromClause}${joins}${whereClause}${groupByClause}${havingClause}${orderByClause}`;
};
