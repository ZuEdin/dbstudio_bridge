import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateAngular } from '../angularGenerator';

export const generateElectronAngularFrontend = (
  safeTables: Table[],
  safeRelationships: Relationship[],
  safeQueries: Query[],
  config: BackendConfig,
  safeForms: Form[],
  safeReports: Report[],
  root: string,
  fePort: number = 3002,
  bePort: number = 3001
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const targetBePort = bePort || config.port || 3001;
  const angularFiles = generateAngular(safeTables, safeRelationships, safeQueries, safeForms, config, safeReports);

  if (Array.isArray(angularFiles)) {
    angularFiles.forEach(f => {
      let relativePath = f.path.replace(/^Frontend\//, '');

      // Angular API Service: Uses localhost server in Electron or file:// protocol
      if (f.name === 'api.service.ts') {
        f.content = f.content.replace(
          /private baseUrl = .*/,
          `private baseUrl = (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) ? (window.location.origin.includes('localhost') ? 'http://localhost:${targetBePort}/api/' : window.location.origin + '/api/') : 'http://localhost:${targetBePort}/api/';`
        );
      }

      // Angular Main: Enable HashLocationStrategy for file:// compatibility
      if (f.name === 'main.ts') {
        f.content = f.content.replace(
          /import\s+\{\s*provideRouter\s*\}\s+from\s+'@angular\/router';/,
          "import { provideRouter, withHashLocation } from '@angular/router';"
        ).replace(
          /provideRouter\(appRoutes\)/,
          "provideRouter(appRoutes, withHashLocation())"
        );
      }

      // Angular Index HTML: Convert absolute base href to relative
      if (f.name === 'index.html') {
        f.content = f.content.replace(
          /<base href="\/">/,
          '<base href="./">'
        );
      }

      f.path = `${root}/AngularFrontend/${relativePath}`;
      files.push(f);
    });
  }

  return files;
};
