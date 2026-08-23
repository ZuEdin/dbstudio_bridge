import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateElectronFrontend } from './frontend';
import { generateElectronBackend } from './backend';
import { generateElectronConfigs } from './config';
import { generateElectronScripts } from './scripts';

export const generateElectron = (
  tables: Table[], 
  relationships: Relationship[], 
  queries: Query[], 
  config: BackendConfig, 
  forms: Form[], 
  reports: Report[]
): VirtualFile[] => {
  const root = `ElectronApp`;
  
  const safeTables = tables || [];
  const safeRelationships = relationships || [];
  const safeQueries = queries || [];
  const safeForms = forms || [];
  const safeReports = reports || [];

  const dbTypeStr = String(config.dbType || 'sqlite').toLowerCase();
  const bePort = config.port && config.port !== 3000 ? config.port : 3001;
  const fePort = config.frontendPort || 3002;

  let defaultDbPort = 3306;
  if (dbTypeStr === 'postgres' || dbTypeStr === 'postgresql') defaultDbPort = 5432;
  if (dbTypeStr === 'mssql' || dbTypeStr === 'sqlserver') defaultDbPort = 1433;

  const frontendFiles = generateElectronFrontend(
    safeTables, safeRelationships, safeQueries, config, safeForms, safeReports, root, fePort, bePort
  );

  const backendFiles = generateElectronBackend(
    safeTables, safeRelationships, safeQueries, config, root, bePort, dbTypeStr, defaultDbPort
  );

  const configFiles = generateElectronConfigs(config, root, bePort, fePort, dbTypeStr);

  const scriptFiles = generateElectronScripts(config, root, bePort, dbTypeStr);

  return [
    ...frontendFiles,
    ...backendFiles,
    ...configFiles,
    ...scriptFiles
  ];
};
