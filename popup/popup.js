const detectedEl = document.getElementById("detected");
const questionEl = document.getElementById("question");
const askBtn = document.getElementById("askBtn");
const statusEl = document.getElementById("status");
const answerEl = document.getElementById("answer");

let currentInfo = null;

async function getCurrentTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function init() {
  const tabId = await getCurrentTabId();

  // Ask content script (via background) for latest video info
  chrome.runtime.sendMessage({ type: "POPUP_GET_INFO", tabId }, (res) => {
    if (!res?.ok) return;
    currentInfo = res.info;

    if (currentInfo?.videoId) {
      detectedEl.textContent = `Found video: ${currentInfo.title} (${currentInfo.videoId})`;
      statusEl.textContent = "Hi! How may I help?";
    } else {
      detectedEl.textContent =
        "Not on a YouTube video. Open a video and reopen this popup.";
      askBtn.disabled = true;
    }
  });
}

askBtn.addEventListener("click", () => {
  const q = questionEl.value.trim();
  if (!q || !currentInfo?.videoId) return;

  askBtn.disabled = true;
  statusEl.textContent = "Processing…";
  answerEl.textContent = "";

  chrome.runtime.sendMessage(
    {
      type: "PROCESS_QUESTION",
      payload: { videoId: currentInfo.videoId, question: q }
    },
    (res) => {
      askBtn.disabled = false;
      if (!res?.ok) {
        statusEl.textContent = "Error";
        answerEl.textContent = res?.error || "Unknown error";
        return;
      }
      const data = res.data;
      statusEl.textContent = data?.rate_limited
        ? "Free limit reached (server). Try later or upgrade."
        : "Done";
      answerEl.textContent = data?.answer || "(no answer)";
    }
  );
});

init();
