import { toPascalCase } from './common';

import { Table, Query, VirtualFile, Relationship, BackendConfig, Form, Report, CustomPage } from '../../types/index';
import { generateReactConfigs } from './react/config';
import { generateReactApi } from './react/api';
import { generateReactPages } from './react/pages';
import { generateReactStructure } from './react/structure';

export const generateReact = (
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

  const root = `Frontend`;
  const configFiles = generateReactConfigs(config, root);
  const apiFiles = generateReactApi(tables, queries, config, root, reports, macros);
  // Pass Queries and Custom Pages to Structure generator for Routes/Sidebar
  const structureFiles = generateReactStructure(tables, forms, reports, config, root, queries, pages);
  const pageFiles = generateReactPages(tables, forms, reports, root, queries, pages, customComponents);

  // Docs
  const readmeContent = `# ${config.projectName} (React Client)

Dieses Frontend wurde mit **React + Vite + TypeScript** generiert.

## 🚀 Schnellstart

### 1. Voraussetzungen
* **Node.js** (LTS Version, z.B. v18 oder v20).

### 2. Installation
Öffnen Sie ein Terminal im Ordner \`Frontend\`:

\`\`\`bash
npm install
\`\`\`

### 3. Starten (Development)
\`\`\`bash
npm run dev
\`\`\`

Die Anwendung läuft standardmäßig unter **http://localhost:${config.frontendPort || 3000}**.
⚠️ Stellen Sie sicher, dass das Backend läuft (Standard: Port ${config.port}).

### 4. Build (Production)
Um eine optimierte Version für den Webserver zu erstellen:

\`\`\`bash
npm run build
\`\`\`

Die Dateien befinden sich anschließend im Ordner \`dist\`. Diese können auf jeden statischen Webserver (Nginx, Apache, Azure Static Web Apps) hochgeladen werden.

## 🛠 Konfiguration
Die API-URL ist in \`src/services/api.ts\` definiert.
Aktuell: \`http://localhost:${config.port}/api\`

Um dies für Produktion zu ändern, setzen Sie Umgebungsvariablen oder ändern Sie die Datei vor dem Build.
`;

  const readme: VirtualFile = { name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' };

  return [
      ...configFiles,
      ...apiFiles,
      ...structureFiles,
      ...pageFiles,
      readme
  ];
};
