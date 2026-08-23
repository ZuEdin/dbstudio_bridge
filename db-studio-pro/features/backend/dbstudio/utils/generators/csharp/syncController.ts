import JSZip from "jszip";

export function generateSyncController(zip: JSZip) {
  zip.file("Controllers/SyncController.cs", `using Microsoft.AspNetCore.Mvc;
using DBStudioBackend.Data;
using DBStudioBackend.Models;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SyncController : ControllerBase {
        private readonly MetaDbContext _db;
        public SyncController(MetaDbContext db) => _db = db;

        [HttpPost]
        public async Task<IActionResult> Sync([FromBody] SyncDto dto) {
            var syncId = "sync_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var metaStr = dto.Metadata != null ? JsonSerializer.Serialize(dto.Metadata) : "{}";

            var history = new SysSyncHistory {
                Id = syncId,
                ProjectId = dto.ProjectId ?? "proj_default",
                UserId = "admin",
                SyncType = "LOCAL_TO_CLOUD",
                ImplementationPrompt = dto.Prompt ?? "Sync",
                MetadataPayload = metaStr
            };

            _db.SysSyncHistory.Add(history);
            await _db.SaveChangesAsync();

            return Ok(new { 
                success = true, 
                syncId = syncId, 
                message = "DB Studio Metadaten & IndexedDB erfolgreich synchronisiert" 
            });
        }
    }

    public class SyncDto {
        public string? ProjectId { get; set; }
        public string? Prompt { get; set; }
        public object? Metadata { get; set; }
    }
}
`);
}
