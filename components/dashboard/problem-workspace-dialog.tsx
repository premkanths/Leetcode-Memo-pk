"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import {
  BookOpen,
  Check,
  CircleAlert,
  CircleCheck,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCw,
  Save,
  Send,
  Sparkles,
  Split,
  X,
} from "lucide-react";
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
      className="text-primary underline underline-offset-2 hover:opacity-80"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[12px] text-foreground" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="block overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[12px] leading-relaxed text-foreground" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="my-2 overflow-x-auto rounded-xl border border-border bg-muted/40 p-3.5 font-mono text-xs text-foreground" {...props}>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 flex h-[94vh] max-h-[960px] w-[96vw] max-w-[1720px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl">
        {open && problem && (
          <ProblemWorkspaceContent
            key={problem.titleSlug}
            problem={problem}
            onClose={() => onOpenChange(false)}
            onStatusChange={onStatusChange}
            onSaveNotes={onSaveNotes}
            onSaveCode={onSaveCode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ProblemWorkspaceContentProps {
  problem: SolvedProblem;
  onClose: () => void;
  onStatusChange: (titleSlug: string, status: MemoryStatus) => Promise<void>;
  onSaveNotes: (titleSlug: string, notes: string) => Promise<void>;
  onSaveCode?: (titleSlug: string, code: string, lang?: string) => Promise<void>;
}

function ProblemWorkspaceContent({
  problem,
  onClose,
  onStatusChange,
  onSaveNotes,
  onSaveCode,
}: ProblemWorkspaceContentProps) {
  // Main view tab: "description" | "code" | "notes" | "split"
  const [activeTab, setActiveTab] = useState<"description" | "code" | "notes" | "split">(
    problem.code ? "description" : "code"
  );
  
  // Problem details state (LeetCode description HTML)
  const [details, setDetails] = useState<ProblemDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Notes state
  const [editedNotes, setEditedNotes] = useState<string | null>(null);
  const [notesMode, setNotesMode] = useState<"write" | "preview">("write");
  const [savingNotes, setSavingNotes] = useState(false);

  // Code state
  const [codeDraft, setCodeDraft] = useState<string | null>(null);
  const [codeLang, setCodeLang] = useState<string>(problem.codeLanguage || "java");
  const [isEditingCode, setIsEditingCode] = useState(!problem.code);
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

  // Fetch problem details (description HTML) from LeetCode
  useEffect(() => {
    let isCancelled = false;

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
  }, [problem.titleSlug]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiSummary, loadingAi, sendingChat]);

  const currentNotes = editedNotes ?? problem.notes;
  const isNotesDirty = editedNotes !== null && editedNotes !== problem.notes;
  const currentCode = codeDraft ?? problem.code ?? "";
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
    <>
      {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="truncate text-base font-bold text-foreground sm:text-lg">
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
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Open on LeetCode"
                >
                  <span>LeetCode</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {problem.solvedAt ? (
                  <span>Solved {formatDate(problem.solvedAt)}</span>
                ) : (
                  <span>Added manually</span>
                )}
                {problem.topics.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="truncate">{problem.topics.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Memory Status Selector */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
              {MEMORY_STATUSES.map((status) => {
                const isActive = currentStatus === status;
                let activeStyle = "text-muted-foreground hover:text-foreground";
                if (isActive) {
                  if (status === "Mastered") activeStyle = "bg-status-mastered-bg text-status-mastered-text border border-status-mastered-border shadow-xs";
                  if (status === "Needs Review") activeStyle = "bg-status-review-bg text-status-review-text border border-status-review-border shadow-xs";
                  if (status === "Confused") activeStyle = "bg-status-confused-bg text-status-confused-text border border-status-confused-border shadow-xs";
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
              onClick={onClose}
              className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Close Workspace"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        {/* Workspace Body: Left (Content) & Right (Gemini AI Coach) */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Area: 7 cols (Question / Code / Notes / Split) */}
          <section className="flex min-h-0 flex-col border-b border-border lg:col-span-7 lg:border-b-0 lg:border-r">
            {/* View Tab Switcher */}
            <div className="flex items-center justify-between border-b border-border bg-card/60 px-5 py-2.5">
              <nav className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1" aria-label="Workspace views">
                <button
                  type="button"
                  onClick={() => setActiveTab("description")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "description" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="size-3.5 text-primary" />
                  <span>Problem Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "code" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Code2 className="size-3.5 text-status-mastered-text" />
                  <span>My Code ({codeLang})</span>
                  {problem.code && <span className="size-1.5 rounded-full bg-status-mastered-text" />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "notes" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Pencil className="size-3.5 text-status-review-text" />
                  <span>Notes & Memo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("split")}
                  className={cn(
                    "hidden cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex",
                    activeTab === "split" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Split className="size-3.5 text-primary" />
                  <span>Split View</span>
                </button>
              </nav>

              {activeTab === "code" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => void handleCopyCode()}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="size-3 text-status-mastered-text" /> Copied
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
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
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
                    <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-muted/60" />
                    <div className="h-24 w-full animate-pulse rounded-xl bg-muted/40" />
                  </div>
                ) : details?.content ? (
                  <div
                    className="prose dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:leading-relaxed prose-pre:border prose-pre:border-border prose-pre:bg-muted/40 prose-code:text-foreground"
                    dangerouslySetInnerHTML={{ __html: details.content }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <BookOpen className="mb-3 size-10 text-muted-foreground/60" />
                    <h4 className="text-base font-semibold text-foreground">{problem.title}</h4>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Problem description could not be loaded directly from LeetCode. You can view it directly on LeetCode or check Gemini&apos;s summary on the right.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => window.open(problem.leetcodeUrl, "_blank")}
                    >
                      <ExternalLink className="size-3.5" /> Open on LeetCode
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
                      className="cursor-pointer rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                      <span className="rounded border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                        ⚡ {problem.runtime}
                      </span>
                    )}
                    {problem.memoryUsage && (
                      <span className="rounded border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
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
                    className="flex-1 resize-none rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  />
                ) : currentCode ? (
                  <div className="flex-1 overflow-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground">
                    <pre className="overflow-x-auto whitespace-pre font-mono">
                      <code>{currentCode}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <Code2 className="mb-2 size-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground">No code attached yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
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
                    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setNotesMode("write")}
                        className={cn(
                          "cursor-pointer rounded-md px-2.5 py-1 transition-colors",
                          notesMode === "write" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotesMode("preview")}
                        className={cn(
                          "cursor-pointer rounded-md px-2.5 py-1 transition-colors",
                          notesMode === "preview" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Preview
                      </button>
                    </div>

                    <div className="hidden gap-1 sm:flex">
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate("### 💡 Core Pattern\n- ")}
                        className="rounded-md border border-border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        + Pattern
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate("### ⚠️ Edge Cases\n- Empty input / size 1\n- ")}
                        className="rounded-md border border-border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        + Edge Cases
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate("### ⏱️ Complexity\n- Time: O()\n- Space: O()\n")}
                        className="rounded-md border border-border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        + Complexity
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
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
                    className="flex-1 resize-none rounded-xl border border-border bg-background p-4 text-xs leading-relaxed text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  />
                ) : (
                  <div className="prose dark:prose-invert flex-1 overflow-auto rounded-xl border border-border bg-muted/30 p-4 text-xs leading-relaxed text-foreground">
                    {currentNotes.trim() ? (
                      <ReactMarkdown components={markdownComponents}>{currentNotes}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground">No notes written yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Split View (Problem & Code Side-by-Side) */}
            {activeTab === "split" && (
              <div className="grid flex-1 grid-cols-2 divide-x divide-border overflow-hidden">
                {/* Left: Problem Statement */}
                <div className="overflow-y-auto p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Problem Statement
                  </p>
                  {details?.content ? (
                    <div
                      className="prose dark:prose-invert prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: details.content }}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">Loading problem statement…</p>
                  )}
                </div>

                {/* Right: Code */}
                <div className="flex flex-col overflow-hidden p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Solution Code ({codeLang})
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => void handleCopyCode()}
                    >
                      {copiedCode ? <Check className="size-3 text-status-mastered-text" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto rounded-xl border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground">
                    <pre className="overflow-x-auto whitespace-pre font-mono">
                      <code>{currentCode || "// No code attached"}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right Area: 5 cols (Interactive Gemini AI Coach) */}
          <aside className="flex min-h-0 flex-col bg-card/40 lg:col-span-5 border-l border-border">
            {/* Coach Header */}
            <div className="flex items-center justify-between border-b border-border bg-card/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="size-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Gemini AI Coach</h3>
                  <p className="text-[10px] text-muted-foreground">Instant intuition, code walkthrough & chat</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
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
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 p-6 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                    <Sparkles className="size-5" />
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">Gemini AI Coach Ready</h4>
                  <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
                    AI analysis generates only when you request it. Choose a topic prompt below or generate a complete problem breakdown.
                  </p>

                  <Button
                    size="sm"
                    onClick={() => void handleRegenerateAi()}
                    className="mt-4 gap-2 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Generate Full Breakdown</span>
                  </Button>
                </div>
              ) : null}

              {loadingAi && !aiSummary ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 p-8 text-center">
                  <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                  <p className="font-medium text-foreground">Analyzing your solution…</p>
                  <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
                    Summarizing the question, walking through your code, and verifying complexities.
                  </p>
                </div>
              ) : aiError ? (
                <div className="rounded-xl border border-status-confused-border bg-status-confused-bg p-4 text-status-confused-text">
                  <p className="font-semibold">Could not generate AI coach breakdown</p>
                  <p className="mt-1 text-[11px] opacity-90">{aiError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-status-confused-border"
                    onClick={() => void handleRegenerateAi()}
                  >
                    Retry
                  </Button>
                </div>
              ) : aiSummary ? (
                <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
                  <div className="mb-2 flex items-center gap-1.5 text-primary">
                    <Sparkles className="size-3.5" />
                    <span className="font-semibold text-foreground">Solution Breakdown</span>
                  </div>
                  <div className="prose dark:prose-invert prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:leading-relaxed prose-pre:border prose-pre:border-border prose-pre:bg-muted/40 prose-code:text-foreground">
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
                      ? "ml-8 border border-primary/20 bg-primary/10 text-foreground"
                      : "mr-4 border border-border bg-card text-foreground shadow-xs"
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {msg.role === "user" ? "You" : "Gemini Coach"}
                  </div>
                  <div className="prose dark:prose-invert prose-sm max-w-none text-foreground prose-p:leading-relaxed prose-code:text-foreground">
                    <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}

              {sendingChat && (
                <div className="mr-8 flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-3.5 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Gemini is thinking…</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Pills */}
            <div className="border-t border-border bg-card/70 p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSendMessage(prompt)}
                    disabled={sendingChat || loadingAi}
                    className="cursor-pointer rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
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
                  className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!userChatInput.trim() || sendingChat}
                  className="size-8.5 rounded-xl bg-primary p-0 text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                  title="Send message"
                >
                  <Send className="size-3.5" />
                </Button>
              </form>
            </div>
          </aside>
        </div>
    </>
  );
}
