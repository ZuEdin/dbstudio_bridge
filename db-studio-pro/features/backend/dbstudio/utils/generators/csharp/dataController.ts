import JSZip from "jszip";

export function generateDataController(zip: JSZip) {
  zip.file("Controllers/DataController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DBStudioBackend.Data;
using DBStudioBackend.Models;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataController : ControllerBase {
        private readonly MetaDbContext _db;
        public DataController(MetaDbContext db) => _db = db;

        [HttpGet("{tableName}")]
        public async Task<IActionResult> GetTableData(string tableName, [FromQuery] string? projectId) {
            var projId = projectId ?? "proj_default";
            var rows = await _db.SysTableData
                .Where(r => r.TableName == tableName && r.ProjectId == projId)
                .ToListAsync();

            var records = rows.Select(r => {
                try {
                    return JsonSerializer.Deserialize<object>(r.DataJson);
                } catch {
                    return r.DataJson;
                }
            }).Where(r => r != null).ToList();

            return Ok(records);
        }

        [HttpPost("{tableName}")]
        public async Task<IActionResult> InsertOrUpdateTableData(string tableName, [FromBody] JsonElement record, [FromQuery] string? projectId) {
            string recId = "rec_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            
            if (record.TryGetProperty("id", out var idProp)) {
                recId = idProp.ToString();
            }

            var projId = projectId ?? "proj_default";
            if (record.TryGetProperty("projectId", out var projProp)) {
                projId = projProp.ToString();
            }

            string sysId = \`\${tableName}_\${recId}\`;
            var dataStr = record.ToString();

            var existing = await _db.SysTableData.FindAsync(sysId);
            if (existing == null) {
                _db.SysTableData.Add(new SysTableData {
                    Id = sysId,
                    ProjectId = projId,
                    TableName = tableName,
                    RecordId = recId,
                    DataJson = dataStr
                });
            } else {
                existing.DataJson = dataStr;
                _db.Entry(existing).State = EntityState.Modified;
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, recordId = recId });
        }
    }
}
`);
}
