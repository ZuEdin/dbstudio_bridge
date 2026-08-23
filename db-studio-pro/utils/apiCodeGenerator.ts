import { Field } from '../types/index';

export interface CodeGenResult {
  dotnet: string;
  node: string;
  php: string;
}

/**
 * Maps application field types to C# / .NET types.
 */
const mapToDotNetType = (type: string): string => {
  switch (type) {
    case 'INTEGER': return 'int';
    case 'TINYINT': return 'byte';
    case 'DECIMAL':
    case 'DOUBLE': return 'decimal';
    case 'BOOLEAN': return 'bool';
    case 'DATE':
    case 'DATETIME':
    case 'TIMESTAMP': return 'DateTime';
    case 'TIME': return 'TimeSpan';
    default: return 'string';
  }
};

/**
 * Maps application field types to Prisma / TypeScript types.
 */
const mapToPrismaType = (type: string): string => {
  switch (type) {
    case 'INTEGER': return 'Int';
    case 'DECIMAL':
    case 'DOUBLE': return 'Float';
    case 'BOOLEAN': return 'Boolean';
    case 'DATE':
    case 'DATETIME':
    case 'TIMESTAMP': return 'DateTime';
    default: return 'String';
  }
};

/**
 * Maps application field types to PHP type hints.
 */
const mapToPhpType = (type: string): string => {
  switch (type) {
    case 'INTEGER': return 'int';
    case 'DECIMAL':
    case 'DOUBLE': return 'float';
    case 'BOOLEAN': return 'bool';
    default: return 'string';
  }
};

/**
 * Generates SQL Server table creation script.
 */
export const generateSqlServerMigration = (tableName: string, fields: Field[]): string => {
  const columnDefs = fields.map(f => {
    let sqlType = 'NVARCHAR(MAX)';
    switch (f.type) {
      case 'INTEGER':
        sqlType = 'INT';
        break;
      case 'TINYINT':
        sqlType = 'TINYINT';
        break;
      case 'DECIMAL':
      case 'DOUBLE':
        sqlType = 'DECIMAL(18,4)';
        break;
      case 'BOOLEAN':
        sqlType = 'BIT';
        break;
      case 'DATE':
        sqlType = 'DATE';
        break;
      case 'TIME':
        sqlType = 'TIME';
        break;
      case 'DATETIME':
      case 'TIMESTAMP':
        sqlType = 'DATETIME2';
        break;
    }
    
    const pk = f.isPrimaryKey ? ' PRIMARY KEY' : '';
    const identity = f.isAutoIncrement && f.type === 'INTEGER' ? ' IDENTITY(1,1)' : '';
    const nullability = f.allowNull ? 'NULL' : 'NOT NULL';
    
    return `    [${f.name}] ${sqlType}${identity}${pk} ${nullability}`;
  });

  return `CREATE TABLE [dbo].[${tableName}] (\n${columnDefs.join(',\n')}\n);`;
};

/**
 * Generates C# Entity Framework Core Code for MS SQL Server.
 */
export const generateDotNetCode = (tableName: string, fields: Field[], apiUrl: string): string => {
  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const properties = fields.map(f => {
    const type = mapToDotNetType(f.type);
    const nullable = f.allowNull && type !== 'string' ? '?' : '';
    const isPk = f.isPrimaryKey ? '    [Key]\n' : '';
    const isIdentity = f.isAutoIncrement ? '    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]\n' : '';
    return `${isPk}${isIdentity}    public ${type}${nullable} ${f.name.charAt(0).toUpperCase() + f.name.slice(1)} { get; set; }`;
  }).join('\n\n');

  return `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace SqlServerApiImporter.Models
{
    [Table("${tableName}")]
    public class ${className}
    {
${properties}
    }

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<${className}> ${className}s { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ${className}SyncController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _clientFactory;

        public ${className}SyncController(AppDbContext context, IHttpClientFactory clientFactory)
        {
            _context = context;
            _clientFactory = clientFactory;
        }

        /// <summary>
        /// Holt Daten von der API und synchronisiert sie in den MS SQL Server
        /// </summary>
        [HttpPost("sync")]
        public async Task<IActionResult> SyncFromApi()
        {
            var client = _clientFactory.CreateClient();
            try
            {
                var externalData = await client.GetFromJsonAsync<${className}[]>("${apiUrl}");
                if (externalData == null) return BadRequest("Keine Daten von der API empfangen.");

                // Einfache Synchronisations-Logik (zuerst leeren oder updaten)
                // Für Testzwecke leeren wir die Tabelle und fügen die neuen Zeilen ein:
                await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE ${tableName}");
                
                await _context.${className}s.AddRangeAsync(externalData);
                await _context.SaveChangesAsync();

                return Ok(new { Message = $"{externalData.Length} Datensätze erfolgreich in SQL Server importiert." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Synchronisationsfehler: {ex.Message}");
            }
        }
    }
}`;
};

