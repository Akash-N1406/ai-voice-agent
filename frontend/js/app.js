/**
 * app.js — Main application controller
 * Orchestrates recording → API → playback flow.
 */

let sessionId = null;
const audioPlayer = document.getElementById("audio-player");

// ── Boot ──────────────────────────────────────────────────
(async function init() {
    UI.setApiStatus("loading");
    try {
        const health = await API.checkHealth();
        UI.setApiStatus(health.status === "ok" ? "ok" : "error");
        if (health.status !== "ok") {
            UI.toast("Some services are offline. Check your backend.", "error");
        }
    } catch {
        UI.setApiStatus("error");
        UI.toast("Cannot reach backend. Is it running?", "error");
    }

    // Pre-request mic permission on load
    try {
        await AudioRecorder.requestMicPermission();
    } catch {
        UI.toast("Microphone access denied. Please allow it in your browser.", "error");
    }
})();

// ── Mic button handler ────────────────────────────────────
document.getElementById("mic-btn").addEventListener("click", async () => {
    if (AudioRecorder.isRecording()) {
        await stopAndProcess();
    } else {
        await startRecording();
    }
});

async function startRecording() {
    try {
        await AudioRecorder.start();
        UI.setState("listening");
        UI.hideTranscript();
    } catch (err) {
        UI.toast("Could not access microphone: " + err.message, "error");
    }
}

async function stopAndProcess() {
    UI.setState("thinking");

    const audioBlob = await AudioRecorder.stop();

    if (!audioBlob || audioBlob.size < 1000) {
        UI.toast("Recording was too short. Please try again.", "error");
        UI.setState("idle");
        return;
    }

    try {
        const result = await API.processVoice(audioBlob, sessionId);

        // Save session ID for multi-turn conversation
        sessionId = result.session_id;

        // Show transcript
        UI.showTranscript(result.transcript);
        UI.addMessage("user", result.transcript);

        // Show AI response in chat
        UI.addMessage("assistant", result.response);

        // Play audio response
        await playAudioResponse(result.audio_base64, result.audio_format);

    } catch (err) {
        UI.toast(err.message || "Something went wrong.", "error");
        UI.setState("idle");
    }
}

async function playAudioResponse(base64Audio, format = "mp3") {
    UI.setState("speaking");

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], { type: `audio/${format}` });
    const url = URL.createObjectURL(blob);

    audioPlayer.src = url;
    audioPlayer.onended = () => {
        UI.setState("idle");
        UI.hideTranscript();
        URL.revokeObjectURL(url);
    };
    audioPlayer.onerror = () => {
        UI.toast("Could not play audio response.", "error");
        UI.setState("idle");
    };

    await audioPlayer.play();
}