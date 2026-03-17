import os
from datetime import datetime
from supabase import create_client
from utils.logger import get_logger

logger = get_logger(__name__)
_client = None

def get_client():
    global _client
    if not _client:
        _client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    return _client

def create_session(user_id=None):
    payload = {"created_at": datetime.utcnow().isoformat()}
    if user_id:
        payload["user_id"] = user_id
    return get_client().table("sessions").insert(payload).execute().data[0]

def save_message(session_id, role, content):
    return get_client().table("messages").insert({
        "session_id": session_id, "role": role,
        "content": content, "timestamp": datetime.utcnow().isoformat()
    }).execute().data[0]

def get_conversation_history(session_id, limit=20):
    rows = get_client().table("messages").select("role, content") \
        .eq("session_id", session_id).order("timestamp").limit(limit).execute().data
    return [{"role": r["role"], "content": r["content"]} for r in rows]

def log_audio(session_id, audio_url="[inline]"):
    return get_client().table("audio_logs").insert({
        "session_id": session_id, "audio_url": audio_url,
        "created_at": datetime.utcnow().isoformat()
    }).execute().data[0]