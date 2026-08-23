import JSZip from 'jszip';
import { generateProjectFiles } from './php/project';
import { generateAuthController } from './php/authController';
import { generateProjectsController } from './php/projectsController';
import { generateDataController } from './php/dataController';
import { generateUtilityControllers } from './php/utilityControllers';
import { generateDeployFiles } from './php/deploy';

export function generatePhpBackend(
  zip: JSZip, 
  schemaSql: string,
  subfolderPath: string = '',
  includeWwwroot: boolean = true
) {
  const cleanSubfolder = subfolderPath.trim().replace(/\/+$/, '');
  const normalizedSubfolder = cleanSubfolder ? (cleanSubfolder.startsWith('/') ? cleanSubfolder : '/' + cleanSubfolder) : '';

  // 1. Core Laravel skeleton setup
  generateProjectFiles(zip, normalizedSubfolder, includeWwwroot);

  // 2. Auth Controller (Login, Register, WhoAmI)
  generateAuthController(zip);

  // 3. Projects Controller
  generateProjectsController(zip);

  // 4. Dynamic DB Studio Custom Table Data Handler
  generateDataController(zip);

  // 5. Utility Controllers (Users, Mail, Sync, Backup, AI, Webhooks, Chat)
  generateUtilityControllers(zip);

  // 6. Docker, docker-compose, IaC, CI/CD pipeline profiles
  generateDeployFiles(zip);
  
  // 7. Inject Schema SQL for Database initializer references
  zip.file("database/schema.sql", schemaSql);
}
