
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { toPascalCase, toCamelCase, toSnakeCase } from './common';

export const generateLaravel = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // 1. Environment File (.env)
  let dbConnection = 'mysql';
  let dbHost = '127.0.0.1';
  let dbPort = '3306';
  let dbDatabase = 'laravel';
  let dbUsername = 'root';
  let dbPassword = '';

  if (config.dbType === DbType.SQLite) {
      dbConnection = 'sqlite';
  } else if (config.dbType === DbType.SQL) {
      dbConnection = 'sqlsrv';
      dbPort = '1433';
  }

  // Parse Config (Simple parser)
  if (config.dbConnection) {
      const parts = config.dbConnection.split(';');
      parts.forEach(p => {
          const [k, v] = p.split('=');
          if (!k || !v) return;
          const key = k.trim().toLowerCase();
          const val = v.trim();
          if (key === 'server' || key === 'host' || key === 'data source') dbHost = val;
          if (key === 'database' || key === 'initial catalog') dbDatabase = val;
          if (key === 'user' || key === 'uid' || key === 'user id') dbUsername = val;
          if (key === 'password' || key === 'pwd') dbPassword = val;
          if (key === 'port') dbPort = val;
      });
  }

  const envContent = `APP_NAME="${config.projectName}"
APP_ENV=local
APP_KEY=base64:${btoa(config.projectName + Date.now())}
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=${dbConnection}
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_DATABASE=${dbDatabase}
DB_USERNAME=${dbUsername}
DB_PASSWORD="${dbPassword}"

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
`;
  files.push({ name: '.env', path: `${root}/.env`, content: envContent, language: 'text' });

  // Generate .env.{environment} for Laravel
  if (config.environments) {
      config.environments.forEach(env => {
          const suffix = env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development';
          let envDbConnection = dbConnection;
          let envDbHost = dbHost;
          let envDbPort = dbPort;
          let envDbDatabase = dbDatabase;
          let envDbUsername = dbUsername;
          let envDbPassword = dbPassword;

          if (env.dbConnection) {
              const parts = env.dbConnection.split(';');
              parts.forEach(p => {
                  const [k, v] = p.split('=');
                  if (!k || !v) return;
                  const key = k.trim().toLowerCase();
                  const val = v.trim();
                  if (key === 'server' || key === 'host' || key === 'data source') envDbHost = val;
                  if (key === 'database' || key === 'initial catalog') envDbDatabase = val;
                  if (key === 'user' || key === 'uid' || key === 'user id') envDbUsername = val;
                  if (key === 'password' || key === 'pwd') envDbPassword = val;
                  if (key === 'port') envDbPort = val;
              });
          }

          let envFileContent = `APP_NAME="${config.projectName}"
APP_ENV=${suffix}
APP_KEY=base64:${btoa(config.projectName + suffix + Date.now())}
APP_DEBUG=${suffix === 'production' ? 'false' : 'true'}
APP_URL=${env.apiUrl || 'http://localhost'}

LOG_CHANNEL=stack
LOG_LEVEL=${suffix === 'production' ? 'info' : 'debug'}

DB_CONNECTION=${envDbConnection}
DB_HOST=${envDbHost}
DB_PORT=${envDbPort}
DB_DATABASE=${envDbDatabase}
DB_USERNAME=${envDbUsername}
DB_PASSWORD="${envDbPassword}"

BROADCAST_DRIVER=log
CACHE_DRIVER=file
SESSION_DRIVER=file
`;
          if (env.vars) {
              Object.entries(env.vars).forEach(([k, v]) => {
                  envFileContent += `\n${k}=${v}`;
              });
          }
          files.push({
              name: `.env.${suffix}`,
              path: `${root}/.env.${suffix}`,
              content: envFileContent,
              language: 'text'
          });
      });
  }

  // 2. Composer JSON (Minimal)
  files.push({
      name: 'composer.json',
      path: `${root}/composer.json`,
      content: JSON.stringify({
          "name": config.projectName.toLowerCase() + "/laravel",
          "type": "project",
          "description": "The Laravel Framework.",
          "keywords": ["framework", "laravel"],
          "license": "MIT",
          "require": {
              "php": "^8.1",
              "guzzlehttp/guzzle": "^7.2",
              "laravel/framework": "^10.10",
              "laravel/sanctum": "^3.3",
              "laravel/tinker": "^2.8"
          },
          "autoload": {
              "psr-4": {
                  "App\\": "app/",
                  "Database\\Factories\\": "database/factories/",
                  "Database\\Seeders\\": "database/seeders/"
              }
          }
      }, null, 2),
      language: 'json'
  });

  // 3. Migrations
  let migrationTimestamp = Date.now();
  tables.forEach((table, index) => {
      // Increment timestamp slightly to ensure order
      const ts = new Date(migrationTimestamp + (index * 1000)).toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
      const tableName = toSnakeCase(table.name);
      const className = `Create${toPascalCase(table.name)}Table`;

      const schemaFields = table.fields.map(f => {
          let laravelType = 'string';
          let modifiers = '';

          // Map types
          if (f.type === 'INTEGER') laravelType = 'integer';
          if (f.type === 'BOOLEAN') laravelType = 'boolean';
          if (f.type === 'DATE') laravelType = 'date';
          if (f.type === 'DATETIME') laravelType = 'dateTime';
          if (f.type === 'TIME') laravelType = 'time';
          if (f.type === 'TIMESTAMP') laravelType = 'timestamp';
          if (f.type === 'TINYINT') laravelType = 'tinyInteger';
          if (f.type === 'TEXT') laravelType = 'text';
          if (f.type === 'DECIMAL' || f.type === 'DOUBLE') laravelType = 'decimal';

          // Modifiers
          if (f.isPrimaryKey && f.type === 'INTEGER') return `            $table->id();`; // Shorthand for bigInteger AI PK
          if (f.isPrimaryKey) modifiers += '->primary()';
          if (f.allowNull) modifiers += '->nullable()';
          if (f.defaultValue) modifiers += `->default('${f.defaultValue}')`;

          return `            $table->${laravelType}('${f.name}')${modifiers};`;
      }).join('\n');

      // Add Relationships (Foreign Keys)
      const tableRels = relationships.filter(r => r.toTableId === table.id);
      const fkConstraints = tableRels.map(rel => {
          const parentTable = tables.find(t => t.id === rel.fromTableId);
          const fkField = table.fields.find(f => f.id === rel.toFieldId);
          if (!parentTable || !fkField) return '';
          
          let constraint = `            $table->foreign('${fkField.name}')->references('${relationships.find(r => r.id === rel.id)?.fromFieldId ? parentTable.fields.find(f => f.id === rel.fromFieldId)?.name : 'id'}')->on('${toSnakeCase(parentTable.name)}')`;
          
          if (rel.onDelete && rel.onDelete !== 'NO ACTION') constraint += `->onDelete('${rel.onDelete.toLowerCase()}')`;
          if (rel.onUpdate && rel.onUpdate !== 'NO ACTION') constraint += `->onUpdate('${rel.onUpdate.toLowerCase()}')`;
          
          return constraint + ';';
      }).join('\n');

      const migrationContent = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('${tableName}', function (Blueprint $table) {
${schemaFields}
${fkConstraints}
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('${tableName}');
    }
};`;
      files.push({ name: `${ts}_create_${tableName}_table.php`, path: `${root}/database/migrations/${ts}_create_${tableName}_table.php`, content: migrationContent, language: 'php' });
  });

  // 4. Models & Controllers
  let apiRoutes = "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n";

  tables.forEach(table => {
      const modelName = toPascalCase(table.name);
      const controllerName = `${modelName}Controller`;
      const tableName = toSnakeCase(table.name);
      
      // -- Model --
      const fillable = table.fields.filter(f => !f.isPrimaryKey).map(f => `'${f.name}'`).join(', ');
      
      // Relationships
      let relationMethods = '';
      
      // HasMany (I am the parent)
      const childRels = relationships.filter(r => r.fromTableId === table.id);
      childRels.forEach(rel => {
          const childTable = tables.find(t => t.id === rel.toTableId);
          const childField = childTable?.fields.find(f => f.id === rel.toFieldId);
          if (childTable && childField) {
              const methodName = toCamelCase(childTable.name) + 's'; // Plural usually
              relationMethods += `
    public function ${methodName}()
    {
        return $this->hasMany(${toPascalCase(childTable.name)}::class, '${childField.name}');
    }
`;
          }
      });

      // BelongsTo (I am the child)
      const parentRels = relationships.filter(r => r.toTableId === table.id);
      parentRels.forEach(rel => {
          const parentTable = tables.find(t => t.id === rel.fromTableId);
          const myField = table.fields.find(f => f.id === rel.toFieldId);
          if (parentTable && myField) {
              const methodName = toCamelCase(parentTable.name);
              relationMethods += `
    public function ${methodName}()
    {
        return $this->belongsTo(${toPascalCase(parentTable.name)}::class, '${myField.name}');
    }
`;
          }
      });

      const modelContent = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class ${modelName} extends Model
{
    use HasFactory;

    protected $table = '${tableName}';
    protected $fillable = [${fillable}];

    ${relationMethods}
}
`;
      files.push({ name: `${modelName}.php`, path: `${root}/app/Models/${modelName}.php`, content: modelContent, language: 'php' });

      // -- Controller --
      const controllerContent = `<?php

namespace App\\Http\\Controllers;

use App\\Models\\${modelName};
use Illuminate\\Http\\Request;

class ${controllerName} extends Controller
{
    public function index()
    {
        return ${modelName}::all();
    }

    public function store(Request $request)
    {
        $item = ${modelName}::create($request->all());
        return response()->json($item, 201);
    }

    public function show($id)
    {
        return ${modelName}::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $item = ${modelName}::findOrFail($id);
        $item->update($request->all());
        return response()->json($item, 200);
    }

    public function destroy($id)
    {
        ${modelName}::destroy($id);
        return response()->json(null, 204);
    }
}
`;
      files.push({ name: `${controllerName}.php`, path: `${root}/app/Http/Controllers/${controllerName}.php`, content: controllerContent, language: 'php' });

      // Route Registration
      apiRoutes += `use App\\Http\\Controllers\\${controllerName};\n`;
  });

  apiRoutes += `\n// Auto-generated Resources\n`;
  tables.forEach(table => {
      const modelName = toPascalCase(table.name);
      apiRoutes += `Route::apiResource('${toCamelCase(table.name)}', ${modelName}Controller::class);\n`;
  });

  // Docs
  if (config.authConfig?.useUserLogin) {
      const authControllerContent = `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;

class AuthController extends Controller
{
    public function login(Request $request) {
        $username = $request->input('username', 'user');
        return response()->json(['token' => 'dummy-jwt-token-for-'.$username, 'user' => ['username' => $username, 'role' => 'Admin']]);
    }
    public function register(Request $request) {
        return response()->json(['message' => 'User registered successfully'], 201);
    }
    public function loginSso(Request $request) {
        $provider = $request->input('provider', 'unknown');
        return response()->json(['token' => 'dummy-jwt-token-sso-'.$provider, 'user' => ['username' => $provider.' User', 'role' => 'User']]);
    }
}`;
      files.push({ name: `AuthController.php`, path: `${root}/app/Http/Controllers/AuthController.php`, content: authControllerContent, language: 'php' });
      apiRoutes += `use App\\Http\\Controllers\\AuthController;\nRoute::post('auth/login', [AuthController::class, 'login']);\nRoute::post('auth/register', [AuthController::class, 'register']);\nRoute::post('auth/login-sso', [AuthController::class, 'loginSso']);\n`;
  }
  
  // Queries
  const selectQueries = queries.filter(q => q.type === 'SELECT');
  if (selectQueries.length > 0) {
      let queryMethods = '';
      apiRoutes += `\n// Queries\nuse Illuminate\\Support\\Facades\\DB;\nuse App\\Http\\Controllers\\QueriesController;\n`;
      selectQueries.forEach(q => {
          const camelName = toCamelCase(q.name);
          const safeName = toPascalCase(q.name);
          
          apiRoutes += `Route::get('queries/${camelName}', [QueriesController::class, 'get${safeName}']);\n`;
          
          queryMethods += `
    public function get${safeName}(Request $request) {
        $page = $request->input('page', 1);
        $pageSize = $request->input('pageSize', 20);
        $offset = ($page - 1) * $pageSize;
        
        $sql = "SELECT * FROM \`" . "${safeName}" . "\` WHERE 1=1";
        $bindings = [];
        
        // Handle MS Access style form references passed as query parameters
        foreach ($request->query() as $key => $value) {
            if (str_starts_with($key, 'form_')) {
                // Filter mapping logic goes here
            }
        }
        
        $countResult = DB::select("SELECT COUNT(*) as count FROM \`" . "${safeName}" . "\`");
        $total = $countResult[0]->count ?? 0;
        
        $sql .= " LIMIT ? OFFSET ?";
        $bindings[] = $pageSize;
        $bindings[] = $offset;
        
        $results = DB::select($sql, $bindings);
        
        return response()->json([
            'data' => $results,
            'total' => (int)$total,
            'page' => (int)$page,
            'pageSize' => (int)$pageSize,
            'totalPages' => ceil($total / $pageSize)
        ]);
    }
`;
      });
      
      const queriesControllerContent = `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

class QueriesController extends Controller
{${queryMethods}
}
`;
      files.push({ name: `QueriesController.php`, path: `${root}/app/Http/Controllers/QueriesController.php`, content: queriesControllerContent, language: 'php' });
  }

  files.push({ name: 'api.php', path: `${root}/routes/api.php`, content: apiRoutes, language: 'php' });

  // Docs
  const readmeContent = `# ${config.projectName} (Laravel)

## Voraussetzungen
1. Installieren Sie **PHP** und **Composer**.
2. Datenbank (${config.dbType}) muss erreichbar sein.

## Einrichtung
1. Führen Sie \`composer install\` im Terminal aus.
2. Kopieren Sie die \`.env\` Datei: \`cp .env .env.example\` (falls nötig, hier wird sie bereits generiert).
3. Generieren Sie den App-Key: \`php artisan key:generate\`.
4. Führen Sie die Migrationen aus: \`php artisan migrate\`.

## Starten
\`\`\`bash
php artisan serve
\`\`\`

Die API ist unter \`http://localhost:8000/api\` erreichbar.
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
