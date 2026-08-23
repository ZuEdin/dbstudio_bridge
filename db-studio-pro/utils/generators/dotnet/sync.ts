import { Table, BackendConfig, VirtualFile } from '../../../types/index';
import { toPascalCase, toCamelCase } from '../common';

export const generateDotNetSync = (
  tables: Table[],
  config: BackendConfig,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');

  // 1. Sync DTO Models (Models/SyncModels.cs)
  const syncModelsContent = `using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ${safeNamespace}.Models
{
    public class SyncStatusDto
    {
        public bool IsOnline { get; set; } = true;
        public string ServerTimestamp { get; set; } = DateTime.UtcNow.ToString("o");
        public string ServerVersion { get; set; } = "1.0.0";
        public List<string> SupportedTables { get; set; } = new();
    }

    public class SyncPushDto
    {
        public string ClientId { get; set; } = string.Empty;
        public Dictionary<string, TableSyncPushDataDto> Changes { get; set; } = new();
    }

    public class TableSyncPushDataDto
    {
        public List<Dictionary<string, object>> Upserted { get; set; } = new();
        public List<object> DeletedIds { get; set; } = new();
    }

    public class SyncPushResultDto
    {
        public bool Success { get; set; }
        public int AppliedCount { get; set; }
        public string ServerTimestamp { get; set; } = DateTime.UtcNow.ToString("o");
        public List<string> Errors { get; set; } = new();
    }

    public class SyncPullDto
    {
        public string ClientId { get; set; } = string.Empty;
        public string? Since { get; set; }
        public List<string>? Tables { get; set; }
    }

    public class SyncPullResultDto
    {
        public bool Success { get; set; }
        public string ServerTimestamp { get; set; } = DateTime.UtcNow.ToString("o");
        public Dictionary<string, TableSyncPullDataDto> Changes { get; set; } = new();
    }

    public class TableSyncPullDataDto
    {
        public List<Dictionary<string, object>> Upserted { get; set; } = new();
        public List<object> DeletedIds { get; set; } = new();
    }
}
`;

  files.push({
    name: 'SyncModels.cs',
    path: `${root}/Models/SyncModels.cs`,
    content: syncModelsContent,
    language: 'csharp'
  });

  // 2. Sync Controller (Controllers/SyncController.cs)
  const tableNamesArray = tables.map(t => `"${toPascalCase(t.name)}"`).join(', ');

  const syncControllerContent = `using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using ${safeNamespace}.Data;
using ${safeNamespace}.Models;

namespace ${safeNamespace}.Controllers
{
    [Route("api/sync")]
    [ApiController]
    public class SyncController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly List<string> _supportedTables = new() { ${tableNamesArray} };

        public SyncController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new SyncStatusDto
            {
                IsOnline = true,
                ServerTimestamp = DateTime.UtcNow.ToString("o"),
                SupportedTables = _supportedTables
            });
        }

        [HttpPost("push")]
        public async Task<ActionResult<SyncPushResultDto>> PushChanges([FromBody] SyncPushDto dto)
        {
            if (dto == null || dto.Changes == null)
            {
                return BadRequest(new SyncPushResultDto { Success = false, Errors = { "Invalid payload." } });
            }

            var result = new SyncPushResultDto { Success = true };
            var applied = 0;

            var connection = _context.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var serverNow = DateTime.UtcNow;

                foreach (var (rawTable, data) in dto.Changes)
                {
                    var matchedTable = _supportedTables.FirstOrDefault(t => 
                        string.Equals(t, rawTable, StringComparison.OrdinalIgnoreCase));
                    if (matchedTable == null) continue;

                    // 1. Process Soft-Deletes
                    if (data.DeletedIds != null && data.DeletedIds.Count > 0)
                    {
                        foreach (var delId in data.DeletedIds)
                        {
                            var idVal = delId?.ToString();
                            if (string.IsNullOrEmpty(idVal)) continue;

                            using var cmd = connection.CreateCommand();
                            cmd.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                            cmd.CommandText = $"UPDATE [{matchedTable}] SET [_is_deleted] = 1, [_updated_at] = @p_updated WHERE [id] = @p_id OR [Id] = @p_id OR [ID] = @p_id";
                            
                            var pUp = cmd.CreateParameter();
                            pUp.ParameterName = "@p_updated";
                            pUp.Value = serverNow;
                            cmd.Parameters.Add(pUp);

                            var pId = cmd.CreateParameter();
                            pId.ParameterName = "@p_id";
                            pId.Value = idVal;
                            cmd.Parameters.Add(pId);

                            try
                            {
                                var rows = await cmd.ExecuteNonQueryAsync();
                                applied += rows;
                            }
                            catch
                            {
                                // Fallback for databases without soft-delete columns: attempt standard delete
                                using var hardDelCmd = connection.CreateCommand();
                                hardDelCmd.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                                hardDelCmd.CommandText = $"DELETE FROM [{matchedTable}] WHERE [id] = @p_id OR [Id] = @p_id OR [ID] = @p_id";
                                var pId2 = hardDelCmd.CreateParameter();
                                pId2.ParameterName = "@p_id";
                                pId2.Value = idVal;
                                hardDelCmd.Parameters.Add(pId2);
                                applied += await hardDelCmd.ExecuteNonQueryAsync();
                            }
                        }
                    }

                    // 2. Process Upserts (Last-Write-Wins)
                    if (data.Upserted != null && data.Upserted.Count > 0)
                    {
                        foreach (var record in data.Upserted)
                        {
                            if (record == null || record.Count == 0) continue;

                            // Standardize keys
                            var pkKey = record.Keys.FirstOrDefault(k => string.Equals(k, "id", StringComparison.OrdinalIgnoreCase) || string.Equals(k, "Id", StringComparison.OrdinalIgnoreCase)) ?? record.Keys.First();
                            var pkValue = record[pkKey]?.ToString();

                            // Inject Sync metadata
                            record["_updated_at"] = serverNow.ToString("o");
                            record["_is_deleted"] = 0;
                            if (!string.IsNullOrEmpty(dto.ClientId))
                            {
                                record["_client_id"] = dto.ClientId;
                            }

                            // Check if row exists
                            bool exists = false;
                            if (!string.IsNullOrEmpty(pkValue))
                            {
                                using var checkCmd = connection.CreateCommand();
                                checkCmd.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                                checkCmd.CommandText = $"SELECT COUNT(1) FROM [{matchedTable}] WHERE [{pkKey}] = @p_id";
                                var pCheck = checkCmd.CreateParameter();
                                pCheck.ParameterName = "@p_id";
                                pCheck.Value = pkValue;
                                checkCmd.Parameters.Add(pCheck);

                                var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                                exists = count > 0;
                            }

                            using var mutationCmd = connection.CreateCommand();
                            mutationCmd.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();

                            if (exists)
                            {
                                // UPDATE
                                var setClauses = new List<string>();
                                var pIdx = 0;
                                foreach (var (col, val) in record)
                                {
                                    if (string.Equals(col, pkKey, StringComparison.OrdinalIgnoreCase)) continue;
                                    var pName = $"@p{pIdx++}";
                                    setClauses.Add($"[{col}] = {pName}");

                                    var param = mutationCmd.CreateParameter();
                                    param.ParameterName = pName;
                                    param.Value = NormalizeDbValue(val);
                                    mutationCmd.Parameters.Add(param);
                                }

                                var pPkName = $"@p{pIdx}";
                                var pkParam = mutationCmd.CreateParameter();
                                pkParam.ParameterName = pPkName;
                                pkParam.Value = pkValue!;
                                mutationCmd.Parameters.Add(pkParam);

                                mutationCmd.CommandText = $"UPDATE [{matchedTable}] SET {string.Join(", ", setClauses)} WHERE [{pkKey}] = {pPkName}";
                                applied += await mutationCmd.ExecuteNonQueryAsync();
                            }
                            else
                            {
                                // INSERT
                                var cols = new List<string>();
                                var valPlaceholders = new List<string>();
                                var pIdx = 0;

                                foreach (var (col, val) in record)
                                {
                                    cols.Add($"[{col}]");
                                    var pName = $"@p{pIdx++}";
                                    valPlaceholders.Add(pName);

                                    var param = mutationCmd.CreateParameter();
                                    param.ParameterName = pName;
                                    param.Value = NormalizeDbValue(val);
                                    mutationCmd.Parameters.Add(param);
                                }

                                mutationCmd.CommandText = $"INSERT INTO [{matchedTable}] ({string.Join(", ", cols)}) VALUES ({string.Join(", ", valPlaceholders)})";
                                applied += await mutationCmd.ExecuteNonQueryAsync();
                            }
                        }
                    }
                }

                await transaction.CommitAsync();
                result.AppliedCount = applied;
                result.ServerTimestamp = serverNow.ToString("o");
                return Ok(result);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                result.Success = false;
                result.Errors.Add(ex.Message);
                return StatusCode(500, result);
            }
        }

        [HttpPost("pull")]
        public async Task<ActionResult<SyncPullResultDto>> PullChanges([FromBody] SyncPullDto dto)
        {
            var serverNow = DateTime.UtcNow;
            var result = new SyncPullResultDto
            {
                Success = true,
                ServerTimestamp = serverNow.ToString("o")
            };

            DateTime? sinceDate = null;
            if (!string.IsNullOrEmpty(dto.Since) && DateTime.TryParse(dto.Since, out var parsed))
            {
                sinceDate = parsed.ToUniversalTime();
            }

            var connection = _context.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
            }

            var targetTables = dto.Tables != null && dto.Tables.Count > 0
                ? _supportedTables.Where(t => dto.Tables.Any(req => string.Equals(req, t, StringComparison.OrdinalIgnoreCase))).ToList()
                : _supportedTables;

            foreach (var table in targetTables)
            {
                var tableData = new TableSyncPullDataDto();

                using var cmd = connection.CreateCommand();
                if (sinceDate.HasValue)
                {
                    cmd.CommandText = $"SELECT * FROM [{table}] WHERE [_updated_at] > @p_since OR [_created_at] > @p_since";
                    var pSince = cmd.CreateParameter();
                    pSince.ParameterName = "@p_since";
                    pSince.Value = sinceDate.Value;
                    cmd.Parameters.Add(pSince);
                }
                else
                {
                    cmd.CommandText = $"SELECT * FROM [{table}]";
                }

                try
                {
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>();
                        var isDeleted = false;
                        object? idVal = null;

                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            var colName = reader.GetName(i);
                            var val = reader.IsDBNull(i) ? null : reader.GetValue(i);

                            if (string.Equals(colName, "_is_deleted", StringComparison.OrdinalIgnoreCase))
                            {
                                isDeleted = Convert.ToInt32(val ?? 0) == 1 || Convert.ToBoolean(val ?? false);
                            }
                            if (string.Equals(colName, "id", StringComparison.OrdinalIgnoreCase) || 
                                string.Equals(colName, "Id", StringComparison.OrdinalIgnoreCase) || 
                                string.Equals(colName, "ID", StringComparison.OrdinalIgnoreCase))
                            {
                                idVal = val;
                            }

                            row[colName] = val ?? DBNull.Value;
                        }

                        if (isDeleted && idVal != null)
                        {
                            tableData.DeletedIds.Add(idVal);
                        }
                        else
                        {
                            tableData.Upserted.Add(row);
                        }
                    }
                }
                catch
                {
                    // If metadata columns do not exist on the remote table yet, fallback to select all active rows
                    using var fallbackCmd = connection.CreateCommand();
                    fallbackCmd.CommandText = $"SELECT * FROM [{table}]";
                    using var reader = await fallbackCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] = reader.IsDBNull(i) ? null! : reader.GetValue(i);
                        }
                        tableData.Upserted.Add(row);
                    }
                }

                result.Changes[table] = tableData;
            }

            return Ok(result);
        }

        private static object NormalizeDbValue(object? val)
        {
            if (val == null) return DBNull.Value;
            if (val is JsonElement jsonEl)
            {
                switch (jsonEl.ValueKind)
                {
                    case JsonValueKind.String: return jsonEl.GetString() ?? (object)DBNull.Value;
                    case JsonValueKind.Number:
                        if (jsonEl.TryGetInt64(out var l)) return l;
                        if (jsonEl.TryGetDouble(out var d)) return d;
                        return jsonEl.GetRawText();
                    case JsonValueKind.True: return true;
                    case JsonValueKind.False: return false;
                    case JsonValueKind.Null:
                    case JsonValueKind.Undefined: return DBNull.Value;
                    default: return jsonEl.GetRawText();
                }
            }
            return val;
        }
    }
}
`;

  files.push({
    name: 'SyncController.cs',
    path: `${root}/Controllers/SyncController.cs`,
    content: syncControllerContent,
    language: 'csharp'
  });

  return files;
};
