import type { ReactNode } from "react";
import { Brain, CircleCheck, CircleAlert, Layers, RotateCw, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SolvedProblem, UserProfile } from "@/lib/types";

interface StatsOverviewProps {
  profile: UserProfile | null;
  problems: SolvedProblem[];
  loading: boolean;
}

function pickCount(fromProfile: number | undefined, fallback: number): number {
  return fromProfile && fromProfile > 0 ? fromProfile : fallback;
}

function percentage(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

type Tone = "violet" | "emerald" | "amber" | "rose";

const TONE_CLASSES: Record<Tone, { line: string; chip: string }> = {
  violet: { line: "via-violet-500/60", chip: "bg-violet-500/10" },
  emerald: { line: "via-emerald-500/60", chip: "bg-emerald-500/10" },
  amber: { line: "via-amber-500/60", chip: "bg-amber-500/10" },
  rose: { line: "via-rose-500/60", chip: "bg-rose-500/10" },
};

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  tone: Tone;
  loading: boolean;
}

function StatCard({ label, value, hint, icon, tone, loading }: StatCardProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent", classes.line)} />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <span className={cn("rounded-lg p-2", classes.chip)}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 tabular-nums">
        {loading ? "–" : value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </Card>
  );
}

export function StatsOverview({ profile, problems, loading }: StatsOverviewProps) {
  const total = pickCount(profile?.totalSolved, problems.length);
  const easy = pickCount(profile?.easySolved, problems.filter((p) => p.difficulty === "Easy").length);
  const medium = pickCount(profile?.mediumSolved, problems.filter((p) => p.difficulty === "Medium").length);
  const hard = pickCount(profile?.hardSolved, problems.filter((p) => p.difficulty === "Hard").length);

  const tracked = problems.length;
  const mastered = problems.filter((p) => p.memoryStatus === "Mastered").length;
  const needsReview = problems.filter((p) => p.memoryStatus === "Needs Review").length;
  const confused = problems.filter((p) => p.memoryStatus === "Confused").length;

  return (
    <section aria-label="Progress overview" className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total solved"
          value={total}
          hint={`${tracked} tracked in your hub`}
          icon={<Trophy className="size-4 text-violet-300" />}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Easy"
          value={easy}
          hint={`${percentage(easy, total)}% of total`}
          icon={<Layers className="size-4 text-emerald-300" />}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Medium"
          value={medium}
          hint={`${percentage(medium, total)}% of total`}
          icon={<Layers className="size-4 text-amber-300" />}
          tone="amber"
          loading={loading}
        />
        <StatCard
          label="Hard"
          value={hard}
          hint={`${percentage(hard, total)}% of total`}
          icon={<Layers className="size-4 text-rose-300" />}
          tone="rose"
          loading={loading}
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-indigo-500/10 p-2">
              <Brain className="size-4 text-indigo-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Memory health</p>
              <p className="text-xs text-zinc-400">
                {mastered} mastered · {needsReview} to review · {confused} confused
                {total > tracked && (
                  <span className="text-zinc-500"> ({tracked} tracked of {total} LeetCode solves)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CircleCheck className="size-3.5 text-emerald-400" /> {percentage(mastered, tracked)}% mastered
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCw className="size-3.5 text-amber-400" /> {needsReview} review
            </span>
            <span className="flex items-center gap-1.5">
              <CircleAlert className="size-3.5 text-rose-400" /> {confused} confused
            </span>
          </div>
        </div>
        <div
          className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-zinc-800"
          role="img"
          aria-label={`${mastered} mastered, ${needsReview} needs review, ${confused} confused`}
        >
          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${percentage(mastered, tracked)}%` }} />
          <div className="bg-amber-400 transition-all duration-500" style={{ width: `${percentage(needsReview, tracked)}%` }} />
          <div className="bg-rose-500 transition-all duration-500" style={{ width: `${percentage(confused, tracked)}%` }} />
        </div>
      </Card>
    </section>
  );
}
