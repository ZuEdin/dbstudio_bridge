

import { Field, DbType } from '../../types/index';
import { DATA_TYPES } from '../../config/dataTypes';

export const toSubformSuffix = (id: string) => {
    if (!id) return '';
    return id.replace(/^sub_field_/, '').replace(/^sub_/, '').replace(/^field_/, '').replace(/[^a-zA-Z0-9_]/g, '_');
};

export const isNullable = (field: Field | undefined | null) => field ? (field.allowNull !== false && !field.isPrimaryKey) : true;

export const resolveType = (field: Field | undefined | null, language: 'csharp' | 'sequelize' | 'typescript' | 'sql', dbType?: DbType) => {
    if (!field || !field.type) {
        if (language === 'csharp') return 'int';
        if (language === 'typescript') return 'number';
        if (language === 'sequelize') return 'DataTypes.INTEGER';
        return 'INT';
    }
    const config = DATA_TYPES[field.type];
    if (!config) {
        if (language === 'csharp') return 'string';
        if (language === 'typescript') return 'string';
        if (language === 'sequelize') return 'DataTypes.STRING';
        return 'VARCHAR(255)';
    }

    const mapping = config.mappings[language];
    if (!mapping) return 'string';
    if (typeof mapping === 'string') return mapping;
    
    const typeGen = (mapping as any).type;
    
    if (typeof typeGen === 'function') {
        return typeGen({ length: field.length, precision: field.precision, scale: field.scale, enumValues: field.enumValues, field, dbType });
    }
    return typeGen || 'string';
};

// String Helpers

// Helper to replace German umlauts with ASCII equivalents
const normalizeString = (str: string) => {
    if (!str) return '';
    return str
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/Ä/g, 'Ae')
        .replace(/Ö/g, 'Oe')
        .replace(/Ü/g, 'Ue');
};

export const toPascalCase = (str: string) => {
  if (!str) return '';
  // 1. Transliterate Umlauts
  let clean = normalizeString(str);
  
  // 2. Treat underscores and dashes as separators (replace with space)
  clean = clean.replace(/[_-]/g, ' ');
  
  // 3. Remove all other non-alphanumeric characters (keeping spaces for splitting)
  clean = clean.replace(/[^a-zA-Z0-9 ]/g, ''); 
  
  // 4. Capitalize each word and join
  return clean.split(' ')
    .filter(word => word.length > 0) // Remove empty strings
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

export const toCamelCase = (str: string) => {
  const pascal = toPascalCase(str);
  if (!pascal) return '';
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export const toKebabCase = (str: string) => {
    if (!str) return '';
    let clean = normalizeString(str);
    
    // Handle existing CamelCase to kebab (e.g., "MyField" -> "My-Field")
    clean = clean.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
    
    // Replace spaces and underscores with dashes
    clean = clean.replace(/[\s_]+/g, '-');
    
    // Remove anything that isn't a letter, number, or dash
    clean = clean.replace(/[^a-zA-Z0-9-]/g, '');
    
    return clean.toLowerCase();
};

export const toSnakeCase = (str: string) => {
    if (!str) return '';
    return toPascalCase(str)
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
};

export const quoteIdentifier = (name: string, dbType: DbType): string => {
    if (!name) return '';
    switch (dbType) {
        case DbType.SQL:
            return `[${name}]`;
        case DbType.MySQL:
            return `\`${name}\``;
        case DbType.SQLite:
            return `"${name}"`;
        default:
            return name;
    }
};
