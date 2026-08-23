import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateTauriFrontend } from './frontend';
import { generateTauriConfigs } from './config';
import { generateTauriRustFiles } from './rust';
import { generateTauriScripts } from './scripts';

export const generateTauri = (
  tables: Table[], 
  relationships: Relationship[], 
  queries: Query[], 
  config: BackendConfig, 
  forms: Form[], 
  reports: Report[]
): VirtualFile[] => {
  const root = `TauriApp`;
  
  const safeTables = tables || [];
  const safeRelationships = relationships || [];
  const safeQueries = queries || [];
  const safeForms = forms || [];
  const safeReports = reports || [];

  const dbTypeStr = String(config.dbType || 'sqlite').toLowerCase();
  const fePort = config.frontendPort || 3002;

  let defaultDbPort = 3306;
  if (dbTypeStr === 'postgres' || dbTypeStr === 'postgresql') defaultDbPort = 5432;
  if (dbTypeStr === 'mssql' || dbTypeStr === 'sqlserver') defaultDbPort = 1433;

  const frontendFiles = generateTauriFrontend(
    safeTables, safeRelationships, safeQueries, config, safeForms, safeReports, root, fePort
  );

  const configFiles = generateTauriConfigs(config, root);

  const rustFiles = generateTauriRustFiles(config, root, dbTypeStr, defaultDbPort);

  const scriptFiles = generateTauriScripts(config, root, dbTypeStr, defaultDbPort);

  return [
    ...frontendFiles,
    ...configFiles,
    ...rustFiles,
    ...scriptFiles
  ];
};
