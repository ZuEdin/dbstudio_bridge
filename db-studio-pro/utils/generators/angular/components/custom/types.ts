import { Table, Form, Query } from '../../../../../types/index';

export interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export interface NodeGeneratorContext {
  isBootstrap: boolean;
  tables: Table[];
  queries: Query[];
  forms: Form[];
  customComponents: any[];
  states: string[];
  initCalls: string[];
  methods: string[];
  pages?: any[];
  currentContextVar?: string;
  nodeNameCache?: Map<string, string>;
  usedSuffixes?: Set<string>;
}
