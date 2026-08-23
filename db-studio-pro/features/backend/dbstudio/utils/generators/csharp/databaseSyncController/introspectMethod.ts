export function getIntrospectMethodCode(): string {
  return `        [HttpPost("introspect")]
        public async Task<IActionResult> Introspect([FromBody] System.Text.Json.JsonElement body)
        {
            string type = "mssql";
            string host = "localhost";
            int port = 1433;
            string database = "production_db";
            string username = "sa";
            string password = "";

            if (body.TryGetProperty("type", out var typeProp)) type = typeProp.GetString() ?? type;
            if (body.TryGetProperty("host", out var hostProp)) host = hostProp.GetString() ?? host;
            if (body.TryGetProperty("port", out var portProp)) {
                if (portProp.ValueKind == System.Text.Json.JsonValueKind.Number) port = portProp.GetInt32();
                else if (portProp.ValueKind == System.Text.Json.JsonValueKind.String && int.TryParse(portProp.GetString(), out var pVal)) port = pVal;
            }
            if (body.TryGetProperty("database", out var dbProp)) database = dbProp.GetString() ?? database;
            if (body.TryGetProperty("username", out var userProp)) username = userProp.GetString() ?? username;
            if (body.TryGetProperty("password", out var pwProp)) password = pwProp.GetString() ?? password;

            var dbVendor = type.ToUpper();
            var newConnStr = $"Server={host},{port};Database={database};User Id={username};Password={password};TrustServerCertificate=True;Encrypt=True;";
            _customConnectionString = newConnStr;
            _customDbType = type;

            var timestampStr = DateTime.Now.ToString("o");
            var introspectedTables = new List<object>();

            try 
            {
                using (var connection = new Microsoft.Data.SqlClient.SqlConnection(newConnStr))
                {
                    await connection.OpenAsync();

                    // Retrieve Primary Keys
                    var primaryKeys = new HashSet<string>();
                    using (var pkCmd = connection.CreateCommand())
                    {
                        pkCmd.CommandText = @"
                            SELECT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME
                            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                            JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
                              ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME 
                             AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
                            WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY';";
                        
                        using (var reader = await pkCmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var s = reader.GetString(0);
                                var t = reader.GetString(1);
                                var c = reader.GetString(2);
                                primaryKeys.Add($"{s}.{t}.{c}");
                            }
                        }
                    }

                    // Retrieve Columns grouped by Schema and Table
                    var tablesMap = new Dictionary<string, List<object>>();
                    using (var colCmd = connection.CreateCommand())
                    {
                        colCmd.CommandText = @"
                            SELECT 
                                t.TABLE_SCHEMA,
                                t.TABLE_NAME,
                                c.COLUMN_NAME,
                                c.DATA_TYPE,
                                c.IS_NULLABLE,
                                c.COLUMN_DEFAULT
                            FROM INFORMATION_SCHEMA.TABLES t
                            JOIN INFORMATION_SCHEMA.COLUMNS c 
                              ON t.TABLE_SCHEMA = c.TABLE_SCHEMA 
                             AND t.TABLE_NAME = c.TABLE_NAME
                            WHERE t.TABLE_TYPE = 'BASE TABLE' AND t.TABLE_NAME NOT IN ('sysdiagrams')
                            ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME, c.ORDINAL_POSITION;";

                        using (var reader = await colCmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var schema = reader.GetString(0);
                                var tableName = reader.GetString(1);
                                var columnName = reader.GetString(2);
                                var dataType = reader.GetString(3);
                                var isNullable = reader.GetString(4) == "YES";
                                var defaultValue = reader.IsDBNull(5) ? null : reader.GetValue(5)?.ToString();

                                var tableKey = $"{schema}.{tableName}";
                                if (!tablesMap.ContainsKey(tableKey))
                                {
                                    tablesMap[tableKey] = new List<object>();
                                }

                                var isPk = primaryKeys.Contains($"{schema}.{tableName}.{columnName}");

                                tablesMap[tableKey].Add(new {
                                    id = $"f_real_{tableName.ToLower()}_{columnName.ToLower()}",
                                    name = columnName,
                                    type = dataType.ToUpper(),
                                    isPrimaryKey = isPk,
                                    allowNull = isNullable,
                                    isUnique = isPk,
                                    defaultValue = defaultValue
                                });
                            }
                        }
                    }

                    // Fetch records and build Table definitions
                    foreach (var kvp in tablesMap)
                    {
                        var split = kvp.Key.Split('.');
                        var schema = split[0];
                        var tableName = split[1];
                        var fields = kvp.Value;

                        var tableData = new List<object>();
                        try
                        {
                            using (var dataCmd = connection.CreateCommand())
                            {
                                dataCmd.CommandText = $"SELECT TOP 50 * FROM [{schema}].[{tableName}];";
                                using (var dataReader = await dataCmd.ExecuteReaderAsync())
                                {
                                    while (await dataReader.ReadAsync())
                                    {
                                        var row = new Dictionary<string, object>();
                                        for (int i = 0; i < dataReader.FieldCount; i++)
                                        {
                                            var colName = dataReader.GetName(i);
                                            var colVal = dataReader.IsDBNull(i) ? null : dataReader.GetValue(i);
                                            row[colName] = colVal ?? "";
                                        }
                                        tableData.Add(row);
                                    }
                                }
                            }
                        }
                        catch (Exception dataEx)
                        {
                            Console.WriteLine($"Could not fetch data for table {kvp.Key}: " + dataEx.Message);
                        }

                        introspectedTables.Add(new {
                            id = $"tbl_real_{tableName.ToLower()}",
                            name = tableName,
                            fields = fields,
                            data = tableData,
                            description = $"Echte Live-Tabelle introspektiert aus MS SQL Server (Schema: {schema})"
                        });
                    }
                }

                _logs.Add(new {
                    timestamp = timestampStr,
                    action = "INTROSPECT",
                    details = $"Live-Metadaten & Introspection erfolgreich über .NET WebAPI von {dbVendor} Server ({host}:{port}/{database}) geladen. {introspectedTables.Count} Tabellen gefunden.",
                    status = "SUCCESS"
                });
            }
            catch (Exception ex)
            {
                _logs.Add(new {
                    timestamp = timestampStr,
                    action = "INTROSPECT_ERROR",
                    details = $"Fehler beim Laden der Struktur über .NET WebAPI: {ex.Message}",
                    status = "ERROR"
                });

                return BadRequest(new { success = false, message = "Verbindungsfehler: " + ex.Message });
            }

            var introspectedProject = new {
                id = "proj_sql_introspected_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                name = $"{dbVendor} SQL Server ({database})",
                lastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                data = new {
                    tables = introspectedTables,
                    queries = new object[] {},
                    relationships = new object[] {},
                    forms = new object[] {},
                    reports = new object[] {},
                    layout = new object[] {},
                    tableGroups = new object[] {},
                    backendConfig = new {
                        type = type == "postgresql" ? "postgres" : type == "mysql" ? "mysql" : "sqlite",
                        name = database,
                        language = "csharp",
                        auth = new { enabled = true, provider = "windows_ad" }
                    }
                }
            };

            return Ok(new {
                success = true,
                message = $"Erfolgreich mit {dbVendor} Server ({host}:{port}/{database}) verbunden. {introspectedTables.Count} Tabellen und Datensätze introspektiert.",
                connection = new { type, host, port, database, username },
                project = introspectedProject
            });
        }`;
}
