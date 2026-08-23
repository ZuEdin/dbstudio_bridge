import JSZip from "jszip";

export function generateProjectsController(zip: JSZip) {
  zip.file("app/Http/Controllers/ProjectsController.php", `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Log;

class ProjectsController extends Controller
{
    public function getProjects()
    {
        try {
            $projects = DB::select("SELECT * FROM sys_projects ORDER BY created_at DESC");
            $users = DB::select("SELECT * FROM sys_users");

            $result = array_map(function ($p) use ($users) {
                $ownerUser = null;
                foreach ($users as $u) {
                    if ($u->id === $p->owner_id || $u->email === $p->owner_id || $u->username === $p->owner_id) {
                        $ownerUser = $u;
                        break;
                    }
                }

                $ownerName = $ownerUser ? $ownerUser->username : (!empty($p->owner_id) ? $p->owner_id : "Administrator");
                $cleanOwner = str_replace([' ', '\\\\'], '.', strtolower($ownerName));
                $ownerEmail = $ownerUser ? $ownerUser->email : (str_contains($ownerName, '@') ? $ownerName : "{$cleanOwner}@firma.de");

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'status' => 'AKTIV',
                    'isCloud' => ($p->is_cloud == 1),
                    'dbType' => $p->db_type ?? 'SQLite',
                    'language' => $p->language ?? 'php',
                    'owner' => $ownerName,
                    'ownerEmail' => $ownerEmail,
                    'created' => $p->last_modified ?? (strtotime($p->created_at) * 1000),
                    'memberCount' => 1,
                    'teamMembers' => [
                        [
                            'id' => 'mem_owner',
                            'email' => $ownerEmail,
                            'name' => $ownerName,
                            'role' => 'Projekt-Owner',
                            'status' => 'AKTIV'
                        ]
                    ]
                ];
            }, $projects);

            return response()->json($result);
        } catch (\\Exception $e) {
            Log::error("PHP GetProjects failed: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler: ' . $e->getMessage()], 500);
        }
    }

    public function getProject($id)
    {
        try {
            $p = DB::selectOne("SELECT * FROM sys_projects WHERE id = ?", [$id]);
            if (!$p) {
                return response()->json(['error' => 'Projekt nicht gefunden'], 404);
            }

            $payload = DB::selectOne("SELECT data_json FROM sys_project_payloads WHERE project_id = ?", [$id]);
            $data = null;
            if ($payload && !empty($payload->data_json)) {
                $data = json_decode($payload->data_json, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $data = $payload->data_json;
                }
            }

            $users = DB::select("SELECT * FROM sys_users");
            $ownerUser = null;
            foreach ($users as $u) {
                if ($u->id === $p->owner_id || $u->email === $p->owner_id || $u->username === $p->owner_id) {
                    $ownerUser = $u;
                    break;
                }
            }
            $ownerName = $ownerUser ? $ownerUser->username : (!empty($p->owner_id) ? $p->owner_id : "Administrator");
            $ownerEmail = $ownerUser ? $ownerUser->email : (str_contains($ownerName, '@') ? $ownerName : strtolower($ownerName) . "@firma.de");

            return response()->json([
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'dbType' => $p->db_type ?? 'SQLite',
                'language' => $p->language ?? 'php',
                'isCloud' => ($p->is_cloud == 1),
                'owner' => $ownerName,
                'ownerEmail' => $ownerEmail,
                'created' => $p->last_modified ?? (strtotime($p->created_at) * 1000),
                'data' => $data
            ]);
        } catch (\\Exception $e) {
            Log::error("PHP GetProject failed: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler: ' . $e->getMessage()], 500);
        }
    }

    public function createProject(Request $request)
    {
        $id = $request->input('id');
        if (empty($id)) {
            $id = 'proj_' . bin2hex(random_bytes(8));
        }

        $name = $request->input('name', 'Neues Projekt');
        $desc = $request->input('description', '');
        $dbType = $request->input('dbType', 'SQLite');
        $isCloud = $request->input('isCloud') === true ? 1 : 0;
        $ownerId = session('user_id') ?? 'admin_usr_1';

        try {
            // Check if exists
            $exists = DB::selectOne("SELECT id FROM sys_projects WHERE id = ?", [$id]);

            if ($exists) {
                DB::update("UPDATE sys_projects SET name = ?, description = ?, db_type = ?, is_cloud = ?, last_modified = ? WHERE id = ?", [
                    $name,
                    $desc,
                    $dbType,
                    $isCloud,
                    round(microtime(true) * 1000),
                    $id
                ]);
            } else {
                DB::insert("INSERT INTO sys_projects (id, name, description, db_type, language, is_cloud, owner_id, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    $id,
                    $name,
                    $desc,
                    $dbType,
                    'php',
                    $isCloud,
                    $ownerId,
                    round(microtime(true) * 1000)
                ]);
            }

            if ($request->has('data')) {
                $dataJson = json_encode($request->input('data'));
                DB::insert("INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET data_json = excluded.data_json", [
                    $id,
                    $dataJson
                ]);
            }

            return response()->json(['success' => true, 'id' => $id]);
        } catch (\\Exception $e) {
            Log::error("PHP CreateProject failed: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler beim Speichern des Projekts: ' . $e->getMessage()], 500);
        }
    }
}
`);
}
