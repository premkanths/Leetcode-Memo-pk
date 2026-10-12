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
      // Find active leetcode.com tab
      const [tab] = await chrome.tabs.query({ url: "*://*.leetcode.com/*" });
      if (!tab) {
        showStatus("Please open a LeetCode tab first (e.g. leetcode.com/problemset), then click Sync!", "error");
        syncBtn.disabled = false;
        syncBtn.innerHTML = "<span>⚡ Sync Now to Hub</span>";
        return;
      }

      // Send message to content script in leetcode tab
      chrome.tabs.sendMessage(
        tab.id,
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
            showStatus(
              "Could not communicate with the LeetCode tab. Please refresh your LeetCode page and try again!",
              "error"
            );
            return;
          }

          if (response && response.success) {
            showStatus(`✅ Successfully synced ${response.count} solutions into your Memory Hub!`, "success");
          } else {
            showStatus(`❌ ${(response && response.error) || "Sync failed"}`, "error");
          }
        }
      );
    } catch (err) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = "<span>⚡ Sync Now to Hub</span>";
      showStatus(`Error: ${err.message}`, "error");
    }
  });
});
