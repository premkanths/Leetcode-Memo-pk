"use client";

import type { User } from "firebase/auth";
import {
  Award,
  BookMarked,
  Brain,
  CheckCircle2,
  Code2,
  ExternalLink,
  Layers,
  Pencil,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SolvedProblem, UserProfile } from "@/lib/types";

interface DeveloperInfoCardProps {
  user: User;
  profile: UserProfile | null;
  problems: SolvedProblem[];
  leetcodeUsername: string;
  onOpenProfile: () => void;
  onOpenSyncCode: () => void;
}

export function DeveloperInfoCard({
  user,
  profile,
  problems,
  leetcodeUsername,
  onOpenProfile,
  onOpenSyncCode,
}: DeveloperInfoCardProps) {
  const displayName = profile?.displayName || user.displayName || user.email || "LeetCode Explorer";
  const preferredLang = profile?.preferredLanguage || "Java";
  const totalTracked = problems.length;
  const masteredCount = problems.filter((p) => p.memoryStatus === "Mastered").length;
  const masteredPercent = totalTracked > 0 ? Math.round((masteredCount / totalTracked) * 100) : 0;

  return (
    <Card className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: User identity & stats */}
        <div className="flex items-start gap-4">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={displayName}
              className="size-13 rounded-2xl border border-border object-cover"
            />
          ) : (
            <span className="flex size-13 items-center justify-center rounded-2xl bg-muted text-base font-semibold text-foreground border border-border">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
              <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                {preferredLang.toUpperCase()}
              </span>
              {leetcodeUsername && (
                <a
                  href={`https://leetcode.com/u/${leetcodeUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                >
                  <span>@{leetcodeUsername}</span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Mastering algorithmic patterns with calm intuition and spaced revision.
            </p>

            {/* Quick Metrics Pills */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground">
                <Trophy className="size-3.5 text-status-review-text" />
                <span>
                  <strong className="font-semibold text-foreground">{profile?.totalSolved ?? totalTracked}</strong> Solved
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-status-mastered-border bg-status-mastered-bg px-2.5 py-1 text-status-mastered-text">
                <CheckCircle2 className="size-3.5" />
                <span>
                  <strong className="font-semibold text-foreground">{masteredCount}</strong> Mastered ({masteredPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground">
                <BookMarked className="size-3.5 text-primary" />
                <span>
                  <strong className="font-semibold text-foreground">{totalTracked}</strong> Notebook Cards
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProfile}
            className="gap-1.5 text-xs"
          >
            <Pencil className="size-3" />
            <span>Customize Profile</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSyncCode}
            className="gap-1.5 text-xs"
          >
            <Zap className="size-3" />
            <span>Sync Extension Code</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
