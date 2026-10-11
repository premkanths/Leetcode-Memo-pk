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
    active: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40",
    badge: "mastered",
  },
  "Needs Review": {
    icon: <RotateCw className="size-3.5" />,
    active: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40",
    badge: "review",
  },
  Confused: {
    icon: <CircleAlert className="size-3.5" />,
    active: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40",
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
      className="text-violet-400 hover:underline"
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
    <Card className="group flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/30 hover:shadow-violet-500/10">
      {/* Problem Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenWorkspace?.(problem)}
              className="group/btn inline-flex max-w-full cursor-pointer items-center gap-1.5 text-left text-base font-semibold text-zinc-50 transition-colors hover:text-violet-300"
              title="Open full-screen workspace and Gemini AI Coach"
            >
              <span className="truncate">{problem.title}</span>
              <Maximize2 className="size-3.5 shrink-0 text-violet-400 opacity-40 transition-opacity group-hover/btn:opacity-100" />
            </button>
            <a
              href={problem.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-300"
              title="Open on LeetCode"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="sr-only">(opens LeetCode)</span>
            </a>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <span>{problem.solvedAt ? `Solved ${formatDate(problem.solvedAt)}` : "Added manually"}</span>
            {problem.code && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
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
            className="h-7 cursor-pointer px-2 text-xs text-zinc-400 hover:bg-violet-500/10 hover:text-violet-200"
            title="Open Problem Workspace & AI Coach"
          >
            <Sparkles className="size-3 text-violet-400" />
            <span className="hidden sm:inline">AI View</span>
          </Button>
        </div>
      </div>

      {/* Topics */}
      {problem.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5">
          {visibleTopics.map((topic) => (
            <span key={topic} className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400">
              {topic}
            </span>
          ))}
          {hiddenTopicCount > 0 && (
            <span className="rounded-md px-2 py-0.5 text-[11px] text-zinc-500">+{hiddenTopicCount}</span>
          )}
        </div>
      )}

      {/* Memory Status Radio Group */}
      <div className="px-5 pt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Memory status</p>
        <div
          role="radiogroup"
          aria-label="Memory status"
          className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950/60 p-1"
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
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all disabled:cursor-wait sm:text-xs",
                  active ? meta.active : "text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200",
                )}
              >
                {meta.icon}
                <span className="truncate">{status}</span>
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-rose-400">
            {error}
          </p>
        )}
      </div>

      {/* Dual Tab Action Bar: [Notes] and [Solution Code] */}
      <div className="mt-4 border-t border-white/[0.06] bg-zinc-950/30">
        <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
          {/* Notes Toggle */}
          <button
            type="button"
            onClick={() => setActiveTab((cur) => (cur === "notes" ? "none" : "notes"))}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors",
              activeTab === "notes"
                ? "bg-violet-500/10 text-violet-300"
                : "text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200",
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
                ? "bg-violet-500/10 text-violet-300"
                : "text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200",
            )}
          >
            <Code2 className="size-3.5" />
            <span>Solution Code</span>
            {problem.code && (
              <span className="size-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" title="Code synced" />
            )}
            <ChevronDown
              className={cn("size-3 transition-transform", activeTab === "code" && "rotate-180")}
            />
          </button>
        </div>

        {/* Panel 1: Notes Editor */}
        {activeTab === "notes" && (
          <div className="space-y-3 border-t border-white/[0.06] p-5">
            <div className="flex items-center justify-between">
              <div
                className="inline-flex rounded-md bg-zinc-950/60 p-0.5 text-xs"
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
                      "cursor-pointer rounded px-2.5 py-1 capitalize transition-colors",
                      notesTab === mode ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-zinc-600">
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
              <div className="prose prose-invert prose-sm min-h-[140px] max-w-none rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 prose-pre:bg-zinc-900">
                {notesDraft.trim() ? (
                  <ReactMarkdown components={markdownComponents}>{notesDraft}</ReactMarkdown>
                ) : (
                  <p className="text-zinc-500">Nothing to preview yet.</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-600">Markdown supported · Ctrl/⌘ + S to save</p>
              <div className="flex gap-2">
                {notesDirty && (
                  <Button variant="ghost" size="sm" onClick={() => setEditedNotes(null)} disabled={savingNotes}>
                    Discard
                  </Button>
                )}
                <Button size="sm" onClick={() => void saveNotes()} disabled={!notesDirty || savingNotes}>
                  <Save /> {savingNotes ? "Saving…" : "Save notes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Solution Code Viewer & Editor */}
        {activeTab === "code" && (
          <div className="space-y-3 border-t border-white/[0.06] p-5">
            {problem.code && !editingCode ? (
              <div className="space-y-3">
                {/* Code header bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-violet-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-300 ring-1 ring-violet-500/30">
                      {problem.codeLanguage || "code"}
                    </span>
                    {problem.runtime && (
                      <span className="text-[11px] text-zinc-400">⚡ {problem.runtime}</span>
                    )}
                    {problem.memoryUsage && (
                      <span className="text-[11px] text-zinc-500">💾 {problem.memoryUsage}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100"
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
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                      onClick={() => setEditingCode(true)}
                    >
                      <Pencil className="size-3" /> Edit
                    </Button>
                  </div>
                </div>

                {/* Code Display */}
                <div className="max-h-80 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200 shadow-inner">
                  <pre className="overflow-x-auto whitespace-pre font-mono">
                    <code>{problem.code}</code>
                  </pre>
                </div>
              </div>
            ) : (
              /* Code Editor / Paste view */
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-300">
                    {problem.code ? "Edit Solution Code" : "Add Solution Code"}
                  </p>
                  <select
                    value={editedLang}
                    onChange={(e) => setEditedLang(e.target.value)}
                    className="cursor-pointer rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-sans text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
                  className="min-h-[160px] font-mono text-xs leading-relaxed text-zinc-200"
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
