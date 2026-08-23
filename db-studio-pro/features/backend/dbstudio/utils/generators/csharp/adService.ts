import JSZip from "jszip";

export function generateAdService(zip: JSZip) {
  zip.file("Services/AdService.cs", `using System;
using System.DirectoryServices.AccountManagement;
using System.Runtime.Versioning;
using System.Security.Principal;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace DBStudioBackend.Services
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
}
`);
}
