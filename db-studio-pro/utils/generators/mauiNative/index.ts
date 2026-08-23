import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateMauiNativeModels } from './models';
import { generateMauiNativeServices } from './services';
import { generateMauiNativeViews } from './views';
import { generateMauiNativeProjectFiles } from './projectFiles';

export const generateMauiNative = (
    tables: Table[], 
    relationships: Relationship[], 
    queries: Query[], 
    config: BackendConfig, 
    forms: Form[], 
    reports: Report[]
): VirtualFile[] => {
  const root = `Frontend/${config.projectName}.MauiNative`;
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');
  const namespace = `${safeNamespace}.MauiNative`;
  
  let version = config.backendVersion || '9.0';
  if (parseFloat(version) > 9.0) {
    version = '9.0';
  }
  const targetFramework = `net${version}`;

  const files: VirtualFile[] = [
    // Project files (csproj, Program.cs, App, MainPage, etc.)
    ...generateMauiNativeProjectFiles(tables, config, namespace, root, targetFramework, version),
    
    // Core Services
    ...generateMauiNativeServices(config, namespace, root),
    
    // Models
    ...generateMauiNativeModels(tables, namespace, root),
    
    // Views
    ...generateMauiNativeViews(tables, config, namespace, root)
  ];

  return files;
};
