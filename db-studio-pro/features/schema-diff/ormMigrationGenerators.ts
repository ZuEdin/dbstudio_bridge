import { Table, DbType } from '../../types/index';
import { SchemaDiffChange, GeneratedMigrations } from './schemaDiffTypes';

export interface OrmMigrationBundle {
  prismaMigrationSql: string;
  prismaSchemaDiff: string;
  efCoreUpCSharp: string;
  efCoreDownCSharp: string;
  drizzleTsUp: string;
  knexJsUp: string;
  knexJsDown: string;
}

export const generateOrmMigrationBundle = (
  changes: SchemaDiffChange[],
  currentTables: Table[],
  snapshotTables: Table[],
  dbType: DbType,
  rawSqlUp: string,
  rawSqlDown: string
): OrmMigrationBundle => {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

  // 1. Prisma Migration SQL
  const prismaMigrationSql = `-- Prisma Migration (${timestamp}_schema_update)
-- Target: ${dbType}
${rawSqlUp || '-- No changes'}
`;

  // 2. EF Core C# Migration Class
  let efUpOperations = '';
  let efDownOperations = '';

  changes.forEach(c => {
    if (c.type === 'table_add') {
      const table = currentTables.find(t => t.name.toLowerCase() === c.tableName.toLowerCase());
      if (table) {
        efUpOperations += `            migrationBuilder.CreateTable(
                name: "${table.name}",
                columns: table => new
                {
${table.fields.map(f => `                    ${f.name} = table.Column<${mapFieldToCSharpType(f.type)}>(nullable: ${f.allowNull})`).join(',\n')}
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_${table.name}", x => x.${table.fields.find(f => f.isPrimaryKey)?.name || 'Id'});
                });\n\n`;

        efDownOperations += `            migrationBuilder.DropTable(name: "${table.name}");\n`;
      }
    } else if (c.type === 'column_add') {
      efUpOperations += `            migrationBuilder.AddColumn<${mapFieldToCSharpType(c.newType || 'string')}>(
                name: "${c.columnName}",
                table: "${c.tableName}",
                nullable: ${c.newNullable ?? true});\n\n`;
      efDownOperations += `            migrationBuilder.DropColumn(name: "${c.columnName}", table: "${c.tableName}");\n`;
    } else if (c.type === 'column_drop') {
      efUpOperations += `            migrationBuilder.DropColumn(name: "${c.columnName}", table: "${c.tableName}");\n`;
      efDownOperations += `            migrationBuilder.AddColumn<${mapFieldToCSharpType(c.oldType || 'string')}>(
                name: "${c.columnName}",
                table: "${c.tableName}",
                nullable: true);\n\n`;
    } else if (c.type === 'column_type_change') {
      efUpOperations += `            migrationBuilder.AlterColumn<${mapFieldToCSharpType(c.newType || 'string')}>(
                name: "${c.columnName}",
                table: "${c.tableName}",
                nullable: ${c.newNullable ?? true});\n\n`;
      efDownOperations += `            migrationBuilder.AlterColumn<${mapFieldToCSharpType(c.oldType || 'string')}>(
                name: "${c.columnName}",
                table: "${c.tableName}",
                nullable: ${c.oldNullable ?? true});\n\n`;
    }
  });

  const efCoreUpCSharp = `using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyProject.Migrations
{
    /// <inheritdoc />
    public partial class Migration_${timestamp} : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
${efUpOperations || '            // Keine Änderungen'}
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
${efDownOperations || '            // Kein Rollback'}
        }
    }
}
`;

  const efCoreDownCSharp = efCoreUpCSharp;

  // 3. Drizzle TypeScript Migration Code
  let drizzleStatements: string[] = [];
  changes.forEach(c => {
    if (c.type === 'table_add') {
      drizzleStatements.push(`  // Tabelle "${c.tableName}" anlegen\n  await db.execute(sql\`CREATE TABLE IF NOT EXISTS "${c.tableName}" (...);\`);`);
    } else if (c.type === 'column_add') {
      drizzleStatements.push(`  await db.execute(sql\`ALTER TABLE "${c.tableName}" ADD COLUMN "${c.columnName}" ${c.newType || 'text'};\`);`);
    } else if (c.type === 'column_drop') {
      drizzleStatements.push(`  await db.execute(sql\`ALTER TABLE "${c.tableName}" DROP COLUMN "${c.columnName}";\`);`);
    } else if (c.type === 'column_type_change') {
      drizzleStatements.push(`  await db.execute(sql\`ALTER TABLE "${c.tableName}" ALTER COLUMN "${c.columnName}" TYPE ${c.newType || 'text'};\`);`);
    }
  });

  const drizzleTsUp = `import { sql } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export async function up(db: PostgresJsDatabase): Promise<void> {
${drizzleStatements.length > 0 ? drizzleStatements.join('\n\n') : '  // Keine Änderungen erforderlich'}
}
`;

  // 4. Knex.js JS Migration File
  let knexUpCode = '';
  let knexDownCode = '';

  changes.forEach(c => {
    if (c.type === 'table_add') {
      const table = currentTables.find(t => t.name.toLowerCase() === c.tableName.toLowerCase());
      if (table) {
        knexUpCode += `  await knex.schema.createTable('${table.name}', (table) => {\n`;
        table.fields.forEach(f => {
          if (f.isPrimaryKey) knexUpCode += `    table.increments('${f.name}').primary();\n`;
          else if (f.type === 'VARCHAR') knexUpCode += `    table.string('${f.name}', ${f.length || 255})${f.allowNull ? '.nullable()' : '.notNullable()'};\n`;
          else if (f.type === 'INTEGER') knexUpCode += `    table.integer('${f.name}')${f.allowNull ? '.nullable()' : '.notNullable()'};\n`;
          else if (f.type === 'DECIMAL' || f.type === 'DOUBLE') knexUpCode += `    table.decimal('${f.name}', 12, 2)${f.allowNull ? '.nullable()' : '.notNullable()'};\n`;
          else if (f.type === 'DATE' || f.type === 'DATETIME') knexUpCode += `    table.timestamp('${f.name}')${f.allowNull ? '.nullable()' : '.notNullable()'};\n`;
          else if (f.type === 'BOOLEAN') knexUpCode += `    table.boolean('${f.name}')${f.allowNull ? '.nullable()' : '.notNullable()'};\n`;
          else knexUpCode += `    table.text('${f.name}')${f.allowNull ? '.nullable()' : '.notNullable()'};\n`;
        });
        knexUpCode += `  });\n\n`;
        knexDownCode += `  await knex.schema.dropTableIfExists('${table.name}');\n`;
      }
    } else if (c.type === 'column_add') {
      knexUpCode += `  await knex.schema.alterTable('${c.tableName}', (table) => {\n    table.string('${c.columnName}')${c.newNullable ? '.nullable()' : '.notNullable()'};\n  });\n`;
      knexDownCode += `  await knex.schema.alterTable('${c.tableName}', (table) => {\n    table.dropColumn('${c.columnName}');\n  });\n`;
    } else if (c.type === 'column_drop') {
      knexUpCode += `  await knex.schema.alterTable('${c.tableName}', (table) => {\n    table.dropColumn('${c.columnName}');\n  });\n`;
      knexDownCode += `  await knex.schema.alterTable('${c.tableName}', (table) => {\n    table.string('${c.columnName}').nullable();\n  });\n`;
    }
  });

  const knexJsUp = `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
${knexUpCode || '  // Keine Schemaänderungen'}
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
${knexDownCode || '  // Kein Rollback'}
};
`;

  return {
    prismaMigrationSql,
    prismaSchemaDiff: rawSqlUp,
    efCoreUpCSharp,
    efCoreDownCSharp,
    drizzleTsUp,
    knexJsUp,
    knexJsDown: knexJsUp
  };
};

function mapFieldToCSharpType(fieldType: string): string {
  const t = fieldType.toUpperCase();
  if (t.includes('INT')) return 'int';
  if (t.includes('DECIMAL') || t.includes('NUMERIC')) return 'decimal';
  if (t.includes('FLOAT') || t.includes('DOUBLE')) return 'double';
  if (t.includes('BOOL')) return 'bool';
  if (t.includes('DATE') || t.includes('TIME')) return 'DateTime';
  return 'string';
}
