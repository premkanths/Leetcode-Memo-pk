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

  showFloatingToast("⚡ Connecting to LeetCode session...", "#8b5cf6");

  let submissions = [];
  const seenSlugs = new Set();

  // Strategy 1: Fetch full history with code via paginated REST submissions API
  let offset = 0;
  let hasNext = true;
  let page = 0;
  const maxPages = 40; // up to 2,000 submissions to cover all 140+ problems

  while (hasNext && page < maxPages) {
    page++;
    showFloatingToast(`⚡ Scanning solve history (page ${page}, ${submissions.length} problems found)...`, "#8b5cf6");
    try {
      const res = await fetch(`https://leetcode.com/api/submissions/?offset=${offset}&limit=50`);
      if (!res.ok) break;
      const data = await res.json();
      const dump = data.submissions_dump || [];
      if (dump.length === 0) break;

      for (const s of dump) {
        if (s.status_display === "Accepted" && s.code) {
          const rawSlug = s.title_slug || s.title || "";
          const slug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          if (slug && !seenSlugs.has(slug)) {
            seenSlugs.add(slug);
            submissions.push({
              title: s.title,
              code: s.code,
              lang: s.lang || "java",
              runtime: s.runtime || "",
              memory: s.memory || "",
              timestamp: s.timestamp || Math.floor(Date.now() / 1000)
            });
          }
        }
      }

      hasNext = Boolean(data.has_next);
      offset += 50;
      await new Promise(r => setTimeout(r, 60));
    } catch (err) {
      console.warn("Submissions pagination error:", err);
      break;
    }
  }

  // Strategy 2: If REST returned 0, fallback to GraphQL recentAc + submissionDetails
  if (submissions.length === 0 && username) {
    showFloatingToast("Checking recent submissions via GraphQL fallback...", "#8b5cf6");
    try {
      const gqlRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "query recentAc($username: String!) { recentAcSubmissionList(username: $username, limit: 50) { id title titleSlug timestamp } }",
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
            const slug = item.titleSlug || item.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
            if (!seenSlugs.has(slug)) {
              seenSlugs.add(slug);
              submissions.push({
                title: item.title,
                code: details.code,
                lang: details.lang?.name || "java",
                runtime: details.runtimeDisplay || "",
                memory: details.memoryDisplay || "",
                timestamp: Number(item.timestamp)
              });
            }
          }
        } catch(e) {}
      }
    } catch(e) {
      console.warn("GraphQL recentAc failed:", e);
    }
  }

  if (submissions.length === 0) {
    showFloatingToast("⚠️ No accepted submissions found. Ensure you are logged into leetcode.com!", "#f59e0b");
    return { success: false, count: 0, error: "No accepted submissions found." };
  }

  const payload = JSON.stringify({ userId, submissions });

  // Multi-method clipboard write
  let copiedSuccess = false;
  try {
    const ta = document.createElement("textarea");
    ta.value = payload;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    copiedSuccess = document.execCommand("copy");
    document.body.removeChild(ta);
  } catch(e) {}

  if (!copiedSuccess) {
    try {
      await navigator.clipboard.writeText(payload);
      copiedSuccess = true;
    } catch(e) {}
  }

  // Direct backend push if reachable
  const targetUrl = (hubUrl || "http://localhost:3000").replace(/\/$/, "");
  let autoSynced = false;
  try {
    const postRes = await fetch(`${targetUrl}/api/sync-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, submissions })
    });
    if (postRes.ok) {
      autoSynced = true;
    }
  } catch(e) {
    console.warn("Could not POST directly to Memory Hub backend:", e);
  }

  // Interactive floating toast with click-to-copy and download
  showCompletedToast(submissions.length, payload, autoSynced, copiedSuccess);

  return { success: true, count: submissions.length, autoSynced };
}

function showCompletedToast(count, payload, autoSynced, copiedSuccess) {
  const existing = document.getElementById("lc-memo-ext-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "lc-memo-ext-toast";
  toast.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;background:#09090b;color:#f4f4f5;padding:18px 22px;border-radius:16px;border:1.5px solid #10b981;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;box-shadow:0 20px 40px rgba(0,0,0,0.85);display:flex;flex-direction:column;gap:10px;max-width:420px;line-height:1.5;";
  toast.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">🎉</span><div><strong style="color:#6ee7b7;font-size:15px;display:block;">' + count + ' Solves Extracted!</strong><span style="color:#a7f3d0;font-size:11px;">All unique problem solutions captured with code</span></div></div>' +
    (autoSynced ? '<div style="color:#d1fae5;font-size:12px;background:#064e3b;padding:8px 12px;border-radius:8px;">✨ Transferred automatically to Memory Hub!</div>' : '<div style="color:#d1fae5;font-size:12px;">Click below to copy your solves to clipboard:</div>') +
    '<div style="display:flex;gap:8px;margin-top:4px;">' +
      '<button id="lc-ext-copy-btn" style="flex:1;cursor:pointer;background:#059669;color:#fff;border:none;border-radius:10px;padding:9px 14px;font-weight:600;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;">' + (copiedSuccess ? '✅ Copied! Click to Re-copy' : '📋 Click to Copy Solves') + '</button>' +
      '<button id="lc-ext-dl-btn" style="cursor:pointer;background:#27272a;color:#e4e4e7;border:1px solid #3f3f46;border-radius:10px;padding:9px 12px;font-size:12px;">📥 Download JSON</button>' +
    '</div>' +
    '<div style="color:#a1a1aa;font-size:11px;">Return to your Memory Hub tab and click <b>Import from Clipboard</b>!</div>';

  document.body.appendChild(toast);

  const copyBtn = document.getElementById("lc-ext-copy-btn");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(payload);
        copyBtn.textContent = "✅ Copied to Clipboard!";
        copyBtn.style.background = "#10b981";
      } catch(e) {
        copyBtn.textContent = "Use Download JSON instead";
      }
    };
  }

  const dlBtn = document.getElementById("lc-ext-dl-btn");
  if (dlBtn) {
    dlBtn.onclick = () => {
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leetcode-solves.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      dlBtn.textContent = "✅ Downloaded!";
    };
  }

  setTimeout(() => toast.remove(), 12000);
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
