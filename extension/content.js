// LeetCode Memory Hub Content Script
// Listens for sync requests from the popup or automatically syncs when solved
console.log("[LeetCode Memory Hub Extension] Content script loaded on leetcode.com");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SYNC_SOLUTIONS") {
    syncLeetCodeSolves(request.userId, request.username, request.hubUrl)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function syncLeetCodeSolves(userId, username, hubUrl) {
  if (!userId) {
    throw new Error("Missing User ID. Please link your Memory Hub account in the extension popup.");
  }

  showFloatingToast("⚡ Fetching your accepted solutions...", "#8b5cf6");

  let submissions = [];

  // 1. Fetch recent accepted submissions via GraphQL
  try {
    const gqlRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "query recentAc($username: String!) { recentAcSubmissionList(username: $username, limit: 30) { id title titleSlug timestamp } }",
        variables: { username }
      })
    });
    const gqlData = await gqlRes.json();
    const list = gqlData.data?.recentAcSubmissionList || [];

    for (const item of list) {
      try {
        const detailRes = await fetch("https://leetcode.com/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: "query subDetails($id: Int!) { submissionDetails(submissionId: $id) { code lang { name verboseName } runtimeDisplay memoryDisplay } }",
            variables: { id: Number(item.id) }
          })
        });
        const detailData = await detailRes.json();
        const details = detailData.data?.submissionDetails;
        if (details && details.code) {
          submissions.push({
            title: item.title,
            code: details.code,
            lang: details.lang?.name || "java",
            runtime: details.runtimeDisplay || "",
            memory: details.memoryDisplay || "",
            timestamp: Number(item.timestamp)
          });
        }
      } catch(e) {}
    }
  } catch(e) {
    console.warn("GraphQL recentAc failed, attempting fallback:", e);
  }

  // 2. Fallback to submissions REST endpoint
  if (submissions.length === 0) {
    try {
      const res = await fetch("https://leetcode.com/api/submissions/?offset=0&limit=50");
      if (res.ok) {
        const data = await res.json();
        const dump = data.submissions_dump || [];
        const accepted = dump.filter(s => s.status_display === "Accepted");
        submissions = accepted.map(s => ({
          title: s.title,
          code: s.code,
          lang: s.lang,
          runtime: s.runtime || "",
          memory: s.memory || "",
          timestamp: s.timestamp
        }));
      }
    } catch(e) {}
  }

  if (submissions.length === 0) {
    showFloatingToast("⚠️ No accepted submissions found on LeetCode.", "#f59e0b");
    return { success: false, count: 0, error: "No accepted submissions found." };
  }

  // 3. Post directly to Memory Hub backend
  const targetUrl = (hubUrl || "http://localhost:3000").replace(/\/$/, "");
  showFloatingToast(`🚀 Syncing ${submissions.length} problems to Memory Hub...`, "#8b5cf6");

  const postRes = await fetch(`${targetUrl}/api/sync-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, submissions })
  });

  const postData = await postRes.json();
  if (!postRes.ok) {
    showFloatingToast(`❌ Sync error: ${postData.error || "Failed"}`, "#ef4444");
    throw new Error(postData.error || "Failed to sync to Memory Hub");
  }

  showFloatingToast(`✅ Successfully synced ${postData.total || submissions.length} solutions & code!`, "#10b981");
  return { success: true, count: postData.total || submissions.length };
}

function showFloatingToast(text, borderColor) {
  const existing = document.getElementById("lc-memo-ext-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "lc-memo-ext-toast";
  toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:2147483647;background:#09090b;color:#fafafa;padding:14px 20px;border-radius:14px;border:1.5px solid ${borderColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;box-shadow:0 12px 30px rgba(0,0,0,0.6);display:flex;align-items:center;gap:10px;animation:fadein 0.3s;`;
  toast.innerHTML = `<span>⚡</span><div><div style="font-weight:600;color:#c4b5fd;">LeetCode Memory Hub</div><div style="font-size:12px;color:#d4d4d8;">${text}</div></div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}
