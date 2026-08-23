
import { Table, Relationship, BackendConfig, VirtualFile, Query, SelectQuery, ValidationRule, DbType } from '../../../types/index';
import { DATA_TYPES } from '../../../config/dataTypes';
import { resolveType, toPascalCase, isNullable } from '../common';
import { detectJunctionTables, generateEfCoreManyToManyFluent } from '../manyToManyGenerator';

export const getRelationshipNames = (relationships: Relationship[], tables: Table[], currentRel: Relationship) => {
    const parentTable = tables.find(t => t.id === currentRel.fromTableId);
    const childTable = tables.find(t => t.id === currentRel.toTableId);
    const fkField = childTable?.fields.find(f => f.id === currentRel.toFieldId);

    if (!parentTable || !childTable || !fkField) return { navName: '', collectionName: '' };

    const childToParentRels = relationships.filter(r => r.toTableId === childTable.id && r.fromTableId === parentTable.id);
    let navName = toPascalCase(parentTable.name);
    if (childToParentRels.length > 1) {
        const idx = childToParentRels.findIndex(r => r.id === currentRel.id);
        const sameFkRels = childToParentRels.filter(r => r.toFieldId === currentRel.toFieldId);
        if (sameFkRels.length > 1) {
            navName = `${navName}_${toPascalCase(fkField.name)}_${idx + 1}`;
        } else {
            navName = `${navName}_${toPascalCase(fkField.name)}`;
        }
    }

    const parentToChildRels = relationships.filter(r => r.fromTableId === parentTable.id && r.toTableId === childTable.id);
    let collectionName = `${toPascalCase(childTable.name)}s`;
    if (parentToChildRels.length > 1) {
        const idx = parentToChildRels.findIndex(r => r.id === currentRel.id);
        const sameFkRels = parentToChildRels.filter(r => r.toFieldId === currentRel.toFieldId);
        if (sameFkRels.length > 1) {
            collectionName = `${collectionName}_${toPascalCase(fkField.name)}_${idx + 1}`;
        } else {
            collectionName = `${collectionName}_${toPascalCase(fkField.name)}`;
        }
    }

    return { navName, collectionName };
};

