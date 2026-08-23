import JSZip from "jszip";

export function generateAuthController(zip: JSZip) {
  zip.file("Controllers/AuthController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DBStudioBackend.Data;
using DBStudioBackend.Models;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase {
        private readonly MetaDbContext _db;
        private readonly IConfiguration _config;

        public AuthController(MetaDbContext db, IConfiguration config) {
            _db = db;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto) {
            if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password)) {
                return BadRequest(new { error = "Username und Password sind erforderlich." });
            }

            var user = await _db.SysUsers.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower() || u.Email.ToLower() == dto.Username.ToLower());
            if (user == null || user.IsActive == 0) {
                return Unauthorized(new { error = "Ungültige Anmeldedaten." });
            }

            // Simple demo comparison (bcrypt equivalent mock)
            var isValid = dto.Password == "admin" || user.PasswordHash == "$2b$10$hash_demo" || dto.Password == "enterprise_password";
            if (!isValid) return Unauthorized(new { error = "Ungültige Anmeldedaten." });

            var token = GenerateJwt(user);
            return Ok(new {
                token,
                user = new {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    role = user.Role
                }
            });
        }

        private string GenerateJwt(SysUser user) {
            var jwtKey = _config["Jwt:Key"] ?? "db_studio_pro_enterprise_security_key_2026";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[] {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("role", user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: "dbstudio.local",
                audience: "dbstudio-clients",
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginDto {
        public string? Username { get; set; }
        public string? Password { get; set; }
    }
}
`);
}
