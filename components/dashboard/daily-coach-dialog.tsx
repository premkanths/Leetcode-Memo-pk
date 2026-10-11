"use client";

import { ArrowUpRight, BookOpen, ExternalLink, Lightbulb, RefreshCw, Sparkles, Target, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import type { DailyRecommendations, Difficulty, Recommendation } from "@/lib/types";

interface DailyCoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function DailyCoachDialog({
  open,
  onOpenChange,
  recommendations,
  loading,
  generating,
  error,
  hasProblems,
  onRegenerate,
}: DailyCoachDialogProps) {
  const dateLabel = formatDate(recommendations?.generatedAt ?? new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-5 rounded-2xl border-white/[0.1] bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/25">
                <Sparkles className="size-4" />
              </span>
              <DialogTitle className="text-lg font-bold text-zinc-100">AI Coach · Today&apos;s Plan</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              Personalized interview study recommendations based on your revision memory and weak spots.
            </DialogDescription>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={generating || loading || !hasProblems}
            className="h-8 gap-1.5 text-xs text-zinc-400 hover:text-white"
          >
            <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
            <span>{generating ? "Thinking…" : "Regenerate"}</span>
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3 py-6">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Sparkles className="size-3.5 animate-pulse text-violet-300" />
                <span>Analysing your strengths and weak spots with Gemini…</span>
              </div>
              <Skeleton className="h-20 rounded-xl bg-zinc-900/60" />
              <Skeleton className="h-20 rounded-xl bg-zinc-900/60" />
              <Skeleton className="h-20 rounded-xl bg-zinc-900/60" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
              <p className="font-semibold">Could not generate recommendations</p>
              <p className="mt-1 text-rose-200/80">{error}</p>
              <Button size="sm" variant="outline" className="mt-3 border-rose-500/40" onClick={onRegenerate}>
                Retry
              </Button>
            </div>
          ) : recommendations ? (
            <>
              {/* Summary note */}
              {recommendations.summary && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3.5 text-xs leading-relaxed text-zinc-200">
                  <p className="font-medium text-violet-300">💡 Coach Insight</p>
                  <p className="mt-1 text-zinc-300">{recommendations.summary}</p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Recommended Action Items ({recommendations.items.length})
                </p>
                {recommendations.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border border-white/[0.06] bg-zinc-900/50 p-3.5 transition-all hover:border-violet-500/40 hover:bg-zinc-900/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {item.type === "concept" ? (
                            <span className="flex size-5 items-center justify-center rounded-md bg-amber-500/15 text-amber-300">
                              <Lightbulb className="size-3" />
                            </span>
                          ) : (
                            <span className="flex size-5 items-center justify-center rounded-md bg-violet-500/15 text-violet-300">
                              <Target className="size-3" />
                            </span>
                          )}
                          <span className="truncate text-xs font-semibold text-zinc-100 group-hover:text-violet-300 transition-colors">
                            {item.title}
                          </span>
                          {item.difficulty && (
                            <Badge variant={DIFFICULTY_VARIANT[item.difficulty]} className="text-[10px]">
                              {item.difficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-400">{item.reason}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-zinc-500 group-hover:text-violet-300">
                        <span className="text-[11px] font-medium">{item.topic}</span>
                        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-zinc-500">
                <span>Generated for {dateLabel}</span>
                <span>Powered by Gemini</span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              <p>No study recommendations generated yet.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={onRegenerate}>
                Generate Today&apos;s Plan
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
