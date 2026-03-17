const UI = (() => {
    const micBtn = document.getElementById("mic-btn");
    const micIcon = document.getElementById("mic-icon");
    const stopIcon = document.getElementById("stop-icon");
    const stateLabel = document.getElementById("state-label");
    const statusBadge = document.getElementById("status-badge");
    const rings = document.getElementById("rings");
    const transcriptBar = document.getElementById("transcript-bar");
    const transcriptTxt = document.getElementById("transcript-text");
    const conversation = document.getElementById("conversation");
    const convEmpty = document.getElementById("conversation-empty");
    const apiDot = document.querySelector(".dot");
    const toastContainer = document.getElementById("toast-container");

    function setState(state) {
        // Remove all state classes
        ["listening", "thinking", "speaking"].forEach(s => {
            micBtn.classList.remove(s);
            stateLabel.classList.remove(s);
            rings.classList.remove(s);
        });

        const labels = {
            idle: "TAP TO SPEAK",
            listening: "LISTENING... TAP TO STOP",
            thinking: "THINKING...",
            speaking: "SPEAKING...",
        };
        const badges = {
            idle: ["IDLE", "badge--idle"],
            listening: ["REC", "badge--listening"],
            thinking: ["THINKING", "badge--thinking"],
            speaking: ["SPEAKING", "badge--speaking"],
        };

        stateLabel.textContent = labels[state] || "TAP TO SPEAK";
        if (state !== "idle") stateLabel.classList.add(state);

        statusBadge.textContent = badges[state][0];
        statusBadge.className = `badge ${badges[state][1]}`;

        if (state !== "idle") {
            micBtn.classList.add(state);
            rings.classList.add(state);
        }

        // Toggle mic / stop icon
        if (state === "listening") {
            micIcon.classList.add("hidden");
            stopIcon.classList.remove("hidden");
        } else {
            micIcon.classList.remove("hidden");
            stopIcon.classList.add("hidden");
        }
    }

    function showTranscript(text) {
        transcriptTxt.textContent = text;
        transcriptBar.classList.add("visible");
    }

    function hideTranscript() {
        transcriptBar.classList.remove("visible");
    }

    function addMessage(role, content) {
        // Remove empty state
        if (convEmpty) convEmpty.style.display = "none";

        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const div = document.createElement("div");
        div.className = `message message--${role}`;

        div.innerHTML = `
      <div class="message__avatar">${role === "user" ? "YOU" : "AI"}</div>
      <div>
        <div class="message__bubble">${escapeHtml(content)}</div>
        <div class="message__time">${time}</div>
      </div>
    `;

        conversation.appendChild(div);
        div.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    function setApiStatus(status) {
        apiDot.className = "dot " + status; // "ok" | "error" | "loading"
    }

    function toast(message, type = "info") {
        const el = document.createElement("div");
        el.className = `toast ${type}`;
        el.textContent = message;
        toastContainer.appendChild(el);
        setTimeout(() => {
            el.classList.add("fade-out");
            setTimeout(() => el.remove(), 300);
        }, 4000);
    }

    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    return { setState, showTranscript, hideTranscript, addMessage, setApiStatus, toast };
})();