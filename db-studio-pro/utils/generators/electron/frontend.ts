import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateElectronReactFrontend } from './frontendReact';
import { generateElectronAngularFrontend } from './frontendAngular';

export const generateElectronFrontend = (
  safeTables: Table[],
  safeRelationships: Relationship[],
  safeQueries: Query[],
  config: BackendConfig,
  safeForms: Form[],
  safeReports: Report[],
  root: string,
  fePort: number,
  bePort: number
): VirtualFile[] => {
  const reactFiles = generateElectronReactFrontend(
    safeTables, safeRelationships, safeQueries, config, safeForms, safeReports, root, fePort, bePort
  );

  const angularFiles = generateElectronAngularFrontend(
    safeTables, safeRelationships, safeQueries, config, safeForms, safeReports, root, fePort, bePort
  );

  return [...reactFiles, ...angularFiles];
};
