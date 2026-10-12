"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Maximize2,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
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

const STRATEGY_TIPS = [
  {
    title: "The 20-Minute Struggle Rule",
    tip: "Spend 20 focused minutes testing inputs by hand before opening hints or solutions.",
  },
  {
    title: "Pattern Over Syntax",
    tip: "Explain the algorithm in plain English first. If the state transition is clear, the code writes itself.",
  },
  {
    title: "Test Extreme Invariants",
    tip: "Always dry-run null/empty inputs, size 1 arrays, and duplicates to catch edge-case bugs.",
  },
];

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
      <DialogContent className="fixed inset-0 top-0 left-0 z-50 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl overflow-y-auto">
        {/* Full-screen top header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl sm:px-10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                AI Coach · Recommended Questions & Study Plan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Comprehensive full-screen view of your active weak-spot concepts and curated interview drill questions.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={generating || loading || !hasProblems}
              className="gap-2 border-border bg-card/60 text-xs text-foreground hover:bg-muted"
            >
              <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
              <span>{generating ? "Consulting Gemini…" : "Regenerate Plan"}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close recommendations"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Full-screen body content */}
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 space-y-8">
          {/* Main Plan Section */}
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4 animate-pulse text-primary" />
                  <span>Analysing your revision memory patterns and weak spots with Gemini…</span>
                </div>
                <Skeleton className="h-32 rounded-2xl bg-card" />
                <Skeleton className="h-32 rounded-2xl bg-card" />
                <Skeleton className="h-32 rounded-2xl bg-card" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
                <p className="font-semibold text-base">Could not generate recommendations</p>
                <p className="mt-1.5 text-rose-200/80">{error}</p>
                <Button size="sm" variant="outline" className="mt-4 border-rose-500/40" onClick={onRegenerate}>
                  Retry Generation
                </Button>
              </div>
            ) : recommendations ? (
              <>
                {/* Coach Insight Summary Banner */}
                {recommendations.summary && (
                  <div className="rounded-2xl border border-border bg-muted/40 p-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="size-4" />
                      <span className="font-semibold text-xs uppercase tracking-wider">Coach Diagnostic</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {recommendations.summary}
                    </p>
                  </div>
                )}

                {/* Grid of Recommended Questions & Concepts */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Today for you ({recommendations.items.length})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Gentle practice recommendations focused on your recent revision topics.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {recommendations.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                              {idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {item.difficulty && (
                                <Badge variant={item.difficulty.toLowerCase() as "easy" | "medium" | "hard"}>
                                  {item.difficulty}
                                </Badge>
                              )}
                              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {item.type}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-foreground">
                              {item.title}
                            </h4>
                            <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              {item.topic}
                            </span>
                          </div>

                          <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground block mb-0.5">Why this:</span>
                            {item.reason}
                          </div>
                        </div>

                        <div className="mt-5 border-t border-border pt-3.5">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
                          >
                            <span>Open on LeetCode</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Coaching Content: Study Strategies & Interview Framework */}
                <div className="grid gap-6 sm:grid-cols-3">
                  {STRATEGY_TIPS.map((tip) => (
                    <div key={tip.title} className="rounded-2xl border border-border bg-card/40 p-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Lightbulb className="size-4 text-amber-400" />
                        <span>{tip.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{tip.tip}</p>
                    </div>
                  ))}
                </div>

                {/* Footer notes */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>Generated dynamically for {dateLabel}</span>
                  <span>Powered by Google Gemini · LeetCode Memory Hub</span>
                </div>
              </>
            ) : (
              <div className="py-16 text-center space-y-4">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <BookOpen className="size-6" />
                </span>
                <div>
                  <h4 className="text-base font-semibold text-foreground">No study plan generated yet</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click below to have Gemini analyze your tracked problems and build your customized question list.
                  </p>
                </div>
                <Button onClick={onRegenerate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="size-4" />
                  <span>Generate Recommended Questions</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
