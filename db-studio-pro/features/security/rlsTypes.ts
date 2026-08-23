export type DefaultRole = 'Admin' | 'Manager' | 'Sachbearbeiter' | 'Gast';

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
}

export interface TablePermission {
  tableId: string;
  tableName: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  columnPermissions?: Record<string, 'readwrite' | 'readonly' | 'hidden'>;
}

export interface RlsRule {
  id: string;
  tableId: string;
  tableName: string;
  roleId: string;
  action: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  name: string;
  expression: string; // e.g. "owner_id = auth.uid"
  description?: string;
  enabled: boolean;
}

export interface SecurityRlsConfig {
  roles: RoleDefinition[];
  permissions: Record<string, Record<string, TablePermission>>; // roleId -> tableId -> TablePermission
  rules: RlsRule[];
  enablePostgresRls: boolean;
}
