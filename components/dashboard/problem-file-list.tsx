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
}: ProblemFileListProps) {
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const handleStatusClick = async (
    e: React.MouseEvent,
    problem: SolvedProblem,
    nextStatus: MemoryStatus
  ) => {
    e.stopPropagation();
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

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/60 shadow-xl backdrop-blur-xl">
      {/* File Table Header */}
      <div className="grid grid-cols-12 items-center border-b border-white/[0.07] bg-zinc-900/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        <div className="col-span-5 flex items-center gap-2">
          <span>Problem File</span>
        </div>
        <div className="col-span-2 hidden sm:block">
          <span>Difficulty</span>
        </div>
        <div className="col-span-2 hidden md:block">
          <span>Solution Code</span>
        </div>
        <div className="col-span-3 hidden lg:block">
          <span>Memory State</span>
        </div>
        <div className="col-span-7 flex justify-end sm:col-span-5 md:col-span-3 lg:col-span-2">
          <span>Action</span>
        </div>
      </div>

      {/* File Rows List */}
      <div className="divide-y divide-white/[0.04]">
        {problems.map((problem) => {
          const diffConfig = DIFFICULTY_CONFIG[problem.difficulty];
          const hasCode = !!problem.code;
          const hasNotes = !!problem.notes?.trim();

          return (
            <div
              key={problem.titleSlug}
              onClick={() => onOpenWorkspace?.(problem)}
              className="group grid grid-cols-12 items-center gap-2 px-4 py-3 text-xs transition-all hover:bg-zinc-900/70 cursor-pointer"
            >
              {/* File / Problem Name */}
              <div className="col-span-5 flex min-w-0 items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-white/[0.08] group-hover:border-violet-500/40">
                  {hasCode ? (
                    <FileCode2 className={cn("size-3.5", diffConfig.iconClass)} />
                  ) : (
                    <FileText className="size-3.5 text-zinc-500" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-zinc-100 group-hover:text-violet-300 transition-colors">
                      {problem.title}
                    </span>
                    <a
                      href={problem.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded p-0.5 text-zinc-500 opacity-40 transition-opacity hover:text-zinc-200 group-hover:opacity-100"
                      title="Open on LeetCode"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  {/* Subtitle with Topics */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                    {problem.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="rounded bg-zinc-900 px-1.5 py-0.2 text-zinc-400">
                        {topic}
                      </span>
                    ))}
                    {problem.topics.length > 3 && (
                      <span className="text-zinc-600">+{problem.topics.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className="col-span-2 hidden sm:flex items-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                    diffConfig.badgeClass
                  )}
                >
                  {problem.difficulty}
                </span>
              </div>

              {/* Code Status */}
              <div className="col-span-2 hidden md:flex items-center gap-1.5">
                {hasCode ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                    <Code2 className="size-3" />
                    <span>{problem.codeLanguage || "Java"}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-600">No code</span>
                )}
                {hasNotes && (
                  <span className="size-1.5 rounded-full bg-amber-400/80" title="Notes added" />
                )}
              </div>

              {/* Memory Status Selector */}
              <div
                className="col-span-3 hidden lg:flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="inline-flex items-center rounded-lg bg-zinc-900/90 p-0.5 ring-1 ring-white/[0.06]">
                  {MEMORY_STATUSES.map((status) => {
                    const isSelected = problem.memoryStatus === status;
                    let activeCls = "text-zinc-500 hover:text-zinc-300";
                    if (isSelected) {
                      if (status === "Mastered") activeCls = "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40";
                      if (status === "Needs Review") activeCls = "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40";
                      if (status === "Confused") activeCls = "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40";
                    }
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={(e) => void handleStatusClick(e, problem, status)}
                        disabled={updatingSlug === problem.titleSlug}
                        className={cn(
                          "cursor-pointer rounded px-2 py-0.5 text-[10px] font-medium transition-all",
                          activeCls
                        )}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="col-span-7 flex items-center justify-end gap-1.5 sm:col-span-5 md:col-span-3 lg:col-span-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenWorkspace?.(problem);
                  }}
                  className="h-7 cursor-pointer px-2 text-xs text-zinc-400 hover:bg-violet-500/15 hover:text-violet-200"
                  title="Open full workspace & AI Coach"
                >
                  <Sparkles className="size-3 text-violet-400" />
                  <span>AI View</span>
                  <Maximize2 className="size-3 opacity-50" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
