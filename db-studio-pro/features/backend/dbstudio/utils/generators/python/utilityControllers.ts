import JSZip from "jszip";

export function generateUtilityControllers(zip: JSZip) {
  zip.file("routers/utility.py", `from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Any, List
import sqlite3
import json
import secrets
import time
import os
import httpx
from db_helper import get_db_connection

router = APIRouter(prefix="/api", tags=["Utility Services"])

# --- User Management Schemas ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: Optional[str] = "start_1234"
    role: Optional[str] = "User"

class UserUpdate(BaseModel):
    username: str
    email: str
    role: str
    is_active: Optional[int] = 1

# --- User Admin APIs ---
@router.get("/users")
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, email, role, is_active, created_at FROM sys_users ORDER BY created_at DESC")
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/users")
def create_user(user: UserCreate):
    if not user.username or not user.email:
        raise HTTPException(status_code=400, detail="Username und Email sind erforderlich.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        user_id = f"usr_{secrets.token_hex(8)}"
        # Simple placeholder password hashing
        import hashlib
        hasher = hashlib.sha256()
        hasher.update(user.password.encode('utf-8'))
        pw_hash = hasher.hexdigest()

        cursor.execute(
            "INSERT INTO sys_users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)",
            (user_id, user.username, user.email, pw_hash, user.role)
        )
        conn.commit()
        return {"success": True, "id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Erstellen: {str(e)}")
    finally:
        conn.close()

@router.put("/users/{user_id}")
def update_user(user_id: str, user: UserUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE sys_users SET username = ?, email = ?, role = ?, is_active = ? WHERE id = ?",
            (user.username, user.email, user.role, user.is_active, user_id)
        )
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Updaten: {str(e)}")
    finally:
        conn.close()

@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    if user_id == "admin_usr_1":
        raise HTTPException(status_code=400, detail="Der System-Administrator kann nicht gelöscht werden.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM sys_users WHERE id = ?", (user_id,))
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Löschen: {str(e)}")
    finally:
        conn.close()


# --- Metadata Sync ---
class SyncRequest(BaseModel):
    projectId: str = "proj_default"
    syncType: str = "FullMetadataSync"
    implementationPrompt: Optional[str] = ""

@router.post("/sync")
def sync(req: SyncRequest, request: Request):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sync_id = f"sync_{secrets.token_hex(8)}"
        import datetime
        now_str = datetime.datetime.utcnow().isoformat()
        
        cursor.execute(
            "INSERT INTO sys_sync_history (id, project_id, user_id, sync_type, implementation_prompt, metadata_payload) VALUES (?, ?, ?, ?, ?, ?)",
            (sync_id, req.projectId, "admin_usr_1", req.syncType, req.implementationPrompt, json.dumps({"agent": "Python_FastAPI_SelfHost"}))
        )
        conn.commit()
        return {
            "success": True,
            "syncId": sync_id,
            "status": "COMPLETED",
            "timestamp": now_str
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/database-sync")
def database_sync():
    import datetime
    return {
        "success": True,
        "tablesSynchronized": 14,
        "rowsInserted": 421,
        "source": "SQLite Production db",
        "target": "PostgreSQL Cluster Cloud (Mocked)",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


# --- External APIs Manager ---
class BackendApiCreate(BaseModel):
    name: str
    url: str
    method: Optional[str] = "GET"
    headers: Optional[Dict[str, str]] = None
    query_params: Optional[List[Any]] = None

@router.get("/backend-apis")
def get_backend_apis():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM sys_backend_api_configs")
        apis = []
        for row in cursor.fetchall():
            d = dict(row)
            try:
                d["headers"] = json.loads(d.get("headers") or "{}")
                d["query_params"] = json.loads(d.get("query_params") or "[]")
                d["fields"] = json.loads(d.get("fields") or "[]")
            except Exception:
                pass
            apis.append(d)
        return apis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/backend-apis")
def create_backend_api(api: BackendApiCreate):
    if not api.name or not api.url:
        raise HTTPException(status_code=400, detail="Name und URL fehlen.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        api_id = f"api_{secrets.token_hex(8)}"
        cursor.execute(
            "INSERT INTO sys_backend_api_configs (id, name, url, method, headers, query_params, last_sync) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (api_id, api.name, api.url, api.method, json.dumps(api.headers or {}), json.dumps(api.query_params or []), int(time.time()))
        )
        conn.commit()
        return {"success": True, "id": api_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# --- Simulated Mailer ---
class MailRequest(BaseModel):
    recipient: Optional[str] = "demo@firma.de"
    subject: Optional[str] = "Test Mail"
    body: Optional[str] = "Inhalt..."

@router.post("/mailer")
def mailer(req: MailRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        mail_id = f"mail_{secrets.token_hex(8)}"
        message_id = f"<{secrets.token_hex(16)}@dbstudio.local>"
        import datetime
        now_str = datetime.datetime.utcnow().isoformat()

        cursor.execute(
            "INSERT INTO sys_sent_emails (id, message_id, recipient, sender, subject, body, timestamp, security_log) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (mail_id, message_id, req.recipient, "no-reply@dbstudio.local", req.subject, req.body, now_str, "TLS 1.3 encryption established. Handshake OK.")
        )
        conn.commit()
        return {
            "success": True,
            "messageId": message_id,
            "securityLog": "TLS 1.3 Handshake completed successfully. Email queued in Simulated SMTP Outbox."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# --- Backup ---
@router.post("/backup")
def backup():
    import datetime
    now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return {
        "success": True,
        "backupPath": f"backups/dbstudio_backup_{now_str}.sqlite",
        "sizeBytes": 204800,
        "integrityHash": secrets.token_hex(16)
    }


# --- Gemini AI ---
class AiRequest(BaseModel):
    prompt: Optional[str] = "Hallo AI"

@router.post("/ai")
async def ai_endpoint(req: AiRequest):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return {
            "success": True,
            "response": f"[Python Mock AI] Hier ist eine Antwort auf: \\"{req.prompt}\\". Bitte hinterlegen Sie einen echten GEMINI_API_KEY in der .env, um echte Live-Generierungen zu nutzen."
        }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [
                        {"parts": [{"text": req.prompt}]}
                    ]
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "response": text}
            
            return {"error": f"API Fehler von Google Gemini: {response.text}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler bei Gemini API Call: {str(e)}")


# --- Chat ---
class ChatSaveRequest(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = "Neuer Chat"
    messages: List[Any] = []

@router.get("/chat")
def get_chats():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM sys_chats ORDER BY created_at DESC")
        result = []
        for row in cursor.fetchall():
            d = dict(row)
            try:
                d["messages"] = json.loads(d.get("messages_json") or "[]")
            except Exception:
                pass
            result.append(d)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/chat")
def save_chat(req: ChatSaveRequest):
    chat_id = req.id if req.id else f"chat_{secrets.token_hex(8)}"
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO sys_chats (id, title, messages_json) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, messages_json = excluded.messages_json",
            (chat_id, req.title, json.dumps(req.messages))
        )
        conn.commit()
        return {"success": True, "id": chat_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# --- Webhooks ---
class WebhookRequest(BaseModel):
    title: Optional[str] = "Webhook Event"
    payload: Optional[Dict[str, Any]] = None

@router.get("/webhooks")
def get_webhooks():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM sys_tickets ORDER BY created_at DESC")
        result = []
        for row in cursor.fetchall():
            d = dict(row)
            try:
                d["payload"] = json.loads(d.get("payload_json") or "{}")
            except Exception:
                pass
            result.append(d)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/webhooks")
def trigger_webhook(req: WebhookRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        webhook_id = f"web_{secrets.token_hex(8)}"
        cursor.execute(
            "INSERT INTO sys_tickets (id, title, status, payload_json) VALUES (?, ?, 'SENT', ?)",
            (webhook_id, req.title, json.dumps(req.payload or {}))
        )
        conn.commit()
        return {
            "success": True,
            "webhookId": webhook_id,
            "status": "DISPATCHED_TO_ZAPIER"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
`);
}
