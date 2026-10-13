"use client";

import { useState } from "react";
import { FileText, Filter, FolderTree, LayoutGrid, RotateCcw, Search } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);
  const update = (patch: Partial<ProblemFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Search problems, topics or trick notes…"
            className="pl-9 h-9.5 text-xs rounded-xl border-border bg-card"
            aria-label="Search problems"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filters Toggle Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9.5 rounded-xl border-border text-xs gap-1.5",
              showFilters && "bg-muted font-medium text-foreground"
            )}
          >
            <Filter className="size-3.5" />
            <span>Filters</span>
            {hasActiveFilters(filters) && (
              <span className="size-1.5 rounded-full bg-primary" />
            )}
          </Button>

          {/* View Modes */}
          <div className="flex rounded-xl border border-border bg-muted/40 p-0.5" role="group" aria-label="View mode">
            <ViewButton active={view === "files" || view === "list"} onClick={() => onViewChange("files")} label="Files view">
              <FileText className="size-3.5" /> <span className="hidden sm:inline">Files</span>
            </ViewButton>
            <ViewButton active={view === "cards"} onClick={() => onViewChange("cards")} label="Cards view">
              <LayoutGrid className="size-3.5" /> <span className="hidden sm:inline">Cards</span>
            </ViewButton>
            <ViewButton active={view === "folders"} onClick={() => onViewChange("folders")} label="Folders view">
              <FolderTree className="size-3.5" /> <span className="hidden sm:inline">Folders</span>
            </ViewButton>
          </div>
        </div>
      </div>

      {/* Collapsible Dropdown Filters */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Select
              aria-label="Filter by topic"
              value={filters.topic}
              onChange={(event) => update({ topic: event.target.value })}
              className="text-xs h-8.5 rounded-lg border-border bg-background"
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
              className="text-xs h-8.5 rounded-lg border-border bg-background"
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
              className="text-xs h-8.5 rounded-lg border-border bg-background"
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
              className="text-xs h-8.5 rounded-lg border-border bg-background"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p aria-live="polite">
          Showing <span className="font-medium text-foreground">{resultCount}</span> of {totalCount} problems
        </p>
        {hasActiveFilters(filters) && (
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)} className="h-7 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="size-3" /> Reset filters
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
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
