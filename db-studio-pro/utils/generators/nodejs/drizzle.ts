import { Table, Relationship, DbType, Field } from '../../../types/index';

export const generateDrizzleSchema = (tables: Table[], relationships: Relationship[], dbType: DbType): string => {
    let output = ``;
    let imports = new Set<string>();

    const getColumnDef = (field: Field) => {
        const nameStr = `"${field.name}"`;
        let def = '';
        const fieldType = (field.type || 'VARCHAR').toUpperCase();
        switch(fieldType) {
            case 'INTEGER': case 'TINYINT': case 'SMALLINT': case 'BIGINT':
                imports.add('integer'); def = `integer(${nameStr})`; break;
            case 'DECIMAL': case 'FLOAT': case 'DOUBLE':
                imports.add('real'); def = `real(${nameStr})`; break;
            case 'VARCHAR': case 'TEXT': case 'CHAR':
                imports.add('text'); def = `text(${nameStr})`; break;
            case 'BOOLEAN': case 'BIT':
                imports.add('boolean'); def = `boolean(${nameStr})`; break;
            case 'DATE': case 'DATETIME': case 'TIMESTAMP':
                imports.add('timestamp'); def = `timestamp(${nameStr})`; break;
            case 'JSON':
                imports.add('json'); def = `json(${nameStr})`; break;
            default:
                imports.add('text'); def = `text(${nameStr})`; break;
        }

        if (field.isPrimaryKey && field.isAutoIncrement) {
            def = `serial(${nameStr}).primaryKey()`;
            imports.add('serial');
            imports.delete('integer');
        } else if (field.isPrimaryKey) {
            def += `.primaryKey()`;
        } else if (!field.allowNull) {
            def += `.notNull()`;
        }
        if (field.isUnique) {
            def += `.unique()`;
        }

        return def;
    };

    let tableDefs = ``;
    tables.forEach(table => {
        tableDefs += `export const ${table.name} = pgTable("${table.name}", {\n`;
        table.fields.forEach(field => {
            tableDefs += `  ${field.name}: ${getColumnDef(field)},\n`;
        });
        tableDefs += `});\n\n`;
    });

    imports.add('pgTable');

    output = `import { ${Array.from(imports).join(', ')} } from "drizzle-orm/pg-core";\n\n` + tableDefs;
    return output;
};
