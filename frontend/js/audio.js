const AudioRecorder = (() => {
    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;
    let autoStopTimer = null;

    async function requestMicPermission() {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        return stream;
    }

    async function start(onAutoStop) {
        if (!stream) await requestMicPermission();

        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.start(250); // collect chunks every 250ms

        // Auto-stop after MAX_RECORD_SEC
        autoStopTimer = setTimeout(() => stop(), CONFIG.MAX_RECORD_SEC * 1000);
    }

    function stop() {
        return new Promise((resolve) => {
            clearTimeout(autoStopTimer);
            if (!mediaRecorder || mediaRecorder.state === "inactive") {
                resolve(null); return;
            }
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: "audio/webm" });
                resolve(blob);
            };
            mediaRecorder.stop();
        });
    }

    function isRecording() {
        return mediaRecorder && mediaRecorder.state === "recording";
    }

    return { start, stop, isRecording, requestMicPermission };
})();