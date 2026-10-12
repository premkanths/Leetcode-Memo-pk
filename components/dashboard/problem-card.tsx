"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import {
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Code2,
  Copy,
  ExternalLink,
  Maximize2,
  Pencil,
  RotateCw,
  Save,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate, formatRelativeTime, getErrorMessage } from "@/lib/utils";
import {
  MAX_NOTES_LENGTH,
  MEMORY_STATUSES,
  type Difficulty,
  type MemoryStatus,
  type SolvedProblem,
} from "@/lib/types";

const MAX_VISIBLE_TOPICS = 4;

const STATUS_META: Record<
  MemoryStatus,
  { icon: React.ReactNode; active: string; badge: "mastered" | "review" | "confused" }
> = {
  Mastered: {
    icon: <CircleCheck className="size-3.5" />,
    active: "bg-status-mastered-bg text-status-mastered-text border border-status-mastered-border shadow-xs",
    badge: "mastered",
  },
  "Needs Review": {
    icon: <RotateCw className="size-3.5" />,
    active: "bg-status-review-bg text-status-review-text border border-status-review-border shadow-xs",
    badge: "review",
  },
  Confused: {
    icon: <CircleAlert className="size-3.5" />,
    active: "bg-status-confused-bg text-status-confused-text border border-status-confused-border shadow-xs",
    badge: "confused",
  },
};

const DIFFICULTY_VARIANT: Record<Difficulty, "easy" | "medium" | "hard"> = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
};

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
};

interface ProblemCardProps {
  problem: SolvedProblem;
  onStatusChange: (titleSlug: string, status: MemoryStatus) => Promise<void>;
  onSaveNotes: (titleSlug: string, notes: string) => Promise<void>;
  onSaveCode?: (titleSlug: string, code: string, lang?: string) => Promise<void>;
  onOpenWorkspace?: (problem: SolvedProblem) => void;
}

