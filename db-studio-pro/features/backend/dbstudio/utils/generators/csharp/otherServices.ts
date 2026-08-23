import JSZip from "jszip";

export function generateOtherServices(zip: JSZip) {
  zip.file("Services/TenantService.cs", `using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace DBStudioBackend.Services
{
    public interface ITenantService 
    { 
        string? GetTenantId(); 
        string GetConnectionString(string original); 
        bool IsDatabasePerTenant(); 
    }

    public class TenantService : ITenantService 
    {
        private readonly IHttpContextAccessor _h; 
        private readonly IConfiguration _c;

        public TenantService(IHttpContextAccessor h, IConfiguration c) 
        { 
            _h = h; 
            _c = c; 
        }

        public bool IsDatabasePerTenant() => false;

        public string? GetTenantId() 
        { 
            return _h.HttpContext?.Request.Headers["X-Tenant-ID"].ToString(); 
        }

        public string GetConnectionString(string o) 
        { 
            return o; 
        }
    }
}
`);

  zip.file("Services/PermissionService.cs", `using System.Security.Claims;
using System.Threading.Tasks;
using DBStudioBackend.Data;

namespace DBStudioBackend.Services
{
    public interface IPermissionService 
    { 
        Task<bool> CanReadTableAsync(ClaimsPrincipal u, string t); 
        Task<bool> CanWriteTableAsync(ClaimsPrincipal u, string t); 
        Task<bool> CanDeleteTableAsync(ClaimsPrincipal u, string t); 
    }

    public class PermissionService : IPermissionService 
    {
        public PermissionService(MetaDbContext c) 
        { 
        }

        public Task<bool> CanReadTableAsync(ClaimsPrincipal u, string t) => Task.FromResult(true);
        public Task<bool> CanWriteTableAsync(ClaimsPrincipal u, string t) => Task.FromResult(true);
        public Task<bool> CanDeleteTableAsync(ClaimsPrincipal u, string t) => Task.FromResult(true);
    }
}
`);
}
