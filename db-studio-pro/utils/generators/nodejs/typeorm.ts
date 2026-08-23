import { Table, Relationship, DbType, Field } from '../../../types/index';
import { toPascalCase } from '../common';

export const generateTypeOrmModels = (tables: Table[], relationships: Relationship[], dbType: DbType): string => {
  let output = `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";\n\n`;

  const mapType = (field: Field) => {
    const fType = (field.type || 'VARCHAR').toUpperCase();
    switch(fType) {
        case 'INTEGER': case 'TINYINT': case 'SMALLINT': case 'BIGINT':
            return { type: 'int', ts: 'number' };
        case 'DECIMAL': case 'FLOAT': case 'DOUBLE':
            return { type: 'decimal', ts: 'number' };
        case 'VARCHAR': case 'TEXT': case 'CHAR':
            return { type: 'varchar', ts: 'string' };
        case 'BOOLEAN': case 'BIT':
            return { type: 'boolean', ts: 'boolean' };
        case 'DATE': case 'DATETIME': case 'TIMESTAMP':
            return { type: 'timestamp', ts: 'Date' };
        case 'JSON':
            return { type: 'json', ts: 'any' };
        default:
            return { type: 'varchar', ts: 'string' };
    }
  };

  tables.forEach(table => {
    output += `@Entity("${table.name}")\nexport class ${toPascalCase(table.name)} {\n`;
    
    table.fields.forEach(field => {
      const typeInfo = mapType(field);
      if (field.isPrimaryKey && field.isAutoIncrement) {
          output += `    @PrimaryGeneratedColumn()\n`;
      } else if (field.isPrimaryKey) {
          output += `    @PrimaryColumn()\n`;
      } else {
          output += `    @Column({ type: "${typeInfo.type}", nullable: ${field.allowNull} })\n`;
      }
      output += `    ${field.name}${field.allowNull ? '?' : '!'}: ${typeInfo.ts};\n\n`;
    });

    // Relationships To One
    const toOneRels = relationships.filter(r => r.fromTableId === table.id);
    toOneRels.forEach(rel => {
        const toTable = tables.find(t => t.id === rel.toTableId);
        if (toTable) {
            output += `    @ManyToOne(() => ${toPascalCase(toTable.name)}, ${toTable.name.toLowerCase()} => ${toTable.name.toLowerCase()}.${table.name.toLowerCase()}s)\n`;
            output += `    @JoinColumn({ name: "${table.fields.find(f => f.id === rel.fromFieldId)?.name}" })\n`;
            output += `    ${toTable.name.toLowerCase()}: ${toPascalCase(toTable.name)};\n\n`;
        }
    });

    // Relationships To Many
    const toManyRels = relationships.filter(r => r.toTableId === table.id);
    toManyRels.forEach(rel => {
        const fromTable = tables.find(t => t.id === rel.fromTableId);
        if (fromTable) {
            output += `    @OneToMany(() => ${toPascalCase(fromTable.name)}, ${fromTable.name.toLowerCase()} => ${fromTable.name.toLowerCase()}.${table.name.toLowerCase()})\n`;
            output += `    ${fromTable.name.toLowerCase()}s: ${toPascalCase(fromTable.name)}[];\n\n`;
        }
    });

    output += `}\n\n`;
  });

  return output;
};
