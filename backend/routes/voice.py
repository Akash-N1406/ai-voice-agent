import base64
from flask import Blueprint, request, jsonify
from services.stt_service import transcribe_audio
from services.llm_service  import generate_response
from services.tts_service  import synthesize_speech
from db.database import create_session, get_conversation_history, save_message, log_audio
from utils.logger import get_logger

logger   = get_logger(__name__)
voice_bp = Blueprint("voice", __name__)

@voice_bp.route("/process", methods=["POST"])
def process_voice():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided."}), 400

    audio_bytes = request.files["audio"].read()
    session_id  = request.form.get("session_id")

    try:
        if not session_id:
            session_id = create_session()["session_id"]

        transcript  = transcribe_audio(audio_bytes)
        if not transcript:
            return jsonify({"error": "Could not transcribe audio.", "session_id": session_id}), 422

        save_message(session_id, "user", transcript)
        history     = get_conversation_history(session_id)
        ai_response = generate_response(history)
        save_message(session_id, "assistant", ai_response)
        audio_out   = synthesize_speech(ai_response)
        log_audio(session_id)

        return jsonify({
            "session_id":   session_id,
            "transcript":   transcript,
            "response":     ai_response,
            "audio_base64": base64.b64encode(audio_out).decode("utf-8"),
            "audio_format": "mp3",
        }), 200

    except TimeoutError as e:
        return jsonify({"error": "Request timed out.", "details": str(e)}), 504
    except Exception as e:
        logger.exception(e)
        return jsonify({"error": "Server error.", "details": str(e)}), 500

@voice_bp.route("/history/<session_id>", methods=["GET"])
def get_history(session_id):
    return jsonify({"messages": get_conversation_history(session_id, 50)}), 200