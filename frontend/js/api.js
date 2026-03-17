const API = (() => {
    async function processVoice(audioBlob, sessionId = null) {
        const form = new FormData();
        form.append("audio", audioBlob, "recording.webm");
        if (sessionId) form.append("session_id", sessionId);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/voice/process`, {
                method: "POST", body: form, signal: controller.signal,
            });
            clearTimeout(timeout);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Server error");
            return data;
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === "AbortError") throw new Error("Request timed out.");
            throw err;
        }
    }

    async function checkHealth() {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/health`);
        return res.json();
    }

    return { processVoice, checkHealth };
})();