export const generateDbContext = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, root: string): VirtualFile => {
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');
  const dbSets = tables.map(t => `        public DbSet<${toPascalCase(t.name)}> ${toPascalCase(t.name)}s { get; set; }`).join('\n');
  const queryDbSets = queries
    .filter(q => q.type === 'SELECT')
    .map(q => `        public DbSet<${toPascalCase(q.name)}> ${toPascalCase(q.name)}s { get; set; }`)
    .join('\n');
  
  const tableMappings = tables.map(t => `            modelBuilder.Entity<${toPascalCase(t.name)}>().ToTable("${toPascalCase(t.name)}");`).join('\n');
  const queryMappings = queries
    .filter(q => q.type === 'SELECT')
    .map(q => `            modelBuilder.Entity<${toPascalCase(q.name)}>().ToView("${toPascalCase(q.name)}").HasNoKey();`).join('\n');

  // Relationship Configuration (Fluent API for DeleteBehavior)
  const relationshipConfigs = relationships.map(rel => {
      const parentTable = tables.find(t => t.id === rel.fromTableId);
      const childTable = tables.find(t => t.id === rel.toTableId);
      const childField = childTable?.fields.find(f => f.id === rel.toFieldId);

      if (!parentTable || !childTable || !childField) return '';
      
      const parentPk = parentTable.fields.find(f => f.isPrimaryKey) || parentTable.fields[0];
      if (!parentPk) return '';
      
      if (childField.type !== parentPk.type) {
          return `            // [SKIPPED] Relationship ${toPascalCase(parentTable.name)} -> ${toPascalCase(childTable.name)} skipped due to Type Mismatch: FK ${childField.name} (${childField.type}) vs PK ${parentPk.name} (${parentPk.type})`;
      }

      const parentName = toPascalCase(parentTable.name);
      const childName = toPascalCase(childTable.name);
      const fkName = toPascalCase(childField.name);
      
      const { navName, collectionName } = getRelationshipNames(relationships, tables, rel);

      let deleteBehavior = 'DeleteBehavior.ClientSetNull'; // Default safe
      if (rel.onDelete === 'CASCADE') deleteBehavior = 'DeleteBehavior.Cascade';
      else if (rel.onDelete === 'SET NULL') deleteBehavior = 'DeleteBehavior.SetNull';
      else if (rel.onDelete === 'RESTRICT') deleteBehavior = 'DeleteBehavior.Restrict';
      else if (rel.onDelete === 'NO ACTION') deleteBehavior = 'DeleteBehavior.NoAction';

      // Warning comment if OnUpdate is set, as EF Core Fluent API doesn't support .OnUpdate() natively
      let onUpdateComment = '';
      if (rel.onUpdate && rel.onUpdate !== 'NO ACTION') {
          onUpdateComment = `
                // NOTE: OnUpdate action '${rel.onUpdate}' is defined in design but EF Core Fluent API does not support .OnUpdate(). 
                // To enforce this, use raw SQL migration or database-specific configuration.`;
      }

      return `            modelBuilder.Entity<${childName}>()
                .HasOne(d => d.${navName})
                .WithMany(p => p.${collectionName})
                .HasForeignKey(d => d.${fkName})
                .OnDelete(${deleteBehavior});${onUpdateComment}`;
  }).join('\n\n');

  // Multi-Tenancy Logic
  let tenantServiceInjection = '';
  let tenantConstructor = '';
  let tenantFilters = '';
  let onConfiguring = '';
  let namespaces = `using Microsoft.EntityFrameworkCore;\nusing ${safeNamespace}.Models;`;

  if (config.multiTenancy?.enabled) {
      namespaces += `\nusing ${safeNamespace}.Services;\nusing Microsoft.Extensions.Configuration;`;
      tenantServiceInjection = `        private readonly ITenantService _tenantService;\n        private readonly IConfiguration _config;`;
      
      tenantConstructor = `
        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantService tenantService, IConfiguration config) : base(options) 
        { 
            _tenantService = tenantService;
            _config = config;
        }`;
      
      // DISCRIMINATOR STRATEGY: Global Filters
      if (config.multiTenancy.strategy === 'discriminator') {
          const tenantField = config.multiTenancy?.tenantField || 'TenantId';
          
          tenantFilters = tables
            .filter(t => t.fields.some(f => f.name === tenantField)) 
            .map(t => `            modelBuilder.Entity<${toPascalCase(t.name)}>().HasQueryFilter(a => a.${tenantField} == _tenantService.GetTenantId());`)
            .join('\n');
      }

      // DATABASE PER TENANT STRATEGY: OnConfiguring Override
      if (config.multiTenancy.strategy === 'database') {
          let dbProviderCall = '';
          if (config.dbType === DbType.MySQL) dbProviderCall = `optionsBuilder.UseMySql(newConn, ServerVersion.AutoDetect(newConn));`;
          else if (config.dbType === DbType.SQLite) dbProviderCall = `optionsBuilder.UseSqlite(newConn);`;
          else dbProviderCall = `optionsBuilder.UseSqlServer(newConn);`;

          onConfiguring = `
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (_tenantService.IsDatabasePerTenant())
            {
                var defaultConn = _config.GetConnectionString("DefaultConnection");
                if(!string.IsNullOrEmpty(defaultConn)) {
                    var newConn = _tenantService.GetConnectionString(defaultConn);
                    if (newConn != defaultConn)
                    {
                        ${dbProviderCall}
                    }
                }
            }
            base.OnConfiguring(optionsBuilder);
        }`;
      }
  } else {
      tenantConstructor = `        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }`;
  }

  const content = `${namespaces}

namespace ${safeNamespace}.Data
{
    public class AppDbContext : DbContext
    {
${tenantServiceInjection}
${tenantConstructor}

        // Tables
${dbSets}

        // Queries (Views)
${queryDbSets}

${onConfiguring}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

${tableMappings}
${queryMappings}

            // Relationships
${relationshipConfigs}

            // Many-to-Many Relationships (.NET 10 EF Core UsingEntity)
${generateEfCoreManyToManyFluent(detectJunctionTables(tables, relationships))}

            // Multi-Tenancy Filters
${tenantFilters}
        }
    }
}`;
  return { name: 'AppDbContext.cs', path: `${root}/Data/AppDbContext.cs`, content: content, language: 'csharp' };
};

