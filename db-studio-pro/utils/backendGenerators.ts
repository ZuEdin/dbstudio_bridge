
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form, Report, CustomPage } from '../types/index';
import { sanitizeProjectName } from './nameUtils';
import { generateDotNet } from './generators/dotnetGenerator';
import { generateNodeJs } from './generators/nodeGenerator';
import { generateAngular } from './generators/angularGenerator';
import { generateAngularModern } from './generators/angularModernGenerator';
import { generateReact } from './generators/reactGenerator';
import { generatePhp } from './generators/phpGenerator';
import { generateLaravel } from './generators/laravelGenerator';
import { generateBlazor } from './generators/blazorGenerator';
import { generateMaui } from './generators/maui/index';
import { generateMauiNative } from './generators/mauiNative/index';
import { generateElectron } from './generators/electronGenerator';
import { generateTauri } from './generators/tauriGenerator';
import { generateVue } from './generators/vueGenerator';
import { generatePython } from './generators/pythonGenerator';
import { generateMarkdownApiDocs } from "./generators/markdownApiGenerator";
import { generateDatabaseScripts } from './generators/databaseGenerator';
import { generateSolution } from './generators/dotnet/solution';
import { generateOfflineSyncFiles } from './generators/offlineSyncGenerator';

// Main Generator Function
export const generateBackendCode = (
    tables: Table[], 
    relationships: Relationship[], 
    queries: Query[], 
    config: BackendConfig, 
    forms: Form[] = [], 
    reports: Report[] = [],
    pages: CustomPage[] = [],
    customComponents: any[] = [],
    macros: any[] = []
): VirtualFile[] => {
  let files: VirtualFile[] = [];

    const toPascalCase = (str) => {
        if (!str) return '';
        const words = str.match(/[a-z]+/gi) || [];
        return words.map(w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()).join('');
    };
    



  // Normalize Auth Config (Legacy String -> Mapping)
  // Ensures that simple comma-separated lists from the wizard are converted to proper Role Mappings for the backend
  const activeConfig = { 
    ...config,
    projectName: sanitizeProjectName(config?.projectName || 'MyProject')
  }; 
  if (activeConfig.authConfig) {
      activeConfig.authConfig = { ...activeConfig.authConfig }; // Shallow copy auth level
      if (activeConfig.authConfig.useWindowsAuth && 
          activeConfig.authConfig.useAdGroups && 
          activeConfig.authConfig.adGroups && 
          (!activeConfig.authConfig.adMapping || activeConfig.authConfig.adMapping.length === 0)) {
          
          const groups = activeConfig.authConfig.adGroups.split(',').map(g => g.trim()).filter(g => g);
          // Default mapping to 'User' role if not specified otherwise
          activeConfig.authConfig.adMapping = groups.map(g => ({ groupName: g, roleName: 'User' }));
      }
  }

  // 1. Generate Backend Language Code
  if (activeConfig.language === 'dotnet') {
    files = generateDotNet(tables, relationships, queries, activeConfig);
  } else if (activeConfig.language === 'nodejs' || activeConfig.language === 'electron') {
    // Treat 'electron' as 'nodejs' for the backend API structure
    files = generateNodeJs(tables, relationships, queries, activeConfig);
  } else if (activeConfig.language === 'php') {
    files = generatePhp(tables, relationships, queries, activeConfig);
  } else if (activeConfig.language === 'laravel' || activeConfig.language === 'php-laravel' as any) {
    files = generateLaravel(tables, relationships, queries, activeConfig);
  } else if (activeConfig.language === 'python') {
    files = generatePython(tables, relationships, queries, activeConfig);
  }

  // 2. Generate Database Schema/Scripts (Common for all backends)
  const dbFiles = generateDatabaseScripts(tables, relationships, activeConfig, queries);
  files = [...files, ...dbFiles];

  // 3. Generate Frontend Code
  if (activeConfig.frontendFramework === 'angular') {
    const angularFiles = generateAngular(tables, relationships, queries, forms, activeConfig, reports, pages, customComponents, macros);
    files = [...files, ...angularFiles];
  } else if (activeConfig.frontendFramework === 'angular-modern') {
    const angularModernFiles = generateAngularModern(tables, relationships, queries, forms, activeConfig, reports, pages, customComponents, macros);
    files = [...files, ...angularModernFiles];
  } else if (activeConfig.frontendFramework === 'react') {
    const reactFiles = generateReact(tables, relationships, queries, activeConfig, forms, reports, pages, customComponents, macros);
    files = [...files, ...reactFiles];
  } else if (activeConfig.frontendFramework === 'blazor') {
    const blazorFiles = generateBlazor(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...blazorFiles];
  } else if (activeConfig.frontendFramework === 'maui') {
    const mauiFiles = generateMaui(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...mauiFiles];
  } else if (activeConfig.frontendFramework === 'maui-native') {
    const mauiNativeFiles = generateMauiNative(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...mauiNativeFiles];
  } else if (activeConfig.frontendFramework === 'vue') {
    const vueFiles = generateVue(tables, relationships, queries, activeConfig, forms, reports, pages, customComponents);
    files = [...files, ...vueFiles];
  } else if (activeConfig.frontendFramework === 'electron' || activeConfig.language === 'electron') {
    const electronFiles = generateElectron(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...electronFiles];
  } else if (activeConfig.frontendFramework === 'tauri' || activeConfig.language === 'tauri') {
    const tauriFiles = generateTauri(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...tauriFiles];
  }

  // --- SPECIAL POST-PROCESSING FOR BLAZOR & MAUI + .NET ---
  // Transforms the structure from "Backend/Project" & "Frontend/Project.Client" (or Project.Maui)
  // to "Project" & "Project.Client" (or Project.Maui) at root level + Solution File
  if (activeConfig.language === 'dotnet' && (
      activeConfig.frontendFramework === 'blazor' || 
      activeConfig.frontendFramework === 'maui' || 
      activeConfig.frontendFramework === 'maui-native'
  )) {
      const isMaui = activeConfig.frontendFramework === 'maui';
      const isMauiNative = activeConfig.frontendFramework === 'maui-native';
      const backendPrefix = `Backend/${activeConfig.projectName}.Server`;
      
      let frontendPrefix = `Frontend/${activeConfig.projectName}.Client`;
      let targetFrontendName = `${activeConfig.projectName}.Client`;
      
      if (isMaui) {
          frontendPrefix = `Frontend/${activeConfig.projectName}.Maui`;
          targetFrontendName = `${activeConfig.projectName}.Maui`;
      } else if (isMauiNative) {
          frontendPrefix = `Frontend/${activeConfig.projectName}.MauiNative`;
          targetFrontendName = `${activeConfig.projectName}.MauiNative`;
      }
      
      files.forEach(f => {
          // Move Backend up to Root
          if (f.path.startsWith(backendPrefix)) {
              f.path = f.path.replace(backendPrefix, `${activeConfig.projectName}.Server`);
          }
          // Move Frontend up to Root
          if (f.path.startsWith(frontendPrefix)) {
              f.path = f.path.replace(frontendPrefix, targetFrontendName);
          }
      });

      // Add Visual Studio Solution File
      files.push(generateSolution(activeConfig));
  }

  // 4. Generate Offline-First & Sync Infrastructure if enabled or selected
  if (activeConfig.offlineSync?.enabled || activeConfig.deploymentConfig?.target === 'offline_sync' || activeConfig.deploymentConfig?.offlineSync?.enabled) {
    const syncFiles = generateOfflineSyncFiles(tables, activeConfig, activeConfig.offlineSync || activeConfig.deploymentConfig?.offlineSync);
    files = [...files, ...syncFiles];
  }

  const apiDocsMd = generateMarkdownApiDocs(tables, activeConfig, queries, relationships);
  files.push({ name: "API_DOCUMENTATION.md", path: "API_DOCUMENTATION.md", content: apiDocsMd, language: "markdown" });
  return files;
};
