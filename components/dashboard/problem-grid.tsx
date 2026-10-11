"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Folder, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { groupByTopic, type ViewMode } from "@/lib/problem-filters";
import type { MemoryStatus, SolvedProblem } from "@/lib/types";
import { ProblemCard } from "./problem-card";
import { ProblemFileList } from "./problem-file-list";

interface ProblemGridProps {
  problems: SolvedProblem[];
  view: ViewMode;
  totalCount: number;
  loading: boolean;
  onClearFilters: () => void;
  onStatusChange: (titleSlug: string, status: MemoryStatus) => Promise<void>;
  onSaveNotes: (titleSlug: string, notes: string) => Promise<void>;
  onSaveCode?: (titleSlug: string, code: string, lang?: string) => Promise<void>;
  onOpenWorkspace?: (problem: SolvedProblem) => void;
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-2xl border border-white/[0.06] bg-zinc-900/60" />
      ))}
    </div>
  );
}

function EmptyState({ hasAnyProblems, onClearFilters }: { hasAnyProblems: boolean; onClearFilters: () => void }) {
  if (!hasAnyProblems) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-violet-500/10">
          <Sparkles className="size-6 text-violet-300" />
        </span>
        <h3 className="text-lg font-semibold text-zinc-100">Your hub is empty</h3>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Hit <span className="text-zinc-300">Sync LeetCode</span> to import your recent accepted submissions, or add
          a problem by URL.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-zinc-800/60">
        <Search className="size-6 text-zinc-400" />
      </span>
      <h3 className="text-lg font-semibold text-zinc-100">No problems match</h3>
      <p className="mt-1 text-sm text-zinc-500">Try a different search term or clear your filters.</p>
      <Button variant="outline" size="sm" className="mt-5" onClick={onClearFilters}>
        Clear filters
      </Button>
    </div>
  );
}

export function ProblemGrid({
  problems,
  view,
  totalCount,
  loading,
  onClearFilters,
  onStatusChange,
  onSaveNotes,
  onSaveCode,
  onOpenWorkspace,
}: ProblemGridProps) {
  const folders = useMemo(() => (view === "folders" ? groupByTopic(problems) : []), [problems, view]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (loading) return <GridSkeleton />;
  if (problems.length === 0) {
    return <EmptyState hasAnyProblems={totalCount > 0} onClearFilters={onClearFilters} />;
  }

  if (view === "files" || view === "list") {
    return (
      <ProblemFileList
        problems={problems}
        onStatusChange={onStatusChange}
        onOpenWorkspace={onOpenWorkspace}
      />
    );
  }

  if (view === "cards") {
    return (
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {problems.map((problem) => (
          <ProblemCard
            key={problem.titleSlug}
            problem={problem}
            onStatusChange={onStatusChange}
            onSaveNotes={onSaveNotes}
            onSaveCode={onSaveCode}
            onOpenWorkspace={onOpenWorkspace}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {folders.map((folder) => {
        const isCollapsed = collapsed[folder.topic] ?? false;
        const masteredPercent = Math.round((folder.mastered / folder.problems.length) * 100);
        return (
          <section key={folder.topic} aria-label={`${folder.topic} folder`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [folder.topic]: !isCollapsed }))}
                aria-expanded={!isCollapsed}
                className="group flex cursor-pointer items-center gap-2.5 text-left"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">
                  <Folder className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-100 group-hover:text-white">{folder.topic}</span>
                  <span className="block text-xs text-zinc-500">
                    {folder.problems.length} problem{folder.problems.length === 1 ? "" : "s"}
                  </span>
                </span>
                <ChevronDown
                  className={cn("size-4 text-zinc-500 transition-transform", isCollapsed && "-rotate-90")}
                />
              </button>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="hidden sm:inline">{masteredPercent}% mastered</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${masteredPercent}%` }} />
                </div>
              </div>
            </div>

            {!isCollapsed && (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {folder.problems.map((problem) => (
                  <ProblemCard
                    key={`${folder.topic}-${problem.titleSlug}`}
                    problem={problem}
                    onStatusChange={onStatusChange}
                    onSaveNotes={onSaveNotes}
                    onSaveCode={onSaveCode}
                    onOpenWorkspace={onOpenWorkspace}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
