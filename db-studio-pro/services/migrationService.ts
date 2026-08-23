
import { Table, DbType, Field } from '../types/index';
import { resolveType, quoteIdentifier, toPascalCase } from '../utils/generators/common';

export interface MigrationScript {
    up: string;
    down: string;
    description: string;
}

const mapTypeToSql = (field: Field, dbType: DbType): string => {
    let type = resolveType(field, 'sql');
    if (dbType === DbType.SQLite && type.toUpperCase().includes('INT') && field.isAutoIncrement) return 'INTEGER';
    return type;
};

const buildTableFieldsDef = (table: Table, dbType: DbType): string => {
    return table.fields.map(f => {
        let def = `${quoteIdentifier(f.name, dbType)} ${mapTypeToSql(f, dbType)}`;
        if (!f.allowNull && !f.isPrimaryKey) def += ' NOT NULL';
        if (f.isPrimaryKey) {
            def += ' PRIMARY KEY';
            if (f.isAutoIncrement) {
                if (dbType === DbType.MySQL) def += ' AUTO_INCREMENT';
                else if (dbType === DbType.SQL) def += ' IDENTITY(1,1)';
            }
        }
        return def;
    }).join(', ');
};

export const calculateMigration = (currentTables: Table[], snapshotTables: Table[] = [], dbType: DbType): MigrationScript => {
    let upSql = '';
    let downSql = '';
    const changes: string[] = [];

    // 1. Check for New Tables
    currentTables.forEach(curr => {
        const prev = snapshotTables.find(t => t.id === curr.id);
        const tableName = quoteIdentifier(curr.name, dbType);
        
        if (!prev) {
            // New Table
            changes.push(`Create table ${curr.name}`);
            const fieldsDef = buildTableFieldsDef(curr, dbType);
            upSql += `CREATE TABLE ${tableName} (${fieldsDef});\n`;
            downSql += `DROP TABLE ${tableName};\n`;
        } else {
            // Check for Modified/New Fields
            curr.fields.forEach(currField => {
                const prevField = prev.fields.find(f => f.id === currField.id);
                const fieldName = quoteIdentifier(currField.name, dbType);
                const fieldType = mapTypeToSql(currField, dbType);

                if (!prevField) {
                    // New Column
                    changes.push(`Add column ${curr.name}.${currField.name}`);
                    let constraint = !currField.allowNull ? ' NOT NULL' : '';
                    upSql += `ALTER TABLE ${tableName} ADD ${fieldName} ${fieldType}${constraint};\n`;
                    // SQLite 3.35.0+ supports DROP COLUMN
                    downSql += `ALTER TABLE ${tableName} DROP COLUMN ${fieldName};\n`;
                } else {
                    // Rename Column
                    if (currField.name !== prevField.name) {
                        changes.push(`Rename column ${prevField.name} to ${currField.name} in ${curr.name}`);
                        const prevNameQuoted = quoteIdentifier(prevField.name, dbType);
                        if (dbType === DbType.SQL) {
                            upSql += `EXEC sp_rename '${curr.name}.${prevField.name}', '${currField.name}', 'COLUMN';\n`;
                            downSql += `EXEC sp_rename '${curr.name}.${currField.name}', '${prevField.name}', 'COLUMN';\n`;
                        } else if (dbType === DbType.MySQL) {
                            upSql += `ALTER TABLE ${tableName} CHANGE ${prevNameQuoted} ${fieldName} ${fieldType};\n`;
                            downSql += `ALTER TABLE ${tableName} CHANGE ${fieldName} ${prevNameQuoted} ${mapTypeToSql(prevField, dbType)};\n`;
                        } else {
                            upSql += `ALTER TABLE ${tableName} RENAME COLUMN ${prevNameQuoted} TO ${fieldName};\n`;
                            downSql += `ALTER TABLE ${tableName} RENAME COLUMN ${fieldName} TO ${prevNameQuoted};\n`;
                        }
                    }
                    // Type Change
                    if (currField.type !== prevField.type || currField.allowNull !== prevField.allowNull) {
                         changes.push(`Modify ${curr.name}.${currField.name}`);
                         let currConstraint = !currField.allowNull ? ' NOT NULL' : ' NULL';
                         let prevConstraint = !prevField.allowNull ? ' NOT NULL' : ' NULL';
                         
                         if (dbType === DbType.SQL) {
                             upSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} ${fieldType}${currConstraint};\n`;
                             downSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} ${mapTypeToSql(prevField, dbType)}${prevConstraint};\n`;
                         } else if (dbType === DbType.MySQL) {
                             upSql += `ALTER TABLE ${tableName} MODIFY ${fieldName} ${fieldType}${currConstraint};\n`;
                             downSql += `ALTER TABLE ${tableName} MODIFY ${fieldName} ${mapTypeToSql(prevField, dbType)}${prevConstraint};\n`;
                         } else {
                             // PostgreSQL / SQLite fallback (Postgres uses ALTER COLUMN TYPE)
                             upSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} TYPE ${fieldType};\n`;
                             downSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} TYPE ${mapTypeToSql(prevField, dbType)};\n`;
                         }
                    }
                }
            });

            // Check for Dropped Fields
            prev.fields.forEach(prevField => {
                if (!curr.fields.find(f => f.id === prevField.id)) {
                    changes.push(`Drop column ${prevField.name} from ${curr.name}`);
                    const fieldName = quoteIdentifier(prevField.name, dbType);
                    upSql += `ALTER TABLE ${tableName} DROP COLUMN ${fieldName};\n`;
                    let constraint = !prevField.allowNull ? ' NOT NULL' : '';
                    downSql += `ALTER TABLE ${tableName} ADD ${fieldName} ${mapTypeToSql(prevField, dbType)}${constraint};\n`;
                }
            });
        }
    });

    // 2. Check for Dropped Tables
    snapshotTables.forEach(prev => {
        if (!currentTables.find(t => t.id === prev.id)) {
            changes.push(`Drop table ${prev.name}`);
            const tableName = quoteIdentifier(prev.name, dbType);
            upSql += `DROP TABLE ${tableName};\n`;
            const fieldsDef = buildTableFieldsDef(prev, dbType);
            downSql += `CREATE TABLE ${tableName} (${fieldsDef});\n`;
        }
    });

    return {
        up: upSql || '-- No changes detected',
        down: downSql || '-- No changes detected',
        description: changes.length > 0 ? changes.join('\n') : 'No changes'
    };
};
