// Runs on YouTube pages. Detects video ID + title (even on SPA navigation).

function getVideoInfo() {
  try {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("v");
    const title =
      document.querySelector("h1.title")?.innerText ||
      document.title?.replace(" - YouTube", "") ||
      "YouTube Video";
    return id ? { videoId: id, title } : null;
  } catch {
    return null;
  }
}

// Send initial info
const info = getVideoInfo();
if (info) {
  chrome.runtime.sendMessage({ type: "YT_VIDEO_INFO", payload: info });
}

// Detect SPA URL changes on YouTube
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    const updated = getVideoInfo();
    if (updated) {
      chrome.runtime.sendMessage({ type: "YT_VIDEO_INFO", payload: updated });
    }
  }
}).observe(document, { subtree: true, childList: true });

// Respond to popup asking for latest info
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_VIDEO_INFO") {
    sendResponse(getVideoInfo());
  }
});
