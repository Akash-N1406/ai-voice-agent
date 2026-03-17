import os, time, requests
from utils.logger import get_logger

logger = get_logger(__name__)
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
HEADERS = {"authorization": ASSEMBLYAI_API_KEY, "content-type": "application/json"}

def transcribe_audio(audio_bytes: bytes) -> str:
    # Step 1: Upload audio
    upload_res = requests.post(
        "https://api.assemblyai.com/v2/upload",
        headers={"authorization": ASSEMBLYAI_API_KEY},
        data=audio_bytes, timeout=30
    )
    upload_res.raise_for_status()
    audio_url = upload_res.json()["upload_url"]

    # Step 2: Request transcription
    transcript_res = requests.post(
        "https://api.assemblyai.com/v2/transcript",
        json={"audio_url": audio_url, "punctuate": True, "format_text": True},
        headers=HEADERS, timeout=30
    )
    transcript_res.raise_for_status()
    transcript_id = transcript_res.json()["id"]

    # Step 3: Poll for result
    poll_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
    for _ in range(30):
        poll = requests.get(poll_url, headers=HEADERS, timeout=15)
        poll.raise_for_status()
        data = poll.json()
        if data["status"] == "completed":
            return data.get("text", "").strip()
        elif data["status"] == "error":
            raise RuntimeError(f"AssemblyAI error: {data.get('error')}")
        time.sleep(2)

    raise TimeoutError("Transcription timed out.")