/**
 * Generates Node.js Express + Prisma Code.
 */
export const generateNodeCode = (tableName: string, fields: Field[], apiUrl: string): string => {
  const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const prismaFields = fields.map(f => {
    let type = mapToPrismaType(f.type);
    const pkAttr = f.isPrimaryKey ? ' @id' : '';
    const defaultAttr = f.isAutoIncrement ? ' @default(autoincrement())' : '';
    const optionalAttr = f.allowNull ? '?' : '';
    return `  ${f.name} ${type}${optionalAttr}${pkAttr}${defaultAttr}`;
  }).join('\n');

  return `// 1. prisma/schema.prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model ${modelName} {
${prismaFields}
}


// 2. server.js (Express & Importer-Logic)
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

/**
 * Holt Daten von der API und importiert sie in den SQL Server via Prisma
 */
app.post('/api/sync-${tableName.toLowerCase()}', async (req, res) => {
  try {
    const response = await axios.get('${apiUrl}');
    const items = Array.isArray(response.data) 
      ? response.data 
      : (response.data.products || response.data.results || [response.data]);

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Keine Daten von der API empfangen." });
    }

    // Verwende eine Transaktion für sicheren Import
    await prisma.$transaction([
      // Tabelle leeren (Truncate)
      prisma.$executeRawUnsafe('TRUNCATE TABLE [${tableName}]'),
      
      // Neue Daten einfügen
      prisma.${tableName.charAt(0).toLowerCase() + tableName.slice(1)}.createMany({
        data: items.map(item => ({
${fields.filter(f => !f.isAutoIncrement).map(f => `          ${f.name}: item.${f.name}`).join(',\n')}
        }))
      })
    ]);

    res.json({ 
      success: true, 
      message: \`\${items.length} Datensätze erfolgreich in SQL Server importiert.\` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server läuft auf Port \${PORT}\`);
});`;
};

/**
 * Generates PHP Laravel Eloquent Code.
 */
export const generatePhpCode = (tableName: string, fields: Field[], apiUrl: string): string => {
  const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const migrationFields = fields.map(f => {
    if (f.isPrimaryKey && f.isAutoIncrement) {
      return `            $table->id('${f.name}');`;
    }
    
    let fluentType = 'string';
    switch (f.type) {
      case 'INTEGER': fluentType = 'integer'; break;
      case 'DECIMAL':
      case 'DOUBLE': fluentType = 'decimal'; break;
      case 'BOOLEAN': fluentType = 'boolean'; break;
      case 'DATE': fluentType = 'date'; break;
      case 'DATETIME':
      case 'TIMESTAMP': fluentType = 'dateTime'; break;
      case 'TEXT': fluentType = 'text'; break;
    }
    
    const nullable = f.allowNull ? '->nullable()' : '';
    const primary = f.isPrimaryKey && !f.isAutoIncrement ? '->primary()' : '';
    return `            $table->${fluentType}('${f.name}')${nullable}${primary};`;
  }).join('\n');

  return `<?php
// 1. Migration File (database/migrations/xxxx_create_${tableName}_table.php)
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('${tableName}', function (Blueprint $table) {
${migrationFields}
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('${tableName}');
    }
};


// 2. Model File (app/Models/${modelName}.php)
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class ${modelName} extends Model
{
    protected $table = '${tableName}';
    
    protected $fillable = [
${fields.filter(f => !f.isPrimaryKey && !f.isAutoIncrement).map(f => `        '${f.name}'`).join(',\n')}
    ];
}


// 3. Controller File (app/Http/Controllers/${modelName}SyncController.php)
namespace App\\Http\\Controllers;

use App\\Models\\${modelName};
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\DB;

class ${modelName}SyncController extends Controller
{
    /**
     * Holt Daten von der API und synchronisiert sie in den SQL Server
     */
    public function sync()
    {
        try {
            $response = Http::get('${apiUrl}');
            if ($response->failed()) {
                return response()->json(['error' => 'API Anfrage fehlgeschlagen.'], 400);
            }

            $data = $response->json();
            $items = is_array($data) ? $data : ($data['products'] ?? $data['results'] ?? [$data]);

            if (empty($items)) {
                return response()->json(['error' => 'Keine Daten von der API empfangen.'], 400);
            }

            DB::transaction(function () use ($items) {
                // Tabelle leeren
                ${modelName}::truncate();

                // Neue Daten befüllen
                foreach ($items as $item) {
                    ${modelName}::create([
${fields.filter(f => !f.isAutoIncrement).map(f => `                        '${f.name}' => \$item['${f.name}'] ?? null`).join(',\n')}
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => count($items) . ' Datensätze erfolgreich synchronisiert.'
            ]);
        } catch (\\Exception \$e) {
            return response()->json(['error' => \$e->getMessage()], 500);
        }
    }
}`;
};
