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
    <Card className="relative overflow-hidden border-white/[0.08] bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-zinc-900/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-60 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 -left-20 size-60 rounded-full bg-emerald-600/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: User identity & stats */}
        <div className="flex items-start gap-4">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={displayName}
              className="size-14 rounded-2xl ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/15"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-violet-500/25">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100 sm:text-lg">{displayName}</h3>
              <span className="rounded-md bg-violet-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-300 ring-1 ring-violet-500/30">
                {preferredLang.toUpperCase()}
              </span>
              {leetcodeUsername && (
                <a
                  href={`https://leetcode.com/u/${leetcodeUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-300 transition-colors hover:text-white"
                >
                  <span>@{leetcodeUsername}</span>
                  <ExternalLink className="size-3 text-zinc-400" />
                </a>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-400">
              Mastering algorithmic patterns with deep intuition and active recall revision.
            </p>

            {/* Quick Metrics Pills */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/90 px-2.5 py-1 text-zinc-300 ring-1 ring-white/[0.06]">
                <Trophy className="size-3.5 text-amber-400" />
                <span>
                  <strong className="text-zinc-100">{profile?.totalSolved ?? totalTracked}</strong> Solved
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/90 px-2.5 py-1 text-zinc-300 ring-1 ring-white/[0.06]">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>
                  <strong className="text-zinc-100">{masteredCount}</strong> Mastered ({masteredPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/90 px-2.5 py-1 text-zinc-300 ring-1 ring-white/[0.06]">
                <BookMarked className="size-3.5 text-violet-400" />
                <span>
                  <strong className="text-zinc-100">{totalTracked}</strong> Revision Cards
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
            className="gap-1.5 border-zinc-800 bg-zinc-900/80 text-xs text-zinc-200 hover:border-violet-500/40 hover:bg-zinc-850 hover:text-white"
          >
            <Pencil className="size-3" />
            <span>Customize Profile</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSyncCode}
            className="gap-1.5 border-violet-500/40 bg-violet-500/10 text-xs text-violet-200 hover:bg-violet-500/20 hover:text-white"
          >
            <Zap className="size-3 fill-violet-300" />
            <span>Sync LeetCode Code</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
