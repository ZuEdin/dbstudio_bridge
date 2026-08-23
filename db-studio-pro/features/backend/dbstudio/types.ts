import { Table, Query, Relationship } from '../../../types/index';

export interface SystemTable {
  name: string;
  description: string;
  fields: { name: string; type: string; isKey?: boolean; comment: string }[];
}

export interface FkError {
  id: string;
  type: 'missing_table' | 'missing_field' | 'type_mismatch';
  message: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  fixable: boolean;
  toTableId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  role: string;
  details: string;
  latencyMs: number;
  status: 'SUCCESS' | 'WARN' | 'ERROR';
}

export interface TeamProject {
  id: string;
  name: string;
  description: string;
  status: string;
  memberCount: number;
}

export interface TeamMember {
  email: string;
  role: string;
  name: string;
  source: string;
}

export interface RbacRole {
  name: string;
  description: string;
  permissions: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }>;
}
