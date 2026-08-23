import JSZip from 'jszip';
import { generateProjectFiles } from './nodejs/project';
import { generateAuthController } from './nodejs/authController';
import { generateProjectsController } from './nodejs/projectsController';
import { generateDataController } from './nodejs/dataController';
import { generateUtilityControllers } from './nodejs/utilityControllers';
import { generateDeployFiles } from './nodejs/deploy';

export function generateNodejsBackend(
  zip: JSZip, 
  schemaSql: string, 
  subfolderPath: string = '', 
  includeWwwroot: boolean = true
) {
  const cleanSubfolder = subfolderPath.trim().replace(/\/+$/, '');
  const normalizedSubfolder = cleanSubfolder ? (cleanSubfolder.startsWith('/') ? cleanSubfolder : '/' + cleanSubfolder) : '';

  // 1. Core Node.js / Express project files setup
  generateProjectFiles(zip, normalizedSubfolder, includeWwwroot);

  // 2. Auth Controller / endpoints configuration
  generateAuthController(zip);

  // 3. Projects Controller / endpoints configuration
  generateProjectsController(zip);

  // 4. Dynamic DB Studio custom tables data router
  generateDataController(zip);

  // 5. Utility Services (Users admin, Backup, Mail SMTP logging, Sync history, Gemini, Zapier Webhooks, Chat logs)
  generateUtilityControllers(zip);

  // 6. Docker profiles, IaC configurations, CI/CD pipelines
  generateDeployFiles(zip);

  // 7. Inject standard metadata database initial schema setup SQL
  zip.file("database/schema.sql", schemaSql);
}
