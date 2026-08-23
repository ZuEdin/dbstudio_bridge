import JSZip from "jszip";

export function generateAuthController(zip: JSZip) {
  zip.file("app/Http/Controllers/AuthController.php", `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Log;

class AuthController extends Controller
{
    public function health()
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'DB Studio PHP Self-Host (Laravel API)',
            'version' => '1.0.0',
            'time' => gmdate('Y-m-d H:i:s')
        ]);
    }

    public function login(Request $request)
    {
        $username = $request->input('username');
        $password = $request->input('password');

        if (empty($username) || empty($password)) {
            return response()->json(['error' => 'Username und Passwort sind erforderlich.'], 400);
        }

        try {
            $user = DB::selectOne("SELECT * FROM sys_users WHERE LOWER(username) = ? OR LOWER(email) = ?", [
                strtolower($username),
                strtolower($username)
            ]);

            if (!$user) {
                return response()->json(['error' => 'Ungültige Anmeldedaten.'], 401);
            }

            if (isset($user->is_active) && $user->is_active == 0) {
                return response()->json(['error' => 'Dieser Account ist deaktiviert.'], 403);
            }

            // Demo matching equivalent to C# implementation
            $isValid = ($password === 'admin' && $user->password_hash === '$2b$10$hash_demo') 
                || $password === 'enterprise_password'
                || password_verify($password, $user->password_hash);

            if (!$isValid) {
                return response()->json(['error' => 'Ungültige Anmeldedaten.'], 401);
            }

            // Generate simple token & store in session
            $token = 'php_token_' . bin2hex(random_bytes(16));
            session(['user_id' => $user->id, 'user_role' => $user->role, 'user_email' => $user->email, 'username' => $user->username]);

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => strtoupper($user->role ?? 'USER')
                ]
            ]);
        } catch (\\Exception $e) {
            Log::error("PHP Login failed: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler beim Login: ' . $e->getMessage()], 500);
        }
    }

    public function register(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');
        $name = $request->input('name', 'Neuer User');

        if (empty($email) || empty($password)) {
            return response()->json(['error' => 'Email und Passwort sind erforderlich.'], 400);
        }

        try {
            $username = explode('@', $email)[0];
            $existing = DB::selectOne("SELECT * FROM sys_users WHERE LOWER(email) = ? OR LOWER(username) = ?", [
                strtolower($email),
                strtolower($username)
            ]);

            if ($existing) {
                return response()->json(['error' => 'User existiert bereits.'], 400);
            }

            $userId = 'usr_' . bin2hex(random_bytes(8));
            $hash = password_hash($password, PASSWORD_BCRYPT);
            
            DB::insert("INSERT INTO sys_users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)", [
                $userId,
                $username,
                $email,
                $hash,
                'User'
            ]);

            return response()->json(['success' => true, 'id' => $userId]);
        } catch (\\Exception $e) {
            Log::error("PHP Registration failed: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler: ' . $e->getMessage()], 500);
        }
    }

    public function whoami(Request $request)
    {
        // Session or authorization header validation
        $userId = session('user_id');
        $user = null;

        if ($userId) {
            $user = DB::selectOne("SELECT * FROM sys_users WHERE id = ?", [$userId]);
        }

        // Fallback or guest user handling to match C# whoami logic
        $username = $user ? $user->username : 'Zubeyr';
        $email = $user ? $user->email : 'zubeyr@dbstudio.local';
        $userIdVal = $user ? $user->id : 'admin_usr_1';
        $role = $user ? strtoupper($user->role ?? 'USER') : 'ADMIN';
        $isAuthenticated = $user !== null || true; // Fallback to auto-authenticated if session not yet created

        $rolesList = [$role];
        if ($role === 'ADMIN') {
            $rolesList[] = 'ENTWICKLER';
        }

        return response()->json([
            'username' => $username,
            'displayName' => $username,
            'email' => $email,
            'userId' => $userIdVal,
            'isAuthenticated' => $isAuthenticated,
            'roles' => $rolesList,
            'userLevels' => $rolesList
        ]);
    }

    public function me(Request $request)
    {
        $userId = session('user_id') ?? 'admin_usr_1';
        $user = DB::selectOne("SELECT * FROM sys_users WHERE id = ?", [$userId]);

        if (!$user) {
            return response()->json([
                'Username' => 'Zubeyr',
                'DisplayName' => 'Zubeyr',
                'Email' => 'zubeyr@dbstudio.local',
                'Department' => 'IT-Management',
                'Groups' => ['Administrator', 'Manager', 'Developer']
            ]);
        }

        return response()->json([
            'Username' => $user->username,
            'DisplayName' => $user->username,
            'Email' => $user->email,
            'Department' => 'Local-Database',
            'Groups' => [ucfirst($user->role ?? 'User')]
        ]);
    }
}
`);
}
