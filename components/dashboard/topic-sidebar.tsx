"use client";

import { useMemo, useState } from "react";
import {
  Brain,
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
        className="flex w-14 shrink-0 flex-col items-center justify-between rounded-2xl border border-white/[0.07] bg-zinc-950/70 py-4 shadow-xl backdrop-blur-xl transition-all"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="h-px w-8 bg-white/[0.08]" />

          <button
            type="button"
            onClick={onOpenCoach}
            title="AI Coach Today"
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40 hover:bg-violet-500/30"
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
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
                selectedStatus === "Mastered" ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40" : "text-zinc-500 hover:text-emerald-400"
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
                selectedStatus === "Needs Review" ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40" : "text-zinc-500 hover:text-amber-400"
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
                selectedStatus === "Confused" ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40" : "text-zinc-500 hover:text-rose-400"
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
          className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <UserIcon className="size-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Topic navigation sidebar"
      className="flex w-72 shrink-0 flex-col rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-4 shadow-xl backdrop-blur-xl"
    >
      {/* Sidebar Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40">
            <Layers className="size-3.5" />
          </span>
          <h3 className="text-xs font-semibold tracking-wide text-zinc-200">Topics & Folders</h3>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* AI Coach Today Button */}
      <button
        type="button"
        onClick={onOpenCoach}
        className="group mb-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-violet-500/15 p-2.5 text-left shadow-sm transition-all hover:border-violet-500/60 hover:shadow-violet-500/10"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-md shadow-violet-600/30">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-zinc-100 group-hover:text-white">AI Coach · Today</p>
            <p className="text-[10px] text-violet-300/80">Daily study recommendations</p>
          </div>
        </div>
        <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
          Open ↗
        </span>
      </button>

      {/* Primary Category: All Problems */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => {
            onSelectTopic("all");
            onSelectStatus("all");
          }}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all",
            selectedTopic === "all" && selectedStatus === "all"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/25 ring-1 ring-violet-400/40"
              : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2.5">
            <FolderOpen className="size-4" />
            <span>All Problems</span>
          </div>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              selectedTopic === "all" && selectedStatus === "all"
                ? "bg-white/20 text-white"
                : "bg-zinc-800 text-zinc-400"
            )}
          >
            {totalCount}
          </span>
        </button>
      </div>

      {/* Memory Status Section */}
      <div className="mt-4">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Memory State
        </p>
        <div className="mt-1.5 space-y-1">
          <button
            type="button"
            onClick={() => onSelectStatus(selectedStatus === "Mastered" ? "all" : "Mastered")}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              selectedStatus === "Mastered"
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
              <span>Mastered</span>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-zinc-500">
              {statusCounts.mastered}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatus(selectedStatus === "Needs Review" ? "all" : "Needs Review")}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              selectedStatus === "Needs Review"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400 ring-2 ring-amber-400/20" />
              <span>Needs Review</span>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-zinc-500">
              {statusCounts.review}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatus(selectedStatus === "Confused" ? "all" : "Confused")}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              selectedStatus === "Confused"
                ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-400 ring-2 ring-rose-400/20" />
              <span>Confused</span>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-zinc-500">
              {statusCounts.confused}
            </span>
          </button>
        </div>
      </div>

      {/* Topic Search Input */}
      <div className="mt-4 mb-2">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Topic Folders ({topics.length})
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            placeholder="Filter topics…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-1.5 pr-2.5 pl-7 text-[11px] text-zinc-200 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
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
                "group flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all",
                isSelected
                  ? "bg-violet-500/15 font-medium text-violet-200 ring-1 ring-violet-500/30"
                  : "text-zinc-400 hover:bg-zinc-900/90 hover:text-zinc-200"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Folder
                  className={cn(
                    "size-3.5 shrink-0 transition-colors",
                    isSelected ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-400"
                  )}
                />
                <span className="truncate">{item.topic}</span>
              </div>
              <span
                className={cn(
                  "ml-2 rounded px-1.5 py-0.2 text-[10px] tabular-nums",
                  isSelected
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-400"
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}

        {filteredTopics.length === 0 && (
          <p className="py-4 text-center text-xs text-zinc-600">No matching topics</p>
        )}
      </div>

      {/* Bottom Profile / Account Pill */}
      <div className="mt-3 border-t border-white/[0.06] pt-2.5">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-zinc-900/80"
          title="Open Profile & Connect LeetCode"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-200 ring-1 ring-white/10">
              {(userName || "U").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-200">{userName || "My Profile"}</p>
              <p className="truncate text-[10px] text-zinc-500">
                {leetcodeUsername ? `@${leetcodeUsername}` : "Connect LeetCode"}
              </p>
            </div>
          </div>
          <Pencil className="size-3 text-zinc-500 hover:text-zinc-300" />
        </button>
      </div>
    </aside>
  );
}
