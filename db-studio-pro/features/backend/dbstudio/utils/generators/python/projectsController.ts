import JSZip from "jszip";

export function generateProjectsController(zip: JSZip) {
  zip.file("routers/projects.py", `from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Any, List
import sqlite3
import json
import time
import secrets
from db_helper import get_db_connection

router = APIRouter(prefix="/api", tags=["Projects"])

class ProjectSave(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = "Neues Projekt"
    description: Optional[str] = ""
    dbType: Optional[str] = "SQLite"
    isCloud: Optional[bool] = False
    data: Optional[Any] = None

@router.get("/projects")
@router.get("/team/projects")
def get_projects():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM sys_projects ORDER BY created_at DESC")
        projects = [dict(row) for row in cursor.fetchall()]

        cursor.execute("SELECT * FROM sys_users")
        users = [dict(row) for row in cursor.fetchall()]

        result = []
        for p in projects:
            owner_id = p.get("owner_id")
            owner_user = None
            for u in users:
                if u["id"] == owner_id or u["email"] == owner_id or u["username"] == owner_id:
                    owner_user = u
                    break
            
            owner_name = owner_user["username"] if owner_user else (owner_id if owner_id else "Administrator")
            clean_owner = owner_name.lower().replace(" ", ".").replace("\\\\", ".")
            owner_email = owner_user["email"] if owner_user else (owner_name if "@" in owner_name else f"{clean_owner}@firma.de")

            result.append({
                "id": p["id"],
                "name": p["name"],
                "description": p.get("description", ""),
                "status": "AKTIV",
                "isCloud": p.get("is_cloud") == 1,
                "dbType": p.get("db_type") or "SQLite",
                "language": p.get("language") or "python",
                "owner": owner_name,
                "ownerEmail": owner_email,
                "created": p.get("last_modified") or (int(time.time()) * 1000),
                "memberCount": 1,
                "teamMembers": [
                    {
                        "id": "mem_owner",
                        "email": owner_email,
                        "name": owner_name,
                        "role": "Projekt-Owner",
                        "status": "AKTIV"
                    }
                ]
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler: {str(e)}")
    finally:
        conn.close()

@router.get("/projects/{project_id}")
def get_project(project_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM sys_projects WHERE id = ?", (project_id,))
        p = cursor.fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Projekt nicht gefunden")

        p_dict = dict(p)
        
        cursor.execute("SELECT data_json FROM sys_project_payloads WHERE project_id = ?", (project_id,))
        payload = cursor.fetchone()
        
        data_val = None
        if payload and payload["data_json"]:
            try:
                data_val = json.loads(payload["data_json"])
            except Exception:
                data_val = payload["data_json"]

        cursor.execute("SELECT * FROM sys_users")
        users = [dict(row) for row in cursor.fetchall()]
        owner_id = p_dict.get("owner_id")
        owner_user = None
        for u in users:
            if u["id"] == owner_id or u["email"] == owner_id or u["username"] == owner_id:
                owner_user = u
                break
        
        owner_name = owner_user["username"] if owner_user else (owner_id if owner_id else "Administrator")
        owner_email = owner_user["email"] if owner_user else (owner_name if "@" in owner_name else f"{owner_name.lower()}@firma.de")

        return {
            "id": p_dict["id"],
            "name": p_dict["name"],
            "description": p_dict.get("description", ""),
            "dbType": p_dict.get("db_type") or "SQLite",
            "language": p_dict.get("language") or "python",
            "isCloud": p_dict.get("is_cloud") == 1,
            "owner": owner_name,
            "ownerEmail": owner_email,
            "created": p_dict.get("last_modified") or (int(time.time()) * 1000),
            "data": data_val
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler: {str(e)}")
    finally:
        conn.close()

@router.post("/projects")
def create_project(proj: ProjectSave):
    project_id = proj.id if proj.id else f"proj_{secrets.token_hex(8)}"
    now_ms = int(time.time() * 1000)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM sys_projects WHERE id = ?", (project_id,))
        exists = cursor.fetchone()

        is_cloud_val = 1 if proj.isCloud else 0
        owner_id = "admin_usr_1" # Default to admin user

        if exists:
            cursor.execute(
                "UPDATE sys_projects SET name = ?, description = ?, db_type = ?, is_cloud = ?, last_modified = ? WHERE id = ?",
                (proj.name, proj.description, proj.dbType, is_cloud_val, now_ms, project_id)
            )
        else:
            cursor.execute(
                "INSERT INTO sys_projects (id, name, description, db_type, language, is_cloud, owner_id, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (project_id, proj.name, proj.description, proj.dbType, "python", is_cloud_val, owner_id, now_ms)
            )

        if proj.data is not None:
            data_str = json.dumps(proj.data)
            cursor.execute(
                "INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET data_json = excluded.data_json",
                (project_id, data_str)
            )

        conn.commit()
        return {"success": True, "id": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler beim Speichern des Projekts: {str(e)}")
    finally:
        conn.close()
`);
}
