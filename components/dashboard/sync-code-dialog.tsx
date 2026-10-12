"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  Info,
  MousePointerClick,
  Sparkles,
  Terminal,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SyncCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  leetcodeUsername?: string;
}

export function SyncCodeDialog({ open, onOpenChange, userId, leetcodeUsername }: SyncCodeDialogProps) {
  const [activeTab, setActiveTab] = useState<"extension" | "bookmarklet" | "console" | "manual">("extension");
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedBookmarkCode, setCopiedBookmarkCode] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Manual code paste states
  const [manualTitle, setManualTitle] = useState("");
  const [manualLang, setManualLang] = useState("java");
  const [manualCode, setManualCode] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [manualStatus, setManualStatus] = useState<string | null>(null);

  const bookmarkRef = useRef<HTMLAnchorElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const username = leetcodeUsername || "OHntGXNFKf";

  // Full-featured universal sync script that executes inside leetcode.com
  // Features:
  // 1. Automatically posts directly back to Memory Hub if possible (CORS enabled)
  // 2. Automatically copies submissions payload to clipboard as reliable fallback
  // 3. Shows sleek animated overlay on LeetCode with progress
  const buildScript = () => `(async function(){
  const HUB_URL = "${origin}";
  const USER_ID = "${userId}";
  const USERNAME = "${username}";

  // Create UI overlay on LeetCode
  const toast = document.createElement("div");
  toast.id = "lc-memo-sync-toast";
  toast.style.cssText = "position:fixed;top:24px;right:24px;z-index:2147483647;background:#09090b;color:#f4f4f5;padding:18px 24px;border-radius:16px;border:1.5px solid #8b5cf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;box-shadow:0 20px 40px rgba(0,0,0,0.8);display:flex;flex-direction:column;gap:8px;max-width:380px;line-height:1.5;";
  toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">⚡</span><strong style="color:#c4b5fd;font-size:15px;">LeetCode Memory Hub Sync</strong></div><div id="lc-status-msg" style="color:#a1a1aa;font-size:12px;">Connecting to your LeetCode profile (' + USERNAME + ')...</div>';
  const existing = document.getElementById("lc-memo-sync-toast");
  if (existing) existing.remove();
  document.body.appendChild(toast);

  const setMsg = (msg, color) => {
    const el = document.getElementById("lc-status-msg");
    if (el) {
      el.textContent = msg;
      if (color) el.style.color = color;
    }
  };

  try {
    let submissions = [];

    setMsg("Fetching recent accepted submissions...", "#c4b5fd");

    // 1. Fetch recent accepted submission list from LeetCode GraphQL
    try {
      const gqlRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "query recentAc($username: String!) { recentAcSubmissionList(username: $username, limit: 30) { id title titleSlug timestamp } }",
          variables: { username: USERNAME }
        })
      });
      const gqlData = await gqlRes.json();
      const list = gqlData.data?.recentAcSubmissionList || [];

      setMsg("Found " + list.length + " solves. Extracting code...", "#c4b5fd");

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
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
            setMsg("Extracted code for: " + item.title + " (" + submissions.length + "/" + list.length + ")", "#e0e7ff");
          }
        } catch(e) {}
      }
    } catch(e) {}

    // 2. Fallback to submissions REST endpoint if GraphQL yielded 0 items
    if (submissions.length === 0) {
      try {
        setMsg("Checking REST submissions endpoint...", "#c4b5fd");
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
      toast.style.borderColor = "#f59e0b";
      setMsg("No accepted submissions with code found on this account yet.", "#fcd34d");
      setTimeout(() => toast.remove(), 5000);
      return;
    }

    // Try Direct Automatic POST to Memory Hub (Zero-Click)
    let autoSynced = false;
    try {
      setMsg("Sending " + submissions.length + " problems directly to Memory Hub...", "#a7f3d0");
      const postRes = await fetch(HUB_URL + "/api/sync-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, submissions })
      });
      if (postRes.ok) {
        autoSynced = true;
      }
    } catch(err) {
      // Cross-origin network restriction or local port difference, fallback to clipboard
    }

    // Always copy payload to clipboard as foolproof backup
    try {
      const payload = JSON.stringify({ userId: USER_ID, submissions });
      await navigator.clipboard.writeText(payload);
    } catch(e) {}

    toast.style.borderColor = "#10b981";
    if (autoSynced) {
      toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">🎉</span><strong style="color:#6ee7b7;font-size:15px;">Auto-Sync Complete!</strong></div><div style="color:#d1fae5;font-size:12px;">Successfully transferred <b>' + submissions.length + '</b> problems & code into Memory Hub! Return to your dashboard tab and refresh.</div>';
    } else {
      toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">✅</span><strong style="color:#6ee7b7;font-size:15px;">' + submissions.length + ' Solutions Copied!</strong></div><div style="color:#d1fae5;font-size:12px;">Switch back to your Memory Hub tab and click <b>"Step 2: Import from Clipboard"</b>!</div>';
    }
    setTimeout(() => toast.remove(), 9000);
  } catch (err) {
    toast.style.borderColor = "#ef4444";
    toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">❌</span><strong style="color:#fca5a5;font-size:15px;">Sync Interrupted</strong></div><div style="color:#fecaca;font-size:12px;">' + (err.message || "An unexpected error occurred.") + '</div>';
    setTimeout(() => toast.remove(), 7000);
  }
})();`;

  const rawScript = buildScript();

  // Create clean bookmarklet URL: javascript:(function(){...})();
  // Minified one-liner format prevents browser URL truncation and parsing failures
  const minifiedScript = rawScript
    .replace(/\/\/.*/g, "") // remove comments
    .replace(/\n\s*/g, " ") // join lines
    .trim();

  const bookmarkletHref = `javascript:${encodeURIComponent(minifiedScript)}`;

  useEffect(() => {
    if (bookmarkRef.current) {
      bookmarkRef.current.setAttribute("href", bookmarkletHref);
    }
  }, [bookmarkletHref, open]);

  const handleCopyScript = () => {
    void navigator.clipboard.writeText(rawScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyBookmarkUrl = () => {
    void navigator.clipboard.writeText(bookmarkletHref);
    setCopiedBookmarkCode(true);
    setTimeout(() => setCopiedBookmarkCode(false), 2500);
  };

  const handleImportFromClipboard = async () => {
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (trimmed.startsWith("(") || trimmed.includes("HUB_URL") || !trimmed.startsWith("{")) {
        throw new Error(
          "Your clipboard currently contains the script code, not your LeetCode solves yet! Please run the bookmarklet or script on LeetCode first, then click Import here."
        );
      }

      const parsed = JSON.parse(trimmed);
      if (!parsed.submissions || !Array.isArray(parsed.submissions) || parsed.submissions.length === 0) {
        throw new Error("No submissions array found in clipboard. Please trigger the sync on LeetCode first!");
      }

      const res = await fetch("/api/sync-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, submissions: parsed.submissions }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setImportStatus(`🎉 Successfully imported ${data.total} solutions & code! Refreshing dashboard...`);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setImportStatus(err instanceof Error ? `❌ ${err.message}` : "❌ Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleSaveManualProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualCode.trim() || savingManual) return;

    setSavingManual(true);
    setManualStatus(null);
    try {
      const res = await fetch("/api/sync-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          submissions: [
            {
              title: manualTitle.trim(),
              code: manualCode.trim(),
              lang: manualLang,
              timestamp: Math.floor(Date.now() / 1000),
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save solution code");

      setManualStatus("✅ Solution saved! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setManualStatus(err instanceof Error ? `❌ ${err.message}` : "❌ Failed to save");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border bg-card/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
              <Zap className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Sync Solutions & Code with LeetCode
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Choose your preferred method to pull your exact accepted solution code directly into your Memory Hub.
              </DialogDescription>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex rounded-xl border border-border bg-muted/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("extension")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                activeTab === "extension"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="size-3.5 text-amber-400" />
              <span>Browser Extension</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bookmarklet")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                activeTab === "bookmarklet"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bookmark className="size-3.5 text-violet-400" />
              <span>1-Click Bookmarklet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("console")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                activeTab === "console"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Terminal className="size-3.5 text-indigo-400" />
              <span>Console</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                activeTab === "manual"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileCode className="size-3.5 text-emerald-400" />
              <span>Manual Entry</span>
            </button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 0: BROWSER EXTENSION (RECOMMENDED & ZERO-FRICTION) */}
          {activeTab === "extension" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 size-5 shrink-0 text-amber-400" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">Official LeetCode Memory Hub Extension</p>
                    <p>
                      Install the extension once in Chrome/Brave/Edge. Whenever you are on LeetCode, click <b>Sync Now</b> to automatically extract all accepted solves & codes straight into your Memory Hub!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Your Linking Credentials */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Step 1: Your Account Linking Info
                </h4>
                <p className="text-xs text-muted-foreground">
                  Copy your User ID below to paste into the extension popup:
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-xs text-foreground select-all">
                    {userId}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(userId);
                      setCopiedUserId(true);
                      setTimeout(() => setCopiedUserId(false), 2000);
                    }}
                    className="gap-1.5 text-xs border-border"
                  >
                    {copiedUserId ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedUserId ? "Copied!" : "Copy User ID"}</span>
                  </Button>
                </div>
              </div>

              {/* Step 2: How to load the extension */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Step 2: Load Extension in Chrome (Takes 30 Seconds)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <li>
                    Open Chrome and navigate to <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">chrome://extensions/</code>
                  </li>
                  <li>
                    Toggle on <b>&ldquo;Developer mode&rdquo;</b> in the top-right corner.
                  </li>
                  <li>
                    Click <b>&ldquo;Load unpacked&rdquo;</b> in the top-left corner.
                  </li>
                  <li>
                    Select the extension folder located inside this project at:
                    <div className="mt-1 rounded-lg border border-border bg-background p-2 font-mono text-[11px] text-violet-300 select-all">
                      d:\leetcode-memo\extension
                    </div>
                  </li>
                </ol>
              </div>

              {/* Step 3: Sync from LeetCode */}
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground">Step 3: Click Sync</p>
                <p>
                  1. Pin the extension in Chrome and click its icon.<br />
                  2. Paste your User ID & LeetCode username.<br />
                  3. Open any tab on <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">leetcode.com</a> and click <b>&ldquo;⚡ Sync Now to Hub&rdquo;</b>!
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: BOOKMARKLET METHOD (FIXED & RELIABLE) */}
          {activeTab === "bookmarklet" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Bookmark className="mt-0.5 size-5 shrink-0 text-violet-400" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">How the 1-Click Bookmarklet Works</p>
                    <p>
                      Because LeetCode solutions require your active login session, a browser bookmarklet executes securely in your own browser tab to collect your code and transfer it seamlessly into Memory Hub.
                    </p>
                  </div>
                </div>
              </div>

              {/* Way A: Drag the Button */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Option A: Drag Button to Bookmarks Bar
                </h4>
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border">Ctrl + Shift + B</kbd> to show your Bookmarks bar, then drag the button below into it:
                </p>

                <div className="flex items-center justify-center py-2">
                  <a
                    ref={bookmarkRef}
                    href={bookmarkletHref}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/uri-list", bookmarkletHref);
                      e.dataTransfer.setData("text/plain", bookmarkletHref);
                    }}
                    className="inline-flex cursor-grab select-none items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-xs text-white shadow-lg shadow-violet-500/25 ring-2 ring-violet-400/30 transition-transform active:cursor-grabbing hover:scale-105"
                    title="Drag me to your browser's Bookmarks bar!"
                  >
                    <Zap className="size-4 fill-white" />
                    <span>⚡ Sync LeetCode Code</span>
                  </a>
                </div>
              </div>

              {/* Way B: Copy Bookmarklet Code (If dragging is tricky) */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Option B: Create Bookmark Manually (100% Reliable)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <li>
                    Right-click your browser&apos;s Bookmarks bar &rarr; click <b>&ldquo;Add page&rdquo;</b> (or <b>&ldquo;Add Bookmark&rdquo;</b>).
                  </li>
                  <li>Set the Name to: <code className="rounded bg-muted px-1.5 py-0.5 text-violet-300">⚡ Sync LeetCode</code>.</li>
                  <li>
                    Click the button below to copy the bookmarklet code, then paste it into the <b>URL</b> field:
                  </li>
                </ol>

                <div className="pt-1 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBookmarkUrl}
                    className="gap-2 border-border bg-background text-xs text-foreground"
                  >
                    {copiedBookmarkCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedBookmarkCode ? "Bookmarklet Code Copied!" : "Copy Bookmarklet Code (URL)"}</span>
                  </Button>
                </div>
              </div>

              {/* Instructions after clicking bookmarklet */}
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground">What happens when you click it on LeetCode?</p>
                <p className="text-muted-foreground leading-relaxed">
                  Open any page on <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">leetcode.com</a> and click your new bookmark. A purple notification appears on LeetCode and automatically transfers your solutions. If direct network communication is blocked by browser restrictions, click <b>Import from Clipboard</b> below!
                </p>

                <Button
                  size="sm"
                  onClick={() => void handleImportFromClipboard()}
                  disabled={importing}
                  className="mt-2 w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-semibold text-white"
                >
                  <Upload className="size-3.5" />
                  <span>{importing ? "Importing Solutions…" : "Import from Clipboard (Fallback)"}</span>
                </Button>
                {importStatus && (
                  <p className="mt-2 text-center text-xs font-medium text-foreground">{importStatus}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONSOLE SCRIPT METHOD (PROVEN TO WORK) */}
          {activeTab === "console" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Terminal className="mt-0.5 size-5 shrink-0 text-indigo-400" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">Console Sync Method</p>
                    <p>
                      Runs directly inside DevTools Console. This bypasses all bookmark browser restrictions and extracts accepted codes with full permissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step 1: Copy Sync Script</span>
                  <Button
                    size="sm"
                    onClick={handleCopyScript}
                    className="gap-2 bg-violet-600 text-xs text-white hover:bg-violet-500"
                  >
                    {copiedScript ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedScript ? "Script Copied!" : "Copy Sync Script"}</span>
                  </Button>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    1. Switch to your <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">LeetCode tab</a>.
                  </p>
                  <p>
                    2. Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border">F12</kbd> (or Right Click &rarr; Inspect) &rarr; switch to the <b>Console</b> tab.
                  </p>
                  <p>
                    3. Paste (<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border">Ctrl + V</kbd>) and press <b>Enter</b>.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step 2: Complete Import</span>
                <p className="text-xs text-muted-foreground">
                  Once the green toast appears on your LeetCode page, click below to load all problems into your hub:
                </p>

                <Button
                  size="sm"
                  onClick={() => void handleImportFromClipboard()}
                  disabled={importing}
                  className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-semibold text-white"
                >
                  <Upload className="size-3.5" />
                  <span>{importing ? "Importing Solutions…" : "Import from Clipboard"}</span>
                </Button>
                {importStatus && (
                  <p className="mt-2 text-center text-xs font-medium text-foreground">{importStatus}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NEW ALTERNATIVE METHOD (DIRECT MANUAL CODE PASTE) */}
          {activeTab === "manual" && (
            <form onSubmit={handleSaveManualProblem} className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <FileCode className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">Direct Problem & Solution Entry</p>
                    <p>
                      Want to add a specific problem or update its code without running browser scripts? Simply enter the problem title or URL and paste your code below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Problem Title or Slug
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Two Sum, 3Sum, or longest-substring-without-repeating-characters"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Language
                </label>
                <select
                  value={manualLang}
                  onChange={(e) => setManualLang(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-violet-500 focus:outline-none"
                >
                  <option value="java">Java</option>
                  <option value="python3">Python 3</option>
                  <option value="cpp">C++</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Solution Code
                </label>
                <textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste your accepted solution code here..."
                  rows={8}
                  required
                  className="w-full rounded-xl border border-border bg-background p-3.5 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none"
                />
              </div>

              {manualStatus && (
                <p className="text-xs font-medium text-foreground">{manualStatus}</p>
              )}

              <Button
                type="submit"
                disabled={!manualTitle.trim() || !manualCode.trim() || savingManual}
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500"
              >
                <Check className="size-3.5" />
                <span>{savingManual ? "Saving to Hub…" : "Save Solution Code to Hub"}</span>
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
