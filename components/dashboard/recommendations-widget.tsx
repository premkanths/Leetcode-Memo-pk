"use client";

import { ArrowUpRight, Lightbulb, RefreshCw, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import type { DailyRecommendations, Difficulty } from "@/lib/types";

interface RecommendationsWidgetProps {
  recommendations: DailyRecommendations | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  hasProblems: boolean;
  onRegenerate: () => void;
}

const DIFFICULTY_VARIANT: Record<Difficulty, "easy" | "medium" | "hard"> = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
};

function LoadingState() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Generating recommendations">
      <p className="flex items-center gap-2 text-xs text-zinc-400">
        <Sparkles className="size-3.5 animate-pulse text-violet-300" /> Analysing your strengths and weak spots…
      </p>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function RecommendationsWidget({
  recommendations,
  loading,
  generating,
  error,
  hasProblems,
  onRegenerate,
}: RecommendationsWidgetProps) {
  const dateLabel = formatDate(recommendations?.generatedAt ?? new Date());

  return (
    <Card className="relative overflow-hidden border-violet-500/20 bg-gradient-to-b from-violet-500/[0.07] to-zinc-900/60">
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-violet-500/20 blur-3xl" />
      <CardHeader className="relative flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
              <Sparkles className="size-3.5 text-violet-300" />
            </span>
            AI Coach · Today
          </CardTitle>
          <CardDescription className="text-xs">
            Three targeted concepts or problems, refreshed daily ({dateLabel}).
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRegenerate}
          disabled={!hasProblems || generating}
          aria-label="Regenerate recommendations"
          title="Regenerate recommendations"
          className="size-8"
        >
          <RefreshCw className={cn(generating && "animate-spin")} />
        </Button>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {!hasProblems && !loading && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-center text-sm text-zinc-500">
            Sync or add a few solved problems and your coach will start analysing your patterns.
          </div>
        )}

        {error && !generating && (
          error.toLowerCase().includes("not configured") ? (
            <div className="space-y-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-center">
              <p className="text-sm font-medium text-violet-200">AI Coach in Standby</p>
              <p className="text-xs text-zinc-400">
                You can review, group, and track your LeetCode problems freely. Gemini AI coaching can be enabled anytime by adding GEMINI_API_KEY.
              </p>
            </div>
          ) : (
            <div role="alert" className="space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <p className="text-sm text-rose-300">{error}</p>
              <Button variant="outline" size="sm" onClick={onRegenerate} disabled={!hasProblems}>
                Try again
              </Button>
            </div>
          )
        )}

        {(loading || generating) && !recommendations && !error && <LoadingState />}

        {recommendations && (
          <>
            {recommendations.summary && (
              <div className="flex gap-2.5 rounded-xl bg-zinc-950/50 p-3.5">
                <Target className="mt-0.5 size-4 shrink-0 text-violet-300" />
                <p className="text-sm leading-relaxed text-zinc-300">{recommendations.summary}</p>
              </div>
            )}

            <ul className="space-y-3">
              {recommendations.items.map((item, index) => (
                <li
                  key={item.id}
                  className="group rounded-xl border border-white/[0.07] bg-zinc-950/40 p-4 transition-colors hover:border-violet-500/30"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-zinc-600">#{index + 1}</span>
                    <Badge variant={item.type === "concept" ? "concept" : "problem"}>
                      {item.type === "concept" ? <Lightbulb className="size-3" /> : <Target className="size-3" />}
                      {item.type === "concept" ? "Concept" : "Problem"}
                    </Badge>
                    {item.difficulty && <Badge variant={DIFFICULTY_VARIANT[item.difficulty]}>{item.difficulty}</Badge>}
                    <Badge variant="outline" className="max-w-[140px] truncate">
                      {item.topic}
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.reason}</p>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-300 transition-colors hover:text-violet-200"
                  >
                    {item.type === "concept" ? "Explore topic on LeetCode" : "Solve on LeetCode"}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>

            <p className="text-center text-[11px] text-zinc-600">
              {recommendations.generatedAt
                ? `Generated ${formatRelativeTime(recommendations.generatedAt)}`
                : "Generated just now"}
              {recommendations.model ? ` · ${recommendations.model}` : ""}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
