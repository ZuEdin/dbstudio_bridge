<?php
/**
 * DB Studio Universal Bridge Relay Gateway (PHP)
 * Version: 2.0.0
 * 
 * Ermöglicht sichere Zwei-Wege-Kommunikation zwischen der Cloud-/Web-Anwendung (DB Studio)
 * und der lokalen Entwickler-Bridge auf dem PC (hinter NAT, Firewalls oder ohne Port-Forwarding).
 */

// 1. CORS & Private Network Access (PNA) Header
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Bridge-Token, Access-Control-Request-Private-Network, *");
header("Access-Control-Allow-Private-Network: true");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$storageDir = __DIR__ . '/bridge_storage';
if (!is_dir($storageDir)) {
    mkdir($storageDir, 0777, true);
}

$action = strtolower($_GET['action'] ?? '');
$token = $_SERVER['HTTP_X_BRIDGE_TOKEN'] ?? $_GET['token'] ?? '';

// =============================================================================
// A. STATUS & LIVE-TELEMETRIE (DB Studio -> Relay)
// =============================================================================
if ($action === 'status' || empty($action)) {
    $heartbeatFile = $storageDir . '/heartbeat.json';
    $heartbeat = file_exists($heartbeatFile) ? json_decode(file_get_contents($heartbeatFile), true) : null;
    $isBridgeOnline = $heartbeat && (abs(time() - ($heartbeat['lastSeen'] ?? 0)) < 60);
    $telemetry = $heartbeat ? ($heartbeat['telemetry'] ?? []) : [];

    echo json_encode([
        "status" => $isBridgeOnline ? "online" : "waiting_for_bridge",
        "relayType" => "PHP_HTTPS_GATEWAY",
        "version" => "2.0.0",
        "bridgeConnected" => $isBridgeOnline,
        "osPlatform" => $telemetry['osPlatform'] ?? "Unbekannt",
        "hostname" => $telemetry['hostname'] ?? "PC",
        "freeMemoryMb" => $telemetry['freeMemoryMb'] ?? null,
        "totalMemoryMb" => $telemetry['totalMemoryMb'] ?? null,
        "runtimes" => $telemetry['runtimes'] ?? [
            "dotnetSdk" => ["installed" => false],
            "nodejs" => ["installed" => false],
            "npm" => ["installed" => false],
            "rust" => ["installed" => false],
            "docker" => ["installed" => false, "running" => false]
        ],
        "activeProcesses" => $telemetry['activeProcesses'] ?? [],
        "bridgePort" => $telemetry['bridgePort'] ?? 5050,
        "projectsDir" => $telemetry['config']['projectsDir'] ?? null,
        "lastHeartbeat" => $heartbeat ? date('Y-m-d H:i:s', $heartbeat['lastSeen']) : null,
        "serverTime" => date('Y-m-d H:i:s')
    ]);
    exit;
}

// =============================================================================
// B. DEPLOYMENT JOB EINREICHEN (DB Studio -> Relay)
// =============================================================================
if ($action === 'deploy' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(["error" => "Ungültiger JSON Payload"]);
        exit;
    }

    $jobId = 'job_' . time() . '_' . substr(md5(uniqid()), 0, 8);
    file_put_contents($storageDir . '/' . $jobId . '.json', $rawInput);

    echo json_encode([
        "success" => true,
        "jobId" => $jobId,
        "message" => "Auftrag erfolgreich in die Queue eingereiht."
    ]);
    exit;
}

