import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report, CustomPage } from '../../types/index';
import { generateAngularModernConfigs } from './angularModern/configs';
import { generateAngularModernCore } from './angularModern/core';
import { generateAngularModernServices } from './angularModern/services';
import { generateAngularModernComponents } from './angularModern/components';
import { generateAngularModernLayout } from './angularModern/layout';

export const generateAngularModern = (
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

  const files: VirtualFile[] = [];

  // 1. Configs (package.json, angular.json, tsconfig, tailwind, etc.)
  const configFiles = generateAngularModernConfigs(config, root);
  files.push(...configFiles);

  // 2. Core Architecture (main.ts, app.config.ts, app.component.ts, interceptors, signals auth/toast)
  const coreFiles = generateAngularModernCore(config, appRoot);
  files.push(...coreFiles);

  // 3. Models & Reactive Services with Angular Signals
  const serviceFiles = generateAngularModernServices(tables, queries, config, appRoot);
  files.push(...serviceFiles);

  // 4. Standalone Table, Form & Report Components with Modern Control Flow (@if / @for)
  const { files: componentFiles, routes: routeObjects } = generateAngularModernComponents(
    tables,
    forms,
    reports,
    queries,
    config,
    appRoot
  );
  files.push(...componentFiles);

  // 5. Layout & Dashboard Components
  const layoutFiles = generateAngularModernLayout(config, tables, reports, queries, appRoot);
  files.push(...layoutFiles);

  // 6. Generate app.routes.ts
  let routeImports = [...new Set(routeObjects.map(r => `import { ${r.component} } from './pages/${r.folder}/${r.file}';`))].join('\n');
  routeImports += `\nimport { LayoutComponent } from './components/layout/layout.component';`;
  routeImports += `\nimport { DashboardComponent } from './pages/dashboard/dashboard.component';`;

  if (useAuth) {
    routeImports += `\nimport { LoginComponent } from './pages/auth/login.component';`;
    routeImports += `\nimport { ForbiddenComponent } from './pages/auth/forbidden.component';`;
    routeImports += `\nimport { authGuard } from './core/guards/auth.guard';`;
  }

  const routeDefs = routeObjects.map(r => {
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
  { path: 'forbidden', component: ForbiddenComponent },
  { 
    path: '', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  } else {
    routesContent = `  { 
    path: '', 
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  }

  const routesFile: VirtualFile = {
    name: 'app.routes.ts',
    path: `${appRoot}/app.routes.ts`,
    content: `import { Routes } from '@angular/router';\n${routeImports}\n\nexport const appRoutes: Routes = [\n${routesContent}\n];\n`,
    language: 'typescript'
  };
  files.push(routesFile);

  // 7. README.md
  const readmeContent = `# ${config.projectName || 'Enterprise App'} - Angular Modern (v19 Signals & Standalone)

Dieses moderne Frontend wurde mit dem **DB Studio Pro Modern Angular Generator** erstellt.

## 🌟 Architektur-Highlights

1. **Angular 19 Standalone Architecture**:
   - Keine \`NgModule\` mehr – schlankes, modulares Bootstrapping mit \`bootstrapApplication()\`.
2. **Reaktive Angular Signals (\`signal()\`, \`computed()\` & \`asReadonly()\`):**
   - Höchste Performance durch zoneless-ready, feingranulare State-Aktualisierungen.
3. **Neuer Built-in Control Flow:**
   - Verwendung der modernen \`@if\`, \`@for ... track item.id\` und \`@empty\` Template-Syntax statt veraltetem \`*ngIf\` / \`*ngFor\`.
4. **Moderne Dependency Injection:**
   - \`inject(HttpClient)\`, \`inject(Router)\` und funktionale Router-Guards (\`CanActivateFn\`).
5. **Tailwind CSS & Utility First Design:**
   - Modernes, responsives Design mit Farbpaletten und schnellen Übergängen.

## 🚀 Schnellstart

\`\`\`bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten (Standard Port ${config.frontendPort || 4200})
npm start
\`\`\`

## 📡 API-Anbindung

Die API-URL ist konfiguriert in \`src/environments/environment.ts\` (Default: \`http://localhost:${config.port}/api/\`).
`;

  files.push({
    name: 'README_ANGULAR_MODERN.md',
    path: `${root}/README.md`,
    content: readmeContent,
    language: 'markdown'
  });

  return files;
};
