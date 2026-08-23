import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateReact } from '../reactGenerator';

export const generateElectronReactFrontend = (
  safeTables: Table[],
  safeRelationships: Relationship[],
  safeQueries: Query[],
  config: BackendConfig,
  safeForms: Form[],
  safeReports: Report[],
  root: string,
  fePort: number,
  bePort: number = 5000
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const reactFiles = generateReact(safeTables, safeRelationships, safeQueries, config, safeForms, safeReports);

  if (Array.isArray(reactFiles)) {
    reactFiles.forEach(f => {
      let relativePath = f.path.replace(/^Frontend\//, '');

      // Vite Config: Transpiles directly into dist folder inside Electron directory
      if (f.name === 'vite.config.ts') {
        f.content = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Relative assets for local file system protocol (file://) in Electron
  build: {
    outDir: 'dist', // Transpiles locally into dist/ inside Frontend
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

      // App.tsx: Replace BrowserRouter with HashRouter for file:// protocol compatibility
      if (f.name === 'App.tsx') {
        f.content = f.content.replace(/\bBrowserRouter\b/g, 'HashRouter');
      }

      // main.tsx: Inject global error window listener to diagnose blank screen in Electron
      if (f.name === 'main.tsx') {
        f.content = `
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'electron-runtime-error-banner';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.backgroundColor = '#fee2e2';
    errorDiv.style.color = '#991b1b';
    errorDiv.style.padding = '16px';
    errorDiv.style.zIndex = '999999';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.borderBottom = '2px solid #ef4444';
    errorDiv.innerHTML = '<strong>Runtime Error:</strong> ' + event.message + '<br/><small>' + event.filename + ':' + event.lineno + '</small><pre style="margin-top:8px; white-space:pre-wrap;">' + (event.error?.stack || '') + '</pre>';
    document.body.appendChild(errorDiv);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'electron-unhandled-rejection-banner';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.backgroundColor = '#fef3c7';
    errorDiv.style.color = '#92400e';
    errorDiv.style.padding = '16px';
    errorDiv.style.zIndex = '999999';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.borderBottom = '2px solid #f59e0b';
    errorDiv.innerHTML = '<strong>Unhandled Promise Rejection:</strong> ' + event.reason;
    document.body.appendChild(errorDiv);
  });
}
` + f.content;
      }

      // API Client: Uses window.electronAPI or fallback to http://localhost:${bePort}/api/ for file:// protocol
      if (f.name === 'api.ts') {
        f.content = f.content.replace(
          /const API_URL = .*/, 
          `const API_URL = (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) ? (window.location.origin.includes('localhost') ? 'http://localhost:${bePort}/api/' : window.location.origin + '/api/') : 'http://localhost:${bePort}/api/';`
        );

        // Inject Electron IPC local handler check in API calls
        f.content = f.content.replace(
          /try \{\s*const token = localStorage\.getItem\('auth_token'\);[\s\S]*?\} catch \(apiErr\) \{/g,
          `if (typeof window !== 'undefined' && ((window as any).electronAPI || window.location.protocol === 'file:')) {
            // Portlose lokale Electron-Schnittstelle ohne HTTP-Server
            if ((window as any).electronAPI?.readJson) {
                try {
                    const localRes = await (window as any).electronAPI.readJson(cleanEndpoint);
                    if (localRes !== undefined && localRes !== null) return localRes;
                } catch(e) {}
            }
        }
        try {`
        );
      }

      f.path = `${root}/Frontend/${relativePath}`;
      files.push(f);
    });
  }

  return files;
};
