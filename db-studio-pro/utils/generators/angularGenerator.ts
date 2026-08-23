import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report, CustomPage } from '../../types/index';
import { generateAngularConfigs } from './angular/configs';
import { generateAngularServices } from './angular/services';
import { generateAngularComponents } from './angular/components';
import { generateAngularStructure } from './angular/structure';
import { toPascalCase, toKebabCase, toCamelCase } from './common';

export const generateAngular = (
  tables: Table[], 
  relationships: Relationship[], 
  queries: Query[], 
  forms: Form[], 
  config: BackendConfig, 
  reports: Report[] = [], 
  pages: CustomPage[] = [],
  customComponents: any[] = [],
  macros: any[] = []
): VirtualFile[] => {

  const root = `Frontend`;
  const appRoot = `${root}/src/app`;
  const useAuth = config.authConfig?.useUserLogin;
  
  // Generate component files and get route definitions
  // Refactored to unified generation logic in components.ts
  const { files: componentFiles, routes: routeObjects } = generateAngularComponents(tables, relationships, forms, reports, config, appRoot, queries, pages, customComponents);

  // Generate app.routes.ts
  let routeImports = [...new Set(routeObjects.map(r => `import { ${r.component} } from './pages/${r.folder}/${r.file}';`))].join('\n');
  routeImports += `\nimport { LayoutComponent } from './components/layout/layout.component';`;
  
  if (useAuth) {
      routeImports += `\nimport { LoginComponent } from './pages/auth/login.component';\nimport { RegisterComponent } from './pages/auth/register.component';\nimport { ForgotPasswordComponent } from './pages/auth/forgot-password.component';\nimport { ProfileComponent } from './pages/auth/profile.component';\nimport { ForbiddenComponent } from './pages/auth/forbidden.component';\nimport { authGuard } from './guards/auth.guard';`;
  }

  // Deduplicate Routes if multiple tables map to same path (should not happen with new logic, but safe guard)
  const uniqueRoutes = new Map();
  routeObjects.forEach(r => {
      if (!uniqueRoutes.has(r.path)) {
          uniqueRoutes.set(r.path, r);
      }
  });

  let routeDefs = Array.from(uniqueRoutes.values()).map(r => {
      let guard = '';
      if (useAuth) {
          const isAdminRoute = r.path.includes('sysUsers') || r.path.includes('sysRoles');
          const rolesData = isAdminRoute ? `, data: { roles: ['Admin'] }` : '';
          guard = `, canActivate: [authGuard]${rolesData}`;
      }
      return `      { path: '${r.path}', component: ${r.component}${guard} }`;
  }).join(',\n');

  let routesContent = '';
  if (useAuth) {
      routesContent = `  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { 
    path: '', 
    component: LayoutComponent,
    children: [
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  } else {
      routesContent = `  { 
    path: '', 
    component: LayoutComponent,
    children: [
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  }
  
  const routesFile: VirtualFile = {
    name: 'app.routes.ts',
    path: `${appRoot}/app.routes.ts`,
    content: `import { Routes } from '@angular/router';\n${routeImports}\n\nexport const appRoutes: Routes = [\n${routesContent}\n];`,
    language: 'typescript'
  };
  
  const configFiles = generateAngularConfigs(config, root);
  const serviceFiles = generateAngularServices(tables, queries, config, appRoot, macros);
  const structureFiles = generateAngularStructure(config, tables, root, pages, reports, queries);

  const readmeContent = `# ${config.projectName} (Angular Client)

Dieses Frontend wurde mit **Angular** (CLI) generiert.

## 🚀 Schnellstart

### 1. Voraussetzungen
* **Node.js** (LTS).
* **Angular CLI**: Installieren Sie es global via \`npm install -g @angular/cli\`.

### 2. Installation
Wechseln Sie in das Verzeichnis \`Frontend\`:
\`\`\`bash
npm install
\`\`\`

### 3. Starten (Development)
\`\`\`bash
ng serve
\`\`\`
Oder alternativ via npm:
\`\`\`bash
npm start
\`\`\`
Die Anwendung läuft unter **http://localhost:4200**.

⚠️ Stellen Sie sicher, dass das Backend läuft (Port ${config.port}).

### 4. Build (Production)
\`\`\`bash
ng build
\`\`\`
Die kompilierten Dateien liegen im Ordner \`dist/angular-client\`.

## 🛠 Konfiguration

Die API-URL ist im Service \`src/app/services/api.service.ts\` hinterlegt:
\`http://localhost:${config.port}/api\`
`;
  const readme: VirtualFile = { name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' };

  return [
      ...configFiles,
      ...serviceFiles,
      ...componentFiles,
      ...structureFiles,
      routesFile,
      readme
  ];
};
