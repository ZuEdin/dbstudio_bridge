import { Table, Form, Report, VirtualFile, BackendConfig, Query, CustomPage } from '../../../types/index';
import { toPascalCase, toCamelCase } from '../common';
import {
  generateGlobalStateContext,
  generateThemeProvider,
  generateAuthContext
} from './structure/contextGenerator';
import {
  generateGenericModal,
  generateUserPickerModal,
  generateCommandPalette
} from './structure/modalGenerator';
import {
  generateMarkdownEditorComponent,
  generateMarkdownViewerComponent
} from './structure/markdownGenerator';
import {
  generateSidebar,
  generateTopNav,
  generateLayout,
  generateForbidden,
  generateProtectedRoute
} from './structure/navigationGenerator';
import {
  generateLogin,
  generateRegister,
  generateForgotPassword,
  generateProfile
} from './structure/authPageGenerator';
import {
  generateAppTsx,
  generateMainTsx,
  generateIndexHtml,
  generatePwaManifest
} from './structure/appGenerator';

export const generateReactStructure = (
  tables: Table[],
  forms: Form[],
  reports: Report[],
  config: BackendConfig,
  root: string,
  queries: Query[] = [],
  pages: CustomPage[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const routes: string[] = [];
  const imports: string[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // Whitelabel Defaults
  const wl = config.whitelabel || {
    appName: config.projectName,
    companyName: 'My Company',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e293b',
    removeBranding: false
  };

  // --- Global State Context ---
  const globalStates = config.globalStates || [];
  const stateDefaults = globalStates.reduce((acc: any, s) => {
    acc[s.name] = s.defaultValue;
    return acc;
  }, {});

  files.push(generateGlobalStateContext(config, root, stateDefaults));
  imports.push(`import { GlobalStateProvider } from './context/GlobalStateContext';`);

  // Theme Context
  files.push(generateThemeProvider(root));

  // Generic Modal Component
  files.push(generateGenericModal(root));

  // User Picker Modal Component
  files.push(generateUserPickerModal(root));

  // Markdown Editor and Viewer Components
  files.push(generateMarkdownEditorComponent(root));
  files.push(generateMarkdownViewerComponent(root));

  // CommandPalette Component
  files.push(generateCommandPalette(config, root));

  // Sidebar Component
  files.push(generateSidebar(tables, forms, reports, config, root, queries, pages, !!useAuth, wl));

  // Top Nav Component
  files.push(generateTopNav(root, !!useAuth));

  // Layout Component
  files.push(generateLayout(config, root, wl));

  // --- Register Routes ---
  
  // Table Routes
  tables.forEach(table => {
    const pascalName = toPascalCase(table.name);
    const camelName = toCamelCase(table.name);
    const listName = `${pascalName}List`;
    imports.push(`import { ${listName} } from './pages/${pascalName}/${listName}';`);
    
    const isSystem = table.name.startsWith('sys_');
    const rolesProp = isSystem ? ` allowedRoles={['Admin']}` : ``;
    
    if (useAuth) {
      routes.push(`<Route path="/${camelName}" element={<${listName} />} />`);
    } else {
      routes.push(`<Route path="/${camelName}" element={<${listName} />} />`);
    }

    const customForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
    if (!customForm) {
      const formCompName = `${pascalName}Form`;
      imports.push(`import { ${formCompName} } from './pages/${pascalName}/${formCompName}';`);
      if (useAuth) {
        routes.push(`<Route path="/${camelName}/new" element={<${formCompName} />} />\n                <Route path="/${camelName}/:id" element={<${formCompName} />} />`);
      } else {
        routes.push(`<Route path="/${camelName}/new" element={<${formCompName} />} />`);
        routes.push(`<Route path="/${camelName}/:id" element={<${formCompName} />} />`);
      }
    }
  });

  // Custom Form Routes
  forms.forEach(form => {
    const compName = `${toPascalCase(form.name)}Form`;
    const formSlug = toPascalCase(form.name).toLowerCase();
    const camelName = toCamelCase(form.name);
    imports.push(`import { ${compName} } from './pages/forms/${compName}';`);
    routes.push(`<Route path="/forms/${formSlug}Form/:id" element={<${compName} />} />`);
    routes.push(`<Route path="/forms/${formSlug}Form" element={<${compName} />} />`);
    routes.push(`<Route path="/forms/${formSlug}Form/new" element={<${compName} />} />`);
    routes.push(`<Route path="/forms/${camelName}" element={<${compName} />} />`);
    routes.push(`<Route path="/forms/${camelName}/:id" element={<${compName} />} />`);
    routes.push(`<Route path="/form/${form.id}" element={<${compName} />} />`);
    routes.push(`<Route path="/form/${form.id}/:id" element={<${compName} />} />`);
    routes.push(`<Route path="/forms/${form.id}" element={<${compName} />} />`);
    routes.push(`<Route path="/forms/${form.id}/:id" element={<${compName} />} />`);
  });

  // Query Routes
  queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE').forEach(q => {
    const compName = `${toPascalCase(q.name)}QueryPage`;
    imports.push(`import { ${compName} } from './pages/queries/${compName}';`);
    routes.push(`<Route path="/queries/${toCamelCase(q.name)}" element={<${compName} />} />`);
    routes.push(`<Route path="/query/${q.id}" element={<${compName} />} />`);
    routes.push(`<Route path="/queries/${q.id}" element={<${compName} />} />`);
  });

  // Report Routes
  reports.forEach(r => {
    const compName = `${toPascalCase(r.name)}ReportPage`;
    imports.push(`import { ${compName} } from './pages/reports/${compName}';`);
    routes.push(`<Route path="/reports/${toCamelCase(r.name)}" element={<${compName} />} />`);
    routes.push(`<Route path="/report/${r.id}" element={<${compName} />} />`);
    routes.push(`<Route path="/reports/${r.id}" element={<${compName} />} />`);
  });

  // Custom Pages Routes
  pages.forEach(p => {
    const pascalName = toPascalCase(p.name);
    imports.push(`import { ${pascalName}Page } from './pages/custom/${pascalName}Page';`);
    routes.push(`<Route path="/custom/${toCamelCase(p.name)}" element={<${pascalName}Page />} />`);
    routes.push(`<Route path="/custom/${p.id}" element={<${pascalName}Page />} />`);
    routes.push(`<Route path="/page/${p.id}" element={<${pascalName}Page />} />`);
  });

  // Auth specific files and configurations
  if (useAuth) {
    imports.push(`import { AuthProvider } from './context/AuthContext';`);
    imports.push(`import { ProtectedRoute } from './components/ProtectedRoute';`);
    imports.push(`import { Login } from './pages/auth/Login';`);
    imports.push(`import { Register } from './pages/auth/Register';`);
    imports.push(`import { ForgotPassword } from './pages/auth/ForgotPassword';`);
    imports.push(`import { Profile } from './pages/auth/Profile';`);
    imports.push(`import { Forbidden } from './pages/auth/Forbidden';`);
    
    files.push(generateForbidden(root));
    files.push(generateAuthContext(config, root));
    files.push(generateLogin(config, root));
    files.push(generateRegister(root));
    files.push(generateForgotPassword(root));
    files.push(generateProfile(root));
    files.push(generateProtectedRoute(root));
  }

  // App.tsx, main.tsx, index.html, manifest.json
  files.push(generateAppTsx(imports, routes, config, root, !!useAuth, wl));
  files.push(generateMainTsx(root));
  files.push(generateIndexHtml(root, wl));

  if (wl.pwaConfiguration?.enabled) {
    files.push(generatePwaManifest(root, wl));
  }

  return files;
};
