
import { Table, Relationship, BackendConfig, VirtualFile, DbType, Query, SelectQuery } from '../../types/index';
import { resolveType, quoteIdentifier, toPascalCase } from './common';
import { generateSqlSelect } from '../sqlHelper';
import { generatePrismaSchema, generateDrizzleSchema, generateTypeOrmEntities } from './ormGenerator';

const mapPermissionObjectId = (row: any, tables: Table[], queries: Query[], isSql: boolean): any => {
    if (!row || typeof row !== 'object') return row;
    const newRow = { ...row };
    const key = Object.keys(newRow).find(k => k.toLowerCase() === 'objectid');
    if (!key) return row;

    const objectId = newRow[key];
    const objectTypeKey = Object.keys(newRow).find(k => k.toLowerCase() === 'objecttype');
    const objectType = objectTypeKey ? String(newRow[objectTypeKey]).toLowerCase() : '';

    if (objectType === 'table') {
        const matchedTable = tables.find(t => t.id === objectId);
        if (matchedTable) {
            newRow[key] = isSql ? toPascalCase(matchedTable.name) : matchedTable.name;
        }
    } else if (objectType === 'query') {
        const matchedQuery = queries.find(q => q.id === objectId);
        if (matchedQuery) {
            newRow[key] = isSql ? toPascalCase(matchedQuery.name) : matchedQuery.name;
        }
    } else if (objectType === 'field') {
        let matchedFieldName = '';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === objectId);
            if (f) {
                matchedFieldName = f.name;
                break;
            }
        }
        if (matchedFieldName) {
            newRow[key] = matchedFieldName;
        }
    }
    return newRow;
};

