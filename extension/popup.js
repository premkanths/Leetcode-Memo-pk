// Popup script for Chrome extension
document.addEventListener("DOMContentLoaded", () => {
  const hubUrlInput = document.getElementById("hubUrl");
  const userIdInput = document.getElementById("userId");
  const usernameInput = document.getElementById("username");
  const syncBtn = document.getElementById("syncBtn");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  // Load saved credentials from chrome.storage
  chrome.storage.local.get(["hubUrl", "userId", "username"], (data) => {
    if (data.hubUrl) hubUrlInput.value = data.hubUrl;
    else hubUrlInput.value = "http://localhost:3000";

    if (data.userId) userIdInput.value = data.userId;
    if (data.username) usernameInput.value = data.username;
  });

  const showStatus = (text, type) => {
    statusDiv.textContent = text;
    statusDiv.className = `status ${type}`;
  };

  saveBtn.addEventListener("click", () => {
    chrome.storage.local.set(
      {
        hubUrl: hubUrlInput.value.trim(),
        userId: userIdInput.value.trim(),
        username: usernameInput.value.trim(),
      },
      () => {
        showStatus("Credentials saved locally!", "success");
        setTimeout(() => {
          statusDiv.style.display = "none";
        }, 2000);
      }
    );
  });

  syncBtn.addEventListener("click", async () => {
    const hubUrl = hubUrlInput.value.trim() || "http://localhost:3000";
    const userId = userIdInput.value.trim();
    const username = usernameInput.value.trim();

    if (!userId) {
      showStatus("Please enter your User ID from Memory Hub.", "error");
      return;
    }

    if (!username) {
      showStatus("Please enter your LeetCode username.", "error");
      return;
    }

    // Auto save credentials
    chrome.storage.local.set({ hubUrl, userId, username });

    syncBtn.disabled = true;
    syncBtn.textContent = "Syncing with LeetCode...";

    try {
      // Find the current active tab or any open leetcode.com tab
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      let targetTab = activeTabs.find((t) => t.url && t.url.includes("leetcode.com"));

      if (!targetTab) {
        const allLeetCodeTabs = await chrome.tabs.query({ url: "*://*.leetcode.com/*" });
        targetTab = allLeetCodeTabs[0];
      }

      if (!targetTab) {
        showStatus("Please open a LeetCode tab first (e.g. leetcode.com), then click Sync!", "error");
        syncBtn.disabled = false;
        syncBtn.innerHTML = "<span>⚡ Sync Now to Hub</span>";
        return;
      }

      // Helper to send message with auto-injection fallback if content script was not ready
      const sendSyncMessage = () => {
        chrome.tabs.sendMessage(
          targetTab.id,
          {
            action: "SYNC_SOLUTIONS",
            hubUrl,
            userId,
            username,
          },
          (response) => {
            syncBtn.disabled = false;
            syncBtn.innerHTML = "<span>⚡ Sync Now to Hub</span>";

            if (chrome.runtime.lastError) {
              // Content script might not be injected yet (e.g. page was open before extension installed)
              // Attempt programmatic injection
              if (chrome.scripting) {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: targetTab.id },
                    files: ["content.js"],
                  },
                  () => {
                    if (chrome.runtime.lastError) {
                      showStatus("Please reload your LeetCode page and click Sync again!", "error");
                      return;
                    }
                    // Retry once after injecting
                    setTimeout(() => {
                      chrome.tabs.sendMessage(
                        targetTab.id,
                        { action: "SYNC_SOLUTIONS", hubUrl, userId, username },
                        (retryRes) => {
                          if (retryRes && retryRes.success) {
                            showStatus(`✅ Captured ${retryRes.count} solutions! Go to Memory Hub & import.`, "success");
                          } else {
                            showStatus(`❌ ${(retryRes && retryRes.error) || "Please reload LeetCode page and retry."}`, "error");
                          }
                        }
                      );
                    }, 300);
                  }
                );
                return;
              }

              showStatus(
                "Could not communicate with the LeetCode tab. Please refresh your LeetCode page and try again!",
                "error"
              );
              return;
            }

            if (response && response.success) {
              showStatus(
                `✅ Captured ${response.count} solutions! Go to Memory Hub & click "Import Captured Solutions" to complete.`,
                "success"
              );
            } else {
              showStatus(`❌ ${(response && response.error) || "Sync failed"}`, "error");
            }
          }
        );
      };

      sendSyncMessage();
    } catch (err) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = "<span>⚡ Sync Now to Hub</span>";
      showStatus(`Error: ${err.message}`, "error");
    }
  });
});
