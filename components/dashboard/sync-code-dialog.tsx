"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileCode,
  FileUp,
  Loader2,
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
import { syncUserProblemsAndStats } from "@/lib/hub-service";
import type { LeetCodeProblem } from "@/lib/types";
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
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedJson, setPastedJson] = useState("");

  // Manual code paste states
  const [manualTitle, setManualTitle] = useState("");
  const [manualLang, setManualLang] = useState("java");
  const [manualCode, setManualCode] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [manualStatus, setManualStatus] = useState<string | null>(null);

  const bookmarkRef = useRef<HTMLAnchorElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        void processSubmissionsPayload(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const username = leetcodeUsername || "OHntGXNFKf";

  // Full-featured universal sync script that executes inside leetcode.com
  // Features:
  // 1. Paginates through LeetCode's submission history to extract ALL solved questions (140+), not just recent 20
  // 2. Extracts accepted code, language, runtime, memory, and timestamp for every solve
  // 3. Multi-method copy (execCommand + writeText + clickable overlay buttons on LeetCode)
  // 4. Downloadable JSON backup button directly on the LeetCode toast
  const buildScript = () => `(async function(){
  const HUB_URL = "${origin}";
  const USER_ID = "${userId}";
  const USERNAME = "${username}";

  // Create UI overlay on LeetCode
  const toast = document.createElement("div");
  toast.id = "lc-memo-sync-toast";
  toast.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;background:#09090b;color:#f4f4f5;padding:18px 22px;border-radius:16px;border:1.5px solid #8b5cf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;box-shadow:0 20px 40px rgba(0,0,0,0.85);display:flex;flex-direction:column;gap:10px;max-width:420px;line-height:1.5;";
  toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">⚡</span><div><strong style="color:#c4b5fd;font-size:15px;display:block;">LeetCode Memory Hub Sync</strong><span style="color:#a1a1aa;font-size:11px;">Extracting all solved problems for ' + USERNAME + '</span></div></div><div id="lc-status-msg" style="color:#e4e4e7;font-size:12px;background:#18181b;padding:8px 12px;border-radius:8px;border:1px solid #27272a;">Connecting to your LeetCode session...</div>';
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
    const seenSlugs = new Set();

    // Strategy 1: Fetch complete history via LeetCode REST submissions API with pagination
    setMsg("Fetching complete submission history (all solved problems)...", "#c4b5fd");
    let offset = 0;
    let hasNext = true;
    let page = 0;
    const maxPages = 40; // up to 2,000 submissions

    while (hasNext && page < maxPages) {
      page++;
      setMsg("Loading submissions (page " + page + ", " + submissions.length + " unique problems found so far)...", "#c4b5fd");
      try {
        const res = await fetch("https://leetcode.com/api/submissions/?offset=" + offset + "&limit=50");
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
        await new Promise(r => setTimeout(r, 80));
      } catch (err) {
        console.warn("Submissions pagination error:", err);
        break;
      }
    }

    // Strategy 2: If REST endpoint returned 0 items, fallback to GraphQL recentAc
    if (submissions.length === 0) {
      setMsg("Checking recent submissions via GraphQL fallback...", "#c4b5fd");
      try {
        const gqlRes = await fetch("https://leetcode.com/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: "query recentAc($username: String!) { recentAcSubmissionList(username: $username, limit: 50) { id title titleSlug timestamp } }",
            variables: { username: USERNAME }
          })
        });
        const gqlData = await gqlRes.json();
        const list = gqlData.data?.recentAcSubmissionList || [];

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
      } catch(e) {}
    }

    if (submissions.length === 0) {
      toast.style.borderColor = "#f59e0b";
      setMsg("No accepted submissions found. Make sure you are logged into leetcode.com!", "#fcd34d");
      setTimeout(() => toast.remove(), 7000);
      return;
    }

    const payload = JSON.stringify({ userId: USER_ID, submissions });

    // Multi-method background copy
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

    // Try Direct Automatic POST to Memory Hub (Zero-Click if CORS allows)
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
    } catch(err) {}

    toast.style.borderColor = "#10b981";
    toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">🎉</span><div><strong style="color:#6ee7b7;font-size:15px;display:block;">' + submissions.length + ' Solves Extracted!</strong><span style="color:#a7f3d0;font-size:11px;">All unique problem solutions captured with code</span></div></div>' +
      (autoSynced ? '<div style="color:#d1fae5;font-size:12px;background:#064e3b;padding:8px 12px;border-radius:8px;">✨ Transferred automatically to Memory Hub! Refresh your dashboard tab.</div>' : '<div style="color:#d1fae5;font-size:12px;">Click below to copy your solves to clipboard:</div>') +
      '<div style="display:flex;gap:8px;margin-top:4px;">' +
        '<button id="lc-copy-btn" style="flex:1;cursor:pointer;background:#059669;color:#fff;border:none;border-radius:10px;padding:9px 14px;font-weight:600;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;">' + (copiedSuccess ? '✅ Copied! Click to Re-copy' : '📋 Click to Copy Solves') + '</button>' +
        '<button id="lc-dl-btn" style="cursor:pointer;background:#27272a;color:#e4e4e7;border:1px solid #3f3f46;border-radius:10px;padding:9px 12px;font-size:12px;">📥 Download JSON</button>' +
      '</div>' +
      '<div style="color:#a1a1aa;font-size:11px;">Return to your Memory Hub tab and click <b>Import from Clipboard</b>!</div>';

    const copyBtn = document.getElementById("lc-copy-btn");
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

    const dlBtn = document.getElementById("lc-dl-btn");
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
  } catch (err) {
    toast.style.borderColor = "#ef4444";
    toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">❌</span><strong style="color:#fca5a5;font-size:15px;">Sync Interrupted</strong></div><div style="color:#fecaca;font-size:12px;">' + (err.message || "An unexpected error occurred.") + '</div>';
    setTimeout(() => toast.remove(), 7000);
  }
})();`;

  const rawScript = buildScript();

  // Create clean bookmarklet URL: javascript:(function(){...})();
  const minifiedScript = rawScript
    .replace(/\/\/.*/g, "")
    .replace(/\n\s*/g, " ")
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

  const processSubmissionsPayload = async (rawText: string) => {
    setImporting(true);
    setImportStatus(null);
    try {
      const trimmed = rawText.trim();
      if (!trimmed) {
        throw new Error("Payload is empty. Please copy your solves from LeetCode first.");
      }

      if (trimmed.startsWith("(") || trimmed.includes("HUB_URL") || !trimmed.startsWith("{")) {
        setShowPasteBox(true);
        throw new Error(
          "Your clipboard currently contains the script code, not your LeetCode solves yet! On LeetCode, please check the green toast in the corner and click '📋 Click to Copy Solves' (or click 'Download JSON' and upload it below)."
        );
      }

      let parsed: { userId?: string; submissions?: unknown[] };
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        setShowPasteBox(true);
        throw new Error("Invalid JSON format. Please re-copy from the LeetCode toast or paste directly below.");
      }

      if (!parsed.submissions || !Array.isArray(parsed.submissions) || parsed.submissions.length === 0) {
        throw new Error("No submissions array found in payload. Please run the sync on LeetCode first!");
      }

      setImportStatus(`⏳ Resolving problem metadata & tags for ${parsed.submissions.length} problems...`);
      const res = await fetch("/api/sync-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, submissions: parsed.submissions }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      const resolvedProblems: LeetCodeProblem[] = data.problems || [];
      if (resolvedProblems.length === 0) {
        throw new Error("No problems could be resolved from submissions.");
      }

      setImportStatus(`💾 Saving all ${resolvedProblems.length} solutions into your Memory Hub...`);
      const upsertResult = await syncUserProblemsAndStats(userId, resolvedProblems);

      setImportStatus(
        `🎉 Successfully imported all ${resolvedProblems.length} solutions (${upsertResult.added} new, ${upsertResult.existing} updated)! Refreshing dashboard...`
      );
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setImportStatus(err instanceof Error ? `❌ ${err.message}` : "❌ Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      await processSubmissionsPayload(text);
    } catch (err) {
      setShowPasteBox(true);
      setImportStatus(
        err instanceof Error
          ? `❌ ${err.message}`
          : "❌ Could not read clipboard. Please paste the JSON data directly into the box below."
      );
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
      if (!res.ok) throw new Error(data.error || "Failed to process solution code");

      const resolvedProblems: LeetCodeProblem[] = data.problems || [];
      if (resolvedProblems.length === 0) {
        throw new Error("Could not resolve problem metadata.");
      }

      await syncUserProblemsAndStats(userId, resolvedProblems);

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

  const renderImportSection = (title: string, subtitle: string) => (
    <div className="space-y-3.5 rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Button
          size="sm"
          type="button"
          onClick={() => void handleImportFromClipboard()}
          disabled={importing}
          className="gap-2 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          <span>{importing ? "Importing Solutions…" : "Import from Clipboard"}</span>
        </Button>

        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="gap-2 border-border text-xs font-medium text-foreground hover:bg-muted"
        >
          <FileUp className="size-3.5 text-muted-foreground" />
          <span>Upload JSON File</span>
        </Button>
      </div>

      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowPasteBox(!showPasteBox)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          {showPasteBox ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          <span>{showPasteBox ? "Hide Manual Paste Box" : "Or Paste JSON Payload Manually"}</span>
        </button>

        {showPasteBox && (
          <div className="mt-2.5 space-y-2 rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-[11px] text-muted-foreground">
              Paste the extracted JSON data below if clipboard read is restricted:
            </p>
            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              placeholder='{"userId":"...", "submissions":[...]}'
              rows={4}
              className="w-full rounded-lg border border-border bg-background p-2.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center justify-end gap-2">
              {pastedJson && (
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => setPastedJson("")}
                  className="text-xs h-7 px-2.5 text-muted-foreground"
                >
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                type="button"
                onClick={() => void processSubmissionsPayload(pastedJson)}
                disabled={!pastedJson.trim() || importing}
                className="gap-1.5 bg-primary text-xs h-7 px-3 text-primary-foreground hover:bg-primary/90"
              >
                {importing ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                <span>Import Pasted JSON</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {importStatus && (
        <div
          className={cn(
            "rounded-xl border p-3.5 text-xs transition-all",
            importStatus.startsWith("🎉")
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : importStatus.startsWith("⏳") || importStatus.startsWith("💾")
              ? "border-primary/30 bg-primary/10 text-foreground flex items-center gap-2"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          {importStatus.startsWith("⏳") || importStatus.startsWith("💾") ? (
            <>
              <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              <span>{importStatus}</span>
            </>
          ) : importStatus.startsWith("❌") ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                <p className="font-medium text-red-200">{importStatus}</p>
              </div>
              {importStatus.includes("contains the script code") && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-200 leading-relaxed">
                  <p className="font-semibold text-amber-300 mb-1">💡 Quick resolution:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>On your LeetCode tab, look at the notification at top-right & click <b>[📋 Click to Copy Solves]</b>, then click <b>Import from Clipboard</b> here.</li>
                    <li>Or click <b>[📥 Download JSON]</b> on LeetCode & click <b>Upload JSON File</b> right above!</li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <p className="font-medium">{importStatus}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border bg-card/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
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
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="size-3.5 text-primary" />
              <span>Browser Extension</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bookmarklet")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                activeTab === "bookmarklet"
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bookmark className="size-3.5 text-muted-foreground" />
              <span>1-Click Bookmarklet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("console")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                activeTab === "console"
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Terminal className="size-3.5 text-muted-foreground" />
              <span>Console</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                activeTab === "manual"
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileCode className="size-3.5 text-muted-foreground" />
              <span>Manual Entry</span>
            </button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 0: BROWSER EXTENSION (RECOMMENDED & ZERO-FRICTION) */}
          {activeTab === "extension" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-status-review-border bg-status-review-bg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 size-5 shrink-0 text-status-review-text" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">Official LeetCode Memory Hub Extension</p>
                    <p>
                      Install the extension once in Chrome/Brave/Edge. Whenever you are on LeetCode, click <b>Sync Now</b> to automatically extract all accepted solves & codes straight into your Memory Hub!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Your Linking Credentials */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
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
                    {copiedUserId ? <Check className="size-3.5 text-status-mastered-text" /> : <Copy className="size-3.5" />}
                    <span>{copiedUserId ? "Copied!" : "Copy User ID"}</span>
                  </Button>
                </div>
              </div>

              {/* Step 2: How to load the extension */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
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
                    <div className="mt-1 rounded-lg border border-border bg-background p-2 font-mono text-[11px] text-foreground select-all">
                      d:\leetcode-memo\extension
                    </div>
                  </li>
                </ol>
              </div>

              {/* Step 3: Sync from LeetCode */}
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground">Step 3: Run Extension & Import</p>
                <p>
                  1. Pin the extension in Chrome and click its icon.<br />
                  2. Paste your User ID & LeetCode username.<br />
                  3. Open any tab on <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">leetcode.com</a> and click <b>&ldquo;⚡ Sync Now to Hub&rdquo;</b>.<br />
                  4. Return to this dialog and load your solutions below!
                </p>
              </div>

              {renderImportSection("Complete Import", "Once the extension captures your solutions on LeetCode, load them into your hub:")}
            </div>
          )}

          {/* TAB 1: BOOKMARKLET METHOD (FIXED & RELIABLE) */}
          {activeTab === "bookmarklet" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <Bookmark className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">How the 1-Click Bookmarklet Works</p>
                    <p>
                      Because LeetCode solutions require your active login session, a browser bookmarklet executes securely in your own browser tab to collect your code and transfer it seamlessly into Memory Hub.
                    </p>
                  </div>
                </div>
              </div>

              {/* Way A: Drag the Button */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
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
                    className="inline-flex cursor-grab select-none items-center gap-2.5 rounded-xl bg-primary px-6 py-3 font-semibold text-xs text-primary-foreground shadow-xs transition-transform active:cursor-grabbing hover:opacity-90"
                    title="Drag me to your browser's Bookmarks bar!"
                  >
                    <Zap className="size-4" />
                    <span>⚡ Sync LeetCode Code</span>
                  </a>
                </div>
              </div>

              {/* Way B: Copy Bookmarklet Code (If dragging is tricky) */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Option B: Create Bookmark Manually (100% Reliable)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <li>
                    Right-click your browser&apos;s Bookmarks bar &rarr; click <b>&ldquo;Add page&rdquo;</b> (or <b>&ldquo;Add Bookmark&rdquo;</b>).
                  </li>
                  <li>Set the Name to: <code className="rounded bg-muted px-1.5 py-0.5 text-foreground font-mono">⚡ Sync LeetCode</code>.</li>
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
                    {copiedBookmarkCode ? <Check className="size-3.5 text-status-mastered-text" /> : <Copy className="size-3.5" />}
                    <span>{copiedBookmarkCode ? "Bookmarklet Code Copied!" : "Copy Bookmarklet Code (URL)"}</span>
                  </Button>
                </div>
              </div>

              {/* Instructions after clicking bookmarklet */}
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground">What happens when you click it on LeetCode?</p>
                <p className="text-muted-foreground leading-relaxed">
                  Open any page on <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">leetcode.com</a> and click your bookmark. A notification appears on LeetCode and gathers all your solutions.
                </p>
              </div>

              {renderImportSection("Complete Import", "Once the bookmarklet runs on LeetCode, load your solutions into your hub:")}
            </div>
          )}

          {/* TAB 2: CONSOLE SCRIPT METHOD (PROVEN TO WORK) */}
          {activeTab === "console" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <Terminal className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">Console Sync Method</p>
                    <p>
                      Runs directly inside DevTools Console. This bypasses all bookmark browser restrictions and extracts accepted codes with full permissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step 1: Copy Sync Script</span>
                  <Button
                    size="sm"
                    onClick={handleCopyScript}
                    className="gap-2 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    {copiedScript ? <Check className="size-3.5 text-status-mastered-text" /> : <Copy className="size-3.5" />}
                    <span>{copiedScript ? "Script Copied!" : "Copy Sync Script"}</span>
                  </Button>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    1. Switch to your <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">LeetCode tab</a>.
                  </p>
                  <p>
                    2. Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border">F12</kbd> (or Right Click &rarr; Inspect) &rarr; switch to the <b>Console</b> tab.
                  </p>
                  <p>
                    3. Paste (<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border">Ctrl + V</kbd>) and press <b>Enter</b>.
                  </p>
                </div>
              </div>

              {renderImportSection("Step 2: Complete Import", "Once the script finishes on LeetCode (you will see the notification in the top-right), load them into your hub:")}
            </div>
          )}

          {/* TAB 3: NEW ALTERNATIVE METHOD (DIRECT MANUAL CODE PASTE) */}
          {activeTab === "manual" && (
            <form onSubmit={handleSaveManualProblem} className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <FileCode className="mt-0.5 size-5 shrink-0 text-primary" />
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
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Language
                </label>
                <select
                  value={manualLang}
                  onChange={(e) => setManualLang(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
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
                  className="w-full rounded-xl border border-border bg-background p-3.5 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
                />
              </div>

              {manualStatus && (
                <p className="text-xs font-medium text-foreground">{manualStatus}</p>
              )}

              <Button
                type="submit"
                disabled={!manualTitle.trim() || !manualCode.trim() || savingManual}
                className="w-full gap-2 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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
