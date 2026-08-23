import JSZip from "jszip";

export function generateProjectFiles(
  zip: JSZip,
  normalizedSubfolder: string,
  includeWwwroot: boolean
) {
  // 1. composer.json
  zip.file("composer.json", JSON.stringify({
    name: "dbstudio/selfhost-backend",
    description: "DB Studio Pro Self-Host Backend (Laravel PHP API)",
    type: "project",
    keywords: ["laravel", "framework", "dbstudio"],
    license: "MIT",
    require: {
      "php": "^8.2",
      "laravel/framework": "^11.0",
      "laravel/tinker": "^2.9"
    },
    autoload: {
      "psr-4": {
        "App\\": "app/"
      }
    },
    config: {
      "optimize-autoloader": true,
      "preferred-install": "dist",
      "sort-packages": true
    }
  }, null, 2));

  // 2. .env
  zip.file(".env", `APP_NAME="DB Studio Pro"
APP_ENV=local
APP_KEY=base64:fH7+9y6U98g8W7yYhV2k1mPqR4sT5uV6wX7yZ8aB9cI=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=sqlite
DB_DATABASE=/app/dbstudio_meta.db
`);

  // 3. bootstrap/app.php
  zip.file("bootstrap/app.php", `<?php

use Illuminate\\Foundation\\Application;
use Illuminate\\Foundation\\Configuration\\Exceptions;
use Illuminate\\Foundation\\Configuration\\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Disable CSRF for api routes
        $middleware->validateCsrfTokens(except: [
            'api/*',
            '*'
        ]);
        
        // CORS setup for pre-flight and session cookies
        $middleware->append(\\Illuminate\\Http\\Middleware\\HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
`);

  // 4. public/index.php
  zip.file("public/index.php", `<?php

use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
`);

  // 5. config/database.php
  zip.file("config/database.php", `<?php

return [
    'default' => env('DB_CONNECTION', 'sqlite'),
    'connections' => [
        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DATABASE_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
        ],
    ],
    'migrations' => 'migrations',
];
`);

  // 6. routes/web.php
  zip.file("routes/web.php", `<?php

use Illuminate\\Support\\Facades\\Route;

Route::get('/', function () {
    return redirect('${normalizedSubfolder}/index.html');
});
`);

  // 7. routes/api.php
  zip.file("routes/api.php", `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\AuthController;
use App\\Http\\Controllers\\ProjectsController;
use App\\Http\\Controllers\\DataController;
use App\\Http\\Controllers\\UtilityController;

$prefix = '${normalizedSubfolder}';

Route::group(['prefix' => trim($prefix, '/')], function () {
    // Health Check
    Route::get('/health', [AuthController::class, 'health']);

    // Auth & local Role assignments
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::get('/ad/whoami', [AuthController::class, 'whoami']);
    Route::get('/ad/me', [AuthController::class, 'me']);

    // Projects
    Route::get('/projects', [ProjectsController::class, 'getProjects']);
    Route::get('/team/projects', [ProjectsController::class, 'getProjects']);
    Route::get('/projects/{id}', [ProjectsController::class, 'getProject']);
    Route::post('/projects', [ProjectsController::class, 'createProject']);

    // Dynamic Data
    Route::get('/data/{tableName}', [DataController::class, 'getTableData']);
    Route::post('/data/{tableName}', [DataController::class, 'insertTableData']);
    Route::delete('/data/{tableName}/{id}', [DataController::class, 'deleteTableData']);

    // Utility actions
    Route::get('/users', [UtilityController::class, 'getUsers']);
    Route::post('/users', [UtilityController::class, 'createUser']);
    Route::put('/users/{id}', [UtilityController::class, 'updateUser']);
    Route::delete('/users/{id}', [UtilityController::class, 'deleteUser']);

    Route::post('/sync', [UtilityController::class, 'sync']);
    Route::post('/database-sync', [UtilityController::class, 'databaseSync']);
    Route::get('/backend-apis', [UtilityController::class, 'getBackendApis']);
    Route::post('/backend-apis', [UtilityController::class, 'createBackendApi']);
    Route::post('/mailer', [UtilityController::class, 'mailer']);
    Route::post('/backup', [UtilityController::class, 'backup']);
    Route::post('/ai', [UtilityController::class, 'ai']);
    Route::get('/chat', [UtilityController::class, 'getChats']);
    Route::post('/chat', [UtilityController::class, 'saveChat']);
    Route::get('/webhooks', [UtilityController::class, 'getWebhooks']);
    Route::post('/webhooks', [UtilityController::class, 'triggerWebhook']);
});
`);
}
