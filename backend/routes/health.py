import os
from flask import Blueprint, jsonify
health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health():
    services = {
        "assemblyai": bool(os.getenv("ASSEMBLYAI_API_KEY")),
        "gemini":     bool(os.getenv("GEMINI_API_KEY")),
        "murf":       bool(os.getenv("MURF_API_KEY")),
        "supabase":   bool(os.getenv("SUPABASE_URL")),
    }
    return jsonify({"status": "ok" if all(services.values()) else "degraded", "services": services}), 200