export enum DbType {
  SQLite = 'SQLite',
  SQL = 'SQL',
  MySQL = 'MySQL',
  PostgreSQL = 'PostgreSQL',
  NoSQL = 'NoSQL'
}

export type FieldType = 'INTEGER' | 'INT' | 'ID' | 'BIGINT' | 'VARCHAR' | 'CHAR' | 'TEXT' | 'DATE' | 'TIME' | 'DATETIME' | 'BOOLEAN' | 'DECIMAL' | 'DOUBLE' | 'FLOAT' | 'REAL' | 'TINYINT' | 'TIMESTAMP' | 'ENUM' | 'UUID' | 'EMAIL' | 'PHONE' | 'URL';

export interface SequenceConfig {
  enabled: boolean;
  prefix?: string;
  suffix?: string;
  padding: number;
  startValue?: number;
  step?: number;
  includeYear?: boolean;
  yearFormat?: 'YYYY' | 'YY';
  pattern?: string;
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  comment?: string;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  isUnique?: boolean;
  isIndexed?: boolean;
  allowNull?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
  length?: number;
  precision?: number;
  scale?: number;
  displayFormat?: string;
  enumValues?: string[];
  rendererType?: 'text' | 'markdown' | 'progress' | 'status_pill' | 'avatar' | 'currency' | 'date';
  inlineEditable?: boolean;
  isCalculated?: boolean;
  calculationFormula?: string;
  sequenceConfig?: SequenceConfig;
}

export interface ValidationRule {
  id: string;
  fieldId: string;
  operator: ValidationOperator;
  compareType: 'value' | 'field';
  compareValue: string;
  errorMessage?: string;
}

export type ValidationOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'regex';

export interface ApiQueryParam {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'select';
  options?: string[];
  isActive: boolean;
}

export interface ApiConfig {
  url: string;
  method: string;
  headers?: string;
  queryParams?: ApiQueryParam[];
  refreshOnLoad?: boolean;
  authType?: 'none' | 'apiKey' | 'bearer' | 'basic';
  authApiKeyName?: string;
  authApiKeyValue?: string;
  authApiKeyPrefix?: string;
  authApiKeyLocation?: 'header' | 'query';
  authBearerToken?: string;
  authUsername?: string;
  authPassword?: string;
}

export interface Table {
  id: string;
  name: string;
  description?: string;
  fields: Field[];
  data?: any[];
  isApiImport?: boolean;
  apiConfig?: ApiConfig;
  validationRules?: ValidationRule[];
  enableInlineEditing?: boolean;
  enableMassUpdates?: boolean;
  conditionalFormatting?: {
    id: string;
    fieldId: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
    value: string;
    style: {
      backgroundColor?: string;
      color?: string;
      fontWeight?: string;
    };
  }[];
}

export interface TableNode {
  id: string;
  tableId: string;
  x: number;
  y: number;
  groupId?: string;
}

export interface TableGroup {
  id: string;
  name: string;
  color?: string;
  comment?: string;
  isCollapsed?: boolean;
}

export const FIELD_HEIGHT = 28;
export const HEADER_HEIGHT = 40;
export const NODE_WIDTH = 192;
