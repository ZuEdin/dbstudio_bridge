import JSZip from "jszip";

export function generateUsersController(zip: JSZip) {
  zip.file("Controllers/UsersController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DBStudioBackend.Data;
using DBStudioBackend.Models;
using System.Threading.Tasks;
using System.Linq;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/team/members")]
    public class UsersController : ControllerBase {
        private readonly MetaDbContext _db;
        public UsersController(MetaDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetMembers() {
            var users = await _db.SysUsers
                .Select(u => new { 
                    email = u.Email, 
                    role = u.Role, 
                    name = u.Username, 
                    source = !string.IsNullOrEmpty(u.AdSid) ? "AD / Active Directory" : "Lokal" 
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMember([FromBody] MemberRequestDto dto) {
            if (string.IsNullOrEmpty(dto.Email)) return BadRequest(new { error = "E-Mail-Adresse ist erforderlich." });
            
            var exists = await _db.SysUsers.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (exists) return BadRequest(new { error = "Ein Benutzer mit dieser E-Mail existiert bereits." });

            var newUser = new SysUser {
                Email = dto.Email,
                Username = !string.IsNullOrEmpty(dto.Name) ? dto.Name : dto.Email.Split('@')[0],
                Role = dto.Role ?? "Entwickler",
                PasswordHash = "pbkdf2_placeholder",
                AdSid = dto.Source == "Lokal" ? "" : "ad_imported_placeholder"
            };

            _db.SysUsers.Add(newUser);
            await _db.SaveChangesAsync();

            return StatusCode(201, new { 
                email = newUser.Email, 
                role = newUser.Role, 
                name = newUser.Username, 
                source = dto.Source ?? "Lokal" 
            });
        }

        [HttpPut("{email}")]
        public async Task<IActionResult> UpdateMember(string email, [FromBody] MemberRequestDto dto) {
            var user = await _db.SysUsers.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (user == null) return NotFound(new { error = "Benutzer nicht gefunden." });

            if (!string.IsNullOrEmpty(dto.Name)) user.Username = dto.Name;
            if (!string.IsNullOrEmpty(dto.Role)) user.Role = dto.Role;
            if (dto.Source != null) {
                user.AdSid = dto.Source == "Lokal" ? "" : "ad_imported_placeholder";
            }

            await _db.SaveChangesAsync();

            return Ok(new { 
                email = user.Email, 
                role = user.Role, 
                name = user.Username, 
                source = string.IsNullOrEmpty(user.AdSid) ? "Lokal" : "AD / Active Directory" 
            });
        }

        [HttpDelete("{email}")]
        public async Task<IActionResult> DeleteMember(string email) {
            var user = await _db.SysUsers.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (user == null) return NotFound(new { error = "Benutzer nicht gefunden." });

            _db.SysUsers.Remove(user);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Benutzer gelöscht." });
        }
    }

    public class MemberRequestDto {
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? Role { get; set; }
        public string? Source { get; set; }
    }
}
`);
}