// =============================================================================
// C. PROZESS-STEUERUNG (Start / Stop / Restart / Kill)
// =============================================================================
if (in_array($action, ['stop', 'restart', 'start', 'kill', 'control', 'process_action', 'process'])) {
    $rawInput = file_get_contents('php://input');
    $payload = !empty($rawInput) ? json_decode($rawInput, true) : [];
    if (!is_array($payload)) $payload = [];
    
    $payload['controlAction'] = $action;
    if (isset($_GET['projectId'])) $payload['projectId'] = $_GET['projectId'];
    if (isset($_GET['processId'])) $payload['processId'] = $_GET['processId'];

    $jobId = 'ctrl_' . time() . '_' . substr(md5(uniqid()), 0, 8);
    file_put_contents($storageDir . '/' . $jobId . '.json', json_encode($payload));

    echo json_encode([
        "success" => true,
        "action" => $action,
        "message" => "Prozessbefehl '$action' in Queue hinterlegt."
    ]);
    exit;
}

// =============================================================================
// D. LIVE-LOGS STREAMING (Pollen & Pushes)
// =============================================================================
// 1. DB Studio holt neue Logs ab
if ($action === 'get_logs') {
    $projectId = $_GET['projectId'] ?? '';
    $logFile = $storageDir . '/live_logs.json';
    $logs = [];

    if (file_exists($logFile)) {
        $allLogs = json_decode(file_get_contents($logFile), true) ?: [];
        if (!empty($projectId)) {
            $logs = array_values(array_filter($allLogs, function($l) use ($projectId) {
                return !isset($l['projectId']) || strpos($l['projectId'], $projectId) !== false;
            }));
        } else {
            $logs = $allLogs;
        }
    }

    echo json_encode(["logs" => $logs]);
    exit;
}

// 2. Lokale Bridge schiebt Log-Chunks an das Relay
if ($action === 'push_logs' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $newLogs = json_decode($rawInput, true);
    $logFile = $storageDir . '/live_logs.json';

    $existing = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
    if (is_array($newLogs)) {
        $merged = array_merge($existing, $newLogs);
        // Behalte nur die letzten 200 Logs
        if (count($merged) > 200) {
            $merged = array_slice($merged, -200);
        }
        file_put_contents($logFile, json_encode($merged));
    }

    echo json_encode(["success" => true]);
    exit;
}

// =============================================================================
// E. LOKALE BRIDGE POLT AUFTRÄGE & SENDET TELEMETRIE (Bridge -> Relay)
// =============================================================================
if ($action === 'pull_jobs') {
    $rawInput = file_get_contents('php://input');
    $telemetryData = !empty($rawInput) ? json_decode($rawInput, true) : [];

    // Heartbeat & Telemetrie aktualisieren
    file_put_contents($storageDir . '/heartbeat.json', json_encode([
        "lastSeen" => time(),
        "telemetry" => $telemetryData
    ]));

    // Alle anstehenden Aufträge (Deployments & Befehle) abholen
    $jobFiles = glob($storageDir . '/{job_,ctrl_}*.json', GLOB_BRACE);
    $jobs = [];
    if ($jobFiles) {
        foreach ($jobFiles as $file) {
            $content = file_get_contents($file);
            $jobs[] = [
                "id" => basename($file, '.json'),
                "payload" => json_decode($content, true)
            ];
            unlink($file);
        }
    }

    echo json_encode(["jobs" => $jobs]);
    exit;
}

// =============================================================================
// F. ERGEBNIS-RÜCKMELDUNG (Bridge -> DB Studio)
// =============================================================================
if ($action === 'push_result' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if ($data && isset($data['jobId'])) {
        file_put_contents($storageDir . '/result_' . $data['jobId'] . '.json', $rawInput);
    }
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'get_result') {
    $jobId = $_GET['jobId'] ?? '';
    $resFile = $storageDir . '/result_' . $jobId . '.json';
    if (!empty($jobId) && file_exists($resFile)) {
        $result = json_decode(file_get_contents($resFile), true);
        echo json_encode(["found" => true, "result" => $result]);
    } else {
        echo json_encode(["found" => false, "message" => "Ergebnis noch nicht bereit."]);
    }
    exit;
}

// G. Fallback
http_response_code(404);
echo json_encode(["error" => "Unbekannte Aktion: " . $action]);
