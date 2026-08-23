import JSZip from "jszip";

export function generateBackendApisController(zip: JSZip) {
  zip.file("Controllers/BackendApisController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DBStudioBackend.Data;
using DBStudioBackend.Models;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/backend-apis")]
    public class BackendApisController : ControllerBase {
        private readonly MetaDbContext _db;
        private readonly IHttpClientFactory _clientFactory;

        public BackendApisController(MetaDbContext db, IHttpClientFactory clientFactory) {
            _db = db;
            _clientFactory = clientFactory;
        }

        [HttpGet]
        public async Task<IActionResult> GetConfigs() {
            return Ok(await _db.BackendApiConfigs.ToListAsync());
        }

        [HttpPost]
        public async Task<IActionResult> RegisterConfig([FromBody] BackendApiConfig config) {
            if (string.IsNullOrEmpty(config.Name) || string.IsNullOrEmpty(config.Url)) {
                return BadRequest(new { error = "Name und URL sind erforderlich." });
            }

            var existing = await _db.BackendApiConfigs.FirstOrDefaultAsync(c => c.Name.ToLower() == config.Name.ToLower());
            config.LastSync = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            if (existing != null) {
                existing.Url = config.Url;
                existing.Method = config.Method;
                existing.Headers = config.Headers;
                existing.QueryParams = config.QueryParams;
                existing.Option = config.Option;
                existing.RefreshInterval = config.RefreshInterval;
                existing.Fields = config.Fields;
                existing.LastSync = config.LastSync;
                existing.AuthType = config.AuthType;
                existing.AuthApiKeyName = config.AuthApiKeyName;
                existing.AuthApiKeyValue = config.AuthApiKeyValue;
                existing.AuthApiKeyPrefix = config.AuthApiKeyPrefix;
                existing.AuthApiKeyLocation = config.AuthApiKeyLocation;
                existing.AuthBearerToken = config.AuthBearerToken;
                existing.AuthUsername = config.AuthUsername;
                existing.AuthPassword = config.AuthPassword;
                _db.Entry(existing).State = EntityState.Modified;
            } else {
                config.Id = string.IsNullOrEmpty(config.Id) ? Guid.NewGuid().ToString() : config.Id;
                _db.BackendApiConfigs.Add(config);
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, config });
        }

        [HttpDelete("{name}")]
        public async Task<IActionResult> DeleteConfig(string name) {
            var config = await _db.BackendApiConfigs.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
            if (config == null) return NotFound();

            _db.BackendApiConfigs.Remove(config);
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("{name}/refresh")]
        public async Task<IActionResult> RefreshCache(string name) {
            var config = await _db.BackendApiConfigs.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
            if (config == null) return NotFound(new { error = "API-Konfiguration nicht gefunden." });

            try {
                var data = await FetchExternalData(config);
                config.LastSync = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                
                var sysId = $"cached_api_{config.Name.ToLower()}";
                var cachedRow = await _db.SysTableData.FindAsync(sysId);
                var dataStr = JsonSerializer.Serialize(data);
                
                if (cachedRow == null) {
                    _db.SysTableData.Add(new SysTableData {
                        Id = sysId,
                        ProjectId = "proj_default",
                        TableName = $"cached_api_{config.Name.ToLower()}",
                        RecordId = "cache",
                        DataJson = dataStr
                    });
                } else {
                    cachedRow.DataJson = dataStr;
                }

                await _db.SaveChangesAsync();
                return Ok(new { success = true, count = data.Count, data });
            } catch (Exception ex) {
                return StatusCode(500, new { error = $"Synchronisierungsfehler: {ex.Message}" });
            }
        }

        [HttpGet("{name}/data")]
        public async Task<IActionResult> GetData(string name) {
            var config = await _db.BackendApiConfigs.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
            if (config == null) return NotFound(new { error = "API-Konfiguration nicht gefunden." });

            if (config.Option == "A") {
                try {
                    var data = await FetchExternalData(config);
                    return Ok(data);
                } catch (Exception ex) {
                    return StatusCode(500, new { error = ex.Message });
                }
            } else {
                var sysId = $"cached_api_{config.Name.ToLower()}";
                var cachedRow = await _db.SysTableData.FindAsync(sysId);
                if (cachedRow != null) {
                    var list = JsonSerializer.Deserialize<List<object>>(cachedRow.DataJson);
                    return Ok(list ?? new List<object>());
                }

                try {
                    var data = await FetchExternalData(config);
                    _db.SysTableData.Add(new SysTableData {
                        Id = sysId,
                        ProjectId = "proj_default",
                        TableName = $"cached_api_{config.Name.ToLower()}",
                        RecordId = "cache",
                        DataJson = JsonSerializer.Serialize(data)
                    });
                    config.LastSync = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    await _db.SaveChangesAsync();
                    return Ok(data);
                } catch (Exception ex) {
                    return StatusCode(500, new { error = ex.Message });
                }
            }
        }

        [HttpPut("{name}/data")]
        public async Task<IActionResult> UpdateCacheData(string name, [FromBody] List<object> data) {
            var sysId = $"cached_api_{name.ToLower()}";
            var cachedRow = await _db.SysTableData.FindAsync(sysId);
            var dataStr = JsonSerializer.Serialize(data);

            if (cachedRow == null) {
                _db.SysTableData.Add(new SysTableData {
                    Id = sysId,
                    ProjectId = "proj_default",
                    TableName = $"cached_api_{name.ToLower()}",
                    RecordId = "cache",
                    DataJson = dataStr
                });
            } else {
                cachedRow.DataJson = dataStr;
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, count = data.Count });
        }

        private async Task<List<object>> FetchExternalData(BackendApiConfig config) {
            var client = _clientFactory.CreateClient();
            var url = config.Url;

            if (!string.IsNullOrEmpty(config.QueryParams) && config.QueryParams != "[]") {
                try {
                    var doc = JsonDocument.Parse(config.QueryParams);
                    var list = new List<string>();
                    foreach (var element in doc.RootElement.EnumerateArray()) {
                        var isActive = !element.TryGetProperty("isActive", out var act) || act.GetBoolean();
                        if (isActive) {
                            var key = element.TryGetProperty("key", out var k) ? k.GetString() : (element.TryGetProperty("name", out var n) ? n.GetString() : null);
                            var val = element.TryGetProperty("value", out var v) ? v.GetString() : null;
                            if (!string.IsNullOrEmpty(key) && val != null) {
                                list.Add(\`\${Uri.EscapeDataString(key)}=\${Uri.EscapeDataString(val)}\`);
                            }
                        }
                    }
                    if (list.Count > 0) {
                        url += (url.Contains("?") ? "&" : "?") + string.Join("&", list);
                    }
                } catch {}
            }

            var request = new HttpRequestMessage(new HttpMethod(config.Method ?? "GET"), url);

            if (config.AuthType == "bearer" && !string.IsNullOrEmpty(config.AuthBearerToken)) {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", config.AuthBearerToken);
            } else if (config.AuthType == "apiKey" && config.AuthApiKeyLocation == "header" && !string.IsNullOrEmpty(config.AuthApiKeyName)) {
                var prefix = config.AuthApiKeyPrefix ?? "";
                request.Headers.Add(config.AuthApiKeyName, \`\${prefix}\${config.AuthApiKeyValue}\`);
            } else if (config.AuthType == "basic" && (!string.IsNullOrEmpty(config.AuthUsername) || !string.IsNullOrEmpty(config.AuthPassword))) {
                var authBytes = System.Text.Encoding.UTF8.GetBytes(\`\${config.AuthUsername}:\${config.AuthPassword}\`);
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
            }

            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            
            using var docResult = JsonDocument.Parse(content);
            if (docResult.RootElement.ValueKind == JsonValueKind.Array) {
                return JsonSerializer.Deserialize<List<object>>(content) ?? new List<object>();
            } else if (docResult.RootElement.ValueKind == JsonValueKind.Object) {
                foreach (var prop in docResult.RootElement.EnumerateObject()) {
                    if (prop.Value.ValueKind == JsonValueKind.Array) {
                        return JsonSerializer.Deserialize<List<object>>(prop.Value.GetRawText()) ?? new List<object>();
                    }
                }
                var single = JsonSerializer.Deserialize<object>(content);
                return single != null ? new List<object> { single } : new List<object>();
            }

            return new List<object>();
        }
    }
}
`);
}
