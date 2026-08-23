import JSZip from "jszip";

export function generateProjectsController(zip: JSZip) {
  zip.file("Controllers/ProjectsController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using DBStudioBackend.Data;
using DBStudioBackend.Models;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/team/projects")]
    public class ProjectsController : ControllerBase {
        private readonly MetaDbContext _db;
        private readonly IConfiguration _config;

        public ProjectsController(MetaDbContext db, IConfiguration config) {
            _db = db;
            _config = config;
        }

        private string GetDefaultDomain() {
            var domain = _config["ActiveDirectory:DefaultEmailDomain"] ?? _config["ActiveDirectory:DomainName"] ?? "firma.de";
            domain = domain.TrimStart('@');
            if (!domain.Contains(".")) domain += ".de";
            return domain;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects() {
            var projects = await _db.SysProjects.ToListAsync();
            var users = await _db.SysUsers.ToListAsync();
            var domain = GetDefaultDomain();
            
            var result = projects.Select(p => {
                var ownerUser = users.FirstOrDefault(u => u.Id == p.OwnerId || u.Email == p.OwnerId || u.Username == p.OwnerId);
                var ownerName = ownerUser?.Username ?? (!string.IsNullOrEmpty(p.OwnerId) ? p.OwnerId : "Administrator");
                var cleanOwner = ownerName.ToLower().Replace(" ", ".").Replace("\\\\", ".");
                var ownerEmail = ownerUser?.Email ?? (ownerName.Contains("@") ? ownerName : \`\${cleanOwner}@\${domain}\`);
                
                return new {
                    id = p.Id,
                    name = p.Name,
                    description = p.Description,
                    status = "AKTIV",
                    isCloud = p.IsCloud == 1,
                    dbType = p.DbType,
                    language = p.Language,
                    owner = ownerName,
                    ownerEmail = ownerEmail,
                    created = p.LastModified,
                    memberCount = 1,
                    teamMembers = new[] {
                        new {
                            id = "mem_owner",
                            email = ownerEmail,
                            name = ownerName,
                            role = "Projekt-Owner",
                            status = "AKTIV"
                        }
                    }
                };
            }).ToList();
            
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(string id) {
            var proj = await _db.SysProjects.FindAsync(id);
            if (proj == null) proj = await _db.SysProjects.FirstOrDefaultAsync(p => p.Id == id);
            if (proj == null) return NotFound(new { error = "Projekt nicht gefunden" });
            
            var payload = await _db.SysProjectPayloads.FirstOrDefaultAsync(p => p.ProjectId == id);
            
            object? data = null;
            if (payload != null && !string.IsNullOrEmpty(payload.DataJson)) {
                try {
                    data = System.Text.Json.JsonSerializer.Deserialize<object>(payload.DataJson);
                } catch {
                    data = payload.DataJson;
                }
            }

            var users = await _db.SysUsers.ToListAsync();
            var domain = GetDefaultDomain();
            var ownerUser = users.FirstOrDefault(u => u.Id == proj.OwnerId || u.Email == proj.OwnerId || u.Username == proj.OwnerId);
            var ownerName = ownerUser?.Username ?? (!string.IsNullOrEmpty(proj.OwnerId) ? proj.OwnerId : "Administrator");
            var ownerEmail = ownerUser?.Email ?? (ownerName.Contains("@") ? ownerName : \`\${ownerName.ToLower()}@\${domain}\`);

            return Ok(new { 
                id = proj.Id,
                name = proj.Name,
                description = proj.Description,
                dbType = proj.DbType,
                language = proj.Language,
                isCloud = proj.IsCloud == 1,
                ownerId = proj.OwnerId,
                ownerEmail = ownerEmail,
                lastModified = proj.LastModified,
                data = data
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrUpdateProject([FromBody] ProjectDto dto) {
            var projectId = dto.Id;
            if (string.IsNullOrEmpty(projectId)) {
                projectId = "proj_" + Guid.NewGuid().ToString().Substring(0, 8);
            }
            
            var proj = await _db.SysProjects.FindAsync(projectId);
            if (proj == null) proj = await _db.SysProjects.FirstOrDefaultAsync(p => p.Id == projectId);
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            var domain = GetDefaultDomain();
            var ownerName = !string.IsNullOrEmpty(dto.OwnerName) ? dto.OwnerName : (!string.IsNullOrEmpty(dto.OwnerId) ? dto.OwnerId : "Administrator");
            var ownerEmail = !string.IsNullOrEmpty(dto.OwnerEmail) ? dto.OwnerEmail : (ownerName.Contains("@") ? ownerName : \`\${ownerName.ToLower()}@\${domain}\`);

            if (proj == null) {
                proj = new SysProject {
                    Id = projectId,
                    Name = !string.IsNullOrEmpty(dto.Name) ? dto.Name : "Neues Projekt",
                    Description = dto.Description ?? "",
                    DbType = dto.DbType ?? "SQLite",
                    Language = dto.Language ?? "csharp",
                    IsCloud = dto.IsCloud,
                    OwnerId = ownerName,
                    LastModified = now
                };
                _db.SysProjects.Add(proj);
            } else {
                proj.Name = !string.IsNullOrEmpty(dto.Name) ? dto.Name : proj.Name;
                proj.Description = dto.Description ?? proj.Description;
                proj.DbType = dto.DbType ?? proj.DbType;
                proj.Language = dto.Language ?? proj.Language;
                proj.IsCloud = dto.IsCloud == 1 ? 1 : proj.IsCloud;
                proj.OwnerId = ownerName;
                proj.LastModified = now;
            }

            await _db.SaveChangesAsync();

            if (dto.Data != null) {
                var payloadStr = System.Text.Json.JsonSerializer.Serialize(dto.Data);
                var payload = await _db.SysProjectPayloads.FindAsync(proj.Id);
                if (payload == null) payload = await _db.SysProjectPayloads.FirstOrDefaultAsync(p => p.ProjectId == proj.Id);
                if (payload == null) {
                    payload = new SysPayload {
                        ProjectId = proj.Id,
                        DataJson = payloadStr
                    };
                    _db.SysProjectPayloads.Add(payload);
                } else {
                    payload.DataJson = payloadStr;
                }
                await _db.SaveChangesAsync();
            }

            return StatusCode(201, new { 
                id = proj.Id,
                name = proj.Name, 
                description = proj.Description,
                status = "AKTIV",
                isCloud = proj.IsCloud == 1,
                created = proj.LastModified,
                owner = ownerName,
                ownerEmail = ownerEmail,
                memberCount = 1,
                teamMembers = new[] {
                    new {
                        id = "mem_owner",
                        email = ownerEmail,
                        name = ownerName,
                        role = "Projekt-Owner",
                        status = "AKTIV"
                    }
                }
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(string id) {
            var proj = await _db.SysProjects.FindAsync(id);
            if (proj == null) proj = await _db.SysProjects.FirstOrDefaultAsync(p => p.Id == id);
            if (proj == null) return NotFound(new { error = "Projekt nicht gefunden" });

            var payload = await _db.SysProjectPayloads.FirstOrDefaultAsync(p => p.ProjectId == id);
            if (payload != null) _db.SysProjectPayloads.Remove(payload);

            _db.SysProjects.Remove(proj);
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddProjectMember(string id, [FromBody] ProjectMemberRequest dto) {
            var proj = await _db.SysProjects.FindAsync(id);
            if (proj == null) return NotFound(new { error = "Projekt nicht gefunden." });

            var memberId = "mem_" + Guid.NewGuid().ToString().Substring(0, 8);
            var newMember = new {
                id = memberId,
                email = dto.Email ?? "user@company.com",
                name = dto.Name ?? "Teammitglied",
                role = dto.Role ?? "Entwickler",
                status = "AKTIV",
                joinedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            return StatusCode(201, new { 
                success = true, 
                member = newMember,
                project = new {
                    id = proj.Id,
                    name = proj.Name,
                    isCloud = proj.IsCloud == 1
                }
            });
        }

        [HttpDelete("{id}/members/{memberId}")]
        public async Task<IActionResult> RemoveProjectMember(string id, string memberId) {
            var proj = await _db.SysProjects.FindAsync(id);
            if (proj == null) return NotFound(new { error = "Projekt nicht gefunden." });

            return Ok(new { 
                success = true, 
                message = "Mitglied erfolgreich entfernt.",
                project = new {
                    id = proj.Id,
                    name = proj.Name,
                    isCloud = proj.IsCloud == 1
                }
            });
        }
    }

    public class ProjectMemberRequest {
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? Role { get; set; }
    }

    public class ProjectDto {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? DbType { get; set; }
        public string? Language { get; set; }
        public int IsCloud { get; set; }
        public string? OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public string? OwnerEmail { get; set; }
        public object? Data { get; set; }
    }
}
`);
}