const generateValidationLogic = (rules: ValidationRule[], table: Table): string => {
    if (!rules || rules.length === 0) return '';

    const checks = rules.map(rule => {
        const field = table.fields.find(f => f.id === rule.fieldId);
        if (!field) return '';
        const propName = toPascalCase(field.name);
        
        let compareExp = '';
        if (rule.compareType === 'field') {
            const otherField = table.fields.find(f => f.id === rule.compareValue);
            if (!otherField) return '';
            compareExp = toPascalCase(otherField.name);
        } else {
            if (field.type === 'VARCHAR' || field.type === 'TEXT') compareExp = `"${rule.compareValue}"`;
            else if (field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') compareExp = `DateTime.Parse("${rule.compareValue}")`;
            else compareExp = rule.compareValue; 
        }

        let condition = '';
        const msg = rule.errorMessage || "Validation failed";

        if (rule.operator === 'regex') {
            return `            if (!System.Text.RegularExpressions.Regex.IsMatch(${propName}?.ToString() ?? "", @"${rule.compareValue}"))
            {
                yield return new ValidationResult("${msg}", new[] { "${propName}" });
            }`;
        }

        switch(rule.operator) {
            case 'gt': condition = `${propName} <= ${compareExp}`; break;
            case 'lt': condition = `${propName} >= ${compareExp}`; break;
            case 'gte': condition = `${propName} < ${compareExp}`; break;
            case 'lte': condition = `${propName} > ${compareExp}`; break;
            case 'eq': condition = `${propName} != ${compareExp}`; break;
            case 'neq': condition = `${propName} == ${compareExp}`; break;
        }

        return `            if (${condition})
            {
                yield return new ValidationResult("${msg}", new[] { "${propName}" });
            }`;
    }).join('\n\n');

    return `
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
${checks}
        }`;
};

export const generateModels = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');

  // Table Models
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const hasValidation = table.validationRules && table.validationRules.length > 0;
    
    // Props Generation
    const props = table.fields.map(f => {
      let type = resolveType(f, 'csharp');
      const typeConfig = DATA_TYPES[f.type];
      const attributes = [];
      
      const nullable = isNullable(f);

      let columnAttrContent = `"${f.name}"`;
      if (f.isPrimaryKey) attributes.push('[Key]');

      if (typeConfig && typeConfig.mappings.csharp.attributes) {
          const typeAttrs = typeConfig.mappings.csharp.attributes({ length: f.length, precision: f.precision, scale: f.scale });
          typeAttrs.forEach(attr => {
              if (attr.startsWith('[Column(')) {
                  const inner = attr.substring(8, attr.length - 2);
                  columnAttrContent += `, ${inner}`;
              } else {
                  attributes.push(attr);
              }
          });
      }
      
      attributes.unshift(`[Column(${columnAttrContent})]`);
      
      const isValueType = ['int', 'decimal', 'double', 'DateTime', 'bool'].includes(type);
      let initializer = '';
      
      // Determine if type should be nullable '?'
      if (nullable) {
          type += '?';
      } else {
          // If NOT nullable and is String, init to empty to avoid warnings
          if (type === 'string') initializer = ' = string.Empty;';
          // If NOT nullable and Value Type, no initializer needed (defaults to 0/false)
      }

      // Explicit Default Values override
      if (f.defaultValue) {
          if (type.startsWith('string')) {
              initializer = ` = "${f.defaultValue}";`;
          } else if (type.includes('bool')) {
              initializer = ` = ${f.defaultValue.toLowerCase() === 'true' ? 'true' : 'false'};`;
          } else if (type.startsWith('decimal')) {
              const val = f.defaultValue.trim();
              if (val.toLowerCase().endsWith('m')) {
                  initializer = ` = ${val};`;
              } else if (!isNaN(Number(val))) {
                  initializer = ` = ${val}m;`;
              } else {
                  initializer = ` = ${val};`;
              }
          } else if (type.startsWith('float') || type.startsWith('double')) {
              const val = f.defaultValue.trim();
              if (val.toLowerCase().endsWith('f') || val.toLowerCase().endsWith('d')) {
                  initializer = ` = ${val};`;
              } else if (!isNaN(Number(val))) {
                  initializer = ` = ${val};`;
              } else {
                  initializer = ` = ${val};`;
              }
          } else if (!type.startsWith('DateTime')) {
              initializer = ` = ${f.defaultValue};`;
          }
      }

      const indent = "        "; 
      let attrBlock = attributes.length > 0 ? attributes.map(a => `${indent}${a}`).join('\n') + '\n' : '';
      let propName = toPascalCase(f.name);
      if (propName === safeName) {
          propName = `${propName}Value`;
          attrBlock += `${indent}[JsonPropertyName("${f.name}")]\n`;
      }
      return `${attrBlock}${indent}public ${type} ${propName} { get; set; }${initializer}`;
    }).join('\n\n');

    let tenantProp = '';
    const isDiscriminator = config.multiTenancy?.enabled && config.multiTenancy?.strategy === 'discriminator';
    const tenantField = config.multiTenancy?.tenantField || 'TenantId';
    const hasTenantField = table.fields.some(f => f.name.toLowerCase() === tenantField.toLowerCase() || toPascalCase(f.name) === toPascalCase(tenantField));

    if (isDiscriminator && !hasTenantField && !table.name.startsWith('sys_')) {
        tenantProp = `        public string? ${toPascalCase(tenantField)} { get; set; }`;
    }

    // Nav Properties
    const childRels = relationships.filter(r => r.fromTableId === table.id);
    const childProps = childRels.map(r => {
        const childTable = tables.find(t => t.id === r.toTableId);
        const childField = childTable?.fields.find(f => f.id === r.toFieldId);
        const parentPk = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
        if (!childTable || !childField || !parentPk) return '';
        
        if (childField.type !== parentPk.type) {
            return `        // [SKIPPED] Collection of ${toPascalCase(childTable.name)} skipped due to Type Mismatch: FK ${childField.name} (${childField.type}) vs PK ${parentPk.name} (${parentPk.type})`;
        }

        const { collectionName } = getRelationshipNames(relationships, tables, r);

        return `        public virtual ICollection<${toPascalCase(childTable.name)}> ${collectionName} { get; set; } = new List<${toPascalCase(childTable.name)}>();`;
    }).join('\n\n');

    const parentRels = relationships.filter(r => r.toTableId === table.id);
    const parentProps = parentRels.map(r => {
        const parentTable = tables.find(t => t.id === r.fromTableId);
        const fkField = table.fields.find(f => f.id === r.toFieldId);
        const parentPk = parentTable?.fields.find(f => f.isPrimaryKey) || parentTable?.fields[0];

        if (!parentTable || !fkField || !parentPk) return '';

        if (fkField.type !== parentPk.type) {
            return `        // [SKIPPED] Navigation to ${toPascalCase(parentTable.name)} skipped due to Type Mismatch: ${fkField.name} (${fkField.type}) vs PK ${parentPk.name} (${parentPk.type})`;
        }

        const { navName } = getRelationshipNames(relationships, tables, r);

        return `        [ForeignKey("${toPascalCase(fkField.name)}")]\n        public virtual ${toPascalCase(parentTable.name)}? ${navName} { get; set; }`;
    }).join('\n\n');

    // Many-to-Many Navigation Properties
    const allJunctions = detectJunctionTables(tables, relationships);
    const nmProps: string[] = [];
    const seenNmTargets = new Set<string>();

    allJunctions.filter(j => j.leftTable.id === table.id).forEach(j => {
        const rightName = toPascalCase(j.rightTable.name);
        const pluralSuffix = rightName.endsWith('s') || rightName.endsWith('en') ? '' : 's';
        const propName = `${rightName}${pluralSuffix}`;
        if (!seenNmTargets.has(propName)) {
            seenNmTargets.add(propName);
            nmProps.push(`        public virtual ICollection<${rightName}> ${propName} { get; set; } = new List<${rightName}>();`);
        }
    });

    allJunctions.filter(j => j.rightTable.id === table.id).forEach(j => {
        const leftName = toPascalCase(j.leftTable.name);
        const pluralSuffix = leftName.endsWith('s') || leftName.endsWith('en') ? '' : 's';
        const propName = `${leftName}${pluralSuffix}`;
        if (!seenNmTargets.has(propName)) {
            seenNmTargets.add(propName);
            nmProps.push(`        public virtual ICollection<${leftName}> ${propName} { get; set; } = new List<${leftName}>();`);
        }
    });

    const nmPropBlock = nmProps.join('\n\n');

    const combinedProps = [props, tenantProp, childProps, parentProps, nmPropBlock].filter(p => p).join('\n\n');
    
    const validationMethod = hasValidation ? generateValidationLogic(table.validationRules!, table) : '';
    const interfaceDecl = hasValidation ? ' : IValidatableObject' : '';

    const content = `using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ${safeNamespace}.Models
{
    public class ${safeName}${interfaceDecl}
    {
${combinedProps}
${validationMethod}
    }
}`;
    files.push({ name: `${safeName}.cs`, path: `${root}/Models/${safeName}.cs`, content: content, language: 'csharp' });
  });

  // Query Models
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const selectQ = q as SelectQuery;
      const safeName = toPascalCase(q.name);
      const usedNames = new Set<string>();

      const props = selectQ.columns.filter(c => c.show || (c.criteria && c.criteria.some(cr => cr && cr.trim() !== ''))).map(c => {
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          let type = 'string';
          if (field) {
              type = resolveType(field, 'csharp');
              if (field.allowNull) type += '?';
          }
          if (c.aggregate === 'COUNT') type = 'int';
          if (c.aggregate === 'SUM' && type === 'int') type = 'long?';
          
          let propName = toPascalCase(c.alias || c.fieldName);
          let colAttr = '';
          
          if (propName === safeName) {
              propName = `${propName}Value`;
              colAttr = `        [Column("${c.alias || c.fieldName}")]\n        [JsonPropertyName("${c.alias || c.fieldName}")]\n`;
          }
          
          // Deduplication Logic
          if (usedNames.has(propName)) {
              propName = toPascalCase(`${c.alias || c.fieldName}${toPascalCase(c.tableName)}`);
          }
          let counter = 2;
          const original = propName;
          while(usedNames.has(propName)) {
              propName = `${original}${counter}`;
              counter++;
          }
          usedNames.add(propName);

          let initializer = '';
          if (type === 'string') {
              initializer = ' = string.Empty;';
          }

          return `${colAttr}        public ${type} ${propName} { get; set; }${initializer}`;
      }).join('\n\n');

      const content = `using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ${safeNamespace}.Models
{
    public class ${safeName}
    {
${props}
    }
}`;
      files.push({ name: `${safeName}.cs`, path: `${root}/Models/${safeName}.cs`, content: content, language: 'csharp' });
  });

  return files;
};
