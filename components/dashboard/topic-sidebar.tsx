"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Folder,
  FolderOpen,
  Layers,
  Pencil,
  RotateCw,
  Search,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemoryStatus, SolvedProblem } from "@/lib/types";
import type { TopicCount } from "@/lib/problem-filters";

interface TopicSidebarProps {
  topics: TopicCount[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  selectedStatus: MemoryStatus | "all";
  onSelectStatus: (status: MemoryStatus | "all") => void;
  problems: SolvedProblem[];
  totalCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCoach: () => void;
  onOpenProfile: () => void;
  userName?: string;
  leetcodeUsername?: string;
}

export function TopicSidebar({
  topics,
  selectedTopic,
  onSelectTopic,
  selectedStatus,
  onSelectStatus,
  problems,
  totalCount,
  collapsed,
  onToggleCollapse,
  onOpenCoach,
  onOpenProfile,
  userName,
  leetcodeUsername,
}: TopicSidebarProps) {
  const [topicSearch, setTopicSearch] = useState("");

  // Calculate status counts
  const statusCounts = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let confused = 0;
    for (const p of problems) {
      if (p.memoryStatus === "Mastered") mastered++;
      else if (p.memoryStatus === "Needs Review") review++;
      else if (p.memoryStatus === "Confused") confused++;
    }
    return { mastered, review, confused };
  }, [problems]);

  // Filter topics by topic search input
  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return topics;
    const q = topicSearch.trim().toLowerCase();
    return topics.filter((t) => t.topic.toLowerCase().includes(q));
  }, [topics, topicSearch]);

  if (collapsed) {
    return (
      <aside
        aria-label="Topic navigation sidebar collapsed"
        className="flex w-14 shrink-0 flex-col items-center justify-between rounded-2xl border border-border bg-card py-4 shadow-xs transition-all"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="h-px w-8 bg-border" />

          <button
            type="button"
            onClick={onOpenCoach}
            title="AI Coach Today"
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          >
            <Sparkles className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTopic("all");
              onSelectStatus("all");
            }}
            title={`All Problems (${totalCount})`}
            className={cn(
              "flex size-9 cursor-pointer items-center justify-center rounded-xl transition-colors",
              selectedTopic === "all" && selectedStatus === "all"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Layers className="size-4" />
          </button>

          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onSelectStatus("Mastered")}
              title={`Mastered (${statusCounts.mastered})`}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
                selectedStatus === "Mastered" ? "border border-status-mastered-border bg-status-mastered-bg text-status-mastered-text shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckCircle2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelectStatus("Needs Review")}
              title={`Needs Review (${statusCounts.review})`}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
                selectedStatus === "Needs Review" ? "border border-status-review-border bg-status-review-bg text-status-review-text shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <RotateCw className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelectStatus("Confused")}
              title={`Confused (${statusCounts.confused})`}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
                selectedStatus === "Confused" ? "border border-status-confused-border bg-status-confused-bg text-status-confused-text shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CircleAlert className="size-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          title="Open Profile Settings"
          className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <UserIcon className="size-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Topic navigation sidebar"
      className="flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-xs"
    >
      {/* AI Coach Card at the Top ("Today for you") */}
      <button
        type="button"
        onClick={onOpenCoach}
        className="group mb-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-muted/40 p-3 text-left transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Today for you</p>
            <p className="text-[11px] text-muted-foreground">AI Daily Study Plan</p>
          </div>
        </div>
        <span className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          View ↗
        </span>
      </button>

      {/* Sidebar Header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-foreground">Folders</h3>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3.5" />
        </button>
      </div>

      {/* Primary Category: All Problems */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => {
            onSelectTopic("all");
            onSelectStatus("all");
          }}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
            selectedTopic === "all" && selectedStatus === "all"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-2.5">
            <FolderOpen className="size-4" />
            <span>All Problems</span>
          </div>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
              selectedTopic === "all" && selectedStatus === "all"
                ? "bg-black/10 text-primary-foreground dark:bg-white/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            {totalCount}
          </span>
        </button>
      </div>

      {/* Memory Status Section */}
      <div className="mt-4">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Memory State
        </p>
        <div className="mt-1.5 space-y-1">
          <button
            type="button"
            onClick={() => onSelectStatus(selectedStatus === "Mastered" ? "all" : "Mastered")}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              selectedStatus === "Mastered"
                ? "bg-[var(--status-mastered-bg)] text-[var(--status-mastered-fg)] font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Mastered</span>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {statusCounts.mastered}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatus(selectedStatus === "Needs Review" ? "all" : "Needs Review")}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              selectedStatus === "Needs Review"
                ? "bg-[var(--status-review-bg)] text-[var(--status-review-fg)] font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400" />
              <span>Needs Review</span>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {statusCounts.review}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatus(selectedStatus === "Confused" ? "all" : "Confused")}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              selectedStatus === "Confused"
                ? "bg-[var(--status-confused-bg)] text-[var(--status-confused-fg)] font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-400" />
              <span>Confused</span>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {statusCounts.confused}
            </span>
          </button>
        </div>
      </div>
      {/* Topic Search Input */}
      <div className="mt-4 mb-2">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Topic Folders ({topics.length})
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            placeholder="Filter topics…"
            className="w-full rounded-lg border border-border bg-card py-1.5 pr-2.5 pl-7 text-[11px] text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Topics Scrollable List */}
      <div className="max-h-[360px] flex-1 space-y-0.5 overflow-y-auto pr-1">
        {filteredTopics.map((item) => {
          const isSelected = selectedTopic === item.topic;
          return (
            <button
              key={item.topic}
              type="button"
              onClick={() => onSelectTopic(isSelected ? "all" : item.topic)}
              className={cn(
                "group flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                isSelected
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Folder
                  className={cn(
                    "size-3.5 shrink-0 transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.topic}</span>
              </div>
              <span
                className={cn(
                  "ml-2 rounded px-1.5 py-0.2 text-[10px] tabular-nums",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}

        {filteredTopics.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">No matching topics</p>
        )}
      </div>

      {/* Bottom Profile / Account Pill */}
      <div className="mt-3 border-t border-border pt-2.5">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-muted"
          title="Open Profile & Connect LeetCode"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground ring-1 ring-border">
              {(userName || "U").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{userName || "My Profile"}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {leetcodeUsername ? `@${leetcodeUsername}` : "Connect LeetCode"}
              </p>
            </div>
          </div>
          <Pencil className="size-3 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </aside>
  );
}
