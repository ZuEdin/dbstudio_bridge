
import { Table, Relationship, BackendConfig, DbType, ValidationRule } from '../../../types/index';
import { resolveType, isNullable, toPascalCase, toCamelCase } from '../common';

export const generateSequelizeModels = (tables: Table[], relationships: Relationship[], config: BackendConfig): string => {
  let dialect = 'mssql';
  let sequelizeConstructor = '';
  
  if (config.dbType === DbType.MySQL) dialect = 'mysql';
  else if (config.dbType === DbType.SQLite) dialect = 'sqlite';

  if (dialect === 'sqlite') {
      const storage = config.dbConnection.includes('=') ? config.dbConnection.split('=')[1] : 'database.sqlite';
      sequelizeConstructor = `const sequelize = new Sequelize({ dialect: 'sqlite', storage: '${storage}' });`;
  } else {
      let db = 'database_name', user = 'user', pass = 'password', host = 'localhost';
      if (config.dbConnection.includes(';')) {
          config.dbConnection.split(';').forEach(p => {
              const [k, v] = p.split('=');
              if (!k || !v) return;
              const key = k.trim().toLowerCase();
              if (key === 'database' || key === 'initial catalog') db = v.trim();
              if (key === 'server' || key === 'data source') host = v.trim();
              if (key === 'user' || key === 'uid') user = v.trim();
              if (key === 'password' || key === 'pwd') pass = v.trim();
          });
      }
      sequelizeConstructor = `const sequelize = new Sequelize('${db}', '${user}', '${pass}', { host: '${host}', dialect: '${dialect}' });`;
  }

  let content = `const { Sequelize, DataTypes } = require('sequelize');\n${sequelizeConstructor}\nconst db = {};\n`;

  tables.forEach(table => {
    const modelName = toPascalCase(table.name);
    const fields = table.fields.map(f => {
      const type = resolveType(f, 'sequelize');
      const props = [`        type: ${type}`, `        field: '${f.name}'`];
      if (f.isPrimaryKey) props.push('        primaryKey: true');
      if (f.isAutoIncrement) props.push('        autoIncrement: true');
      if (!isNullable(f)) props.push('        allowNull: false');
      
      // Default Value
      if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
          let val = String(f.defaultValue);
          if (['NOW', 'CURRENT_TIMESTAMP'].includes(val.toUpperCase())) {
              val = 'DataTypes.NOW';
          } else if (!['INTEGER', 'BOOLEAN', 'DECIMAL', 'DOUBLE'].includes(f.type) && val !== 'true' && val !== 'false') {
              val = `'${val}'`;
          }
          props.push(`        defaultValue: ${val}`);
      }

      return `    ${toCamelCase(f.name)}: {\n${props.join(',\n')}\n    }`;
    }).join(',\n');

    // Validation Rules
    let validateBlock = '';
    if (table.validationRules && table.validationRules.length > 0) {
        const checks = table.validationRules.map(rule => {
            const field = table.fields.find(f => f.id === rule.fieldId);
            if (!field) return '';
            
            let compareVal = '';
            if (rule.compareType === 'field') {
                const other = table.fields.find(f => f.id === rule.compareValue);
                compareVal = `this.${toCamelCase(other?.name || '')}`;
            } else {
                if (field.type === 'VARCHAR') compareVal = `'${rule.compareValue}'`;
                else if (field.type === 'DATE') compareVal = `new Date('${rule.compareValue}')`;
                else compareVal = rule.compareValue;
            }

            let jsCond = '';
            const fVal = `this.${toCamelCase(field.name)}`;
            
            if (rule.operator === 'regex') {
                return `            if (!/${rule.compareValue}/.test(${fVal})) throw new Error("${rule.errorMessage || 'Invalid format'}");`;
            }

            if (field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
               const dVal = `new Date(${fVal})`;
               const cVal = rule.compareType === 'field' ? `new Date(${compareVal})` : `new Date('${rule.compareValue}')`;
               switch(rule.operator) {
                   case 'gt': jsCond = `${dVal} <= ${cVal}`; break; // Fail condition
                   case 'lt': jsCond = `${dVal} >= ${cVal}`; break;
               }
            } else {
               switch(rule.operator) {
                   case 'gt': jsCond = `${fVal} <= ${compareVal}`; break;
                   case 'lt': jsCond = `${fVal} >= ${compareVal}`; break;
                   case 'eq': jsCond = `${fVal} != ${compareVal}`; break;
                   case 'neq': jsCond = `${fVal} == ${compareVal}`; break;
               }
            }
            
            if (jsCond) {
                return `            if (${jsCond}) throw new Error("${rule.errorMessage || 'Validation error'}");`;
            }
            return '';
        }).join('\n');

        validateBlock = `, {\n    validate: {\n        customValidators() {\n${checks}\n        }\n    }\n}`;
    } else {
        validateBlock = '';
    }

    if (validateBlock) {
        content += `\ndb.${modelName} = sequelize.define('${modelName}', {\n${fields}\n}${validateBlock});\n`;
    } else {
        content += `\ndb.${modelName} = sequelize.define('${modelName}', {\n${fields}\n});\n`;
    }
  });

  content += '\n// Relationships\n';
  relationships.forEach(rel => {
      const parent = tables.find(t => t.id === rel.fromTableId);
      const child = tables.find(t => t.id === rel.toTableId);
      const childField = child?.fields.find(f => f.id === rel.toFieldId);
      
      if (parent && child && childField) {
          const parentModel = toPascalCase(parent.name);
          const childModel = toPascalCase(child.name);
          
          let opts = `{ foreignKey: '${toCamelCase(childField.name)}'`;
          const parentPk = parent.fields.find(f => f.id === rel.fromFieldId);
          if (parentPk && !parentPk.isPrimaryKey) {
             opts += `, targetKey: '${toCamelCase(parentPk.name)}'`;
          }
          if (rel.onDelete && rel.onDelete !== 'NO ACTION') opts += `, onDelete: '${rel.onDelete}'`;
          if (rel.onUpdate && rel.onUpdate !== 'NO ACTION') opts += `, onUpdate: '${rel.onUpdate}'`;
          opts += ' }';

          if (rel.type === '1:n') {
              content += `db.${parentModel}.hasMany(db.${childModel}, ${opts});\n`;
              content += `db.${childModel}.belongsTo(db.${parentModel}, ${opts});\n`;
          } else {
              content += `db.${parentModel}.hasOne(db.${childModel}, ${opts});\n`;
              content += `db.${childModel}.belongsTo(db.${parentModel}, ${opts});\n`;
          }
      }
  });

  content += `\ndb.Sequelize = Sequelize;\ndb.sequelize = sequelize;\nmodule.exports = db;`;
  return content;
};
