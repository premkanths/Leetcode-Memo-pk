"use client";

import { useMemo, useState } from "react";
import {
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Flame,
  Folder,
  Image as ImageIcon,
  Layers,
  LogOut,
  Moon,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Sparkles,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { HubScope } from "@/lib/hub-insights";
import type { MemoryStatus, SolvedProblem, TopicStat } from "@/lib/types";
import type { TopicCount } from "@/lib/problem-filters";

interface TopicSidebarProps {
  topics: TopicCount[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  selectedStatus: MemoryStatus | "all";
  onSelectStatus: (status: MemoryStatus | "all") => void;
  hubScope: HubScope;
  onSelectScope: (scope: HubScope) => void;
  problems: SolvedProblem[];
  totalCount: number;
  dueCount: number;
  pinnedCount: number;
  streak: number;
  weakTopics: TopicStat[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenCoach: () => void;
  onOpenProfile: () => void;
  onAddProblem: () => void;
  onExportNotes: () => void;
  onSync?: () => void;
  syncing?: boolean;
  onSignOut?: () => void;
  pinnedProblems?: SolvedProblem[];
  onOpenWorkspace?: (problem: SolvedProblem) => void;
  userName?: string;
  leetcodeUsername?: string;
}

export function TopicSidebar({
  topics,
  selectedTopic,
  onSelectTopic,
  selectedStatus,
  onSelectStatus,
  hubScope,
  onSelectScope,
  problems,
  totalCount,
  dueCount,
  pinnedCount,
  streak,
  weakTopics,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onOpenCoach,
  onOpenProfile,
  onAddProblem,
  onExportNotes,
  onSync,
  syncing,
  onSignOut,
  pinnedProblems,
  onOpenWorkspace,
  userName,
  leetcodeUsername,
}: TopicSidebarProps) {
  const { theme, toggleTheme, cycleBackground, currentBackgroundOption } = useTheme();
  const [topicSearch, setTopicSearch] = useState("");

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

  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return topics;
    const q = topicSearch.trim().toLowerCase();
    return topics.filter((t) => t.topic.toLowerCase().includes(q));
  }, [topics, topicSearch]);

  const goAll = () => {
    onSelectScope("all");
    onSelectTopic("all");
    onSelectStatus("all");
    onCloseMobile();
  };

  const shell = (children: React.ReactNode, extraClass: string) => (
    <aside aria-label="Dashboard panel" className={cn("flex shrink-0 flex-col border-r border-border bg-card/90 backdrop-blur-xl", extraClass)}>
      {children}
    </aside>
  );

  const collapsedRail = (
    <>
      <div className="flex flex-col items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BookMarked className="size-4" />
        </span>
        <button type="button" onClick={onToggleCollapse} title="Expand sidebar" className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <ChevronRight className="size-4" />
        </button>
        <div className="h-px w-7 bg-border" />
        <RailButton active={hubScope === "all"} title="All problems" onClick={goAll} icon={<Layers className="size-4" />} />
        <RailButton active={hubScope === "due"} title={`Due for review (${dueCount})`} onClick={() => { onSelectScope("due"); onCloseMobile(); }} icon={<RotateCw className="size-4" />} />
        <RailButton active={hubScope === "pinned"} title={`Pinned (${pinnedCount})`} onClick={() => { onSelectScope("pinned"); onCloseMobile(); }} icon={<Pin className="size-4" />} />
        <RailButton title="AI Coach" onClick={() => { onOpenCoach(); onCloseMobile(); }} icon={<Sparkles className="size-4" />} accent />
        <RailButton title="Add problem" onClick={() => { onAddProblem(); onCloseMobile(); }} icon={<Plus className="size-4" />} />
        <RailButton
          title={syncing ? "Syncing LeetCode…" : "Sync LeetCode"}
          onClick={() => { onSync?.(); }}
          icon={<RefreshCw className={cn("size-4", syncing && "animate-spin text-primary")} />}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => { onOpenProfile(); onCloseMobile(); }}
          title={userName || "Open profile"}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <UserIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={cycleBackground}
          title={`Wallpaper: ${currentBackgroundOption.name} (Click to switch)`}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ImageIcon className="size-4 text-primary" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-zinc-600" />}
        </button>
        {onSignOut && (
          <button
            type="button"
            onClick={() => { onSignOut(); onCloseMobile(); }}
            title="Sign out"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
          >
            <LogOut className="size-4" />
          </button>
        )}
      </div>
    </>
  );

  const expanded = (
    <>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BookMarked className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Memory Hub</p>
            <p className="truncate text-[11px] text-muted-foreground">Revision desk</p>
          </div>
        </div>
        <button type="button" onClick={onToggleCollapse} title="Collapse sidebar" className="hidden size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:flex">
          <ChevronLeft className="size-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          onOpenCoach();
          onCloseMobile();
        }}
        className="group mt-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-primary/25 bg-primary/10 p-3 text-left transition-colors hover:bg-primary/15"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Today for you</p>
            <p className="text-[11px] text-muted-foreground">AI daily study plan</p>
          </div>
        </div>
        <span className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Open</span>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Flame className="size-3 text-primary" /> Streak
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{streak}</p>
          <p className="text-[10px] text-muted-foreground">day{streak === 1 ? "" : "s"}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelectScope("due");
            onCloseMobile();
          }}
          className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-left transition-colors hover:border-primary/40"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Due</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{dueCount}</p>
          <p className="text-[10px] text-muted-foreground">to revisit</p>
        </button>
      </div>

      {weakTopics.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Weak topics</p>
          <div className="mt-2 space-y-1.5">
            {weakTopics.map((topic) => (
              <button
                key={topic.topic}
                type="button"
                onClick={() => {
                  onSelectScope("all");
                  onSelectTopic(topic.topic);
                  onCloseMobile();
                }}
                className="flex w-full items-center justify-between rounded-lg px-1.5 py-1 text-left text-xs hover:bg-muted"
              >
                <span className="truncate text-foreground">{topic.topic}</span>
                <span className="tabular-nums text-muted-foreground">{topic.confused + topic.needsReview}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="mt-4 space-y-1">
        <NavRow
          active={hubScope === "all" && selectedTopic === "all" && selectedStatus === "all"}
          icon={<Layers className="size-4" />}
          label="All problems"
          count={totalCount}
          onClick={goAll}
        />
        <NavRow
          active={hubScope === "due"}
          icon={<RotateCw className="size-4" />}
          label="Due for review"
          count={dueCount}
          onClick={() => {
            onSelectScope("due");
            onCloseMobile();
          }}
        />
        <NavRow
          active={hubScope === "pinned"}
          icon={<Pin className="size-4" />}
          label="Pinned"
          count={pinnedCount}
          onClick={() => {
            onSelectScope("pinned");
            onCloseMobile();
          }}
        />
        <NavRow
          icon={<Plus className="size-4" />}
          label="Add problem"
          onClick={() => {
            onAddProblem();
            onCloseMobile();
          }}
        />
        <NavRow
          icon={<RefreshCw className={cn("size-4", syncing && "animate-spin text-primary")} />}
          label={syncing ? "Syncing LeetCode…" : "Sync LeetCode"}
          onClick={() => {
            onSync?.();
          }}
        />
      </nav>

      {pinnedProblems && pinnedProblems.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pinned shortcuts
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectScope("pinned");
                onCloseMobile();
              }}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              Filter ({pinnedProblems.length})
            </button>
          </div>
          <div className="space-y-0.5">
            {pinnedProblems.slice(0, 5).map((problem) => (
              <button
                key={problem.titleSlug}
                type="button"
                onClick={() => {
                  onOpenWorkspace?.(problem);
                  onCloseMobile();
                }}
                className="group flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                title={`Open workspace: ${problem.title}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Pin className="size-3 shrink-0 fill-current text-primary" />
                  <span className="truncate text-foreground transition-colors group-hover:text-primary">
                    {problem.title}
                  </span>
                </div>
                <span
                  className={cn(
                    "ml-1.5 shrink-0 rounded px-1.5 py-0.2 text-[10px] font-medium",
                    problem.difficulty === "Easy"
                      ? "text-emerald-500"
                      : problem.difficulty === "Medium"
                        ? "text-amber-500"
                        : "text-rose-500",
                  )}
                >
                  {problem.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Memory state</p>
        <div className="mt-1.5 space-y-1">
          <StatusRow
            label="Mastered"
            count={statusCounts.mastered}
            active={selectedStatus === "Mastered"}
            dot="bg-emerald-500"
            activeClass="bg-[var(--status-mastered-bg)] text-[var(--status-mastered-fg)]"
            onClick={() => {
              onSelectScope("all");
              onSelectStatus(selectedStatus === "Mastered" ? "all" : "Mastered");
              onCloseMobile();
            }}
          />
          <StatusRow
            label="Needs Review"
            count={statusCounts.review}
            active={selectedStatus === "Needs Review"}
            dot="bg-amber-400"
            activeClass="bg-[var(--status-review-bg)] text-[var(--status-review-fg)]"
            onClick={() => {
              onSelectScope("all");
              onSelectStatus(selectedStatus === "Needs Review" ? "all" : "Needs Review");
              onCloseMobile();
            }}
          />
          <StatusRow
            label="Confused"
            count={statusCounts.confused}
            active={selectedStatus === "Confused"}
            dot="bg-rose-400"
            activeClass="bg-[var(--status-confused-bg)] text-[var(--status-confused-fg)]"
            onClick={() => {
              onSelectScope("all");
              onSelectStatus(selectedStatus === "Confused" ? "all" : "Confused");
              onCloseMobile();
            }}
          />
        </div>
      </div>

      <div className="mt-4 mb-2">
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Topic folders ({topics.length})
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            placeholder="Filter topics…"
            className="w-full rounded-lg border border-border bg-background/70 py-1.5 pr-2.5 pl-7 text-[11px] text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {filteredTopics.map((item) => {
          const isSelected = hubScope === "all" && selectedTopic === item.topic;
          return (
            <button
              key={item.topic}
              type="button"
              onClick={() => {
                onSelectScope("all");
                onSelectTopic(isSelected ? "all" : item.topic);
                onCloseMobile();
              }}
              className={cn(
                "group flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                isSelected ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Folder className={cn("size-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{item.topic}</span>
              </div>
              <span className="ml-2 rounded px-1.5 text-[10px] tabular-nums">{item.count}</span>
            </button>
          );
        })}
        {filteredTopics.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No matching topics</p>}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border pt-2.5">
        <button
          type="button"
          onClick={onExportNotes}
          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Download className="size-3.5" />
          <span>Export notes</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenProfile();
            onCloseMobile();
          }}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-muted"
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
          <Pencil className="size-3 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="size-3.5 text-amber-400" /> : <Moon className="size-3.5 text-zinc-600" />}
            <span className="capitalize">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button
            type="button"
            onClick={cycleBackground}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={`Wallpaper: ${currentBackgroundOption.name} (Click to switch)`}
          >
            <ImageIcon className="size-3.5 text-primary" />
            <span className="truncate">{currentBackgroundOption.tagline}</span>
          </button>
          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onCloseMobile();
              }}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-500"
              title="Sign out of account"
            >
              <LogOut className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close dashboard panel"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {(() => {
        const useRail = collapsed && !mobileOpen;
        return (
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-72 lg:sticky lg:top-0 lg:z-20 lg:h-dvh",
              useRail ? "lg:w-[4.25rem]" : "lg:w-72",
              mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
              "transition-transform duration-200",
            )}
          >
            {shell(
              useRail ? collapsedRail : expanded,
              cn("h-dvh", useRail ? "w-[4.25rem] items-center justify-between py-4" : "w-72 p-4"),
            )}
          </div>
        );
      })()}
    </>
  );
}

function RailButton({
  active,
  title,
  onClick,
  icon,
  accent,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded-xl transition-colors",
        accent && "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
        !accent && active && "bg-primary text-primary-foreground",
        !accent && !active && "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
    </button>
  );
}

function NavRow({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
      )}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      {typeof count === "number" && (
        <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] tabular-nums", active ? "bg-black/10 dark:bg-white/20" : "bg-muted text-muted-foreground")}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatusRow({
  label,
  count,
  active,
  dot,
  activeClass,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  dot: string;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
        active ? `${activeClass} font-medium` : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", dot)} />
        {label}
      </span>
      <span className="text-[11px] font-medium tabular-nums">{count}</span>
    </button>
  );
}
