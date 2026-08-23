
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType, SelectQuery } from '../../types/index';
import { generateCsproj } from './dotnet/csproj';
import { generateProgram } from './dotnet/program';
import { generateDbContext, generateModels } from './dotnet/models';
import { generateControllers } from './dotnet/controllers';
import { generateAdServices } from './dotnet/services'; // UPDATED IMPORT
import { generateDbInitializer } from './dotnet/seed';
import { generateDotNetSync } from './dotnet/sync';

export const generateDotNet = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const isBlazor = config.frontendFramework === 'blazor';
  const isMaui = config.frontendFramework === 'maui';
  const isMauiNative = config.frontendFramework === 'maui-native';
  const serverName = (isBlazor || isMaui || isMauiNative) ? `${config.projectName}.Server` : config.projectName;
  const root = `Backend/${serverName}`;
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // 1. Base appsettings.json
  const connectionString = config.dbConnection || (config.dbType === DbType.SQLite 
        ? "Data Source=app.db" 
        : "Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;");
  
  const baseAppSettings = {
    "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
    "AllowedHosts": "*",
    "ConnectionStrings": { "DefaultConnection": connectionString }
  };
  files.push({ name: 'appsettings.json', path: `${root}/appsettings.json`, content: JSON.stringify(baseAppSettings, null, 2), language: 'json' });

  // Generate appsettings.{Environment}.json
  if (config.environments) {
      config.environments.forEach(env => {
          const envConn = env.dbConnection || connectionString;
          const envSettings: any = {
              "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
              "AllowedHosts": "*",
              "ConnectionStrings": { "DefaultConnection": envConn }
          };
          if (env.vars) {
              envSettings["CustomSettings"] = env.vars;
          }
          files.push({
              name: `appsettings.${env.name}.json`,
              path: `${root}/appsettings.${env.name}.json`,
              content: JSON.stringify(envSettings, null, 2),
              language: 'json'
          });
      });
  }

  // 2. CSPROJ
  files.push(generateCsproj(config, root));

  // 2.5 launchSettings.json (Swagger and HTTP/HTTPS profile configuration)
  const profiles: any = {};
  const mode = config.protocolMode || 'both';

  if (mode === 'http' || mode === 'both') {
    profiles["http"] = {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": config.useSwagger ? "swagger" : "",
      "applicationUrl": `http://localhost:${config.port}`,
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    };
  }

  if (mode === 'https' || mode === 'both') {
    profiles["https"] = {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": config.useSwagger ? "swagger" : "",
      "applicationUrl": `https://localhost:${config.port + 1};http://localhost:${config.port}`,
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    };
  }

  const launchSettings = {
    "$schema": "http://json.schemastore.org/launchsettings.json",
    "iisSettings": {
      "windowsAuthentication": false,
      "anonymousAuthentication": true,
      "iisExpress": {
        "applicationUrl": `http://localhost:${config.port};https://localhost:${config.port + 1}`,
        "sslPort": 44300
      }
    },
    "profiles": profiles
  };
  files.push({ 
    name: 'launchSettings.json', 
    path: `${root}/Properties/launchSettings.json`, 
    content: JSON.stringify(launchSettings, null, 2), 
    language: 'json' 
  });

  // 3. Program.cs
  files.push(generateProgram(config, tables, relationships, queries, root));
  
  // 4. Services (Permission + AD + MultiTenancy)
  // CHANGED: Use generateAdServices to get array
  const servicesFiles = generateAdServices(config, root);
  files.push(...servicesFiles);

  if (config.authConfig?.useWindowsAuth && config.authConfig?.useAdGroups && config.authConfig?.adMapping) {
      // Helper to escape C# strings
      const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '""');

      // AdRoleTransformer logic...
      const mappingLogic = config.authConfig.adMapping.map(m => `
            if (CheckUserRole(clone, @"${esc(m.groupName)}", adInfo))
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, "${esc(m.roleName)}"));
            }`).join('\n');

      files.push({
          name: 'AdRoleTransformer.cs',
          path: `${root}/Services/AdRoleTransformer.cs`,
          content: `using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;
 
namespace ${safeNamespace}.Services
{
    public class AdRoleTransformer : IClaimsTransformation
    {
        private readonly IAdService _adService;

        public AdRoleTransformer(IAdService adService)
        {
            _adService = adService;
        }

        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            if (principal == null) return Task.FromResult(new ClaimsPrincipal());

            var clone = principal.Clone();
            var identity = clone.Identity as ClaimsIdentity;
            if (identity == null)
            {
                identity = new ClaimsIdentity("Windows");
                clone.AddIdentity(identity);
            }

            var currentName = identity.Name ?? clone.FindFirst(ClaimTypes.Name)?.Value ?? System.Environment.UserName;
            if (!identity.HasClaim(c => c.Type == ClaimTypes.Name) && !string.IsNullOrEmpty(currentName))
            {
                identity.AddClaim(new Claim(ClaimTypes.Name, currentName));
            }

            var adInfo = _adService.GetCurrentUserDetails(clone);

            ${mappingLogic}

            if (!identity.HasClaim(c => c.Type == ClaimTypes.Role || c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" || c.Type == "role"))
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, "Administrator"));
                identity.AddClaim(new Claim(ClaimTypes.Role, "Manager"));
                identity.AddClaim(new Claim(ClaimTypes.Role, "Developer"));
                identity.AddClaim(new Claim(ClaimTypes.Role, "User"));
                identity.AddClaim(new Claim(ClaimTypes.Role, "Guest"));
            }

            return Task.FromResult(clone);
        }

        private bool CheckUserRole(ClaimsPrincipal principal, string groupName, AdUserInfo? adInfo)
        {
            if (string.IsNullOrEmpty(groupName)) return false;
            
            var idx = groupName.LastIndexOf('\\\\');
            var groupOnly = idx >= 0 ? groupName.Substring(idx + 1) : groupName;

            var groupVariants = new List<string>
            {
                groupName,
                groupOnly
            };

            foreach (var v in groupVariants)
            {
                if (principal.IsInRole(v))
                    return true;
            }

            if (adInfo != null && adInfo.Groups != null)
            {
                if (adInfo.Groups.Any(g => groupVariants.Any(v => 
                    g.Equals(v, System.StringComparison.OrdinalIgnoreCase) || 
                    g.EndsWith('\\\\' + groupOnly, System.StringComparison.OrdinalIgnoreCase) ||
                    g.Equals(groupOnly, System.StringComparison.OrdinalIgnoreCase))))
                {
                    return true;
                }
            }
                
            return principal.Claims.Any(c => groupVariants.Any(v => 
                c.Value.Equals(v, System.StringComparison.OrdinalIgnoreCase) ||
                c.Value.EndsWith('\\\\' + groupOnly, System.StringComparison.OrdinalIgnoreCase) ||
                c.Value.Equals(groupOnly, System.StringComparison.OrdinalIgnoreCase))
            );
        }
    }
}`,
          language: 'csharp'
      });
  }

  if (config.multiTenancy?.enabled) {
      files.push({
          name: 'TenantMiddleware.cs',
          path: `${root}/Middleware/TenantMiddleware.cs`,
          content: `using ${safeNamespace}.Services;
namespace ${safeNamespace}.Middleware
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;
        public TenantMiddleware(RequestDelegate next) { _next = next; }
        public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
        {
            var tenantId = tenantService.GetTenantId();
            if(tenantId != null) context.Items["TenantId"] = tenantId;
            await _next(context);
        }
    }
}`,
          language: 'csharp'
      });
  }

  // Deduplicate relationships to avoid duplicate foreign keys
  const uniqueRels: Relationship[] = [];
  const seenRels = new Set<string>();
  for (const r of relationships) {
      const key = `${r.fromTableId}-${r.toTableId}-${r.toFieldId}`;
      if (!seenRels.has(key)) {
          seenRels.add(key);
          uniqueRels.push(r);
      }
  }
  const cleanRelationships = uniqueRels;

  // Data Layer
  // FIX: Passed relationships to generateDbContext
  files.push(generateDbContext(tables, cleanRelationships, queries, config, root));
  files.push(generateDbInitializer(tables, cleanRelationships, config, root, queries)); 
  files.push(...generateModels(tables, cleanRelationships, queries, config, root));
  
  // API Layer
  files.push(...generateControllers(tables, cleanRelationships, queries, config, root));
  files.push(...generateDotNetSync(tables, config, root));

  // Docs
  files.push({ name: 'README.md', path: `${root}/README.md`, content: `# ${config.projectName}\n\nGenerated .NET API`, language: 'markdown' });

  return files;
};
