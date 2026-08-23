
import { BackendConfig, VirtualFile } from '../../../types/index';

export const generatePermissionService = (config: BackendConfig, root: string): VirtualFile => {
  // Placeholder to maintain file integrity if called directly
  return { 
      name: 'PermissionService.cs', 
      path: `${root}/Services/PermissionService.cs`, 
      content: `// Placeholder`, 
      language: 'csharp' 
  };
};

export const generateAdServices = (config: BackendConfig, root: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');

    // 1. Tenant & Permission Service
    const isDbPerTenant = config.multiTenancy?.enabled && config.multiTenancy.strategy === 'database';
    
    const tenantImpl = `
    public interface ITenantService { string? GetTenantId(); string GetConnectionString(string original); bool IsDatabasePerTenant(); }
    public class TenantService : ITenantService {
        private readonly IHttpContextAccessor _h; private readonly IConfiguration _c;
        public TenantService(IHttpContextAccessor h, IConfiguration c) { _h = h; _c = c; }
        public bool IsDatabasePerTenant() => ${isDbPerTenant ? 'true' : 'false'};
        public string? GetTenantId() { return _h.HttpContext?.Request.Headers["X-Tenant-ID"].ToString(); }
        public string GetConnectionString(string o) { return o; }
    }`;

    const permissionContent = `using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ${safeNamespace}.Data;

namespace ${safeNamespace}.Services
{
${tenantImpl}

    public interface IPermissionService { Task<bool> CanReadTableAsync(ClaimsPrincipal u, string t); Task<bool> CanWriteTableAsync(ClaimsPrincipal u, string t); Task<bool> CanDeleteTableAsync(ClaimsPrincipal u, string t); }
    public class PermissionService : IPermissionService {
        public PermissionService(AppDbContext c) { }
        public Task<bool> CanReadTableAsync(ClaimsPrincipal u, string t) => Task.FromResult(true);
        public Task<bool> CanWriteTableAsync(ClaimsPrincipal u, string t) => Task.FromResult(true);
        public Task<bool> CanDeleteTableAsync(ClaimsPrincipal u, string t) => Task.FromResult(true);
    }
}`;
    files.push({ name: 'PermissionService.cs', path: `${root}/Services/PermissionService.cs`, content: permissionContent, language: 'csharp' });

    // 2. NEW: Current User Service (Who am I?)
    const currentUserContent = `using System.Security.Claims;

namespace ${safeNamespace}.Services
{
    public interface ICurrentUserService
    {
        string? UserId { get; }
        string? Username { get; }
        string? Email { get; }
        bool IsAuthenticated { get; }
        bool IsInRole(string role);
    }

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

        public string? UserId => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                              ?? User?.FindFirst("sub")?.Value;

        // Fallback chain for Username: Windows Identity Name -> Name Claim -> Preferred Username
        public string? Username => User?.Identity?.Name 
                                ?? User?.FindFirst(ClaimTypes.Name)?.Value 
                                ?? User?.FindFirst("preferred_username")?.Value;

        public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value;

        public bool IsInRole(string role) => User?.IsInRole(role) ?? false;
    }
}`;
    files.push({ name: 'CurrentUserService.cs', path: `${root}/Services/CurrentUserService.cs`, content: currentUserContent, language: 'csharp' });

    // 3. AD Service (Only if Windows Auth is active)
    if (config.authConfig?.useWindowsAuth) {
        const adServiceContent = `using System.DirectoryServices.AccountManagement;
using System.Runtime.Versioning;
using System.Security.Principal;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;

namespace ${safeNamespace}.Services
{
    public class AdUserInfo 
    {
        public string Username { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Department { get; set; } = "";
        public List<string> Groups { get; set; } = new();
    }

    public interface IAdService
    {
        AdUserInfo? GetCurrentUserDetails(IPrincipal user);
        List<AdUserInfo> SearchUsers(string query);
    }

    [SupportedOSPlatform("windows")]
    public class AdService : IAdService
    {
        private readonly ILogger<AdService> _logger;

        public AdService(ILogger<AdService> logger)
        {
            _logger = logger;
        }

        public AdUserInfo? GetCurrentUserDetails(IPrincipal principal)
        {
            var username = principal?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(username) && principal is ClaimsPrincipal cp)
            {
                username = cp.FindFirst(ClaimTypes.Name)?.Value 
                        ?? cp.FindFirst("preferred_username")?.Value 
                        ?? cp.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }
            if (string.IsNullOrWhiteSpace(username))
            {
                username = System.Environment.UserName;
            }
            if (string.IsNullOrWhiteSpace(username)) return null;

            AdUserInfo? info = null;

            // 1. Try Domain Context (Active Directory)
            try 
            {
                using var context = new PrincipalContext(ContextType.Domain);
                using var user = UserPrincipal.FindByIdentity(context, username);
                
                if (user != null) info = MapUser(user, includeGroups: true);
            }
            catch (Exception ex)
            {
                // This catches UriFormatException (Hostname parsing) and Timeouts
                _logger.LogWarning("AD Domain lookup failed ({Msg}). Trying local machine fallback...", ex.Message);

                // 2. Fallback: Try Machine Context (Local User / Dev Mode)
                try 
                {
                    using var context = new PrincipalContext(ContextType.Machine);
                    using var user = UserPrincipal.FindByIdentity(context, username);
                    if (user != null) info = MapUser(user, includeGroups: true);
                }
                catch (Exception ex2)
                {
                    _logger.LogWarning("Machine lookup also failed: {Msg}", ex2.Message);
                }
            }
            
            // 3. Last Resort: Create simple Identity info if not resolved yet
            if (info == null)
            {
                info = new AdUserInfo { Username = username, DisplayName = username };
            }

            // 4. Merge groups from ClaimsPrincipal (extremely reliable and fast fallback)
            if (principal is ClaimsPrincipal claimsPrincipal)
            {
                var claimsGroups = new List<string>();
                var groupClaims = claimsPrincipal.FindAll(ClaimTypes.GroupSid)
                    .Concat(claimsPrincipal.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/groupsid"));

                foreach (var claim in groupClaims)
                {
                    try
                    {
                        var sid = new SecurityIdentifier(claim.Value);
                        var groupName = sid.Translate(typeof(NTAccount)).Value;
                        if (!string.IsNullOrEmpty(groupName))
                        {
                            if (!claimsGroups.Contains(groupName))
                            {
                                claimsGroups.Add(groupName);
                            }
                            var parts = groupName.Split('\\\\');
                            if (parts.Length > 1 && !claimsGroups.Contains(parts[1]))
                            {
                                claimsGroups.Add(parts[1]);
                            }
                        }
                    }
                    catch { }
                }

                var roleClaims = claimsPrincipal.FindAll(ClaimTypes.Role)
                    .Concat(claimsPrincipal.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/role"));
                foreach (var claim in roleClaims)
                {
                    if (!string.IsNullOrEmpty(claim.Value) && !claimsGroups.Contains(claim.Value))
                    {
                        claimsGroups.Add(claim.Value);
                    }
                }

                foreach (var g in claimsGroups)
                {
                    if (!info.Groups.Contains(g))
                    {
                        info.Groups.Add(g);
                    }
                }
            }

            return info;
        }

        public List<AdUserInfo> SearchUsers(string query)
        {
            var results = new List<AdUserInfo>();
            if (string.IsNullOrWhiteSpace(query)) return results;

            try
            {
                // Try connecting to Domain first
                using var context = new PrincipalContext(ContextType.Domain);
                
                // 1. Search by Username
                var userProto1 = new UserPrincipal(context) { SamAccountName = "*" + query + "*" };
                using var searcher1 = new PrincipalSearcher(userProto1);
                
                foreach (var result in searcher1.FindAll().Take(10))
                {
                    if (result is UserPrincipal user && !results.Any(r => r.Username == user.SamAccountName))
                    {
                        results.Add(MapUser(user, includeGroups: false));
                    }
                }

                // 2. Search by DisplayName
                if (results.Count < 20)
                {
                    var userProto2 = new UserPrincipal(context) { DisplayName = "*" + query + "*" };
                    using var searcher2 = new PrincipalSearcher(userProto2);

                    foreach (var result in searcher2.FindAll().Take(20 - results.Count))
                    {
                        if (result is UserPrincipal user && !results.Any(r => r.Username == user.SamAccountName))
                        {
                            results.Add(MapUser(user, includeGroups: false));
                        }
                    }
                }
            }
            catch (Exception ex) 
            { 
                _logger.LogError(ex, "Error searching AD users. (Are you connected to the domain?)"); 
                
                // Optional: Fallback search on local machine
                try {
                    using var localCtx = new PrincipalContext(ContextType.Machine);
                    var localProto = new UserPrincipal(localCtx) { Name = "*" + query + "*" };
                    using var localSearcher = new PrincipalSearcher(localProto);
                    foreach (var res in localSearcher.FindAll().Take(5)) {
                        if (res is UserPrincipal u) results.Add(MapUser(u, false));
                    }
                } catch {}
            }
            return results;
        }

        private AdUserInfo MapUser(UserPrincipal user, bool includeGroups = true)
        {
            var info = new AdUserInfo
            {
                Username = user.SamAccountName ?? "",
                DisplayName = user.DisplayName ?? user.Name ?? "",
                Email = user.EmailAddress ?? "",
                Department = "Unknown"
            };
            
            try {
               if (user.GetUnderlyingObject() is System.DirectoryServices.DirectoryEntry de) {
                   if(de.Properties.Contains("department")) 
                       info.Department = de.Properties["department"].Value?.ToString() ?? "";
               }
            } catch {}

            if (includeGroups)
            {
                try {
                    var groups = user.GetAuthorizationGroups();
                    info.Groups = groups.Select(g => g.Name ?? "").ToList();
                }  
                catch (Exception ex) 
                { 
                    // Swallow group fetch errors specifically (common source of crashes)
                    _logger.LogDebug("Could not fetch AD groups for {User}: {Msg}", user.Name, ex.Message);
                }
            }
            return info;
        }
    }
}`;
        files.push({ name: 'AdService.cs', path: `${root}/Services/AdService.cs`, content: adServiceContent, language: 'csharp' });
    }

    return files;
};
