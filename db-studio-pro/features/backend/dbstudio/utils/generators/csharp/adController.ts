import JSZip from "jszip";

export function generateAdController(zip: JSZip) {
  zip.file("Controllers/AdController.cs", `using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using DBStudioBackend.Services;
using System.Linq;
using System.Collections.Generic;

namespace DBStudioBackend.Controllers
{
    [Route("api/ad")]
    [ApiController]
    [Authorize]
    public class AdController : ControllerBase
    {
        private readonly IAdService _adService;
        private readonly ICurrentUserService _currentUser;
        private readonly IClaimsTransformation _claimsTransformer;
        private readonly IConfiguration _config;

        public AdController(IAdService adService, ICurrentUserService currentUser, IClaimsTransformation claimsTransformer, IConfiguration config)
        {
            _adService = adService;
            _currentUser = currentUser;
            _claimsTransformer = claimsTransformer;
            _config = config;
        }

        [HttpGet("me")]
        public ActionResult<AdUserInfo> GetMe()
        {
            // Returns the full AD profile of the currently logged in user
            var info = _adService.GetCurrentUserDetails(User);
            if (info == null) return NotFound();
            return Ok(info);
        }
        
        [HttpGet("whoami")]
        [AllowAnonymous]
        public async Task<IActionResult> WhoAmI()
        {
            var transformedPrincipal = await _claimsTransformer.TransformAsync(User);
            var adInfo = _adService.GetCurrentUserDetails(transformedPrincipal);
            var domain = (_config["ActiveDirectory:DefaultEmailDomain"] ?? _config["ActiveDirectory:DomainName"] ?? "firma.de").TrimStart('@');
            if (!domain.Contains(".")) domain += ".de";
            var uname = adInfo?.DisplayName ?? adInfo?.Username ?? _currentUser.Username ?? transformedPrincipal.Identity?.Name ?? System.Environment.UserName ?? "Zubeyr";
            var cleanName = uname.ToLower().Replace(" ", ".").Replace("\\\\", ".");
            var email = !string.IsNullOrEmpty(adInfo?.Email) ? adInfo.Email : (_currentUser.Email ?? (uname.Contains("@") ? uname : $"{cleanName}@{domain}"));
            var userId = !string.IsNullOrEmpty(_currentUser.UserId) ? _currentUser.UserId : (!string.IsNullOrEmpty(email) ? email : uname);

            // Rollen werden ausschließlich aus den von AdRoleTransformer.cs verankerten Claims bezogen
            var rolesList = transformedPrincipal.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" || c.Type == "role")
                .Select(c => c.Value)
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Distinct()
                .ToList();

            return Ok(new { 
                Username = uname,
                DisplayName = uname,
                Email = email,
                UserId = userId, 
                IsAuthenticated = _currentUser.IsAuthenticated || transformedPrincipal.Identity?.IsAuthenticated == true || !string.IsNullOrEmpty(uname),
                Roles = rolesList
            });
        }

        [HttpGet("search")]
        public ActionResult<List<AdUserInfo>> Search([FromQuery] string? q = null, [FromQuery] string? search = null)
        {
            var query = q ?? search;
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2) 
                return BadRequest("Query must be at least 2 characters.");

            return Ok(_adService.SearchUsers(query));
        }
    }
}`);
}
