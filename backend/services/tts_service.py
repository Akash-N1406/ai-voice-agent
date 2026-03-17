import os, requests
from utils.logger import get_logger

logger = get_logger(__name__)
MURF_API_KEY = os.getenv("MURF_API_KEY")

def synthesize_speech(text: str) -> bytes:
    res = requests.post(
        "https://api.murf.ai/v1/speech/generate",
        headers={"api-key": MURF_API_KEY, "Content-Type": "application/json"},
        json={
            "voiceId":  os.getenv("MURF_VOICE_ID", "en-US-cooper"),
            "style":    os.getenv("MURF_STYLE", "Conversational"),
            "text":     text,
            "format":   "MP3",
        }, timeout=30
    )
    res.raise_for_status()
    audio_url = res.json().get("audioFile") or res.json().get("audio_file")
    audio = requests.get(audio_url, timeout=30)
    audio.raise_for_status()
    return audio.content