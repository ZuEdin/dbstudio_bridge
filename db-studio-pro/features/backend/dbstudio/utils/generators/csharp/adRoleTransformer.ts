import JSZip from "jszip";

export function generateAdRoleTransformer(
  zip: JSZip,
  adGroupMappings?: { id: string; adGroup: string; appRole: string }[]
) {
  const activeMappings = (adGroupMappings && adGroupMappings.length > 0) ? adGroupMappings : [
    { adGroup: "firma\\\\administratoren", appRole: "Administrator" },
    { adGroup: "firma\\\\manager", appRole: "Manager" },
    { adGroup: "firma\\\\coder", appRole: "Developer" },
    { adGroup: "firma\\\\entwickler", appRole: "Developer" },
    { adGroup: "firma\\\\user", appRole: "User" },
    { adGroup: "firma\\\\gast", appRole: "Guest" }
  ];

  const mappingsCode = activeMappings.map(mapping => {
    let groupClean = mapping.adGroup;
    if (!groupClean.includes("\\\\") && groupClean.includes("\\")) {
      groupClean = groupClean.replace(/\\/g, "\\\\");
    }
    return `            if (CheckUserRole(clone, "${groupClean}", adInfo))
            {
                if (!identity.HasClaim(c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value.Equals("${mapping.appRole}", System.StringComparison.OrdinalIgnoreCase)))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, "${mapping.appRole}"));
                }
            }`;
  }).join("\n\n");

  zip.file("Services/AdRoleTransformer.cs", `using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;

namespace DBStudioBackend.Services
{
    public class AdRoleTransformer : IClaimsTransformation
    {
        private readonly IAdService _adService;
        private readonly IConfiguration _config;

        public AdRoleTransformer(IAdService adService, IConfiguration config)
        {
            _adService = adService;
            _config = config;
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

            // Always query AD details / groups via IAdService so claims are resolved immediately
            var adInfo = _adService.GetCurrentUserDetails(clone);

            // 1. Rollen-Zuordnungen dynamisch aus appsettings.json lesen (ActiveDirectory:RoleMappings)
            var configRoleMappings = _config.GetSection("ActiveDirectory:RoleMappings").Get<List<AdRoleMappingDto>>();
            if (configRoleMappings != null && configRoleMappings.Any())
            {
                foreach (var mapping in configRoleMappings)
                {
                    if (!string.IsNullOrWhiteSpace(mapping.AdGroup) && !string.IsNullOrWhiteSpace(mapping.AppRole))
                    {
                        if (CheckUserRole(clone, mapping.AdGroup, adInfo))
                        {
                            if (!identity.HasClaim(c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value.Equals(mapping.AppRole, StringComparison.OrdinalIgnoreCase)))
                            {
                                identity.AddClaim(new Claim(ClaimTypes.Role, mapping.AppRole));
                            }
                        }
                    }
                }
            }

            // 2. Statisch generierte Zuordnungen als Fallback / Standard
${mappingsCode}

            // Configurable fallback roles from appsettings.json if no specific group matched
            if (!identity.HasClaim(c => c.Type == ClaimTypes.Role || c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" || c.Type == "role"))
            {
                var defaultRolesConfig = _config.GetSection("ActiveDirectory:DefaultRoles").Get<string[]>()
                    ?? _config["ActiveDirectory:DefaultRoles"]?.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    ?? new[] { "Administrator", "Manager", "Developer", "User", "Guest" };

                foreach (var role in defaultRolesConfig)
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, role));
                }
            }

            return Task.FromResult(clone);
        }

        private bool CheckUserRole(ClaimsPrincipal principal, string groupName, AdUserInfo? adInfo)
        {
            if (string.IsNullOrEmpty(groupName)) return false;
            
            var configuredNetBios = _config["ActiveDirectory:NetBiosName"] ?? "firma";
            var configuredDomain = _config["ActiveDirectory:DomainName"] ?? "firma.local";
            
            var idx = groupName.LastIndexOf('\\\\');
            var groupOnly = idx >= 0 ? groupName.Substring(idx + 1) : groupName;

            var groupVariants = new List<string>
            {
                groupName,
                groupOnly,
                configuredNetBios + '\\\\' + groupOnly,
                configuredDomain + '\\\\' + groupOnly
            };

            foreach (var v in groupVariants)
            {
                if (principal.IsInRole(v))
                    return true;
            }

            if (adInfo != null && adInfo.Groups != null)
            {
                if (adInfo.Groups.Any(g => groupVariants.Any(v => 
                    g.Equals(v, StringComparison.OrdinalIgnoreCase) || 
                    g.EndsWith('\\\\' + groupOnly, StringComparison.OrdinalIgnoreCase) ||
                    g.Equals(groupOnly, StringComparison.OrdinalIgnoreCase))))
                {
                    return true;
                }
            }
                
            return principal.Claims.Any(c => groupVariants.Any(v => 
                c.Value.Equals(v, StringComparison.OrdinalIgnoreCase) ||
                c.Value.EndsWith('\\\\' + groupOnly, StringComparison.OrdinalIgnoreCase) ||
                c.Value.Equals(groupOnly, StringComparison.OrdinalIgnoreCase))
            );
        }
    }

    public class AdRoleMappingDto
    {
        public string AdGroup { get; set; } = string.Empty;
        public string AppRole { get; set; } = string.Empty;
    }
}
`);
}
