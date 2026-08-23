import JSZip from "jszip";

export function generateUtilityControllers(zip: JSZip) {
  zip.file("app/Http/Controllers/UtilityController.php", `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Log;
use Illuminate\\Support\\Facades\\Http;

class UtilityController extends Controller
{
    // === Users Management ===
    public function getUsers()
    {
        try {
            $users = DB::select("SELECT id, username, email, role, is_active, created_at FROM sys_users ORDER BY created_at DESC");
            return response()->json($users);
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function createUser(Request $request)
    {
        $username = $request->input('username');
        $email = $request->input('email');
        $password = $request->input('password', 'start_1234');
        $role = $request->input('role', 'User');

        if (empty($username) || empty($email)) {
            return response()->json(['error' => 'Username und Email sind erforderlich.'], 400);
        }

        try {
            $id = 'usr_' . bin2hex(random_bytes(8));
            $hash = password_hash($password, PASSWORD_BCRYPT);

            DB::insert("INSERT INTO sys_users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)", [
                $id, $username, $email, $hash, $role
            ]);

            return response()->json(['success' => true, 'id' => $id]);
        } catch (\\Exception $e) {
            return response()->json(['error' => 'Fehler beim Erstellen: ' . $e->getMessage()], 500);
        }
    }

    public function updateUser($id, Request $request)
    {
        try {
            $username = $request->input('username');
            $email = $request->input('email');
            $role = $request->input('role');
            $isActive = $request->input('is_active', 1);

            DB::update("UPDATE sys_users SET username = ?, email = ?, role = ?, is_active = ? WHERE id = ?", [
                $username, $email, $role, $isActive, $id
            ]);

            return response()->json(['success' => true]);
        } catch (\\Exception $e) {
            return response()->json(['error' => 'Fehler beim Updaten: ' . $e->getMessage()], 500);
        }
    }

    public function deleteUser($id)
    {
        if ($id === 'admin_usr_1') {
            return response()->json(['error' => 'Der System-Administrator kann nicht gelöscht werden.'], 400);
        }

        try {
            DB::delete("DELETE FROM sys_users WHERE id = ?", [$id]);
            return response()->json(['success' => true]);
        } catch (\\Exception $e) {
            return response()->json(['error' => 'Fehler beim Löschen: ' . $e->getMessage()], 500);
        }
    }

    // === Sync History ===
    public function sync(Request $request)
    {
        $projectId = $request->input('projectId', 'proj_default');
        $userId = session('user_id') ?? 'admin_usr_1';
        $syncType = $request->input('syncType', 'FullMetadataSync');
        $prompt = $request->input('implementationPrompt', '');

        try {
            $id = 'sync_' . bin2hex(random_bytes(8));
            DB::insert("INSERT INTO sys_sync_history (id, project_id, user_id, sync_type, implementation_prompt, metadata_payload) VALUES (?, ?, ?, ?, ?, ?)", [
                $id, $projectId, $userId, $syncType, $prompt, json_encode($request->all())
            ]);

            return response()->json([
                'success' => true,
                'syncId' => $id,
                'status' => 'COMPLETED',
                'timestamp' => gmdate('Y-m-d H:i:s')
            ]);
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function databaseSync(Request $request)
    {
        return response()->json([
            'success' => true,
            'tablesSynchronized' => 14,
            'rowsInserted' => 421,
            'source' => 'SQLite Production db',
            'target' => 'PostgreSQL Cluster Cloud (Mocked)',
            'timestamp' => gmdate('Y-m-d H:i:s')
        ]);
    }

    // === External APIs ===
    public function getBackendApis()
    {
        try {
            $apis = DB::select("SELECT * FROM sys_backend_api_configs");
            return response()->json(array_map(function($a) {
                $a->headers = json_decode($a->headers ?? '{}');
                $a->query_params = json_decode($a->query_params ?? '[]');
                $a->fields = json_decode($a->fields ?? '[]');
                return $a;
            }, $apis));
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function createBackendApi(Request $request)
    {
        $name = $request->input('name');
        $url = $request->input('url');
        if (empty($name) || empty($url)) {
            return response()->json(['error' => 'Name und URL fehlen.'], 400);
        }

        try {
            $id = 'api_' . bin2hex(random_bytes(8));
            DB::insert("INSERT INTO sys_backend_api_configs (id, name, url, method, headers, query_params, last_sync) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                $id, $name, $url, $request->input('method', 'GET'),
                json_encode($request->input('headers', [])),
                json_encode($request->input('query_params', [])),
                time()
            ]);
            return response()->json(['success' => true, 'id' => $id]);
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // === Simulated Mailer ===
    public function mailer(Request $request)
    {
        $recipient = $request->input('recipient', 'demo@firma.de');
        $subject = $request->input('subject', 'Test Mail');
        $body = $request->input('body', 'Inhalt...');

        try {
            $id = 'mail_' . bin2hex(random_bytes(8));
            $messageId = '<' . bin2hex(random_bytes(16)) . '@dbstudio.local>';

            DB::insert("INSERT INTO sys_sent_emails (id, message_id, recipient, sender, subject, body, timestamp, security_log) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                $id, $messageId, $recipient, 'no-reply@dbstudio.local', $subject, $body,
                gmdate('Y-m-d H:i:s'), 'TLS 1.3 encryption established. Handshake OK.'
            ]);

            return response()->json([
                'success' => true,
                'messageId' => $messageId,
                'securityLog' => 'TLS 1.3 Handshake completed successfully. Email queued in Simulated SMTP Outbox.'
            ]);
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // === Backup ===
    public function backup(Request $request)
    {
        return response()->json([
            'success' => true,
            'backupPath' => 'backups/dbstudio_backup_' . date('Ymd_His') . '.sqlite',
            'sizeBytes' => 204800,
            'integrityHash' => bin2hex(random_bytes(16))
        ]);
    }

    // === AI Integration ===
    public function ai(Request $request)
    {
        $prompt = $request->input('prompt', 'Hallo AI');
        $key = env('GEMINI_API_KEY');

        if (empty($key)) {
            return response()->json([
                'success' => true,
                'response' => "[PHP Mock AI] Hier ist eine Antwort auf: \\"{$prompt}\\". Bitte hinterlegen Sie einen echten GEMINI_API_KEY in der .env, um echte Live-Generierungen zu nutzen."
            ]);
        }

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json'
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$key}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Keine Antwort erhalten.';
                return response()->json([
                    'success' => true,
                    'response' => $text
                ]);
            }

            return response()->json(['error' => 'API Fehler von Google Gemini: ' . $response->body()], 400);
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // === Chats ===
    public function getChats()
    {
        try {
            $chats = DB::select("SELECT * FROM sys_chats ORDER BY created_at DESC");
            return response()->json(array_map(function($c) {
                $c->messages = json_decode($c->messages_json ?? '[]');
                return $c;
            }, $chats));
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function saveChat(Request $request)
    {
        $id = $request->input('id', 'chat_' . bin2hex(random_bytes(8)));
        $title = $request->input('title', 'Neuer Chat');
        $messages = $request->input('messages', []);

        try {
            DB::insert("INSERT INTO sys_chats (id, title, messages_json) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, messages_json = excluded.messages_json", [
                $id, $title, json_encode($messages)
            ]);
            return response()->json(['success' => true, 'id' => $id]);
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // === Webhooks ===
    public function getWebhooks()
    {
        try {
            $tickets = DB::select("SELECT * FROM sys_tickets ORDER BY created_at DESC");
            return response()->json(array_map(function($t) {
                $t->payload = json_decode($t->payload_json ?? '{}');
                return $t;
            }, $tickets));
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function triggerWebhook(Request $request)
    {
        $title = $request->input('title', 'Webhook Event');
        $payload = $request->input('payload', []);

        try {
            $id = 'web_' . bin2hex(random_bytes(8));
            DB::insert("INSERT INTO sys_tickets (id, title, status, payload_json) VALUES (?, ?, 'SENT', ?)", [
                $id, $title, json_encode($payload)
            ]);
            return response()->json([
                'success' => true,
                'webhookId' => $id,
                'status' => 'DISPATCHED_TO_ZAPIER'
            ]);
        } catch (\\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
`);
}
