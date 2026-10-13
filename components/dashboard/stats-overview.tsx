import { Brain, CalendarClock, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SolvedProblem, UserProfile } from "@/lib/types";

interface StatsOverviewProps {
  profile: UserProfile | null;
  problems: SolvedProblem[];
  loading: boolean;
  streak: number;
  dueCount: number;
}

function pickCount(fromProfile: number | undefined, fallback: number): number {
  return fromProfile && fromProfile > 0 ? fromProfile : fallback;
}

function percentage(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function StatsOverview({ profile, problems, loading, streak, dueCount }: StatsOverviewProps) {
  const total = pickCount(profile?.totalSolved, problems.length);
  const easy = pickCount(profile?.easySolved, problems.filter((p) => p.difficulty === "Easy").length);
  const medium = pickCount(profile?.mediumSolved, problems.filter((p) => p.difficulty === "Medium").length);
  const hard = pickCount(profile?.hardSolved, problems.filter((p) => p.difficulty === "Hard").length);

  const tracked = problems.length;
  const mastered = problems.filter((p) => p.memoryStatus === "Mastered").length;
  const needsReview = problems.filter((p) => p.memoryStatus === "Needs Review").length;
  const confused = problems.filter((p) => p.memoryStatus === "Confused").length;

  const encouragementText =
    needsReview > 0
      ? `${needsReview} problems waiting for a gentle review`
      : tracked > 0
        ? "All tracked problems look healthy!"
        : "Sync your LeetCode profile or add a problem to get started";

  return (
    <section aria-label="Progress overview" className="space-y-4">
      {/* One Quiet Summary Row (Total, Easy, Medium, Hard) */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 divide-y divide-border sm:grid-cols-4 sm:divide-y-0 sm:divide-x sm:divide-border">
          <div className="px-3 pt-2 sm:pt-0">
            <p className="text-xs font-medium text-muted-foreground">Total Solved</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {loading ? "–" : total.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{tracked} saved in notebook</p>
          </div>

          <div className="px-3 pt-2 sm:pt-0">
            <p className="text-xs font-medium text-muted-foreground">Easy</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {loading ? "–" : easy.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{percentage(easy, total)}% of solves</p>
          </div>

          <div className="px-3 pt-2 sm:pt-0">
            <p className="text-xs font-medium text-muted-foreground">Medium</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {loading ? "–" : medium.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{percentage(medium, total)}% of solves</p>
          </div>

          <div className="px-3 pt-2 sm:pt-0">
            <p className="text-xs font-medium text-muted-foreground">Hard</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {loading ? "–" : hard.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{percentage(hard, total)}% of solves</p>
          </div>
        </div>
      </Card>

      {/* Memory health: quiet multi-segment bar with encouraging line */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Brain className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Memory Health</p>
              <p className="text-xs text-muted-foreground">{encouragementText}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Flame className="size-3.5 text-primary" /> {streak} day streak
            </span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <CalendarClock className="size-3.5 text-primary" /> {dueCount} due
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--status-mastered-fg)]">
              <span className="size-2 rounded-full bg-emerald-500" /> {mastered} Mastered
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--status-review-fg)]">
              <span className="size-2 rounded-full bg-amber-400" /> {needsReview} Review
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--status-confused-fg)]">
              <span className="size-2 rounded-full bg-rose-400" /> {confused} Confused
            </span>
          </div>
        </div>

        <div
          className="flex h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`${mastered} mastered, ${needsReview} needs review, ${confused} confused`}
        >
          <div
            className="bg-emerald-500 transition-all duration-300"
            style={{ width: `${percentage(mastered, tracked)}%` }}
          />
          <div
            className="bg-amber-400 transition-all duration-300"
            style={{ width: `${percentage(needsReview, tracked)}%` }}
          />
          <div
            className="bg-rose-400 transition-all duration-300"
            style={{ width: `${percentage(confused, tracked)}%` }}
          />
        </div>
      </Card>
    </section>
  );
}
