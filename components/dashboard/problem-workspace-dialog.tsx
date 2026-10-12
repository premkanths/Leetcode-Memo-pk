"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  CircleAlert,
  CircleCheck,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Maximize2,
  Pencil,
  RefreshCw,
  RotateCw,
  Save,
  Send,
  Sparkles,
  Split,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";
import {
  MAX_NOTES_LENGTH,
  MEMORY_STATUSES,
  type Difficulty,
  type MemoryStatus,
  type SolvedProblem,
} from "@/lib/types";

interface ProblemDetails {
  questionId?: string;
  questionFrontendId?: string;
  title: string;
  titleSlug: string;
  content: string;
  difficulty: string;
  topicTags: string[];
  sampleTestCase?: string;
}

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ProblemWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problem: SolvedProblem | null;
  onStatusChange: (titleSlug: string, status: MemoryStatus) => Promise<void>;
  onSaveNotes: (titleSlug: string, notes: string) => Promise<void>;
  onSaveCode?: (titleSlug: string, code: string, lang?: string) => Promise<void>;
}

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[12px] text-violet-300" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="block overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-200" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="my-2 overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-200" {...props}>
      {children}
    </pre>
  ),
};

const DIFFICULTY_BADGE: Record<Difficulty, { label: string; cls: string }> = {
  Easy: { label: "Easy", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 badge-glow-emerald" },
  Medium: { label: "Medium", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30 badge-glow-amber" },
  Hard: { label: "Hard", cls: "text-rose-400 bg-rose-500/10 border-rose-500/30 badge-glow-rose" },
};

const QUICK_PROMPTS = [
  "💡 Explain core intuition simpler",
  "🧪 Step-by-step example dry run",
  "⚠️ What tricky edge cases could fail?",
  "🚀 Can we optimize time or space?",
  "🎤 Ask me a mock interview follow-up",
];

export function ProblemWorkspaceDialog({
  open,
  onOpenChange,
  problem,
  onStatusChange,
  onSaveNotes,
  onSaveCode,
}: ProblemWorkspaceDialogProps) {
  // Main view tab: "description" | "code" | "notes" | "split"
  const [activeTab, setActiveTab] = useState<"description" | "code" | "notes" | "split">("description");
  
  // Problem details state (LeetCode description HTML)
  const [details, setDetails] = useState<ProblemDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Notes state
  const [editedNotes, setEditedNotes] = useState<string | null>(null);
  const [notesMode, setNotesMode] = useState<"write" | "preview">("write");
  const [savingNotes, setSavingNotes] = useState(false);

  // Code state
  const [codeDraft, setCodeDraft] = useState<string | null>(null);
  const [codeLang, setCodeLang] = useState<string>("java");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Memory status state
  const [pendingStatus, setPendingStatus] = useState<MemoryStatus | null>(null);

  // Gemini AI Coach state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userChatInput, setUserChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reset or initialize state when problem changes
  useEffect(() => {
    if (!problem || !open) return;

    setEditedNotes(null);
    setCodeDraft(null);
    setCodeLang(problem.codeLanguage || "java");
    setIsEditingCode(!problem.code);
    setChatMessages([]);
    setAiSummary(null);
    setAiError(null);
    setUserChatInput("");
    setActiveTab(problem.code ? "description" : "code");

    // Fetch problem details (description HTML) from LeetCode
    let isCancelled = false;
    setLoadingDetails(true);

    fetch(`/api/problem-details?slug=${problem.titleSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ProblemDetails) => {
        if (!isCancelled) {
          setDetails(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch LeetCode description HTML:", err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingDetails(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [problem?.titleSlug, open]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiSummary, loadingAi, sendingChat]);

  if (!problem) return null;

  const currentNotes = editedNotes ?? problem.notes;
  const isNotesDirty = editedNotes !== null && editedNotes !== problem.notes;

  const currentCode = codeDraft ?? problem.code ?? "";
  const isCodeDirty = codeDraft !== null && codeDraft !== (problem.code ?? "");

  const currentStatus = pendingStatus ?? problem.memoryStatus;

  // Handlers
  const handleStatusSelect = async (status: MemoryStatus) => {
    if (status === currentStatus || pendingStatus) return;
    setPendingStatus(status);
    try {
      await onStatusChange(problem.titleSlug, status);
    } catch (e) {
      console.error(e);
    } finally {
      setPendingStatus(null);
    }
  };

  const handleSaveNotesClick = async () => {
    if (!isNotesDirty || savingNotes) return;
    setSavingNotes(true);
    try {
      const trimmed = currentNotes.slice(0, MAX_NOTES_LENGTH);
      await onSaveNotes(problem.titleSlug, trimmed);
      setEditedNotes(trimmed);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveCodeClick = async () => {
    if (!onSaveCode || savingCode) return;
    setSavingCode(true);
    try {
      await onSaveCode(problem.titleSlug, currentCode, codeLang);
      setIsEditingCode(false);
      setCodeDraft(currentCode);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!currentCode) return;
    await navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInsertTemplate = (template: string) => {
    const updated = currentNotes ? `${currentNotes}\n\n${template}` : template;
    setEditedNotes(updated.slice(0, MAX_NOTES_LENGTH));
  };

  const handleRegenerateAi = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch("/api/problem-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle: problem.title,
          problemSlug: problem.titleSlug,
          difficulty: problem.difficulty,
          topics: problem.topics,
          questionContent: details?.content,
          code: currentCode,
          codeLanguage: codeLang,
          notes: currentNotes,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
      } else if (data.error) {
        setAiError(data.error);
      }
    } catch (err) {
      setAiError(getErrorMessage(err, "Could not regenerate summary."));
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = (promptText || userChatInput).trim();
    if (!textToSend || sendingChat) return;

    setUserChatInput("");
    const newHistory: ChatMessage[] = [...chatMessages, { role: "user", content: textToSend }];
    setChatMessages(newHistory);
    setSendingChat(true);

    try {
      const res = await fetch("/api/problem-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle: problem.title,
          problemSlug: problem.titleSlug,
          difficulty: problem.difficulty,
          topics: problem.topics,
          questionContent: details?.content,
          code: currentCode,
          codeLanguage: codeLang,
          notes: currentNotes,
          messages: newHistory,
          userPrompt: textToSend,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages([...newHistory, { role: "model", content: data.reply }]);
      } else if (data.error) {
        setChatMessages([...newHistory, { role: "model", content: `⚠️ ${data.error}` }]);
      }
    } catch (err) {
      setChatMessages([
        ...newHistory,
        { role: "model", content: `⚠️ ${getErrorMessage(err, "Failed to get AI response.")}` },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 flex h-[94vh] max-h-[960px] w-[96vw] max-w-[1720px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-zinc-950/95 p-0 shadow-2xl backdrop-blur-2xl">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-zinc-950/80 px-6 py-3.5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40">
              <BookOpen className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="truncate text-base font-bold text-zinc-100 sm:text-lg">
                  {problem.title}
                </DialogTitle>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                    DIFFICULTY_BADGE[problem.difficulty].cls
                  )}
                >
                  {problem.difficulty}
                </span>
                <a
                  href={problem.leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-900/90 px-2 py-0.5 text-xs text-zinc-400 ring-1 ring-white/10 transition-colors hover:bg-zinc-800 hover:text-white"
                  title="Open on LeetCode"
                >
                  <span>LeetCode</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                {problem.solvedAt ? (
                  <span>Solved {formatDate(problem.solvedAt)}</span>
                ) : (
                  <span>Added manually</span>
                )}
                {problem.topics.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="truncate text-zinc-400">{problem.topics.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Memory Status Selector */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center rounded-xl border border-white/[0.08] bg-zinc-900/80 p-1">
              {MEMORY_STATUSES.map((status) => {
                const isActive = currentStatus === status;
                let activeStyle = "text-zinc-400 hover:text-zinc-200";
                if (isActive) {
                  if (status === "Mastered") activeStyle = "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40";
                  if (status === "Needs Review") activeStyle = "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40";
                  if (status === "Confused") activeStyle = "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40";
                }
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void handleStatusSelect(status)}
                    disabled={pendingStatus !== null}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                      activeStyle
                    )}
                  >
                    {status === "Mastered" && <CircleCheck className="size-3" />}
                    {status === "Needs Review" && <RotateCw className="size-3" />}
                    {status === "Confused" && <CircleAlert className="size-3" />}
                    <span>{status}</span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              title="Close Workspace"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        {/* Workspace Body: Left (Content) & Right (Gemini AI Coach) */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Area: 7 cols (Question / Code / Notes / Split) */}
          <section className="flex min-h-0 flex-col border-b border-white/[0.08] lg:col-span-7 lg:border-b-0 lg:border-r">
            {/* View Tab Switcher */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-zinc-950/60 px-5 py-2.5">
              <nav className="flex items-center gap-1 rounded-lg bg-zinc-900/80 p-1" aria-label="Workspace views">
                <button
                  type="button"
                  onClick={() => setActiveTab("description")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "description" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <FileText className="size-3.5 text-violet-400" />
                  <span>Problem Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "code" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Code2 className="size-3.5 text-emerald-400" />
                  <span>My Code ({codeLang})</span>
                  {problem.code && <span className="size-1.5 rounded-full bg-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "notes" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Pencil className="size-3.5 text-amber-400" />
                  <span>Notes & Memo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("split")}
                  className={cn(
                    "hidden cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:flex",
                    activeTab === "split" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Split className="size-3.5 text-indigo-400" />
                  <span>Split View</span>
                </button>
              </nav>

              {activeTab === "code" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                    onClick={() => void handleCopyCode()}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="size-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                    onClick={() => setIsEditingCode(!isEditingCode)}
                  >
                    <Pencil className="size-3" /> {isEditingCode ? "Preview" : "Edit"}
                  </Button>
                </div>
              )}
            </div>

            {/* Tab 1: Problem Statement */}
            {activeTab === "description" && (
              <div className="flex-1 overflow-y-auto p-6">
                {loadingDetails ? (
                  <div className="space-y-4 py-8">
                    <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-800" />
                    <div className="h-4 w-full animate-pulse rounded bg-zinc-800/60" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800/60" />
                    <div className="h-24 w-full animate-pulse rounded-xl bg-zinc-800/40" />
                  </div>
                ) : details?.content ? (
                  <div
                    className="prose prose-invert max-w-none text-zinc-300 prose-headings:text-zinc-100 prose-p:leading-relaxed prose-pre:border prose-pre:border-zinc-800 prose-pre:bg-zinc-950 prose-code:text-violet-300"
                    dangerouslySetInnerHTML={{ __html: details.content }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                    <BookOpen className="mb-3 size-10 text-zinc-600" />
                    <h4 className="text-base font-semibold text-zinc-200">{problem.title}</h4>
                    <p className="mt-1 max-w-md text-sm text-zinc-500">
                      Problem description could not be loaded directly from LeetCode. You can view it directly on LeetCode or check Gemini&apos;s summary on the right.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => window.open(problem.leetcodeUrl, "_blank")}
                    >
                      <ExternalLink /> Open on LeetCode
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: My Code */}
            {activeTab === "code" && (
              <div className="flex flex-1 flex-col overflow-hidden p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={codeLang}
                      onChange={(e) => setCodeLang(e.target.value)}
                      className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      <option value="java">Java</option>
                      <option value="python3">Python 3</option>
                      <option value="cpp">C++</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="csharp">C#</option>
                      <option value="go">Go</option>
                      <option value="sql">SQL</option>
                    </select>
                    {problem.runtime && (
                      <span className="rounded bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400">
                        ⚡ {problem.runtime}
                      </span>
                    )}
                    {problem.memoryUsage && (
                      <span className="rounded bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-500">
                        💾 {problem.memoryUsage}
                      </span>
                    )}
                  </div>

                  {isEditingCode && (
                    <Button
                      size="sm"
                      onClick={() => void handleSaveCodeClick()}
                      disabled={!currentCode.trim() || savingCode}
                      className="h-7 text-xs"
                    >
                      <Save className="size-3" /> {savingCode ? "Saving…" : "Save Code"}
                    </Button>
                  )}
                </div>

                {isEditingCode ? (
                  <Textarea
                    value={currentCode}
                    onChange={(e) => {
                      const text = e.target.value;
                      setCodeDraft(text);
                      if (/(public|private|protected)\s+(class|void|int|String|boolean)|System\.out/i.test(text)) {
                        setCodeLang("java");
                      } else if (/def\s+\w+\s*\(|class\s+Solution:|self\./i.test(text)) {
                        setCodeLang("python3");
                      }
                    }}
                    placeholder="Write or paste your accepted solution code here..."
                    className="flex-1 resize-none rounded-xl border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200 focus:border-violet-500"
                  />
                ) : currentCode ? (
                  <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">
                    <pre className="overflow-x-auto whitespace-pre font-mono">
                      <code>{currentCode}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
                    <Code2 className="mb-2 size-8 text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-300">No code attached yet</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Sync your code via LeetCode sync, or click &ldquo;Edit&rdquo; to paste your Java solution.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsEditingCode(true)}
                    >
                      <Pencil className="size-3" /> Paste Solution
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Notes & Memo */}
            {activeTab === "notes" && (
              <div className="flex flex-1 flex-col overflow-hidden p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex rounded-md bg-zinc-900 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setNotesMode("write")}
                        className={cn(
                          "cursor-pointer rounded px-2.5 py-1 transition-colors",
                          notesMode === "write" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotesMode("preview")}
                        className={cn(
                          "cursor-pointer rounded px-2.5 py-1 transition-colors",
                          notesMode === "preview" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        Preview
                      </button>
                    </div>

                    <div className="hidden gap-1 sm:flex">
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate("### 💡 Core Pattern\n- ")}
                        className="rounded bg-zinc-800/60 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        + Pattern
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate("### ⚠️ Edge Cases\n- Empty input / size 1\n- ")}
                        className="rounded bg-zinc-800/60 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        + Edge Cases
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate("### ⏱️ Complexity\n- Time: O()\n- Space: O()\n")}
                        className="rounded bg-zinc-800/60 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        + Complexity
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-600">
                      {currentNotes.length} / {MAX_NOTES_LENGTH}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => void handleSaveNotesClick()}
                      disabled={!isNotesDirty || savingNotes}
                      className="h-7 text-xs"
                    >
                      <Save className="size-3" /> {savingNotes ? "Saving…" : "Save Notes"}
                    </Button>
                  </div>
                </div>

                {notesMode === "write" ? (
                  <Textarea
                    value={currentNotes}
                    maxLength={MAX_NOTES_LENGTH}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
                        e.preventDefault();
                        void handleSaveNotesClick();
                      }
                    }}
                    placeholder={
                      "### 💡 Core Pattern\n- Explain the mental model\n- Key trick to remember in interview\n\n### ⚠️ Edge Cases\n- Zeroes, negatives, duplicates"
                    }
                    className="flex-1 resize-none rounded-xl border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-200 focus:border-violet-500"
                  />
                ) : (
                  <div className="prose prose-invert flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-200">
                    {currentNotes.trim() ? (
                      <ReactMarkdown components={markdownComponents}>{currentNotes}</ReactMarkdown>
                    ) : (
                      <p className="text-zinc-500">No notes written yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Split View (Problem & Code Side-by-Side) */}
            {activeTab === "split" && (
              <div className="grid flex-1 grid-cols-2 divide-x divide-white/[0.06] overflow-hidden">
                {/* Left: Problem Statement */}
                <div className="overflow-y-auto p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Problem Statement
                  </p>
                  {details?.content ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none text-zinc-300"
                      dangerouslySetInnerHTML={{ __html: details.content }}
                    />
                  ) : (
                    <p className="text-xs text-zinc-500">Loading problem statement…</p>
                  )}
                </div>

                {/* Right: Code */}
                <div className="flex flex-col overflow-hidden p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Solution Code ({codeLang})
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs text-zinc-400"
                      onClick={() => void handleCopyCode()}
                    >
                      {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-200">
                    <pre className="overflow-x-auto whitespace-pre font-mono">
                      <code>{currentCode || "// No code attached"}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right Area: 5 cols (Interactive Gemini AI Coach) */}
          <aside className="flex min-h-0 flex-col bg-zinc-950/40 lg:col-span-5">
            {/* Coach Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-zinc-900/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/20">
                  <Sparkles className="size-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Gemini AI Coach</h3>
                  <p className="text-[10px] text-zinc-400">Instant intuition, code walkthrough & chat</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                onClick={() => void handleRegenerateAi()}
                disabled={loadingAi}
                title="Regenerate coaching summary"
              >
                <RefreshCw className={cn("size-3", loadingAi && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            {/* Coach Message Stream */}
            <div ref={chatScrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
              {/* Initial On-Demand Prompt / Summary Card */}
              {!loadingAi && !aiSummary && !aiError && chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-transparent p-6 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/30">
                    <Sparkles className="size-5" />
                  </span>
                  <h4 className="text-sm font-semibold text-zinc-100">Gemini AI Coach Ready</h4>
                  <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-zinc-400">
                    AI analysis generates only when you request it. Choose a topic prompt below or generate a complete problem breakdown.
                  </p>

                  <Button
                    size="sm"
                    onClick={() => void handleRegenerateAi()}
                    className="mt-4 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-xs text-white shadow-md hover:from-violet-500 hover:to-indigo-500"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Generate Full Breakdown</span>
                  </Button>
                </div>
              ) : null}

              {loadingAi && !aiSummary ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
                  <Loader2 className="mb-3 size-6 animate-spin text-violet-400" />
                  <p className="font-medium text-violet-200">Analyzing your solution…</p>
                  <p className="mt-1 max-w-xs text-[11px] text-violet-300/70">
                    Summarizing the question, walking through your code, and verifying complexities.
                  </p>
                </div>
              ) : aiError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                  <p className="font-semibold">Could not generate AI coach breakdown</p>
                  <p className="mt-1 text-[11px] text-rose-200/80">{aiError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-rose-500/40"
                    onClick={() => void handleRegenerateAi()}
                  >
                    Retry
                  </Button>
                </div>
              ) : aiSummary ? (
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4.5 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5 text-violet-400">
                    <Sparkles className="size-3.5" />
                    <span className="font-semibold text-zinc-200">Solution Breakdown</span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-300 prose-headings:text-zinc-100 prose-p:leading-relaxed prose-pre:border prose-pre:border-zinc-800 prose-pre:bg-zinc-950 prose-code:text-violet-300">
                    <ReactMarkdown components={markdownComponents}>{aiSummary}</ReactMarkdown>
                  </div>
                </div>
              ) : null}

              {/* Chat Thread */}
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col rounded-2xl p-4 leading-relaxed",
                    msg.role === "user"
                      ? "ml-8 border border-violet-500/30 bg-violet-500/15 text-zinc-100"
                      : "mr-4 border border-white/[0.07] bg-zinc-900/60 text-zinc-200"
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {msg.role === "user" ? "You" : "Gemini Coach"}
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-300 prose-p:leading-relaxed prose-code:text-violet-300">
                    <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}

              {sendingChat && (
                <div className="mr-8 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-3.5 text-zinc-400">
                  <Loader2 className="size-3.5 animate-spin text-violet-400" />
                  <span>Gemini is thinking…</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Pills */}
            <div className="border-t border-white/[0.06] bg-zinc-950/70 p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSendMessage(prompt)}
                    disabled={sendingChat || loadingAi}
                    className="cursor-pointer rounded-lg border border-white/[0.06] bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-200 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  placeholder="Ask any question about this problem or code…"
                  disabled={sendingChat}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!userChatInput.trim() || sendingChat}
                  className="size-8.5 rounded-xl bg-violet-600 p-0 text-white hover:bg-violet-500 disabled:opacity-40"
                  title="Send message"
                >
                  <Send className="size-3.5" />
                </Button>
              </form>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
