"use client";

import { FileText, FolderTree, LayoutGrid, LayoutList, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  hasActiveFilters,
  SORT_OPTIONS,
  DEFAULT_FILTERS,
  type ProblemFilters,
  type TopicCount,
  type ViewMode,
} from "@/lib/problem-filters";
import { DIFFICULTIES, MEMORY_STATUSES } from "@/lib/types";

interface FilterBarProps {
  filters: ProblemFilters;
  onChange: (next: ProblemFilters) => void;
  topics: TopicCount[];
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  resultCount: number;
  totalCount: number;
}

export function FilterBar({
  filters,
  onChange,
  topics,
  view,
  onViewChange,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const update = (patch: Partial<ProblemFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Search by title, topic, slug or notes…"
            className="pl-9"
            aria-label="Search problems"
          />
        </div>

        <div className="flex rounded-lg border border-zinc-800 bg-zinc-950/70 p-1" role="group" aria-label="View mode">
          <ViewButton active={view === "files" || view === "list"} onClick={() => onViewChange("files")} label="Files one by one">
            <FileText className="size-4" /> <span className="hidden sm:inline">Files</span>
          </ViewButton>
          <ViewButton active={view === "cards"} onClick={() => onViewChange("cards")} label="Box cards">
            <LayoutGrid className="size-4" /> <span className="hidden sm:inline">Boxes</span>
          </ViewButton>
          <ViewButton active={view === "folders"} onClick={() => onViewChange("folders")} label="Topic folders">
            <FolderTree className="size-4" /> <span className="hidden sm:inline">Folders</span>
          </ViewButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Select
          aria-label="Filter by topic"
          value={filters.topic}
          onChange={(event) => update({ topic: event.target.value })}
        >
          <option value="all">All topics ({topics.length})</option>
          {topics.map((topic) => (
            <option key={topic.topic} value={topic.topic}>
              {topic.topic} ({topic.count})
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by difficulty"
          value={filters.difficulty}
          onChange={(event) => update({ difficulty: event.target.value as ProblemFilters["difficulty"] })}
        >
          <option value="all">All difficulties</option>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by memory status"
          value={filters.status}
          onChange={(event) => update({ status: event.target.value as ProblemFilters["status"] })}
        >
          <option value="all">All memory states</option>
          {MEMORY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Sort problems"
          value={filters.sort}
          onChange={(event) => update({ sort: event.target.value as ProblemFilters["sort"] })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
        <p aria-live="polite">
          Showing <span className="font-medium text-zinc-300">{resultCount}</span> of {totalCount} problems
        </p>
        {hasActiveFilters(filters) && (
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
            <RotateCcw /> Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-200",
      )}
    >
      {children}
    </button>
  );
}
