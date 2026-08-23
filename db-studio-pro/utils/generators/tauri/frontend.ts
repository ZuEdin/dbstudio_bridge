import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateReact } from '../reactGenerator';
import { generateAngular } from '../angularGenerator';

export const generateTauriFrontend = (
  safeTables: Table[],
  safeRelationships: Relationship[],
  safeQueries: Query[],
  config: BackendConfig,
  safeForms: Form[],
  safeReports: Report[],
  root: string,
  fePort: number
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // React Frontend
  const reactFiles = generateReact(safeTables, safeRelationships, safeQueries, config, safeForms, safeReports);
  if (Array.isArray(reactFiles)) {
    reactFiles.forEach(f => {
      let relativePath = f.path.replace(/^Frontend\//, '');

      // Vite Config: Base Path for Tauri & Transpiles directly into dist folder
      if (f.name === 'vite.config.ts') {
        f.content = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Relative asset paths for Tauri
  build: {
    outDir: '../dist', // Output directly to TauriApp/dist
    emptyOutDir: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  server: {
    port: ${fePort}
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`;
      }

      f.path = `${root}/Frontend/${relativePath}`;
      files.push(f);
    });
  }

  // Angular Frontend
  const angularFiles = generateAngular(safeTables, safeRelationships, safeQueries, safeForms, config, safeReports);
  if (Array.isArray(angularFiles)) {
    angularFiles.forEach(f => {
      let relativePath = f.path.replace(/^Frontend\//, '');

      // Angular Main: Enable HashLocationStrategy for Tauri compatibility
      if (f.name === 'main.ts') {
        f.content = f.content.replace(
          /import\s+\{\s*provideRouter\s*\}\s+from\s+'@angular\/router';/,
          "import { provideRouter, withHashLocation } from '@angular/router';"
        ).replace(
          /provideRouter\(appRoutes\)/,
          "provideRouter(appRoutes, withHashLocation())"
        );
      }

      // Angular Index HTML: Convert absolute base href to relative for local asset loading
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
