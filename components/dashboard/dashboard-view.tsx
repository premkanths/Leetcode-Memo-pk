"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { AlertTriangle, CircleCheck, CircleAlert, X } from "lucide-react";
import { useAuth, getGithubHandle } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api-client";
import { addProblemByInput, syncLeetCodeProgress, type SyncOutcome } from "@/lib/hub-actions";
import { saveNotes, saveProblemCode, setLeetCodeUsername, setMemoryStatus, updateUserProfile } from "@/lib/hub-service";
import { collectTopics, DEFAULT_FILTERS, filterProblems, type ProblemFilters, type ViewMode } from "@/lib/problem-filters";
import { getLocalDateKey } from "@/lib/recommendations";
import { cn, formatRelativeTime, getErrorMessage } from "@/lib/utils";
import type { LeetCodeProblem, MemoryStatus } from "@/lib/types";
import { useSolvedProblems, useUserProfile } from "@/hooks/use-hub-data";
import { useDailyCoach } from "@/hooks/use-daily-coach";
import { AddProblemDialog } from "./add-problem-dialog";
import { DashboardHeader } from "./header";
import { FilterBar } from "./filter-bar";
import { ProblemGrid } from "./problem-grid";
import { StatsOverview } from "./stats-overview";
import { SyncCodeDialog } from "./sync-code-dialog";
import { ProblemWorkspaceDialog } from "./problem-workspace-dialog";
import { TopicSidebar } from "./topic-sidebar";
import { DailyCoachDialog } from "./daily-coach-dialog";
import { ProfileDialog } from "./profile-dialog";
import { DeveloperInfoCard } from "./developer-info-card";

const AUTO_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const NOTICE_TIMEOUT_MS = 6_000;

interface Notice {
  tone: "success" | "error";
  text: string;
  action?: { label: string; onClick: () => void };
}

function describeSync(result: SyncOutcome): string {
  if (result.added > 0) {
    return `Synced @${result.username}: ${result.added} new problem${result.added === 1 ? "" : "s"} added. ${result.totalSolved.toLocaleString()} solved on LeetCode.`;
  }
  return `Up to date with @${result.username}. ${result.totalSolved.toLocaleString()} solved on LeetCode.`;
}