export const generateDatabaseScripts = (tables: Table[], rawRelationships: Relationship[], config: BackendConfig, queries: Query[] = []): VirtualFile[] => {
    const relationships = rawRelationships.filter((rel, index, self) =>
        index === self.findIndex((r) =>
          r.fromTableId === rel.fromTableId &&
          r.fromFieldId === rel.fromFieldId &&
          r.toTableId === rel.toTableId &&
          r.toFieldId === rel.toFieldId
        )
      );

    const root = `Backend/${config.projectName}/database`;
    const files: VirtualFile[] = [];

    // Clone tables to avoid mutation of frozen store array
    const processingTables = [...tables];

    // Inject Users table if Auth is requested AND it's missing (Fallback)
    if (config.authConfig?.useUserLogin) {
        if (!processingTables.some(t => t.name.toLowerCase() === 'users' || t.name.toLowerCase() === 'sys_users')) {
            processingTables.push({
                id: 'sys_users',
                name: 'Users',
                fields: [
                    { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                    { id: 'u2', name: 'Username', type: 'VARCHAR', length: 50, allowNull: false },
                    { id: 'u3', name: 'PasswordHash', type: 'VARCHAR', length: 255, allowNull: false },
                    { id: 'u4', name: 'Email', type: 'VARCHAR', length: 100, allowNull: true },
                    { id: 'u5', name: 'Role', type: 'VARCHAR', length: 20, defaultValue: 'User' }
                ]
            });
        }
    }

    if (config.dbType === DbType.NoSQL) {
        const schema = processingTables.reduce((acc, t) => {
            acc[t.name] = {
                description: `Collection for ${t.name}`,
                fields: t.fields.map(f => ({
                    name: f.name,
                    type: f.type,
                    isPrimaryKey: f.isPrimaryKey,
                    required: !f.allowNull,
                    default: f.defaultValue
                }))
            };
            return acc;
        }, {} as Record<string, any>);

        // Add Data Seeding for NoSQL (Collections.json usually just structure, but we can add seed data file)
        const seedData = processingTables.reduce((acc, t) => {
            if (t.data && t.data.length > 0) {
                if (t.name.toLowerCase() === 'sys_permissions') {
                    acc[t.name] = t.data.map(row => mapPermissionObjectId(row, tables, queries || [], false));
                } else {
                    acc[t.name] = t.data;
                }
            }
            return acc;
        }, {} as Record<string, any[]>);

        files.push({ name: 'collections.json', path: `${root}/collections.json`, content: JSON.stringify(schema, null, 2), language: 'json' });
        
        if (Object.keys(seedData).length > 0) {
            files.push({ name: 'seed_data.json', path: `${root}/seed_data.json`, content: JSON.stringify(seedData, null, 2), language: 'json' });
        }

    } else {
        let sql = `-- Database Script for ${config.dbType}\n-- Project: ${config.projectName}\n\n`;
        
        // 1. Tables
        processingTables.forEach(table => {
            const fields = table.fields.map(f => {
                let type = resolveType(f, 'sql', config.dbType);
                if (config.dbType === DbType.SQLite) {
                    // SQLite specific auto increment syntax
                    if (f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement) return `  ${quoteIdentifier(f.name, config.dbType)} INTEGER PRIMARY KEY AUTOINCREMENT`;
                } else if (config.dbType === DbType.MySQL) {
                    if (f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement) type += ' AUTO_INCREMENT';
                } else {
                    // SQL Server
                    if (f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement) type += ' IDENTITY(1,1)';
                }
                
                let line = `  ${quoteIdentifier(f.name, config.dbType)} ${type}`;
                if (config.dbType !== DbType.SQLite && f.isPrimaryKey) line += ' PRIMARY KEY';
                if (!f.allowNull && !f.isPrimaryKey) line += ' NOT NULL';
                
                // Add DEFAULT Constraint
                if (f.defaultValue !== undefined && f.defaultValue !== '') {
                    let defVal = f.defaultValue;
                    const isKeyword = ['NOW', 'CURRENT_TIMESTAMP'].includes(defVal.toUpperCase());
                    
                    if (['INTEGER', 'BOOLEAN', 'DECIMAL', 'DOUBLE', 'TINYINT'].includes(f.type) || isKeyword) {
                        if (isKeyword) {
                            defVal = config.dbType === DbType.SQL ? 'GETDATE()' : 'CURRENT_TIMESTAMP';
                        }
                    } else {
                        // String literal
                        defVal = `'${defVal.replace(/'/g, "''")}'`;
                    }
                    line += ` DEFAULT ${defVal}`;
                }

                return line;
            }).join(',\n');
            if (config.dbType === DbType.SQL) {
                sql += `IF OBJECT_ID(N'${quoteIdentifier(toPascalCase(table.name), config.dbType)}', N'U') IS NULL\nBEGIN\nCREATE TABLE ${quoteIdentifier(toPascalCase(table.name), config.dbType)} (\n${fields}\n);\nEND\n\n`;
            } else {
                sql += `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(toPascalCase(table.name), config.dbType)} (\n${fields}\n);\n\n`;
            }
        });

        // 2. Data Seeding (Insert Statements)
        sql += `-- Seed Data\n`;
        processingTables.forEach(table => {
            if (table.data && table.data.length > 0) {
                // Identity Insert ON for SQL Server if needed
                if (config.dbType === DbType.SQL && table.fields.some(f => f.isAutoIncrement)) {
                    sql += `SET IDENTITY_INSERT ${quoteIdentifier(toPascalCase(table.name), config.dbType)} ON;\n`;
                }

                const isPermissionsTable = table.name.toLowerCase() === 'sys_permissions';

                table.data.forEach(row => {
                    const mappedRow = isPermissionsTable ? mapPermissionObjectId(row, tables, queries || [], true) : row;
                    const columns = table.fields.map(f => quoteIdentifier(f.name, config.dbType)).join(', ');
                    const values = table.fields.map(f => {
                        const val = mappedRow[f.name];
                        if (val === undefined || val === null || val === '') return 'NULL';
                        
                        if (['INTEGER', 'DECIMAL', 'DOUBLE'].includes(f.type)) {
                            return val;
                        }
                        if (f.type === 'BOOLEAN') {
                            if (config.dbType === DbType.SQL || config.dbType === DbType.MySQL) {
                                return (val === true || val === 'true') ? 1 : 0;
                            }
                            return (val === true || val === 'true') ? 'TRUE' : 'FALSE';
                        }
                        // Strings/Dates/Passwords
                        let strVal = String(val).replace(/'/g, "''");
                        if (f.name.toLowerCase().includes('password')) {
                             if (config.dbType === DbType.MySQL) {
                                 return `SHA2('${strVal}', 256)`;
                             } else if (config.dbType === DbType.SQL) {
                                 return `CONVERT(VARCHAR(64), HashBytes('SHA2_256', '${strVal}'), 2)`; 
                             }
                        }
                        return `'${strVal}'`;
                    }).join(', ');

                    sql += `INSERT INTO ${quoteIdentifier(toPascalCase(table.name), config.dbType)} (${columns}) VALUES (${values});\n`;
                });

                if (config.dbType === DbType.SQL && table.fields.some(f => f.isAutoIncrement)) {
                    sql += `SET IDENTITY_INSERT ${quoteIdentifier(toPascalCase(table.name), config.dbType)} OFF;\n`;
                }
                sql += '\n';
            }
        });

        // 3. Foreign Keys
        sql += `-- Relationships\n`;
        if (config.dbType !== DbType.SQLite) {
            relationships.forEach(rel => {
                const parent = processingTables.find(t => t.id === rel.fromTableId);
                const child = processingTables.find(t => t.id === rel.toTableId);
                const childField = child?.fields.find(f => f.id === rel.toFieldId);
                const parentField = parent?.fields.find(f => f.id === rel.fromFieldId);
                
                if (parent && child && childField && parentField) {
                    const constraintName = `FK_${child.name.replace(/\s/g, '_')}_${parent.name.replace(/\s/g, '_')}_${Math.floor(Math.random()*1000)}`;
                    let constraintSql = `ALTER TABLE ${quoteIdentifier(toPascalCase(child.name), config.dbType)} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${quoteIdentifier(childField.name, config.dbType)}) REFERENCES ${quoteIdentifier(toPascalCase(parent.name), config.dbType)}(${quoteIdentifier(parentField.name, config.dbType)})`;
                    
                    if (rel.onDelete && rel.onDelete !== 'NO ACTION') {
                        constraintSql += ` ON DELETE ${rel.onDelete}`;
                    }
                    if (rel.onUpdate && rel.onUpdate !== 'NO ACTION') {
                        constraintSql += ` ON UPDATE ${rel.onUpdate}`;
                    }
                    
                    sql += `${constraintSql};\n`;
                }
            });
        }

        // 4. Indexes (Performance Optimization)
        sql += `\n-- Performance Indexes\n`;
        // Automatic indexes for foreign keys
        relationships.forEach(rel => {
            const child = processingTables.find(t => t.id === rel.toTableId);
            const childField = child?.fields.find(f => f.id === rel.toFieldId);
            if (child && childField) {
                const indexName = `IX_${child.name.replace(/\s/g, '_')}_${childField.name.replace(/\s/g, '_')}`;
                sql += `CREATE INDEX ${quoteIdentifier(indexName, config.dbType)} ON ${quoteIdentifier(toPascalCase(child.name), config.dbType)} (${quoteIdentifier(childField.name, config.dbType)});\n`;
            }
        });

        // Specific indexes for club_id, user_id, conversation_id and ending with _id
        const specialFields = ['club_id', 'user_id', 'conversation_id', 'clubid', 'userid', 'conversationid'];
        processingTables.forEach(table => {
            table.fields.forEach(field => {
                const isSpecial = specialFields.includes(field.name.toLowerCase()) || field.name.toLowerCase().endsWith('_id');
                const alreadyIndexed = relationships.some(rel => rel.toTableId === table.id && rel.toFieldId === field.id);
                
                if ((field.isIndexed || isSpecial) && !alreadyIndexed && !field.isPrimaryKey) {
                    const indexName = `IX_${table.name.replace(/\s/g, '_')}_${field.name.replace(/\s/g, '_')}`;
                    sql += `CREATE INDEX ${quoteIdentifier(indexName, config.dbType)} ON ${quoteIdentifier(toPascalCase(table.name), config.dbType)} (${quoteIdentifier(field.name, config.dbType)});\n`;
                }
            });
            
            // Performance Tip for High-Volume Data (e.g. Prayer Schedule)
            if (table.name.toLowerCase().includes('prayerschedule') || table.name.toLowerCase().includes('calendar')) {
                sql += `-- PERFORMANCE TIP: Table '${table.name}' might grow large. \n`;
                sql += `-- Consider using a monthly JSON blob for caching to reduce SELECT overhead for yearly views.\n`;
            }
        });
        
        // 5. Views (for Queries)
        sql += `\n-- Views\n`;
        queries.forEach(q => {
            if (q.type === 'SELECT') {
                const selectSql = generateSqlSelect((q as SelectQuery).nodes, (q as SelectQuery).columns, processingTables, relationships, config.dbType, true);
                if (selectSql) {
                    // Simple wrapper to avoid SQL errors if view logic is complex, 
                    // but for standard SQL generation we output it.
                    sql += `CREATE VIEW ${quoteIdentifier(toPascalCase(q.name), config.dbType)} AS\n${selectSql};\n\n`;
                }
            }
        });

        files.push({ name: 'schema.sql', path: `${root}/schema.sql`, content: sql, language: 'sql' });
        
        // 6. Extended ORM Exports (Prisma, Drizzle, TypeORM)
        try {
            // Prisma Schema
            const prismaCode = generatePrismaSchema(processingTables, relationships, config);
            files.push({ name: 'schema.prisma', path: `${root}/orm/prisma/schema.prisma`, content: prismaCode, language: 'prisma' });

            // Drizzle Schema
            const drizzleCode = generateDrizzleSchema(processingTables, relationships, config);
            files.push({ name: 'schema.ts', path: `${root}/orm/drizzle/schema.ts`, content: drizzleCode, language: 'typescript' });

            // TypeORM Entities
            const typeOrmFiles = generateTypeOrmEntities(processingTables, relationships, config);
            files.push(...typeOrmFiles);
        } catch (ormError) {
            console.error("Error generating ORM schemas:", ormError);
        }
    }

    return files;
};
