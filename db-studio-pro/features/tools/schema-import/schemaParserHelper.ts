import { Table, Field, FieldType } from '../../../types/index';

// SQL DDL Parser
export const parseSqlDdl = (sql: string): Table[] => {
  const tables: Table[] = [];
  
  // Clean comments and normalize whitespace
  let cleanSql = sql
    .replace(/--.*$/gm, '') // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // multi-line comments
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();

  // Find CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]*?)\)(?:\s*;|\s*(?:ENGINE|DEFAULT|CHARSET|collate)\b|$)/gi;
  
  let match;
  while ((match = createTableRegex.exec(cleanSql)) !== null) {
    const rawTableName = match[1].replace(/[`"']/g, '').trim();
    const columnsPart = match[2].trim();
    
    // Split columns by comma, but ignore commas inside parentheses (e.g. DECIMAL(10,2) or VARCHAR(255))
    const columns: string[] = [];
    let currentColumn = '';
    let parenDepth = 0;
    
    for (let i = 0; i < columnsPart.length; i++) {
      const char = columnsPart[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      
      if (char === ',' && parenDepth === 0) {
        columns.push(currentColumn.trim());
        currentColumn = '';
      } else {
        currentColumn += char;
      }
    }
    if (currentColumn.trim()) {
      columns.push(currentColumn.trim());
    }
    
    const fields: Field[] = [];
    let primaryKeyColumn: string | null = null;
    
    // First pass or look for PRIMARY KEY (col) constraints
    columns.forEach(colStr => {
      const upperCol = colStr.toUpperCase();
      if (upperCol.startsWith('PRIMARY KEY') || upperCol.startsWith('CONSTRAINT')) {
        const pkMatch = upperCol.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          primaryKeyColumn = pkMatch[1].replace(/[`"']/g, '').trim();
        }
      }
    });

    columns.forEach(colStr => {
      const parts = colStr.split(/\s+/);
      if (parts.length < 2) return;
      
      const firstPartUpper = parts[0].toUpperCase();
      if (['PRIMARY', 'CONSTRAINT', 'FOREIGN', 'KEY', 'UNIQUE', 'INDEX', 'CHECK'].includes(firstPartUpper)) {
        // Skip table-level constraints
        return;
      }
      
      const rawColName = parts[0].replace(/[`"']/g, '').trim();
      const rawTypeWithLen = parts[1].toLowerCase();
      
      // Extract base type and length/precision
      const typeMatch = rawTypeWithLen.match(/^([a-z]+)(?:\(([^)]+)\))?/i);
      const baseType = typeMatch ? typeMatch[1].toUpperCase() : 'VARCHAR';
      const typeParams = typeMatch && typeMatch[2] ? typeMatch[2] : undefined;
      
      // Determine our FieldType
      let type: FieldType = 'VARCHAR';
      let isAutoIncrement = false;
      let allowNull = true;
      let isPrimaryKey = false;
      let defaultValue: string | undefined = undefined;
      let length: number | undefined = undefined;
      
      if (['INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT', 'SERIAL'].includes(baseType)) {
        type = 'INTEGER';
        if (baseType === 'SERIAL') {
          isAutoIncrement = true;
          isPrimaryKey = true;
        }
      } else if (['DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL'].includes(baseType)) {
        type = 'DECIMAL';
      } else if (['BIT', 'BOOLEAN', 'BOOL'].includes(baseType)) {
        type = 'BOOLEAN';
      } else if (['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'].includes(baseType)) {
        type = 'DATETIME';
      } else if (['TEXT', 'LONGTEXT', 'MEDIUMTEXT', 'TINYTEXT', 'JSON', 'BLOB', 'CLOB'].includes(baseType)) {
        type = 'TEXT';
      } else {
        type = 'VARCHAR';
        if (typeParams) {
          length = parseInt(typeParams, 10) || 255;
        } else {
          length = 255;
        }
      }
      
      const remainderStr = colStr.substring(colStr.indexOf(parts[1]) + parts[1].length).toUpperCase();
      
      if (remainderStr.includes('NOT NULL')) {
        allowNull = false;
      }
      if (remainderStr.includes('PRIMARY KEY') || rawColName.toLowerCase() === 'id' || rawColName === primaryKeyColumn) {
        isPrimaryKey = true;
        allowNull = false;
      }
      if (remainderStr.includes('AUTO_INCREMENT') || remainderStr.includes('IDENTITY') || remainderStr.includes('GENERATED ALWAYS AS IDENTITY')) {
        isAutoIncrement = true;
      }
      
      // Extract DEFAULT value if present
      const defaultMatch = remainderStr.match(/DEFAULT\s+([^(\s]+|\('[^']+'\)|'[^']+')/i);
      if (defaultMatch) {
        defaultValue = defaultMatch[1].replace(/^'|'$/g, '').trim();
        if (defaultValue.toUpperCase() === 'NULL') {
          defaultValue = undefined;
        }
      }
      
      fields.push({
        id: crypto.randomUUID(),
        name: rawColName,
        type,
        isPrimaryKey,
        allowNull,
        isAutoIncrement,
        defaultValue,
        length
      });
    });
    
    // Ensure at least one primary key if there's an ID-like field, or auto-detect
    if (!fields.some(f => f.isPrimaryKey)) {
      const idField = fields.find(f => f.name.toLowerCase() === 'id');
      if (idField) {
        idField.isPrimaryKey = true;
        idField.allowNull = false;
        if (idField.type === 'INTEGER') {
          idField.isAutoIncrement = true;
        }
      } else {
        // Fallback: make first column PK or append ID
        fields.unshift({
          id: crypto.randomUUID(),
          name: 'Id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isAutoIncrement: true,
          allowNull: false
        });
      }
    }
    
    tables.push({
      id: 'table_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
      name: rawTableName,
      fields,
      data: []
    });
  }
  
  return tables;
};

// JSON Schema / Row Data Parser
export const parseJsonSchemaOrData = (jsonText: string): Table[] => {
  const parsed = JSON.parse(jsonText);
  const tables: Table[] = [];

  // Case 1: Standard DB Studio Pro Project structure containing .tables or just list of tables
  if (parsed.tables && Array.isArray(parsed.tables)) {
    return parsed.tables.map((t: any) => ({
      id: t.id || 'table_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: t.name || 'ImportedTable',
      fields: Array.isArray(t.fields) ? t.fields.map((f: any) => ({
        id: f.id || crypto.randomUUID(),
        name: f.name || 'Feld',
        type: f.type || 'VARCHAR',
        isPrimaryKey: !!f.isPrimaryKey,
        allowNull: f.allowNull !== false,
        isAutoIncrement: !!f.isAutoIncrement,
        length: f.length,
        defaultValue: f.defaultValue
      })) : [{ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }],
      data: Array.isArray(t.data) ? t.data : []
    }));
  }

  // Case 2: Array of table definitions
  if (Array.isArray(parsed) && parsed.length > 0 && 'fields' in parsed[0]) {
    return parsed.map((t: any) => ({
      id: t.id || 'table_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: t.name || 'ImportedTable',
      fields: Array.isArray(t.fields) ? t.fields.map((f: any) => ({
        id: f.id || crypto.randomUUID(),
        name: f.name || 'Feld',
        type: f.type || 'VARCHAR',
        isPrimaryKey: !!f.isPrimaryKey,
        allowNull: f.allowNull !== false,
        isAutoIncrement: !!f.isAutoIncrement,
        length: f.length,
        defaultValue: f.defaultValue
      })) : [],
      data: Array.isArray(t.data) ? t.data : []
    }));
  }

  // Case 3: Raw JSON row objects (e.g. [ { "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" } ])
  if (Array.isArray(parsed) && parsed.length > 0) {
    const sample = parsed[0];
    const fields: Field[] = Object.keys(sample).map(key => {
      const val = sample[key];
      let type: FieldType = 'VARCHAR';
      if (typeof val === 'number') {
        type = Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
      } else if (typeof val === 'boolean') {
        type = 'BOOLEAN';
      } else if (typeof val === 'string' && val.length > 500) {
        type = 'TEXT';
      } else if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.includes('-')) {
        type = 'DATETIME';
      }
      
      return {
        id: crypto.randomUUID(),
        name: key,
        type,
        isPrimaryKey: key.toLowerCase() === 'id',
        allowNull: true
      };
    });

    if (!fields.some(f => f.isPrimaryKey)) {
      fields.unshift({
        id: crypto.randomUUID(),
        name: 'Id',
        type: 'INTEGER',
        isPrimaryKey: true,
        isAutoIncrement: true,
        allowNull: false
      });
      parsed.forEach((row: any, idx: number) => {
        row['Id'] = idx + 1;
      });
    }

    tables.push({
      id: 'table_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: 'ImportierteTabelle',
      fields,
      data: parsed
    });
    return tables;
  }

  // Case 4: Single object (as a single table definition)
  if (typeof parsed === 'object' && parsed !== null) {
    if (parsed.name && Array.isArray(parsed.fields)) {
      return [{
        id: parsed.id || 'table_' + Date.now(),
        name: parsed.name,
        fields: parsed.fields.map((f: any) => ({
          id: f.id || crypto.randomUUID(),
          name: f.name || 'Feld',
          type: f.type || 'VARCHAR',
          isPrimaryKey: !!f.isPrimaryKey,
          allowNull: f.allowNull !== false,
          isAutoIncrement: !!f.isAutoIncrement,
          length: f.length,
          defaultValue: f.defaultValue
        })),
        data: Array.isArray(parsed.data) ? parsed.data : []
      }];
    } else {
      // Just key-value pairs representing a record
      const fields: Field[] = Object.keys(parsed).map(key => {
        const val = parsed[key];
        let type: FieldType = 'VARCHAR';
        if (typeof val === 'number') {
          type = Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
        } else if (typeof val === 'boolean') {
          type = 'BOOLEAN';
        }
        return {
          id: crypto.randomUUID(),
          name: key,
          type,
          isPrimaryKey: key.toLowerCase() === 'id',
          allowNull: true
        };
      });
      if (!fields.some(f => f.isPrimaryKey)) {
        fields.unshift({ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true, allowNull: false });
        parsed['Id'] = 1;
      }
      tables.push({
        id: 'table_' + Date.now(),
        name: 'ImportierteTabelle',
        fields,
        data: [parsed]
      });
      return tables;
    }
  }

  throw new Error("Konnte kein bekanntes JSON-Muster erkennen.");
};

// CSV Parser
export const parseCsvText = (csvText: string, delimiter?: string): Table[] => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) throw new Error("Leerer Text.");

  // Auto-detect delimiter if not specified
  if (!delimiter) {
    const firstLine = lines[0];
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    if (semicolons > commas && semicolons > tabs) delimiter = ';';
    else if (tabs > commas && tabs > semicolons) delimiter = '\t';
    else delimiter = ',';
  }

  const parseRow = (line: string, delim: string) => {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delim && !inQuotes) {
        parts.push(current.trim().replace(/^['"]|['"]$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim().replace(/^['"]|['"]$/g, ''));
    return parts;
  };

  const headers = parseRow(lines[0], delimiter);
  if (headers.length === 0 || !headers[0]) throw new Error("Keine Header in der ersten Zeile gefunden.");

  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i], delimiter);
    const row: any = {};
    headers.forEach((header, idx) => {
      const val = values[idx] !== undefined ? values[idx] : '';
      const key = header.toLowerCase();
      // Try to parse number/boolean
      if (val.toLowerCase() === 'true') row[key] = true;
      else if (val.toLowerCase() === 'false') row[key] = false;
      else if (val && !isNaN(Number(val))) row[key] = Number(val);
      else row[key] = val;
    });
    rows.push(row);
  }

  const fields: Field[] = headers.map(header => {
    const key = header.toLowerCase();
    // Infer type from first data row
    const sampleVal = rows.length > 0 ? rows[0][key] : undefined;
    let type: FieldType = 'VARCHAR';
    if (typeof sampleVal === 'number') {
      type = Number.isInteger(sampleVal) ? 'INTEGER' : 'DECIMAL';
    } else if (typeof sampleVal === 'boolean') {
      type = 'BOOLEAN';
    }
    return {
      id: crypto.randomUUID(),
      name: key,
      type,
      isPrimaryKey: key === 'id',
      allowNull: true
    };
  });

  if (!fields.some(f => f.isPrimaryKey)) {
    fields.unshift({
      id: crypto.randomUUID(),
      name: 'id',
      type: 'INTEGER',
      isPrimaryKey: true,
      isAutoIncrement: true,
      allowNull: false
    });
    rows.forEach((row, idx) => {
      row['id'] = idx + 1;
    });
  }

  return [{
    id: 'table_' + Date.now(),
    name: 'ImportierteTabelle',
    fields,
    data: rows
  }];
};
