import JSZip from "jszip";

export function generateBackupController(zip: JSZip) {
  zip.file("Controllers/BackupController.cs", `using Microsoft.AspNetCore.Mvc;
using DBStudioBackend.Data;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/backup")]
    public class BackupController : ControllerBase {
        private readonly MetaDbContext _db;
        public BackupController(MetaDbContext db) => _db = db;

        private static readonly List<object> _scheduledBackups = new List<object> {
            new { id = "sch_daily", name = "Tägliches DB Backup (Nacht)", schedule = "0 2 * * *", target = "FTP Storage (firma.de)", status = "AKTIV", lastRun = DateTime.Now.AddDays(-1).AddHours(2).ToString("g") },
            new { id = "sch_weekly", name = "Wöchentliches Cloud Backup", schedule = "0 4 * * 0", target = "AWS S3 Glaciers", status = "AKTIV", lastRun = DateTime.Now.AddDays(-5).AddHours(4).ToString("g") }
        };

        [HttpGet("scheduled")]
        public IActionResult GetScheduled() => Ok(_scheduledBackups);

        [HttpPost("scheduled")]
        public IActionResult CreateScheduled([FromBody] JsonElement body) {
            string name = body.TryGetProperty("name", out var n) ? n.GetString() ?? "Backup" : "Backup";
            string schedule = body.TryGetProperty("schedule", out var s) ? s.GetString() ?? "* * * * *" : "* * * * *";
            string target = body.TryGetProperty("target", out var t) ? t.GetString() ?? "FTP" : "FTP";

            var item = new {
                id = "sch_" + Guid.NewGuid().ToString().Substring(0, 6),
                name,
                schedule,
                target,
                status = "AKTIV",
                lastRun = "-"
            };
            _scheduledBackups.Add(item);
            return StatusCode(201, item);
        }

        [HttpDelete("scheduled/{id}")]
        public IActionResult DeleteScheduled(string id) {
            var found = _scheduledBackups.FirstOrDefault(x => ((dynamic)x).id == id);
            if (found != null) {
                _scheduledBackups.Remove(found);
                return Ok(new { success = true });
            }
            return NotFound();
        }

        [HttpPost("export")]
        public async Task<IActionResult> ExportSqlScript([FromBody] ExportRequestDto dto) {
            var lines = new List<string> {
                $"-- ========================================================",
                $"-- DB Studio Pro - SQL Schema & Data Export",
                $"-- Target Engine: {dto.Engine?.ToUpper() ?? "POSTGRESQL"}",
                $"-- Export Time: {DateTime.Now:F}",
                $"-- Project ID: {dto.ProjectId ?? "default"}",
                $"-- ========================================================\\n",
                "SET FOREIGN_KEY_CHECKS = 0;\\n"
            };

            var payload = await _db.SysProjectPayloads.FindAsync(dto.ProjectId ?? "proj_default");
            if (payload != null && !string.IsNullOrEmpty(payload.DataJson)) {
                try {
                    using var doc = JsonDocument.Parse(payload.DataJson);
                    if (doc.RootElement.TryGetProperty("tables", out var tablesProp) && tablesProp.ValueKind == JsonValueKind.Array) {
                        foreach (var table in tablesProp.EnumerateArray()) {
                            var tableName = table.GetProperty("name").GetString() ?? "Table";
                            lines.Add($"-- Table structure for {tableName}");
                            lines.Add($"DROP TABLE IF EXISTS \\\"{tableName}\\\";");
                            lines.Add($"CREATE TABLE \\\"{tableName}\\\" (");

                            var cols = new List<string>();
                            if (table.TryGetProperty("fields", out var fieldsProp) && fieldsProp.ValueKind == JsonValueKind.Array) {
                                foreach (var field in fieldsProp.EnumerateArray()) {
                                    var fName = field.GetProperty("name").GetString();
                                    var fType = field.GetProperty("type").GetString() ?? "VARCHAR(255)";
                                    var isPk = field.TryGetProperty("isPrimaryKey", out var pk) && pk.GetBoolean();
                                    
                                    var colDef = $"  \\\"{fName}\\\" {fType}";
                                    if (isPk) colDef += " PRIMARY KEY";
                                    cols.Add(colDef);
                                }
                            }
                            lines.Add(string.Join(",\\n", cols));
                            lines.Add($");\\n");
                        }
                    }
                } catch {}
            }

            lines.Add("SET FOREIGN_KEY_CHECKS = 1;");
            var script = string.Join("\\n", lines);

            return Ok(new {
                success = true,
                engine = dto.Engine,
                script = script,
                fileName = $"db_studio_export_{dto.Engine?.ToLower()}_{DateTime.Now:yyyyMMdd_HHmmss}.sql"
            });
        }
    }

    public class ExportRequestDto {
        public string? ProjectId { get; set; }
        public string? Engine { get; set; }
    }
}
`);
}
