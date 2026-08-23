import { Table, Relationship, DbType } from '../../../types/index';

export const generatePrismaSchema = (tables: Table[], relationships: Relationship[], dbType: DbType): string => {
  const provider = dbType === DbType.SQLite ? 'sqlite' : dbType === DbType.MySQL ? 'mysql' : 'sqlserver';
  
  let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

`;

  const getPrismaType = (type: string) => {
    switch ((type || 'VARCHAR').toUpperCase()) {
      case 'VARCHAR':
      case 'TEXT':
      case 'CHAR':
        return 'String';
      case 'INTEGER':
      case 'INT':
      case 'TINYINT':
      case 'SMALLINT':
        return 'Int';
      case 'BIGINT':
        return 'BigInt';
      case 'DECIMAL':
      case 'NUMERIC':
      case 'FLOAT':
      case 'DOUBLE':
        return 'Float';
      case 'BOOLEAN':
      case 'BIT':
        return 'Boolean';
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'DateTime';
      case 'JSON':
        return 'Json';
      default:
        return 'String';
    }
  };

  tables.forEach(table => {
    schema += `model ${table.name} {\n`;
    
    // Fields
    table.fields.forEach(field => {
      let type = getPrismaType(field.type);
      if (field.allowNull) type += '?';
      
      let attrs = [];
      if (field.isPrimaryKey) attrs.push('@id');
      if (field.isAutoIncrement && getPrismaType(field.type) === 'Int') attrs.push('@default(autoincrement())');
      else if (field.isAutoIncrement) attrs.push('@default(cuid())');
      if (field.isUnique) attrs.push('@unique');
      
      schema += `  ${field.name} ${type} ${attrs.join(' ')}\n`;
    });

    // Relations (To Many)
    const toManyRels = relationships.filter(r => r.toTableId === table.id);
    toManyRels.forEach(rel => {
      const fromTable = tables.find(t => t.id === rel.fromTableId);
      if (fromTable) {
        const relationName = `Rel_${fromTable.name}_${table.name}`;
        schema += `  ${fromTable.name.toLowerCase()}s ${fromTable.name}[] @relation("${relationName}")\n`;
      }
    });

    // Relations (To One / BelongsTo)
    const toOneRels = relationships.filter(r => r.fromTableId === table.id);
    toOneRels.forEach(rel => {
      const toTable = tables.find(t => t.id === rel.toTableId);
      const fromField = table.fields.find(f => f.id === rel.fromFieldId);
      if (toTable && fromField) {
        const relationName = `Rel_${table.name}_${toTable.name}`;
        schema += `  ${toTable.name.toLowerCase()} ${toTable.name}? @relation("${relationName}", fields: [${fromField.name}], references: [${toTable.fields.find(f => f.id === rel.toFieldId)?.name || 'id'}])\n`;
      }
    });

    schema += `}\n\n`;
  });

  return schema;
};
