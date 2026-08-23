import { BridgeConfig } from '../../types/bridge';

export function generateBridgeRelayPhpCode(config: BridgeConfig): string {
  const token = config.token || 'dbstudio-bridge-local-token';

  return `<?php
/**
 * DB Studio Universal Bridge Relay (PHP Gateway)
 * Generiert für Token: ${token}
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Bridge-Token, Access-Control-Request-Private-Network, bypass-tunnel-reminder, *");
header("Access-Control-Allow-Private-Network: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$storageDir = __DIR__ . '/bridge_storage';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0777, true);
}

$action = $_GET['action'] ?? '';
$token = $_SERVER['HTTP_X_BRIDGE_TOKEN'] ?? $_GET['token'] ?? '';
$configToken = "${token}";

// 1. Status Check & Telemetrie
if ($action === 'status' || empty($action)) {
    $heartbeatFile = $storageDir . '/heartbeat.json';
    $heartbeat = file_exists($heartbeatFile) ? json_decode(file_get_contents($heartbeatFile), true) : null;
    $isOnline = $heartbeat && (time() - ($heartbeat['lastSeen'] ?? 0) < 30);

    // Read project status if requested
    $projectId = $_GET['projectId'] ?? '';
    $projectStatus = null;
    if ($projectId && file_exists($storageDir . '/status_' . $projectId . '.json')) {
        $projectStatus = json_decode(file_get_contents($storageDir . '/status_' . $projectId . '.json'), true);
    }

    $response = [
        "status" => $isOnline ? "online" : "waiting_for_bridge",
        "relayType" => "PHP_HTTPS_GATEWAY",
        "bridgeConnected" => $isOnline,
        "serverTime" => date('Y-m-d H:i:s'),
        "projectStatus" => $projectStatus,
        "runtimes" => [
            "phpGateway" => ["installed" => true, "version" => PHP_VERSION]
        ]
    ];

    // Merge live telemetry sent from Bridge Agent
    if ($heartbeat && is_array($heartbeat)) {
        if (!empty($heartbeat['hostname'])) $response['hostname'] = $heartbeat['hostname'];
        if (!empty($heartbeat['osPlatform'])) $response['osPlatform'] = $heartbeat['osPlatform'];
        if (isset($heartbeat['freeMemoryMb'])) $response['freeMemoryMb'] = $heartbeat['freeMemoryMb'];
        if (isset($heartbeat['totalMemoryMb'])) $response['totalMemoryMb'] = $heartbeat['totalMemoryMb'];
        if (!empty($heartbeat['bridgePort'])) $response['bridgePort'] = $heartbeat['bridgePort'];
        if (!empty($heartbeat['runtimes']) && is_array($heartbeat['runtimes'])) {
            $response['runtimes'] = array_merge($response['runtimes'], $heartbeat['runtimes']);
        }
        if (!empty($heartbeat['runningProjects'])) $response['runningProjects'] = $heartbeat['runningProjects'];
        if (!empty($heartbeat['activeProcesses'])) $response['activeProcesses'] = $heartbeat['activeProcesses'];
    }

    echo json_encode($response);
    exit;
}

// 2. Deploy: DB Studio sendet Projekt an Cloud-Relay
if ($action === 'deploy' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true) ?: [];
    $projectId = $payload['projectId'] ?? 'project_' . time();
    $jobId = 'job_' . time() . '_' . substr(md5(uniqid()), 0, 8);
    file_put_contents($storageDir . '/' . $jobId . '.json', $rawInput);

    // Initial status: RUNNING
    file_put_contents($storageDir . '/status_' . $projectId . '.json', json_encode([
        "status" => "RUNNING",
        "lastAction" => "deploy",
        "timestamp" => time()
    ]));

    echo json_encode([
        "success" => true, 
        "jobId" => $jobId, 
        "projectId" => $projectId,
        "message" => "Projekt erfolgreich an Cloud-Relay übertragen. Lokale Bridge führt Ausführung durch."
    ]);
    exit;
}

// 3. Process Action: Start, Stop, Neustart
if (($action === 'action' || $action === 'process_action' || $action === 'process' || $action === 'stop' || $action === 'start' || $action === 'restart') && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $actionData = json_decode($rawInput, true) ?: [];
    
    // Determine action type (from JSON body or query param)
    $actionType = $actionData['action'] ?? (in_array($action, ['start', 'stop', 'restart']) ? $action : 'restart');
    $projectId = $actionData['projectId'] ?? ($_GET['projectId'] ?? 'default');

    $actionId = 'action_' . time() . '_' . substr(md5(uniqid()), 0, 8);
    file_put_contents($storageDir . '/' . $actionId . '.json', json_encode([
        "projectId" => $projectId, 
        "action" => $actionType,
        "timestamp" => time()
    ]));

    // Save persistent project status in Relay storage
    $newStatus = ($actionType === 'stop') ? 'STOPPED' : 'RUNNING';
    file_put_contents($storageDir . '/status_' . $projectId . '.json', json_encode([
        "status" => $newStatus,
        "lastAction" => $actionType,
        "timestamp" => time()
    ]));

    echo json_encode([
        "success" => true, 
        "actionId" => $actionId,
        "status" => $newStatus,
        "action" => $actionType,
        "message" => "Befehl " . strtoupper($actionType) . " erfolgreich an Relay übermittelt."
    ]);
    exit;
}

// 4. Lokale Bridge holt Jobs & Aktionen ab (Polling)
if ($action === 'pull_jobs') {
    $rawTelemetry = file_get_contents('php://input');
    $telemetryData = json_decode($rawTelemetry, true) ?: [];
    $telemetryData['lastSeen'] = time();
    file_put_contents($storageDir . '/heartbeat.json', json_encode($telemetryData));
    
    // Deployment Jobs
    $jobFiles = glob($storageDir . '/job_*.json');
    $jobs = [];
    if ($jobFiles) {
        foreach ($jobFiles as $file) {
            $jobs[] = ["id" => basename($file, '.json'), "type" => "deploy", "payload" => json_decode(file_get_contents($file), true)];
            @unlink($file);
        }
    }

    // Process Actions (Start / Stop / Restart)
    $actionFiles = glob($storageDir . '/action_*.json');
    $actions = [];
    if ($actionFiles) {
        foreach ($actionFiles as $file) {
            $actions[] = ["id" => basename($file, '.json'), "type" => "action", "payload" => json_decode(file_get_contents($file), true)];
            @unlink($file);
        }
    }

    echo json_encode([
        "jobs" => $jobs,
        "actions" => $actions
    ]);
    exit;
}

// 5. Lokale Bridge meldet Logs an Relay zurück
if ($action === 'push_logs' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $logData = json_decode($rawInput, true) ?: [];
    $projectId = $logData['projectId'] ?? 'default';
    
    $existing = [];
    $logFile = $storageDir . '/logs_' . $projectId . '.json';
    if (file_exists($logFile)) {
        $existing = json_decode(file_get_contents($logFile), true) ?: [];
    }
    if (!empty($logData['logs'])) {
        $merged = array_merge($existing, $logData['logs']);
        $merged = array_slice($merged, -200);
        file_put_contents($logFile, json_encode($merged));
    }
    echo json_encode(["success" => true]);
    exit;
}

// 6. DB Studio holt Logs ab (Polling-Fallback)
if ($action === 'get_logs') {
    $projectId = $_GET['projectId'] ?? 'default';
    $logFile = $storageDir . '/logs_' . $projectId . '.json';
    $logs = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
    echo json_encode(["logs" => $logs ?: []]);
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Unbekannte Aktion."]);
`;
}
