import os, requests
from datetime import datetime
from utils.logger import get_logger

logger = get_logger(__name__)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def get_system_prompt():
    today = datetime.now().strftime("%A, %B %d, %Y")
    return f"""You are a helpful, concise AI voice assistant.
Today's date is {today}. Always use this as the current date when answering questions.
Your responses will be read aloud, so keep them conversational,
avoid bullet points or markdown, and aim for 1-3 sentences."""

def generate_response(history: list) -> str:
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")
    if model.startswith("models/"):
        model = model[len("models/"):]

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={GEMINI_API_KEY}"
    )

    contents = [
        {"role": "user",  "parts": [{"text": get_system_prompt()}]},
        {"role": "model", "parts": [{"text": "Understood, ready to help!"}]},
    ]
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    res = requests.post(url, json={
        "contents": contents,
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 512}
    }, timeout=30)
    res.raise_for_status()
    return res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()