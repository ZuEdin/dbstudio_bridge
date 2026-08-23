import JSZip from "jszip";

export function generateDataController(zip: JSZip) {
  zip.file("routers/data.py", `from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, Any, Dict
import sqlite3
import json
import secrets
from db_helper import get_db_connection

router = APIRouter(prefix="/api/data", tags=["Dynamic Data"])

@router.get("/{table_name}")
def get_table_data(table_name: str, project_id: str = "proj_default"):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?",
            (table_name, project_id)
        )
        rows = cursor.fetchall()
        
        result = []
        for r in rows:
            try:
                result.append(json.loads(r["data_json"]))
            except Exception:
                result.append(r["data_json"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler beim Laden der Daten: {str(e)}")
    finally:
        conn.close()

@router.post("/{table_name}")
async def insert_table_data(table_name: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Ungültiger JSON-Body")

    project_id = body.get("project_id", "proj_default")
    record_id = body.get("id")
    if not record_id:
        record_id = f"rec_{secrets.token_hex(8)}"
        body["id"] = record_id

    data_json = json.dumps(body)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Combined ID for Primary Key to prevent overlap
        combined_id = record_id

        cursor.execute(
            "INSERT INTO sys_table_data (id, project_id, table_name, record_id, data_json) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP",
            (combined_id, project_id, table_name, record_id, data_json)
        )
        conn.commit()
        return {"success": True, "id": record_id, "data": body}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler beim Speichern der Daten: {str(e)}")
    finally:
        conn.close()

@router.delete("/{table_name}/{record_id}")
def delete_table_data(table_name: str, record_id: str, project_id: str = "proj_default"):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM sys_table_data WHERE table_name = ? AND id = ? AND project_id = ?",
            (table_name, record_id, project_id)
        )
        deleted = cursor.rowcount

        if deleted == 0:
            # Fallback check on record_id
            cursor.execute(
                "DELETE FROM sys_table_data WHERE table_name = ? AND record_id = ? AND project_id = ?",
                (table_name, record_id, project_id)
            )
            deleted = cursor.rowcount

        conn.commit()
        return {"success": True, "deleted": deleted > 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler beim Löschen der Daten: {str(e)}")
    finally:
        conn.close()
`);
}
