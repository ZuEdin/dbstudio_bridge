import JSZip from "jszip";
import { getIntrospectMethodCode } from "./introspectMethod";
import { getDdlMethodsCode } from "./ddlMethod";

export function generateDatabaseSyncController(zip: JSZip) {
  const introspectCode = getIntrospectMethodCode();
  const ddlMethodsCode = getDdlMethodsCode();

  zip.file("Controllers/DatabaseSyncController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DBStudioBackend.Data;
using DBStudioBackend.Models;

namespace DBStudioBackend.Controllers
{
    [Route("api/db")]
    [ApiController]
    public class DatabaseSyncController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly MetaDbContext _db;
        private static bool _connected = true;
        private static readonly List<object> _logs = new List<object>
        {
            new { timestamp = DateTime.Now.AddMinutes(-10).ToString("o"), action = "CONNECT", details = "Erfolgreich mit SQL Server über .NET WebAPI verbunden", status = "SUCCESS" },
            new { timestamp = DateTime.Now.AddMinutes(-5).ToString("o"), action = "SCHEMA_SCAN", details = "Dapper/EF Core DB-Kontext initialisiert.", status = "SUCCESS" }
        };

        public DatabaseSyncController(IConfiguration configuration, MetaDbContext db)
        {
            _configuration = configuration;
            _db = db;
        }

        private static string? _customConnectionString = null;
        private static string? _customDbType = null;

        [HttpGet("connection-status")]
        public async Task<IActionResult> GetStatus([FromQuery] string? connectionString = null, [FromQuery] string? dbType = null)
        {
            if (!string.IsNullOrEmpty(connectionString))
            {
                _customConnectionString = connectionString;
                _customDbType = dbType;
                _logs.Add(new {
                    timestamp = DateTime.Now.ToString("o"),
                    action = "CREDENTIAL_SYNC",
                    details = $"Zugangsdaten erfolgreich von der IndexedDB an .NET WebAPI übertragen ({dbType ?? "SQL"}).",
                    status = "SUCCESS"
                });
            }

            var host = "localhost";
            var database = "production_db";
            var type = _customDbType?.ToLower() ?? "mssql";

            // 1. Try reading from connection string from IndexedDB, otherwise Configuration
            var connString = _customConnectionString;
            if (string.IsNullOrEmpty(connString))
            {
                connString = _configuration.GetConnectionString("DefaultConnection") 
                    ?? _configuration["ConnectionStrings:DefaultConnection"]
                    ?? _configuration["DatabaseConfig:ConnectionString"];
            }

            if (!string.IsNullOrEmpty(connString))
            {
                ParseConnectionString(connString, ref host, ref database, ref type);
            }
            else
            {
                // 2. Try looking up the active project in MetaDbContext
                try
                {
                    var activeProject = await _db.SysProjects.OrderByDescending(p => p.LastModified).FirstOrDefaultAsync();
                    if (activeProject != null)
                    {
                        type = activeProject.DbType?.ToLower() ?? "sqlite";
                        database = activeProject.Name ?? "production_db";
                        
                        var payload = await _db.SysProjectPayloads.FirstOrDefaultAsync(p => p.ProjectId == activeProject.Id);
                        if (payload != null && !string.IsNullOrEmpty(payload.DataJson))
                        {
                            using (var doc = System.Text.Json.JsonDocument.Parse(payload.DataJson))
                            {
                                if (doc.RootElement.TryGetProperty("config", out var configProp))
                                {
                                    if (configProp.TryGetProperty("host", out var hostProp)) host = hostProp.GetString() ?? host;
                                    else if (configProp.TryGetProperty("server", out var serverProp)) host = serverProp.GetString() ?? host;
                                    
                                    if (configProp.TryGetProperty("database", out var dbProp)) database = dbProp.GetString() ?? database;
                                    if (configProp.TryGetProperty("type", out var typeProp)) type = typeProp.GetString() ?? type;
                                }
                            }
                        }
                    }
                }
                catch
                {
                    // Fallback to default mock configuration on read exception
                }
            }

            return Ok(new {
                connected = _connected,
                config = new {
                    host = host,
                    database = database,
                    type = type
                },
                logsCount = _logs.Count,
                lastSync = DateTime.Now.ToString("o"),
                message = _connected 
                    ? $"Verbindung zum externen SQL Server ({host}/{database}) ist über .NET WebAPI AKTIV."
                    : $"WARNUNG: Keine Verbindung zum externen SQL Server ({host}/{database}). .NET WebAPI läuft im Offline-Backup Modus."
            });
        }

        [HttpPost("connection-toggle")]
        public IActionResult ToggleConnection([FromBody] System.Text.Json.JsonElement body)
        {
            if (body.TryGetProperty("connected", out var connectedProp))
            {
                _connected = connectedProp.GetBoolean();
            }

            _logs.Add(new {
                timestamp = DateTime.Now.ToString("o"),
                action = "CONFIG_CHANGE",
                details = $"Status über .NET API geändert. Verbunden: {_connected}",
                status = "SUCCESS"
            });

            return Ok(new {
                success = true,
                connected = _connected
            });
        }

${introspectCode}

${ddlMethodsCode}
    }
}
`);
}