export function ProblemCard({
  problem,
  onStatusChange,
  onSaveNotes,
  onSaveCode,
  onOpenWorkspace,
}: ProblemCardProps) {
  const [activeTab, setActiveTab] = useState<"none" | "notes" | "code">("none");
  const [notesTab, setNotesTab] = useState<"write" | "preview">("write");

  // Notes state
  const [editedNotes, setEditedNotes] = useState<string | null>(null);
  const notesDraft = editedNotes ?? problem.notes;
  const [savingNotes, setSavingNotes] = useState(false);

  // Code state
  const [editingCode, setEditingCode] = useState(false);
  const [editedCodeText, setEditedCodeText] = useState<string | null>(null);
  const [editedLang, setEditedLang] = useState<string>(problem.codeLanguage || "java");
  const [savingCode, setSavingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [pendingStatus, setPendingStatus] = useState<MemoryStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shownStatus = pendingStatus ?? problem.memoryStatus;
  const notesDirty = editedNotes !== null && editedNotes !== problem.notes;
  const visibleTopics = problem.topics.slice(0, MAX_VISIBLE_TOPICS);
  const hiddenTopicCount = problem.topics.length - visibleTopics.length;
  const notesPreview = problem.notes.split("\n").find((line) => line.trim())?.trim() ?? "";

  const currentCode = editedCodeText ?? problem.code ?? "";

  const changeStatus = async (status: MemoryStatus) => {
    if (status === problem.memoryStatus || pendingStatus) return;
    setError(null);
    setPendingStatus(status);
    try {
      await onStatusChange(problem.titleSlug, status);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update memory status."));
    } finally {
      setPendingStatus(null);
    }
  };

  const saveNotes = async () => {
    if (!notesDirty || savingNotes) return;
    setError(null);
    setSavingNotes(true);
    const text = notesDraft.slice(0, MAX_NOTES_LENGTH);
    try {
      await onSaveNotes(problem.titleSlug, text);
      setEditedNotes(text);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save notes."));
    } finally {
      setSavingNotes(false);
    }
  };

  const saveCode = async () => {
    if (!onSaveCode || savingCode) return;
    setError(null);
    setSavingCode(true);
    try {
      await onSaveCode(problem.titleSlug, currentCode, editedLang);
      setEditingCode(false);
      setEditedCodeText(currentCode);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save code."));
    } finally {
      setSavingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!problem.code) return;
    await navigator.clipboard.writeText(problem.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Card className="group flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20">
      {/* Problem Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenWorkspace?.(problem)}
              className="group/btn inline-flex max-w-full cursor-pointer items-center gap-1.5 text-left text-base font-semibold text-foreground transition-colors hover:text-primary"
              title="Open full-screen workspace and Gemini AI Coach"
            >
              <span className="truncate">{problem.title}</span>
              <Maximize2 className="size-3.5 shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover/btn:opacity-100" />
            </button>
            <a
              href={problem.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              title="Open on LeetCode"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="sr-only">(opens LeetCode)</span>
            </a>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{problem.solvedAt ? `Solved ${formatDate(problem.solvedAt)}` : "Added manually"}</span>
            {problem.code && (
              <span className="rounded border border-status-mastered-border bg-status-mastered-bg px-1.5 py-0.5 font-mono text-[10px] font-medium text-status-mastered-text">
                {problem.codeLanguage || "Java"}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]} className="shrink-0">
            {problem.difficulty}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenWorkspace?.(problem)}
            className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Open Problem Workspace & AI Coach"
          >
            <Sparkles className="size-3 text-primary" />
            <span className="hidden sm:inline">AI View</span>
          </Button>
        </div>
      </div>

      {/* Topics */}
      {problem.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5">
          {visibleTopics.map((topic) => (
            <span key={topic} className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
              {topic}
            </span>
          ))}
          {hiddenTopicCount > 0 && (
            <span className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground">+{hiddenTopicCount}</span>
          )}
        </div>
      )}

      {/* Memory Status Radio Group */}
      <div className="px-5 pt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Memory status</p>
        <div
          role="radiogroup"
          aria-label="Memory status"
          className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1"
        >
          {MEMORY_STATUSES.map((status) => {
            const meta = STATUS_META[status];
            const active = shownStatus === status;
            return (
              <button
                key={status}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={pendingStatus !== null}
                onClick={() => void changeStatus(status)}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all disabled:cursor-wait sm:text-xs",
                  active ? meta.active : "text-muted-foreground hover:bg-background hover:text-foreground",
                )}
              >
                {meta.icon}
                <span className="truncate">{status}</span>
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-status-confused-text">
            {error}
          </p>
        )}
      </div>

      {/* Dual Tab Action Bar: [Notes] and [Solution Code] */}
      <div className="mt-4 border-t border-border bg-muted/20">
        <div className="grid grid-cols-2 divide-x divide-border">
          {/* Notes Toggle */}
          <button
            type="button"
            onClick={() => setActiveTab((cur) => (cur === "notes" ? "none" : "notes"))}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors",
              activeTab === "notes"
                ? "bg-card text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <StickyNote className="size-3.5" />
            <span>Notes</span>
            <ChevronDown
              className={cn("size-3 transition-transform", activeTab === "notes" && "rotate-180")}
            />
          </button>

          {/* Solution Code Toggle */}
          <button
            type="button"
            onClick={() => setActiveTab((cur) => (cur === "code" ? "none" : "code"))}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors",
              activeTab === "code"
                ? "bg-card text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <Code2 className="size-3.5" />
            <span>Solution Code</span>
            {problem.code && (
              <span className="size-1.5 rounded-full bg-status-mastered-text" title="Code synced" />
            )}
            <ChevronDown
              className={cn("size-3 transition-transform", activeTab === "code" && "rotate-180")}
            />
          </button>
        </div>

        {/* Panel 1: Notes Editor */}
        {activeTab === "notes" && (
          <div className="space-y-3 border-t border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div
                className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs"
                role="tablist"
                aria-label="Notes editor mode"
              >
                {(["write", "preview"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={notesTab === mode}
                    onClick={() => setNotesTab(mode)}
                    className={cn(
                      "cursor-pointer rounded-md px-2.5 py-1 capitalize transition-colors",
                      notesTab === mode ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {notesDraft.length.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()}
              </span>
            </div>

            {notesTab === "write" ? (
              <Textarea
                value={notesDraft}
                maxLength={MAX_NOTES_LENGTH}
                onChange={(event) => setEditedNotes(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
                    event.preventDefault();
                    void saveNotes();
                  }
                }}
                placeholder={
                  "Core pattern: sliding window + hash map\n- Shrink when the window becomes invalid\n- Track counts, not indices"
                }
                aria-label={`Notes for ${problem.title}`}
                className="min-h-[140px] text-[13px]"
              />
            ) : (
              <div className="prose dark:prose-invert prose-sm min-h-[140px] max-w-none rounded-xl border border-border bg-muted/30 p-3">
                {notesDraft.trim() ? (
                  <ReactMarkdown components={markdownComponents}>{notesDraft}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">Markdown supported · Ctrl/⌘ + S to save</p>
              <div className="flex gap-2">
                {notesDirty && (
                  <Button variant="ghost" size="sm" onClick={() => setEditedNotes(null)} disabled={savingNotes}>
                    Discard
                  </Button>
                )}
                <Button size="sm" onClick={() => void saveNotes()} disabled={!notesDirty || savingNotes}>
                  <Save className="size-3.5" /> {savingNotes ? "Saving…" : "Save notes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Solution Code Viewer & Editor */}
        {activeTab === "code" && (
          <div className="space-y-3 border-t border-border bg-card p-5">
            {problem.code && !editingCode ? (
              <div className="space-y-3">
                {/* Code header bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                      {problem.codeLanguage || "code"}
                    </span>
                    {problem.runtime && (
                      <span className="text-[11px] text-muted-foreground">⚡ {problem.runtime}</span>
                    )}
                    {problem.memoryUsage && (
                      <span className="text-[11px] text-muted-foreground">💾 {problem.memoryUsage}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
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
                      onClick={() => setEditingCode(true)}
                    >
                      <Pencil className="size-3" /> Edit
                    </Button>
                  </div>
                </div>

                {/* Code Display */}
                <div className="max-h-80 overflow-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground">
                  <pre className="overflow-x-auto whitespace-pre font-mono">
                    <code>{problem.code}</code>
                  </pre>
                </div>
              </div>
            ) : (
              /* Code Editor / Paste view */
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    {problem.code ? "Edit Solution Code" : "Add Solution Code"}
                  </p>
                  <select
                    value={editedLang}
                    onChange={(e) => setEditedLang(e.target.value)}
                    className="cursor-pointer rounded-md border border-border bg-background px-2.5 py-1 font-sans text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                </div>

                <Textarea
                  value={currentCode}
                  onChange={(e) => {
                    const text = e.target.value;
                    setEditedCodeText(text);
                    if (/(public|private|protected)\s+(class|void|int|String|boolean)|System\.out/i.test(text)) {
                      setEditedLang("java");
                    } else if (/def\s+\w+\s*\(|class\s+Solution:|self\./i.test(text)) {
                      setEditedLang("python3");
                    } else if (/#include|std::|vector</i.test(text)) {
                      setEditedLang("cpp");
                    }
                  }}
                  placeholder="Paste or write your accepted LeetCode Java / Python solution here..."
                  className="min-h-[160px] font-mono text-xs leading-relaxed text-foreground"
                />

                <div className="flex items-center justify-end gap-2">
                  {editingCode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCode(false);
                        setEditedCodeText(null);
                      }}
                      disabled={savingCode}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => void saveCode()}
                    disabled={!currentCode.trim() || savingCode}
                  >
                    <Save /> {savingCode ? "Saving…" : "Save code"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