function NoticeBanner({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const isError = notice.tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        isError
          ? "border-status-confused-border bg-status-confused-bg text-status-confused-text"
          : "border-status-mastered-border bg-status-mastered-bg text-status-mastered-text",
      )}
    >
      {isError ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <CircleCheck className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1 leading-relaxed">{notice.text}</p>
      {notice.action && (
        <Button variant="link" size="sm" className="h-auto p-0 text-inherit underline underline-offset-4" onClick={notice.action.onClick}>
          {notice.action.label}
        </Button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function DashboardView({ user }: { user: User }) {
  const { signOut } = useAuth();
  const uid = user.uid;

  const profileState = useUserProfile(uid);
  const problemsState = useSolvedProblems(uid);
  const profile = profileState.data;
  const problems = problemsState.data;
  const problemsReady = !problemsState.loading;

  const [filters, setFilters] = useState<ProblemFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>("files");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [syncCodeOpen, setSyncCodeOpen] = useState(false);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [dateKey] = useState(() => getLocalDateKey());

  const workspaceProblem = useMemo(
    () => (workspaceSlug ? problems.find((p) => p.titleSlug === workspaceSlug) ?? null : null),
    [workspaceSlug, problems],
  );

  const leetcodeUsername = profile?.leetcodeUsername || profile?.githubUsername || getGithubHandle(user) || "";
  const needsUsername = profile !== null && !profile.leetcodeUsername;

  const coach = useDailyCoach(user, problems, problemsReady, dateKey);

  const topics = useMemo(() => collectTopics(problems), [problems]);
  const visibleProblems = useMemo(() => filterProblems(problems, filters), [problems, filters]);

  // Auto-dismiss success notices so the banner never gets stuck on screen.
  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const runSync = useCallback(
    async (username: string) => {
      setSyncing(true);
      setNotice(null);
      try {
        const result = await syncLeetCodeProgress(user, username);
        setNotice({ tone: "success", text: describeSync(result) });
      } catch (error) {
        const errorMsg = getErrorMessage(error, "Sync failed. Please try again.");
        const notFound =
          (error instanceof ApiRequestError && error.status === 404) ||
          errorMsg.toLowerCase().includes("does not exist") ||
          errorMsg.toLowerCase().includes("not found");
        setNotice({
          tone: "error",
          text: errorMsg,
          action: notFound ? { label: "Change username", onClick: () => setProfileOpen(true) } : undefined,
        });
      } finally {
        setSyncing(false);
      }
    },
    [user],
  );

  // First visit (or stale data, older than a day): sync automatically, once per mount.
  const autoSyncDone = useRef(false);
  useEffect(() => {
    if (autoSyncDone.current || !profile?.leetcodeUsername) return;
    autoSyncDone.current = true;
    const stale = !profile.lastSyncedAt || Date.now() - profile.lastSyncedAt.getTime() > AUTO_SYNC_INTERVAL_MS;
    if (!stale) return;
    // Deferred to a timer so the sync's loading state is not set synchronously inside the effect.
    // No cleanup: a re-render must not cancel the one-shot sync.
    window.setTimeout(() => void runSync(profile.leetcodeUsername), 0);
  }, [profile, runSync]);

  const handleSaveProfile = useCallback(
    async (data: { displayName: string; leetcodeUsername: string; preferredLanguage: string }) => {
      await updateUserProfile(uid, data);
      if (data.leetcodeUsername && data.leetcodeUsername !== profile?.leetcodeUsername) {
        await runSync(data.leetcodeUsername);
      }
    },
    [uid, profile?.leetcodeUsername, runSync],
  );

  const handleAddProblem = useCallback((input: string): Promise<LeetCodeProblem> => addProblemByInput(user, input), [user]);

  const handleProblemAdded = useCallback((problem: LeetCodeProblem) => {
    setNotice({ tone: "success", text: `Added "${problem.title}" to your hub.` });
  }, []);

  const handleStatusChange = useCallback(
    (titleSlug: string, status: MemoryStatus) => setMemoryStatus(uid, titleSlug, status),
    [uid],
  );

  const handleSaveNotes = useCallback(
    (titleSlug: string, text: string) => saveNotes(uid, titleSlug, text),
    [uid],
  );

  const handleSaveCode = useCallback(
    (titleSlug: string, code: string, lang?: string) => saveProblemCode(uid, titleSlug, code, lang),
    [uid],
  );

  const liveError = profileState.error ?? problemsState.error;
  const lastSyncedLabel = profile?.lastSyncedAt
    ? `Synced ${formatRelativeTime(profile.lastSyncedAt)}`
    : "Not synced yet";

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardHeader
        user={user}
        displayName={profile?.displayName}
        leetcodeUsername={leetcodeUsername}
        lastSyncedLabel={lastSyncedLabel}
        syncing={syncing}
        onSync={() => void runSync(leetcodeUsername)}
        onAddProblem={() => setAddOpen(true)}
        onOpenSyncCode={() => setSyncCodeOpen(true)}
        onEditUsername={() => setProfileOpen(true)}
        onSignOut={() => void signOut()}
      />

      <main className="mx-auto max-w-[1720px] px-3 py-6 sm:px-6 lg:px-8">
        {notice && <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />}

        {liveError && (
          <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-status-review-border bg-status-review-bg px-4 py-3 text-sm text-status-review-text">
            <AlertTriangle className="size-4 shrink-0" />
            <p>Live data is unavailable: {liveError}</p>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left Sidebar: Topic / Folders Navigation & AI Coach Trigger */}
          <TopicSidebar
            topics={topics}
            selectedTopic={filters.topic}
            onSelectTopic={(topic) => setFilters((prev) => ({ ...prev, topic }))}
            selectedStatus={filters.status}
            onSelectStatus={(status) => setFilters((prev) => ({ ...prev, status }))}
            problems={problems}
            totalCount={problems.length}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onOpenCoach={() => setCoachOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            userName={profile?.displayName || user.displayName || user.email || ""}
            leetcodeUsername={leetcodeUsername}
          />

          {/* Central Problem Hub Content (Spacious & Clean) */}
          <div className="min-w-0 flex-1 space-y-6">
            <StatsOverview profile={profile} problems={problems} loading={problemsState.loading} />

            <section aria-label="Solved problems" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {filters.topic === "all" ? "All Problems" : `Folder: ${filters.topic}`}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Showing {visibleProblems.length} problem{visibleProblems.length === 1 ? "" : "s"}
                    {filters.status !== "all" && ` · Filtered by ${filters.status}`}
                  </p>
                </div>
              </div>

              <FilterBar
                filters={filters}
                onChange={setFilters}
                topics={topics}
                view={view}
                onViewChange={setView}
                resultCount={visibleProblems.length}
                totalCount={problems.length}
              />

              <ProblemGrid
                problems={visibleProblems}
                view={view}
                totalCount={problems.length}
                loading={problemsState.loading}
                onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                onStatusChange={handleStatusChange}
                onSaveNotes={handleSaveNotes}
                onSaveCode={handleSaveCode}
                onOpenWorkspace={(p) => setWorkspaceSlug(p.titleSlug)}
              />
            </section>

            {/* Bottom Developer / Learner Info Card */}
            <div className="pt-2">
              <DeveloperInfoCard
                user={user}
                profile={profile}
                problems={problems}
                leetcodeUsername={leetcodeUsername}
                onOpenProfile={() => setProfileOpen(true)}
                onOpenSyncCode={() => setSyncCodeOpen(true)}
              />
            </div>
          </div>
        </div>
      </main>

      <ProblemWorkspaceDialog
        open={workspaceProblem !== null}
        onOpenChange={(open) => {
          if (!open) setWorkspaceSlug(null);
        }}
        problem={workspaceProblem}
        onStatusChange={handleStatusChange}
        onSaveNotes={handleSaveNotes}
        onSaveCode={handleSaveCode}
      />

      <AddProblemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAddProblem}
        onAdded={handleProblemAdded}
      />

      <DailyCoachDialog
        open={coachOpen}
        onOpenChange={setCoachOpen}
        recommendations={coach.recommendations}
        loading={coach.loading}
        generating={coach.generating}
        error={coach.error}
        hasProblems={problems.length > 0}
        onRegenerate={() => void coach.regenerate()}
      />

      <ProfileDialog
        open={profileOpen || needsUsername}
        onOpenChange={setProfileOpen}
        profile={profile}
        defaultName={user.displayName || user.email || ""}
        defaultLeetcode={leetcodeUsername}
        onSave={handleSaveProfile}
        onSyncLeetcode={runSync}
      />

      <SyncCodeDialog
        open={syncCodeOpen}
        onOpenChange={setSyncCodeOpen}
        userId={uid}
        leetcodeUsername={leetcodeUsername}
      />
    </div>
  );
}
