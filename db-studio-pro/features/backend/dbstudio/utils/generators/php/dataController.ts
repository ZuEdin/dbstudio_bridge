import JSZip from "jszip";

export function generateDataController(zip: JSZip) {
  zip.file("app/Http/Controllers/DataController.php", `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Log;

class DataController extends Controller
{
    public function getTableData($tableName, Request $request)
    {
        try {
            $projectId = $request->query('project_id', 'proj_default');
            $rows = DB::select("SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?", [
                $tableName,
                $projectId
            ]);

            $result = array_map(function ($r) {
                return json_decode($r->data_json, true);
            }, $rows);

            return response()->json($result);
        } catch (\\Exception $e) {
            Log::error("PHP GetTableData failed for {$tableName}: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler beim Laden der Daten: ' . $e->getMessage()], 500);
        }
    }

    public function insertTableData($tableName, Request $request)
    {
        try {
            $projectId = $request->input('project_id', 'proj_default');
            $recordId = $request->input('id');
            if (empty($recordId)) {
                $recordId = 'rec_' . bin2hex(random_bytes(8));
            }

            $body = $request->all();
            if (!isset($body['id'])) {
                $body['id'] = $recordId;
            }

            $dataJson = json_encode($body);

            // Use upsert pattern
            DB::insert("INSERT INTO sys_table_data (id, project_id, table_name, record_id, data_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP", [
                $recordId,
                $projectId,
                $tableName,
                $recordId,
                $dataJson
            ]);

            return response()->json(['success' => true, 'id' => $recordId, 'data' => $body]);
        } catch (\\Exception $e) {
            Log::error("PHP InsertTableData failed for {$tableName}: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler beim Speichern der Daten: ' . $e->getMessage()], 500);
        }
    }

    public function deleteTableData($tableName, $id, Request $request)
    {
        try {
            $projectId = $request->query('project_id', 'proj_default');
            $deleted = DB::delete("DELETE FROM sys_table_data WHERE table_name = ? AND id = ? AND project_id = ?", [
                $tableName,
                $id,
                $projectId
            ]);

            if ($deleted === 0) {
                // Try record_id fallback
                $deleted = DB::delete("DELETE FROM sys_table_data WHERE table_name = ? AND record_id = ? AND project_id = ?", [
                    $tableName,
                    $id,
                    $projectId
                ]);
            }

            return response()->json(['success' => true, 'deleted' => $deleted > 0]);
        } catch (\\Exception $e) {
            Log::error("PHP DeleteTableData failed for {$tableName}: " . $e->getMessage());
            return response()->json(['error' => 'Datenbankfehler beim Löschen der Daten: ' . $e->getMessage()], 500);
        }
    }
}
`);
}
