// Keeps latest video info per tab and proxies requests to backend.

const stateByTab = new Map(); // tabId -> { videoId, title }
const BACKEND_URL = "https://youtube-helper-chrome-extension-backend.onrender.com";
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Content script pushes video info
  if (message?.type === "YT_VIDEO_INFO" && sender.tab?.id != null) {
    stateByTab.set(sender.tab.id, message.payload);
    return; // no async response
  }

  // Popup asks for the current tab's stored info
  if (message?.type === "POPUP_GET_INFO") {
    const tabId = message.tabId;
    const info = stateByTab.get(tabId) || null;
    sendResponse({ ok: true, info });
    return true;
  }

  // Popup asks to process (videoId + user question) via backend
  if (message?.type === "PROCESS_QUESTION") {
    const { videoId, question } = message.payload || {};
    fetch("https://youtube-helper-chrome-extension-backend.onrender.com/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId, question })
    })
      .then(r => r.json())
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: String(err) }));
    return true; // async
  }
});

// Clean up mapping when tab closes
chrome.tabs.onRemoved.addListener((tabId) => stateByTab.delete(tabId));
