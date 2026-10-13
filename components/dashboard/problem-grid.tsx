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
  onTogglePin?: (titleSlug: string, pinned: boolean) => Promise<void>;
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-2xl border border-border bg-card shadow-xs" />
      ))}
    </div>
  );
}

function EmptyState({ hasAnyProblems, onClearFilters }: { hasAnyProblems: boolean; onClearFilters: () => void }) {
  if (!hasAnyProblems) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center shadow-xs">
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="size-6" />
        </span>
        <h3 className="text-lg font-semibold text-foreground">Your notebook is empty</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Hit <span className="text-foreground font-semibold">Sync LeetCode</span> to import your recent accepted submissions, or add
          a problem by URL.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center shadow-xs">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground border border-border">
        <Search className="size-6" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">No problems match</h3>
      <p className="mt-1 text-sm text-muted-foreground">Try a different search term or clear your filters.</p>
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
  onTogglePin,
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
        onTogglePin={onTogglePin}
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
            onTogglePin={onTogglePin}
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
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Folder className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{folder.topic}</span>
                  <span className="block text-xs text-muted-foreground">
                    {folder.problems.length} problem{folder.problems.length === 1 ? "" : "s"}
                  </span>
                </span>
                <ChevronDown
                  className={cn("size-4 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")}
                />
              </button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">{masteredPercent}% mastered</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-status-mastered-text" style={{ width: `${masteredPercent}%` }} />
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
                    onTogglePin={onTogglePin}
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
