"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Terminal, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SyncCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  leetcodeUsername?: string;
}

export function SyncCodeDialog({ open, onOpenChange, userId, leetcodeUsername }: SyncCodeDialogProps) {
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const bookmarkRef = useRef<HTMLAnchorElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const username = leetcodeUsername || "OHntGXNFKf";

  // Script that runs inside leetcode.com
  const rawScript = `(async function(){
  const HUB_URL = "${origin}";
  const USER_ID = "${userId}";
  const USERNAME = "${username}";

  const toast = document.createElement("div");
  toast.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:#09090b;color:#fafafa;padding:16px 22px;border-radius:14px;border:1px solid #8b5cf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;box-shadow:0 12px 30px rgba(0,0,0,0.6);display:flex;align-items:center;gap:12px;transition:all 0.3s ease;";
  toast.innerHTML = '<span style="font-size:20px;">⚡</span><div><div style="font-weight:600;color:#c4b5fd;">LeetCode Memory Hub</div><div style="font-size:12px;color:#a1a1aa;">Fetching your accepted submissions...</div></div>';
  document.body.appendChild(toast);

  try {
    let submissions = [];

    // 1. Query GraphQL recentAcSubmissionList
    try {
      const gqlRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "query recentAc($username: String!) { recentAcSubmissionList(username: $username, limit: 20) { id title titleSlug timestamp } }",
          variables: { username: USERNAME }
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
              runtime: details.runtimeDisplay,
              memory: details.memoryDisplay,
              timestamp: Number(item.timestamp)
            });
          }
        } catch(e) {}
      }
    } catch(e) {}

    // 2. If GraphQL had no results, try REST API
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
            runtime: s.runtime,
            memory: s.memory,
            timestamp: s.timestamp
          }));
        }
      } catch(e) {}
    }

    if (submissions.length === 0) {
      toast.querySelector("div div:last-child").textContent = "No accepted submissions found on LeetCode.";
      setTimeout(() => toast.remove(), 4000);
      return;
    }

    // Copy to clipboard
    const payload = JSON.stringify({ userId: USER_ID, submissions });
    await navigator.clipboard.writeText(payload);

    toast.style.borderColor = "#10b981";
    toast.innerHTML = '<span style="font-size:20px;">✅</span><div><div style="font-weight:600;color:#6ee7b7;">Copied ' + submissions.length + ' Solutions & Codes!</div><div style="font-size:12px;color:#a1a1aa;">Switch to Memory Hub and click "Step 2: Import from Clipboard"!</div></div>';
    setTimeout(() => toast.remove(), 8000);
  } catch (err) {
    toast.style.borderColor = "#ef4444";
    toast.innerHTML = '<span style="font-size:20px;">❌</span><div><div style="font-weight:600;color:#fca5a5;">Sync Failed</div><div style="font-size:12px;color:#a1a1aa;">' + (err.message || "Error") + '</div></div>';
    setTimeout(() => toast.remove(), 6000);
  }
})();`;

  const bookmarkletHref = `javascript:${encodeURIComponent(rawScript)}`;

  useEffect(() => {
    if (bookmarkRef.current) {
      bookmarkRef.current.setAttribute("href", bookmarkletHref);
    }
  }, [bookmarkletHref, open]);

  const handleCopyScript = () => {
    void navigator.clipboard.writeText(rawScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleImportFromClipboard = async () => {
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (trimmed.startsWith("(") || trimmed.includes("HUB_URL") || !trimmed.startsWith("{")) {
        throw new Error(
          "Your clipboard contains the script, not the LeetCode solutions! First go to your LeetCode tab, press F12 (Console), paste (Ctrl+V) and press Enter. Once it finishes, come back here and click Import!"
        );
      }

      const parsed = JSON.parse(trimmed);
      if (!parsed.submissions || !Array.isArray(parsed.submissions) || parsed.submissions.length === 0) {
        throw new Error("No submissions found in clipboard data. Run the script on LeetCode first!");
      }

      const res = await fetch("/api/sync-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, submissions: parsed.submissions }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setImportStatus(`✅ Successfully imported ${data.total} solutions & exact code! Reloading...`);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setImportStatus(err instanceof Error ? `❌ ${err.message}` : "❌ Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30">
              <Zap className="size-4" />
            </span>
            1-Click LeetCode Code Sync
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Pulls your exact accepted solution code directly from LeetCode into your Memory Hub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Method 1: Console / Clipboard Import */}
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-violet-400" />
                <span className="text-xs font-semibold text-zinc-200">2-Step Code Sync</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                className="h-7 text-xs border-violet-500/30 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3" /> Step 1: Copy Script
                  </>
                )}
              </Button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400 leading-relaxed">
              <li>Click <b className="text-violet-300">Step 1: Copy Script</b> above.</li>
              <li>
                Switch to your <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">LeetCode tab</a>, press <kbd className="rounded bg-black/40 px-1 font-mono text-[10px]">F12</kbd> (Console), paste (<kbd className="rounded bg-black/40 px-1 font-mono text-[10px]">Ctrl+V</kbd>) and press <b>Enter</b>.
              </li>
              <li>
                Once the green notification shows on LeetCode, switch back here and click <b className="text-violet-300">Step 2: Import from Clipboard</b> below!
              </li>
            </ol>

            <div className="pt-1">
              <Button
                size="sm"
                onClick={() => void handleImportFromClipboard()}
                disabled={importing}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-semibold"
              >
                <Upload className="size-3.5" />
                {importing ? "Importing Solutions…" : "Step 2: Import from Clipboard"}
              </Button>
              {importStatus && (
                <p className="mt-2 text-center text-xs font-medium text-zinc-300">{importStatus}</p>
              )}
            </div>
          </div>

          {/* Method 2: Drag Bookmark */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-center">
            <p className="mb-2 text-xs font-medium text-zinc-300">
              Or drag bookmark (press <kbd className="rounded bg-black/40 px-1 py-0.5 font-mono text-[11px]">Ctrl+Shift+B</kbd>):
            </p>
            <div className="flex justify-center py-1">
              <a
                ref={bookmarkRef}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Drag this button UP into your Bookmarks Bar (Ctrl + Shift + B)!");
                }}
                className="group inline-flex cursor-grab items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 ring-1 ring-white/10 transition-all hover:bg-zinc-700 active:cursor-grabbing"
                title="Drag to your Bookmarks Bar"
              >
                <Zap className="size-3.5 fill-violet-400 text-violet-400" />
                ⚡ Sync to Memory Hub
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
