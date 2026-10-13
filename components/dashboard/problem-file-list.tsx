"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Code2,
  ExternalLink,
  FileCode2,
  FileText,
  Maximize2,
  Pin,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  MEMORY_STATUSES,
  type Difficulty,
  type MemoryStatus,
  type SolvedProblem,
} from "@/lib/types";

interface ProblemFileListProps {
  problems: SolvedProblem[];
  onStatusChange: (titleSlug: string, status: MemoryStatus) => Promise<void>;
  onOpenWorkspace?: (problem: SolvedProblem) => void;
  onTogglePin?: (titleSlug: string, pinned: boolean) => Promise<void>;
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; textClass: string; badgeClass: string; iconClass: string }
> = {
  Easy: {
    label: "Easy",
    textClass: "text-emerald-400",
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    iconClass: "text-emerald-400",
  },
  Medium: {
    label: "Medium",
    textClass: "text-amber-400",
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    iconClass: "text-amber-400",
  },
  Hard: {
    label: "Hard",
    textClass: "text-rose-400",
    badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    iconClass: "text-rose-400",
  },
};

const STATUS_ICONS: Record<MemoryStatus, React.ReactNode> = {
  Mastered: <CheckCircle2 className="size-3 text-emerald-400" />,
  "Needs Review": <RotateCw className="size-3 text-amber-400" />,
  Confused: <CircleAlert className="size-3 text-rose-400" />,
};

export function ProblemFileList({
  problems,
  onStatusChange,
  onOpenWorkspace,
  onTogglePin,
}: ProblemFileListProps) {
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);

  const handleStatusSelect = async (
    e: React.MouseEvent,
    problem: SolvedProblem,
    nextStatus: MemoryStatus
  ) => {
    e.stopPropagation();
    setStatusMenuOpen(null);
    if (problem.memoryStatus === nextStatus || updatingSlug) return;
    setUpdatingSlug(problem.titleSlug);
    try {
      await onStatusChange(problem.titleSlug, nextStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingSlug(null);
    }
  };

  const getStatusBadgeStyle = (status: MemoryStatus) => {
    if (status === "Mastered") {
      return "border-[var(--status-mastered-border)] bg-[var(--status-mastered-bg)] text-[var(--status-mastered-fg)]";
    }
    if (status === "Needs Review") {
      return "border-[var(--status-review-border)] bg-[var(--status-review-bg)] text-[var(--status-review-fg)]";
    }
    return "border-[var(--status-confused-border)] bg-[var(--status-confused-bg)] text-[var(--status-confused-fg)]";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {/* File Table Header */}
      <div className="grid grid-cols-12 items-center border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="col-span-6 sm:col-span-5">
          <span>Problem</span>
        </div>
        <div className="col-span-3 sm:col-span-2">
          <span>Difficulty</span>
        </div>
        <div className="col-span-3 sm:col-span-3">
          <span>Status</span>
        </div>
        <div className="hidden sm:col-span-2 sm:flex justify-end">
          <span>Action</span>
        </div>
      </div>

      {/* File Rows List */}
      <div className="divide-y divide-border">
        {problems.map((problem) => {
          const diffConfig = DIFFICULTY_CONFIG[problem.difficulty];
          const hasCode = !!problem.code;
          const isMenuOpen = statusMenuOpen === problem.titleSlug;

          return (
            <div
              key={problem.titleSlug}
              onClick={() => onOpenWorkspace?.(problem)}
              className="group grid grid-cols-12 items-center gap-2 px-4 py-3 text-xs transition-colors hover:bg-muted/50 cursor-pointer"
            >
              {/* Problem Name & Topics */}
              <div className="col-span-6 sm:col-span-5 flex min-w-0 items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                  {hasCode ? (
                    <FileCode2 className="size-3.5" />
                  ) : (
                    <FileText className="size-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {problem.pinned && <Pin className="size-3 shrink-0 fill-current text-primary" />}
                    <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                      {problem.title}
                    </span>
                    <a
                      href={problem.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded p-0.5 text-muted-foreground opacity-40 transition-opacity hover:opacity-100"
                      title="Open on LeetCode"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  {/* Topics subtitle */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    {problem.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="rounded bg-muted px-1.5 py-0.2">
                        {topic}
                      </span>
                    ))}
                    {problem.topics.length > 3 && (
                      <span>+{problem.topics.length - 3}</span>
                    )}
                    {hasCode && (
                      <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                        {problem.codeLanguage || "code"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className="col-span-3 sm:col-span-2 flex items-center">
                <Badge variant={problem.difficulty.toLowerCase() as "easy" | "medium" | "hard"}>
                  {problem.difficulty}
                </Badge>
              </div>

              {/* Status Single Soft Pill with small dropdown menu */}
              <div
                className="col-span-3 sm:col-span-3 relative flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setStatusMenuOpen(isMenuOpen ? null : problem.titleSlug)}
                  disabled={updatingSlug === problem.titleSlug}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all hover:opacity-85",
                    getStatusBadgeStyle(problem.memoryStatus)
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  <span>{problem.memoryStatus}</span>
                </button>

                {/* Dropdown status menu */}
                {isMenuOpen && (
                  <div className="absolute left-0 top-full z-30 mt-1 w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
                    {MEMORY_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={(e) => void handleStatusSelect(e, problem, status)}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors",
                          problem.memoryStatus === status
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span>{status}</span>
                        {problem.memoryStatus === status && <span className="size-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action: AI View button (visible on row hover or inside workspace) */}
              <div className="hidden sm:col-span-2 sm:flex items-center justify-end gap-1">
                {onTogglePin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onTogglePin(problem.titleSlug, !problem.pinned);
                    }}
                    className="size-7"
                    title={problem.pinned ? "Unpin" : "Pin"}
                  >
                    <Pin className={cn("size-3.5", problem.pinned && "fill-current text-primary")} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenWorkspace?.(problem);
                  }}
                  className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="size-3 text-primary" />
                  <span>AI View</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
