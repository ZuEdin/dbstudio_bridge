import { Table } from '../../types/index';
import { RoleDefinition, SecurityRlsConfig, TablePermission, RlsRule } from './rlsTypes';

export const DEFAULT_ROLES: RoleDefinition[] = [
  { id: 'role_admin', name: 'Admin', description: 'Voller Lese- und Schreibzugriff ohne Einschränkungen.', isSystem: true },
  { id: 'role_manager', name: 'Manager', description: 'Umfassender Zugriff auf alle Abteilungsdaten und Berichte.', isSystem: true },
  { id: 'role_sachbearbeiter', name: 'Sachbearbeiter', description: 'Zugriff auf zugewiesene Kunden und operative Vorgänge.', isSystem: true },
  { id: 'role_gast', name: 'Gast / Viewer', description: 'Nur-Lese-Rechte auf freigegebene Stammdaten.', isSystem: true }
];

export const createInitialRlsConfig = (tables: Table[]): SecurityRlsConfig => {
  const permissions: Record<string, Record<string, TablePermission>> = {};

  DEFAULT_ROLES.forEach(role => {
    permissions[role.id] = {};
    tables.forEach(table => {
      const colPerms: Record<string, 'readwrite' | 'readonly' | 'hidden'> = {};
      table.fields.forEach(f => {
        if (role.id === 'role_admin') colPerms[f.name] = 'readwrite';
        else if (role.id === 'role_gast') colPerms[f.name] = 'readonly';
        else colPerms[f.name] = 'readwrite';
      });

      if (role.id === 'role_admin') {
        permissions[role.id][table.id] = { tableId: table.id, tableName: table.name, create: true, read: true, update: true, delete: true, columnPermissions: colPerms };
      } else if (role.id === 'role_manager') {
        permissions[role.id][table.id] = { tableId: table.id, tableName: table.name, create: true, read: true, update: true, delete: false, columnPermissions: colPerms };
      } else if (role.id === 'role_sachbearbeiter') {
        permissions[role.id][table.id] = { tableId: table.id, tableName: table.name, create: true, read: true, update: true, delete: false, columnPermissions: colPerms };
      } else {
        // Gast
        permissions[role.id][table.id] = { tableId: table.id, tableName: table.name, create: false, read: true, update: false, delete: false, columnPermissions: colPerms };
      }
    });
  });

  const sampleRules: RlsRule[] = [];
  if (tables.length > 0) {
    const firstTable = tables[0];
    sampleRules.push({
      id: 'rule_1',
      tableId: firstTable.id,
      tableName: firstTable.name,
      roleId: 'role_sachbearbeiter',
      action: 'SELECT',
      name: `Nur eigene ${firstTable.name} anzeigen`,
      expression: `owner_id = current_setting('app.current_user_id', true)::uuid`,
      description: 'Benutzer sehen nur Datensätze, bei denen sie als Ersteller oder Verantwortlicher hinterlegt sind.',
      enabled: true
    });
  }

  return {
    roles: DEFAULT_ROLES,
    permissions,
    rules: sampleRules,
    enablePostgresRls: true
  };
};

export const generatePostgreSqlRlsDdl = (config: SecurityRlsConfig, tables: Table[]): string => {
  const ddl: string[] = [
    `-- ==========================================================`,
    `-- DB Studio Pro: Native PostgreSQL Row-Level-Security (RLS)`,
    `-- Erstellt am: ${new Date().toISOString()}`,
    `-- ==========================================================`,
    ``
  ];

  tables.forEach(table => {
    ddl.push(`-- 1. RLS für Tabelle "${table.name}" aktivieren`);
    ddl.push(`ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;`);
    ddl.push(`ALTER TABLE "${table.name}" FORCE ROW LEVEL SECURITY;`);
    ddl.push(``);
  });

  // Admin bypass
  ddl.push(`-- 2. Admin Vollzugriffs-Policy (Bypass)`);
  tables.forEach(table => {
    ddl.push(`DROP POLICY IF EXISTS "admin_all_access_${table.name}" ON "${table.name}";`);
    ddl.push(`CREATE POLICY "admin_all_access_${table.name}" ON "${table.name}"`);
    ddl.push(`  AS PERMISSIVE FOR ALL`);
    ddl.push(`  TO authenticated`);
    ddl.push(`  USING (current_setting('app.current_user_role', true) = 'Admin');`);
    ddl.push(``);
  });

  // Custom Rules
  ddl.push(`-- 3. Benutzerdefinierte Zeilenfilter-Policies`);
  config.rules.filter(r => r.enabled).forEach(rule => {
    const role = config.roles.find(ro => ro.id === rule.roleId);
    const roleName = role ? role.name : 'authenticated';
    const policyName = `policy_${rule.tableName}_${rule.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    ddl.push(`DROP POLICY IF EXISTS "${policyName}" ON "${rule.tableName}";`);
    ddl.push(`CREATE POLICY "${policyName}" ON "${rule.tableName}"`);
    ddl.push(`  FOR ${rule.action}`);
    ddl.push(`  TO authenticated`);
    ddl.push(`  USING (`);
    ddl.push(`    current_setting('app.current_user_role', true) = '${roleName}' AND (`);
    ddl.push(`      ${rule.expression}`);
    ddl.push(`    )`);
    ddl.push(`  );`);
    ddl.push(``);
  });

  return ddl.join('\n');
};

export const generateDotNetAuthorizationHandler = (config: SecurityRlsConfig): string => {
  return `// ==========================================================
// DB Studio Pro: ASP.NET Core Row-Level Security Requirement & Handler
// ==========================================================

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace DBStudio.Security
{
    public class RowLevelSecurityRequirement : IAuthorizationRequirement
    {
        public string EntityName { get; }
        public string Action { get; }

        public RowLevelSecurityRequirement(string entityName, string action)
        {
            EntityName = entityName;
            Action = action;
        }
    }

    public class RowLevelSecurityHandler : AuthorizationHandler<RowLevelSecurityRequirement>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RowLevelSecurityHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            RowLevelSecurityRequirement requirement)
        {
            var user = context.User;
            var role = user.FindFirst(ClaimTypes.Role)?.Value ?? "Gast";
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Admin bypass
            if (role == "Admin")
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // Apply Rule Check
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext != null)
            {
                httpContext.Items["RLS_Filter_UserId"] = userId;
                httpContext.Items["RLS_Filter_Role"] = role;
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}`;
};
