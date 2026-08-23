import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateMauiModels } from './models';
import { generateIndexedDbJs } from './indexedDbGenerator';
import { generateMauiServices } from './services';
import { generateMauiLayouts } from './layouts';
import { generateMauiPages } from './pages';
import { generateMauiProjectFiles } from './projectFiles';

export const generateMaui = (
    tables: Table[], 
    relationships: Relationship[], 
    queries: Query[], 
    config: BackendConfig, 
    forms: Form[], 
    reports: Report[]
): VirtualFile[] => {
  const root = `Frontend/${config.projectName}.Maui`;
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');
  const namespace = `${safeNamespace}.Maui`;
  
  let version = config.backendVersion || '9.0';
  if (parseFloat(version) > 9.0) {
    version = '9.0';
  }
  const targetFramework = `net${version}`;

  const files: VirtualFile[] = [
    // Project files (csproj, Program.cs, App, MainPage, etc.)
    ...generateMauiProjectFiles(tables, config, namespace, root, targetFramework, version),
    
    // IndexedDB implementation
    generateIndexedDbJs(tables, root),
    
    // Core Services
    ...generateMauiServices(config, namespace, root),
    
    // Models
    ...generateMauiModels(tables, namespace, root),
    
    // Layouts
    ...generateMauiLayouts(tables, config, namespace, root),
    
    // Pages
    ...generateMauiPages(tables, config, namespace, root)
  ];

  return files;
};
