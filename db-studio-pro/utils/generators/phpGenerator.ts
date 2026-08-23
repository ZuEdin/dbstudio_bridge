
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { resolveType, toPascalCase, toCamelCase } from './common';

export const generatePhp = (tables: Table[], rawRelationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const relationships = rawRelationships.filter((rel, index, self) =>
    index === self.findIndex((r) =>
      r.fromTableId === rel.fromTableId &&
      r.fromFieldId === rel.fromFieldId &&
      r.toTableId === rel.toTableId &&
      r.toFieldId === rel.toFieldId
    )
  );

  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // 1. Composer.json (Basic Metadata)
  // Ensure mongodb driver is requested if NoSQL
  const requires = {
    "php": ">=7.4",
    "ext-json": "*"
  };
  
  if (config.dbType === DbType.NoSQL) {
      (requires as any)["mongodb/mongodb"] = "^1.15";
  } else {
      (requires as any)["ext-pdo"] = "*";
  }

  files.push({
    name: 'composer.json',
    path: `${root}/composer.json`,
    content: JSON.stringify({
      "name": config.projectName.toLowerCase() + "/api",
      "description": "Auto-generated PHP Backend",
      "type": "project",
      "require": requires,
      "autoload": {
        "psr-4": {
          "App\\": "./"
        }
      }
    }, null, 2),
    language: 'json'
  });

  // 2. Database Config
  let dbClassContent = '';

  if (config.dbType === DbType.NoSQL) {
      // MongoDB Implementation
      const uri = config.dbConnection || 'mongodb://localhost:27017';
      // Parse DB name roughly from URI or default
      let dbName = 'my_db';
      const parts = uri.split('/');
      if (parts.length > 3 && parts[3]) dbName = parts[3].split('?')[0];

      dbClassContent = `<?php
namespace App\\Config;

use MongoDB\\Client;

class Database {
    private $uri = "${uri}";
    private $db_name = "${dbName}";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $client = new Client($this->uri);
            $this->conn = $client->selectDatabase($this->db_name);
        } catch(\\Exception $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>`;
  } else {
      // PDO Implementation
      let host = 'localhost';
      let db_name = 'my_db';
      let username = 'root';
      let password = '';
      let port = '';

      if (config.dbConnection) {
          const parts = config.dbConnection.split(';');
          parts.forEach(p => {
              const [k, v] = p.split('=');
              if(!k || !v) return;
              const key = k.trim().toLowerCase();
              const val = v.trim();
              if (key === 'server' || key === 'data source' || key === 'host') host = val;
              if (key === 'database' || key === 'initial catalog') db_name = val;
              if (key === 'user id' || key === 'uid' || key === 'user') username = val;
              if (key === 'password' || key === 'pwd') password = val;
              if (key === 'port') port = val;
          });
      }

      dbClassContent = `<?php
namespace App\\Config;

use PDO;
use PDOException;

class Database {
    public $conn;

    public function loadEnv() {
        $activeEnv = getenv('APP_ENV') ?: 'development';
        $envFile = __DIR__ . '/../.env.' . $activeEnv;
        if (!file_exists($envFile)) {
            $envFile = __DIR__ . '/../.env';
        }
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                if (strpos($line, '=') === false) continue;
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                if (preg_match('/^"(.*)"$/', $value, $matches)) {
                    $value = $matches[1];
                }
                $_ENV[$name] = $value;
                putenv("{$name}={$value}");
            }
        }
    }

    public function getConnection() {
        $this->conn = null;
        $this->loadEnv();
        try {
            $dbType = getenv('DB_CONNECTION') ?: '${config.dbType === DbType.SQLite ? 'sqlite' : (config.dbType === DbType.MySQL ? 'mysql' : 'sqlsrv')}';
            if ($dbType === 'sqlite') {
                $dbFile = getenv('DB_STORAGE') ?: '${config.dbConnection.includes('=') ? config.dbConnection.split('=')[1] : 'app.db'}';
                $this->conn = new PDO("sqlite:" . __DIR__ . "/../database/" . $dbFile);
            } else {
                $dbHost = getenv('DB_HOST') ?: '${host}';
                $dbName = getenv('DB_NAME') ?: '${db_name}';
                $dbUser = getenv('DB_USER') ?: '${username}';
                $dbPass = getenv('DB_PASSWORD') ?: '${password}';
                $dbPort = getenv('DB_PORT') ?: '${port}';
                
                if ($dbType === 'mysql') {
                    $portStr = $dbPort ? ";port=" . $dbPort : '';
                    $this->conn = new PDO("mysql:host=" . $dbHost . ";dbname=" . $dbName . $portStr, $dbUser, $dbPass);
                } else {
                    $this->conn = new PDO("sqlsrv:Server=" . $dbHost . ";Database=" . $dbName, $dbUser, $dbPass);
                }
            }
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>`;
  }
  
  files.push({ name: 'Database.php', path: `${root}/config/Database.php`, content: dbClassContent, language: 'php' });

  // Generate .env and .env.{suffix} files for PHP
  const generatePhpEnvContent = (conn: string, vars?: Record<string, string>) => {
      let envHost = 'localhost';
      let envDbName = 'my_db';
      let envUser = 'root';
      let envPass = '';
      let envPort = '';

      if (conn) {
          const parts = conn.split(';');
          parts.forEach(p => {
              const [k, v] = p.split('=');
              if(!k || !v) return;
              const key = k.trim().toLowerCase();
              const val = v.trim();
              if (key === 'server' || key === 'data source' || key === 'host') envHost = val;
              if (key === 'database' || key === 'initial catalog') envDbName = val;
              if (key === 'user id' || key === 'uid' || key === 'user') envUser = val;
              if (key === 'password' || key === 'pwd') envPass = val;
              if (key === 'port') envPort = val;
          });
      }
      let dbConnType = config.dbType === DbType.SQLite ? 'sqlite' : (config.dbType === DbType.MySQL ? 'mysql' : 'sqlsrv');
      let base = `DB_CONNECTION=${dbConnType}\nDB_HOST=${envHost}\nDB_NAME=${envDbName}\nDB_USER=${envUser}\nDB_PASSWORD=${envPass}\nDB_PORT=${envPort}`;
      if (config.dbType === DbType.SQLite) {
          const dbFile = conn.includes('=') ? conn.split('=')[1] : 'app.db';
          base = `DB_CONNECTION=sqlite\nDB_STORAGE=${dbFile}`;
      }
      if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
              base += `\n${k}=${v}`;
          });
      }
      return base + '\n';
  };

  files.push({
      name: '.env',
      path: `${root}/.env`,
      content: generatePhpEnvContent(config.dbConnection),
      language: 'text'
  });

  if (config.environments) {
      config.environments.forEach(env => {
          const suffix = env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development';
          files.push({
              name: `.env.${suffix}`,
              path: `${root}/.env.${suffix}`,
              content: generatePhpEnvContent(env.dbConnection || config.dbConnection, env.vars),
              language: 'text'
          });
      });
  }

  // 3. Base Model (Adapted for NoSQL vs SQL)
  const isNoSql = config.dbType === DbType.NoSQL;
  
  const baseModelContent = isNoSql ? `<?php
namespace App\\Models;

use MongoDB\\BSON\\ObjectId;

class BaseModel {
    protected $db;
    protected $collection_name;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $collection = $this->db->selectCollection($this->collection_name);
        $cursor = $collection->find();
        return iterator_to_array($cursor);
    }

    public function getById($id) {
        $collection = $this->db->selectCollection($this->collection_name);
        return $collection->findOne(['_id' => new ObjectId($id)]);
    }

    public function delete($id) {
        $collection = $this->db->selectCollection($this->collection_name);
        $result = $collection->deleteOne(['_id' => new ObjectId($id)]);
        return $result->getDeletedCount() > 0;
    }
}
?>` : `<?php
namespace App\\Models;

class BaseModel {
    protected $conn;
    protected $table_name;
    protected $primary_key = 'id';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(\\PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE " . $this->primary_key . " = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(\\PDO::FETCH_ASSOC);
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE " . $this->primary_key . " = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        if($stmt->execute()) return true;
        return false;
    }
}
?>`;

  files.push({ name: 'BaseModel.php', path: `${root}/models/BaseModel.php`, content: baseModelContent, language: 'php' });

  // 4. Models & Controllers per Table
  tables.forEach(table => {
      const modelName = toPascalCase(table.name);
      const tableName = toPascalCase(table.name);

      const createdByField = table.fields.find(f => ['createdby', 'created_by', 'erstellt_von', 'erstelltvon', 'created_user', 'createduser'].includes(f.name.toLowerCase()));
      const modifiedByField = table.fields.find(f => ['modifiedby', 'modified_by', 'updatedby', 'updated_by', 'geaendert_von', 'bearbeitetvon', 'bearbeitet_von'].includes(f.name.toLowerCase()));
      const createdDateField = table.fields.find(f => ['createddate', 'created_date', 'createdat', 'created_at', 'erstellt_am', 'erstelltam'].includes(f.name.toLowerCase()));
      const modifiedDateField = table.fields.find(f => ['modifieddate', 'modified_date', 'updatedat', 'updated_at', 'geaendert_am', 'bearbeitet_am'].includes(f.name.toLowerCase()));

      const nowDefaultFields = table.fields.filter(f => {
          const isDateType = ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(f.type);
          const hasNowDefault = f.defaultValue && (
              f.defaultValue.toLowerCase().includes('now') ||
              f.defaultValue.toLowerCase().includes('current_timestamp') ||
              f.defaultValue.toLowerCase().includes('getdate')
          );
          return isDateType && hasNowDefault;
      });

      let onCreateAuditNoSql = '';
      if (createdByField) onCreateAuditNoSql += `        $doc['${createdByField.name}'] = \\getLoggedInUser();\n`;
      if (modifiedByField) onCreateAuditNoSql += `        $doc['${modifiedByField.name}'] = \\getLoggedInUser();\n`;
      if (createdDateField) onCreateAuditNoSql += `        $doc['${createdDateField.name}'] = date('Y-m-d H:i:s');\n`;
      if (modifiedDateField) onCreateAuditNoSql += `        $doc['${modifiedDateField.name}'] = date('Y-m-d H:i:s');\n`;
      nowDefaultFields.forEach(df => {
          onCreateAuditNoSql += `        if (empty($doc['${df.name}'])) $doc['${df.name}'] = date('Y-m-d H:i:s');\n`;
      });

      let onUpdateAuditNoSql = '';
      onUpdateAuditNoSql += `        $existing = $this->getById($id);\n`;
      if (createdByField) onUpdateAuditNoSql += `        if ($existing) { $existingArr = (array)$existing; if (isset($existingArr['${createdByField.name}'])) $doc['${createdByField.name}'] = $existingArr['${createdByField.name}']; }\n`;
      if (createdDateField) onUpdateAuditNoSql += `        if ($existing) { $existingArr = (array)$existing; if (isset($existingArr['${createdDateField.name}'])) $doc['${createdDateField.name}'] = $existingArr['${createdDateField.name}']; }\n`;
      if (modifiedByField) onUpdateAuditNoSql += `        $doc['${modifiedByField.name}'] = \\getLoggedInUser();\n`;
      if (modifiedDateField) onUpdateAuditNoSql += `        $doc['${modifiedDateField.name}'] = date('Y-m-d H:i:s');\n`;

      let onCreateAuditSql = '';
      if (createdByField) onCreateAuditSql += `        $data->${createdByField.name} = \\getLoggedInUser();\n`;
      if (modifiedByField) onCreateAuditSql += `        $data->${modifiedByField.name} = \\getLoggedInUser();\n`;
      if (createdDateField) {
          const fmt = createdDateField.type === 'DATE' ? 'Y-m-d' : (createdDateField.type === 'TIME' ? 'H:i:s' : 'Y-m-d H:i:s');
          onCreateAuditSql += `        $data->${createdDateField.name} = date('${fmt}');\n`;
      }
      if (modifiedDateField) {
          const fmt = modifiedDateField.type === 'DATE' ? 'Y-m-d' : (modifiedDateField.type === 'TIME' ? 'H:i:s' : 'Y-m-d H:i:s');
          onCreateAuditSql += `        $data->${modifiedDateField.name} = date('${fmt}');\n`;
      }
      nowDefaultFields.forEach(df => {
          const fmt = df.type === 'DATE' ? 'Y-m-d' : (df.type === 'TIME' ? 'H:i:s' : 'Y-m-d H:i:s');
          onCreateAuditSql += `        if (empty($data->${df.name})) $data->${df.name} = date('${fmt}');\n`;
      });

      let onUpdateAuditSql = '';
      onUpdateAuditSql += `        $existing = $this->getById($id);\n`;
      if (createdByField) onUpdateAuditSql += `        if ($existing && isset($existing['${createdByField.name}'])) $data->${createdByField.name} = $existing['${createdByField.name}'];\n`;
      if (createdDateField) onUpdateAuditSql += `        if ($existing && isset($existing['${createdDateField.name}'])) $data->${createdDateField.name} = $existing['${createdDateField.name}'];\n`;
      if (modifiedByField) onUpdateAuditSql += `        $data->${modifiedByField.name} = \\getLoggedInUser();\n`;
      if (modifiedDateField) {
          const fmt = modifiedDateField.type === 'DATE' ? 'Y-m-d' : (modifiedDateField.type === 'TIME' ? 'H:i:s' : 'Y-m-d H:i:s');
          onUpdateAuditSql += `        $data->${modifiedDateField.name} = date('${fmt}');\n`;
      }
      
      let modelContent = '';
      if (isNoSql) {
          modelContent = `<?php
namespace App\\Models;

class ${modelName} extends BaseModel {
    protected $collection_name = "${tableName}";

    private function applyHashes(&$doc) {
        foreach($doc as $k => $v) {
            if(stripos($k, 'password') !== false && strlen($v) > 0) {
                // Check if already hashed
                $info = password_get_info($v);
                if($info['algo'] == 0) {
                    $doc[$k] = password_hash($v, PASSWORD_DEFAULT);
                }
            }
        }
    }

    public function create($data) {
        $collection = $this->db->selectCollection($this->collection_name);
        // Cast object to array for MongoDB driver
        $doc = (array) $data;
${onCreateAuditNoSql}        $this->applyHashes($doc);
        $result = $collection->insertOne($doc);
        return $result->getInsertedCount() > 0;
    }

    public function update($id, $data) {
        $collection = $this->db->selectCollection($this->collection_name);
        $doc = (array) $data;
${onUpdateAuditNoSql}        $this->applyHashes($doc);
        $result = $collection->updateOne(
            ['_id' => new \\MongoDB\\BSON\\ObjectId($id)],
            ['$set' => $doc]
        );
        return $result->getModifiedCount() > 0;
    }
}
?>`;
      } else {
          // SQL Model
          const pkField = table.fields.find(f => f.isPrimaryKey);
          const pkName = pkField ? pkField.name : 'id';
          const fieldsList = table.fields.map(f => f.name).filter(n => n !== pkName);
          const paramsStr = fieldsList.map(f => ":" + f).join(", ");
          const updateStr = fieldsList.map(f => `${f} = :${f}`).join(", ");
          const bindParams = fieldsList.map(f => {
              if (f.toLowerCase().includes('password')) {
                  return `if(isset($data->${f}) && strlen($data->${f}) > 0) { 
            $info = password_get_info($data->${f});
            if($info['algo'] == 0) { $data->${f} = password_hash($data->${f}, PASSWORD_DEFAULT); }
        }\n        $stmt->bindParam(":${f}", $data->${f});`;
              }
              return `$stmt->bindParam(":${f}", $data->${f});`;
          }).join("\n        ");

          modelContent = `<?php
namespace App\\Models;

class ${modelName} extends BaseModel {
    protected $table_name = "${tableName}";
    protected $primary_key = "${pkName}";

    public function create($data) {
${onCreateAuditSql}        $query = "INSERT INTO " . $this->table_name . " SET ${fieldsList.map(f => `${f}=:${f}`).join(', ')}";
        $stmt = $this->conn->prepare($query);

        // Sanitize & Bind
        ${bindParams}

        if($stmt->execute()) return true;
        return false;
    }

    public function update($id, $data) {
${onUpdateAuditSql}        $query = "UPDATE " . $this->table_name . " SET ${updateStr} WHERE " . $this->primary_key . " = :id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $id);
        ${bindParams}

        if($stmt->execute()) return true;
        return false;
    }
}
?>`;
      }
      
      files.push({ name: `${modelName}.php`, path: `${root}/models/${modelName}.php`, content: modelContent, language: 'php' });

      // Controller (Mostly generic, but good to have generated)
      const controllerContent = `<?php
namespace App\\Controllers;

use App\\Models\\${modelName};

class ${modelName}Controller {
    private $model;

    public function __construct($db) {
        $this->model = new ${modelName}($db);
    }

    public function processRequest($method, $id = null) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $result = $this->model->getById($id);
                    echo json_encode($result ?: ["message" => "Not found"]);
                } else {
                    $result = $this->model->getAll();
                    echo json_encode($result);
                }
                break;
            case 'POST':
                $data = json_decode(file_get_contents("php://input"));
                if($this->model->create($data)) {
                    http_response_code(201);
                    echo json_encode(["message" => "Created"]);
                } else {
                    http_response_code(503);
                    echo json_encode(["message" => "Unable to create"]);
                }
                break;
            case 'PUT':
                $data = json_decode(file_get_contents("php://input"));
                if($this->model->update($id, $data)) {
                    echo json_encode(["message" => "Updated"]);
                } else {
                    echo json_encode(["message" => "Unable to update"]);
                }
                break;
            case 'DELETE':
                if($this->model->delete($id)) {
                    echo json_encode(["message" => "Deleted"]);
                } else {
                    echo json_encode(["message" => "Unable to delete"]);
                }
                break;
        }
    }
}
?>`;
      files.push({ name: `${modelName}Controller.php`, path: `${root}/controllers/${modelName}Controller.php`, content: controllerContent, language: 'php' });
  });

  // --- Queries Controller ---
  const selectQueries = queries.filter(q => q.type === 'SELECT');
  if (selectQueries.length > 0) {
      let queryMethods = '';
      selectQueries.forEach(q => {
          const camelName = toCamelCase(q.name);
          const safeName = toPascalCase(q.name);
          queryMethods += `
    private function get${safeName}() {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $pageSize = isset($_GET['pageSize']) ? (int)$_GET['pageSize'] : 20;
        $offset = ($page - 1) * $pageSize;
        
        $sql = "SELECT * FROM \`" . "${safeName}" . "\` WHERE 1=1";
        
        // Handle MS Access style form references passed as query parameters
        foreach ($_GET as $key => $value) {
            if (strpos($key, 'form_') === 0) {
                // Filter mapping logic goes here
            }
        }
        
        $sql .= " LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $countSql = "SELECT COUNT(*) FROM \`" . "${safeName}" . "\`";
        $stmtCount = $this->db->query($countSql);
        $total = $stmtCount->fetchColumn();
        
        echo json_encode([
            'data' => $results,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => ceil($total / $pageSize)
        ]);
    }
`;
      });
      
      let endpointCases = selectQueries.map(q => {
          return `
            case '${toCamelCase(q.name)}':
                $this->get${toPascalCase(q.name)}();
                break;`;
      }).join('');
      
      const queriesControllerContent = `<?php
namespace App\\Controllers;

use PDO;

class QueriesController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function processRequest($method, $queryName) {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
            return;
        }

        switch ($queryName) {${endpointCases}
            default:
                http_response_code(404);
                echo json_encode(['message' => 'Query not found']);
                break;
        }
    }
${queryMethods}
}
?>`;
      files.push({ name: 'QueriesController.php', path: `${root}/controllers/QueriesController.php`, content: queriesControllerContent, language: 'php' });
  }

  // --- Offline Sync Controller (PHP Native) ---
  const tableNamesPhp = tables.map(t => `'${toPascalCase(t.name)}'`).join(', ');
  const syncControllerPhp = `<?php
namespace App\\Controllers;

use PDO;
use Exception;

class SyncController {
    private $db;
    private $supportedTables = [${tableNamesPhp}];

    public function __construct($db) {
        $this->db = $db;
    }

    public function processRequest($method, $action = null) {
        if ($method === 'GET' && ($action === 'status' || $action === null)) {
            $this->getStatus();
            return;
        }

        if ($method === 'POST') {
            if ($action === 'push') {
                $this->pushChanges();
                return;
            } elseif ($action === 'pull') {
                $this->pullChanges();
                return;
            }
        }

        http_response_code(400);
        echo json_encode(["message" => "Invalid sync action"]);
    }

    private function getStatus() {
        echo json_encode([
            "isOnline" => true,
            "serverTimestamp" => gmdate("c"),
            "serverVersion" => "1.0.0",
            "supportedTables" => $this->supportedTables
        ]);
    }

    private function pushChanges() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['changes'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "errors" => ["Invalid payload"]]);
            return;
        }

        $applied = 0;
        $serverNow = gmdate("Y-m-d H:i:s");
        $clientId = $data['clientId'] ?? null;

        try {
            $this->db->beginTransaction();

            foreach ($data['changes'] as $table => $syncData) {
                // Check table validity
                $matchedTable = null;
                foreach ($this->supportedTables as $st) {
                    if (strcasecmp($st, $table) === 0) {
                        $matchedTable = $st;
                        break;
                    }
                }
                if (!$matchedTable) continue;

                // 1. Process Soft-Deletes
                if (!empty($syncData['deletedIds'])) {
                    foreach ($syncData['deletedIds'] as $delId) {
                        try {
                            $stmt = $this->db->prepare("UPDATE \`$matchedTable\` SET _is_deleted = 1, _updated_at = :now WHERE id = :id OR ID = :id");
                            $stmt->execute([':now' => $serverNow, ':id' => $delId]);
                            $applied += $stmt->rowCount();
                        } catch (Exception $e) {
                            $stmt = $this->db->prepare("DELETE FROM \`$matchedTable\` WHERE id = :id OR ID = :id");
                            $stmt->execute([':id' => $delId]);
                            $applied += $stmt->rowCount();
                        }
                    }
                }

                // 2. Process Upserts
                if (!empty($syncData['upserted'])) {
                    foreach ($syncData['upserted'] as $record) {
                        if (empty($record)) continue;
                        $pkKey = isset($record['id']) ? 'id' : (isset($record['ID']) ? 'ID' : array_key_first($record));
                        $pkVal = $record[$pkKey] ?? null;

                        $record['_updated_at'] = $serverNow;
                        $record['_is_deleted'] = 0;
                        if ($clientId) {
                            $record['_client_id'] = $clientId;
                        }

                        $exists = false;
                        if ($pkVal !== null) {
                            $stmt = $this->db->prepare("SELECT COUNT(*) FROM \`$matchedTable\` WHERE \`$pkKey\` = :id");
                            $stmt->execute([':id' => $pkVal]);
                            $exists = $stmt->fetchColumn() > 0;
                        }

                        if ($exists) {
                            $setCols = [];
                            $params = [':pk' => $pkVal];
                            foreach ($record as $col => $val) {
                                if ($col === $pkKey) continue;
                                $paramName = ':p_' . preg_replace('/[^a-zA-Z0-9_]/', '', $col);
                                $setCols[] = "\`$col\` = $paramName";
                                $params[$paramName] = is_array($val) ? json_encode($val) : $val;
                            }
                            $sql = "UPDATE \`$matchedTable\` SET " . implode(", ", $setCols) . " WHERE \`$pkKey\` = :pk";
                            $stmt = $this->db->prepare($sql);
                            $stmt->execute($params);
                            $applied += $stmt->rowCount();
                        } else {
                            $cols = [];
                            $placeholders = [];
                            $params = [];
                            foreach ($record as $col => $val) {
                                $paramName = ':p_' . preg_replace('/[^a-zA-Z0-9_]/', '', $col);
                                $cols[] = "\`$col\`";
                                $placeholders[] = $paramName;
                                $params[$paramName] = is_array($val) ? json_encode($val) : $val;
                            }
                            $sql = "INSERT INTO \`$matchedTable\` (" . implode(", ", $cols) . ") VALUES (" . implode(", ", $placeholders) . ")";
                            $stmt = $this->db->prepare($sql);
                            $stmt->execute($params);
                            $applied += 1;
                        }
                    }
                }
            }

            $this->db->commit();
            echo json_encode([
                "success" => true,
                "appliedCount" => $applied,
                "serverTimestamp" => gmdate("c")
            ]);
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            http_response_code(500);
            echo json_encode(["success" => false, "errors" => [$e->getMessage()]]);
        }
    }

    private function pullChanges() {
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        $since = $data['since'] ?? null;
        $requestedTables = $data['tables'] ?? $this->supportedTables;

        $changes = [];

        foreach ($requestedTables as $table) {
            $matchedTable = null;
            foreach ($this->supportedTables as $st) {
                if (strcasecmp($st, $table) === 0) {
                    $matchedTable = $st;
                    break;
                }
            }
            if (!$matchedTable) continue;

            $tableData = ["upserted" => [], "deletedIds" => []];

            try {
                if ($since) {
                    $stmt = $this->db->prepare("SELECT * FROM \`$matchedTable\` WHERE _updated_at > :since OR _created_at > :since");
                    $stmt->execute([':since' => $since]);
                } else {
                    $stmt = $this->db->query("SELECT * FROM \`$matchedTable\`");
                }

                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $row) {
                    $isDeleted = !empty($row['_is_deleted']) && $row['_is_deleted'] == 1;
                    $idVal = $row['id'] ?? ($row['ID'] ?? ($row['Id'] ?? null));

                    if ($isDeleted && $idVal !== null) {
                        $tableData['deletedIds'][] = $idVal;
                    } else {
                        $tableData['upserted'][] = $row;
                    }
                }
            } catch (Exception $e) {
                // Fallback for tables without metadata
                $stmt = $this->db->query("SELECT * FROM \`$matchedTable\`");
                $tableData['upserted'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            $changes[$matchedTable] = $tableData;
        }

        echo json_encode([
            "success" => true,
            "serverTimestamp" => gmdate("c"),
            "changes" => $changes
        ]);
    }
}
?>`;
  files.push({ name: 'SyncController.php', path: `${root}/controllers/SyncController.php`, content: syncControllerPhp, language: 'php' });

  // 5. Main Router (index.php)
  const routerContent = `<?php
use App\\Config\\Database;

// Autoloader
require_once __DIR__ . '/vendor/autoload.php'; // Assuming composer install was run
spl_autoload_register(function ($class_name) {
    $file = __DIR__ . '/' . str_replace(['App\\\\', '\\\\'], ['', '/'], $class_name) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

function getLoggedInUser() {
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } else {
        $headers = array_change_key_case(function_exists('getallheaders') ? getallheaders() : [], CASE_LOWER);
        if (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }
    if (!empty($authHeader) && preg_match('/Bearer\\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        if (strpos($token, 'dummy-jwt-token-for-') === 0) {
            return str_replace('dummy-jwt-token-for-', '', $token);
        }
        if (strpos($token, 'dummy-jwt-token-sso-') === 0) {
            return str_replace('dummy-jwt-token-sso-', '', $token) . ' User';
        }
        return $token;
    }
    return 'System';
}

// CORS Config (Allow Credentials and Reflect Origin)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

// Router Logic
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', trim($uri, '/'));

$resource = null;
$id = null;

if (isset($uriSegments[0]) && $uriSegments[0] === 'api' && isset($uriSegments[1])) {
    $resource = $uriSegments[1];
    $id = isset($uriSegments[2]) ? $uriSegments[2] : null;
} elseif (isset($uriSegments[0])) {
    $resource = $uriSegments[0];
    $id = isset($uriSegments[1]) ? $uriSegments[1] : null;
}

if (!$resource) {
    echo json_encode(["message" => "Welcome to ${config.projectName} API"]);
    exit();
}

$controllerName = 'App\\\\Controllers\\\\' . ucfirst($resource) . 'Controller';

if (class_exists($controllerName)) {
    $database = new Database();
    $db = $database->getConnection();
    
    $controller = new $controllerName($db);
    $controller->processRequest($_SERVER["REQUEST_METHOD"], $id);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Resource '$resource' not found."]);
}
?>`;

  files.push({ name: 'index.php', path: `${root}/index.php`, content: routerContent, language: 'php' });
  
  if (config.authConfig?.useUserLogin) {
      const authControllerContent = `<?php
namespace App\\Controllers;

class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function processRequest($method, $action = null) {
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if ($action === 'login') {
            // Dummy authentication logic
            echo json_encode([
                "token" => "dummy-jwt-token-for-" . ($data->username ?? 'user'), 
                "user" => ["username" => $data->username ?? 'user', "role" => "Admin"]
            ]);
        } elseif ($action === 'login-sso') {
            echo json_encode([
                "token" => "dummy-jwt-token-for-sso-" . ($data->provider ?? 'unknown'), 
                "user" => ["username" => "SSO User", "role" => "User"]
            ]);
        } elseif ($action === 'register') {
            // Dummy logic for registering
            http_response_code(201);
            echo json_encode(["message" => "User registered successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Bad request auth action"]);
        }
    }
}
?>`;
      files.push({ name: 'AuthController.php', path: `${root}/controllers/AuthController.php`, content: authControllerContent, language: 'php' });
  }

  // 6. Helper: .htaccess
  files.push({
      name: '.htaccess',
      path: `${root}/.htaccess`,
      content: `RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^(.*)$ index.php [QSA,L]`,
      language: 'text'
  });

  // Docs
  const readmeContent = `# ${config.projectName} (PHP Native)

## Voraussetzungen
1. Installieren Sie **PHP** (Version 7.4 oder höher).
2. Installieren Sie **Composer** (für Autoloading, optional aber empfohlen).
3. Stellen Sie sicher, dass Ihre Datenbank (${config.dbType}) läuft.

## Einrichtung
1. Öffnen Sie \`config/Database.php\` und passen Sie die Verbindungseinstellungen an (Host, User, Password).
2. Führen Sie im Terminal \`composer install\` aus (oder nutzen Sie den eingebauten Fallback-Autoloader im \`index.php\`, falls keine externen Libs genutzt werden).

## Starten
Sie können den eingebauten PHP-Server verwenden. Öffnen Sie ein Terminal in diesem Ordner:

\`\`\`bash
# Server starten
php -S localhost:${config.port}
\`\`\`

Die API ist dann unter \`http://localhost:${config.port}/api\` erreichbar.
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
