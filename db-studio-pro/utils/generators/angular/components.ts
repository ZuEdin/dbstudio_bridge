import { Table, Form, Report, VirtualFile, BackendConfig, Query, Relationship } from '../../../types/index';
import { generateTableComponents } from './components/tableComponentGenerator';
import { generateReportComponents } from './components/reportComponentGenerator';
import { generateCustomPageComponents } from './components/customComponentGenerator';
import { generateQueryComponents } from './components/queryComponentGenerator';

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export const generateAngularComponents = (
  tables: Table[],
  relationships: Relationship[],
  forms: Form[],
  reports: Report[],
  config: BackendConfig,
  appRoot: string,
  queries: Query[],
  pages: any[] = [],
  customComponents: any[] = []
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];
  const useAuth = config.authConfig?.useUserLogin;
  const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                      (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                      (config as any).styling?.toLowerCase() === 'bootstrap';

  // 1. Table Lists and Forms
  const tablesRes = generateTableComponents(tables, relationships, forms, appRoot, queries, !!useAuth, isBootstrap);
  files.push(...tablesRes.files);
  routes.push(...tablesRes.routes);

  // 2. Report Pages
  const reportsRes = generateReportComponents(reports, tables, queries, appRoot);
  files.push(...reportsRes.files);
  routes.push(...reportsRes.routes);

  // 3. Custom Pages
  const pagesRes = generateCustomPageComponents(pages, tables, queries, forms, appRoot, isBootstrap, customComponents);
  files.push(...pagesRes.files);
  routes.push(...pagesRes.routes);

  // 4. Query Pages
  const queriesRes = generateQueryComponents(queries, tables, appRoot);
  files.push(...queriesRes.files);
  routes.push(...queriesRes.routes);

  return { files, routes };
};
