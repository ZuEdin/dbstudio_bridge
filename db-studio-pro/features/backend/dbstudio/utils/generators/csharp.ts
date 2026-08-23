import JSZip from "jszip";
import { generateProjectFiles } from "./csharp/project";
import { generateDbFiles } from "./csharp/db";
import { generateProjectsController } from "./csharp/projectsController";
import { generateDataController } from "./csharp/dataController";
import { generateUsersController } from "./csharp/usersController";
import { generateSyncController } from "./csharp/syncController";
import { generateDatabaseSyncController } from "./csharp/databaseSyncController/main";
import { generateBackendApisController } from "./csharp/backendApisController";
import { generateMailerController } from "./csharp/mailerController";
import { generateBackupController } from "./csharp/backupController";
import { generateAiController } from "./csharp/aiController";
import { generateChatController } from "./csharp/chatController";
import { generateWebhooksController } from "./csharp/webhooksController";
import { generateAuthController } from "./csharp/authController";
import { generateActiveDirectoryController } from "./csharp/activeDirectoryController";
import { generateAdController } from "./csharp/adController";
import { generateAdService } from "./csharp/adService";
import { generateAdRoleTransformer } from "./csharp/adRoleTransformer";
import { generateOtherServices } from "./csharp/otherServices";
import { generateDeployFiles } from "./csharp/deploy";
import { generateAppSettings } from "./csharp/appsettings";

export function generateCsharpBackend(
  zip: JSZip,
  schemaSql: string,
  adServerAddress?: string,
  adBaseDn?: string,
  adGroupMappings?: { id: string; adGroup: string; appRole: string }[],
  adServiceAccountUsername?: string,
  adServiceAccountPassword?: string,
  subfolderPath: string = '',
  includeWwwroot: boolean = true
) {
  const cleanSubfolder = subfolderPath.trim().replace(/\/+$/, '');
  const normalizedSubfolder = cleanSubfolder ? (cleanSubfolder.startsWith('/') ? cleanSubfolder : '/' + cleanSubfolder) : '';

  // 1. Generate core .NET project files and startup configurations
  generateProjectFiles(zip, normalizedSubfolder, includeWwwroot);

  // 2. Generate Database contexts and models
  generateDbFiles(zip);

  // 3. Generate Controllers
  generateProjectsController(zip);
  generateDataController(zip);
  generateUsersController(zip);
  generateSyncController(zip);
  generateDatabaseSyncController(zip);
  generateBackendApisController(zip);
  generateMailerController(zip);
  generateBackupController(zip);
  generateAiController(zip);
  generateChatController(zip);
  generateWebhooksController(zip);
  generateAuthController(zip);
  generateActiveDirectoryController(zip, adBaseDn);
  generateAdController(zip);

  // 4. Generate Core Services
  generateAdService(zip);
  generateAdRoleTransformer(zip, adGroupMappings);
  generateOtherServices(zip);

  // 5. Generate appsettings.json
  generateAppSettings(zip, adServerAddress, adBaseDn, adServiceAccountUsername, adServiceAccountPassword);

  // 6. Generate Docker, IaC (Terraform, CloudFormation, Bicep) and CI/CD pipelines
  generateDeployFiles(zip);
}
