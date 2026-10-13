"use client";

import { ArrowUpRight, Lightbulb, RefreshCw, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DailyRecommendations, Difficulty } from "@/lib/types";

interface TodayPlanProps {
  recommendations: DailyRecommendations | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  hasProblems: boolean;
  onRegenerate: () => void;
  onOpenFull: () => void;
}

const DIFFICULTY_VARIANT: Record<Difficulty, "easy" | "medium" | "hard"> = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
};

export function TodayPlan({
  recommendations,
  loading,
  generating,
  error,
  hasProblems,
  onRegenerate,
  onOpenFull,
}: TodayPlanProps) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Today’s plan</p>
            <p className="text-xs text-muted-foreground">Three drills from your weak spots</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRegenerate}
            disabled={!hasProblems || generating}
            aria-label="Regenerate today’s plan"
            className="size-8"
          >
            <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenFull} className="text-xs">
            Open full coach
          </Button>
        </div>
      </div>

      {!hasProblems && !loading && (
        <p className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          Sync a few solves and the daily plan will appear here.
        </p>
      )}

      {error && !generating && (
        <p className="rounded-xl border border-status-confused-border bg-status-confused-bg px-4 py-3 text-sm text-status-confused-text">
          {error}
        </p>
      )}

      {(loading || generating) && !recommendations && !error && (
        <div className="grid gap-3 md:grid-cols-3" aria-busy="true" aria-label="Loading today’s plan">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {recommendations && (
        <ul className="grid gap-3 md:grid-cols-3">
          {recommendations.items.slice(0, 3).map((item, index) => (
            <li key={item.id} className="rounded-xl border border-border bg-card/80 p-3.5 shadow-xs">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">#{index + 1}</span>
                <Badge variant={item.type === "concept" ? "concept" : "problem"}>
                  {item.type === "concept" ? <Lightbulb className="size-3" /> : <Target className="size-3" />}
                  {item.type === "concept" ? "Concept" : "Problem"}
                </Badge>
                {item.difficulty && <Badge variant={DIFFICULTY_VARIANT[item.difficulty]}>{item.difficulty}</Badge>}
              </div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.reason}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Open on LeetCode
                <ArrowUpRight className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
