"use client";

import type { User } from "firebase/auth";
import { BookMarked, LogOut, Moon, Pencil, Plus, RefreshCw, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: User;
  displayName?: string;
  leetcodeUsername: string;
  lastSyncedLabel: string;
  syncing: boolean;
  onSync: () => void;
  onAddProblem: () => void;
  onOpenSyncCode: () => void;
  onEditUsername: () => void;
  onSignOut: () => void;
}

function Avatar({ user }: { user: User }) {
  if (user.photoURL) {
    // Remote GitHub avatars are shown as-is; no Next image optimisation needed.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photoURL}
        alt={user.displayName ?? "GitHub avatar"}
        referrerPolicy="no-referrer"
        className="size-9 rounded-full ring-2 ring-white/10"
      />
    );
  }
  const initial = (user.displayName ?? user.email ?? "?").charAt(0).toUpperCase();
  return (
    <span className="flex size-9 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200 ring-2 ring-white/10">
      {initial}
    </span>
  );
}

export function DashboardHeader({
  user,
  displayName,
  leetcodeUsername,
  lastSyncedLabel,
  syncing,
  onSync,
  onAddProblem,
  onOpenSyncCode,
  onEditUsername,
  onSignOut,
}: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const effectiveName = displayName || user.displayName || user.email || "GitHub user";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <BookMarked className="size-5 text-white" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-50">LeetCode Memory Hub</p>
            <button
              type="button"
              onClick={onEditUsername}
              className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md bg-zinc-900/80 px-2 py-0.5 text-xs text-zinc-300 ring-1 ring-white/10 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Change profile or LeetCode username"
            >
              <span className="truncate font-medium text-violet-300">
                {leetcodeUsername ? `@${leetcodeUsername}` : "Connect LeetCode"}
              </span>
              <Pencil className="size-3 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditUsername}
            className="mr-1 hidden cursor-pointer items-center gap-2.5 rounded-xl border border-transparent p-1 transition-colors hover:border-white/10 hover:bg-zinc-900 md:flex"
            title="Edit Profile & LeetCode connection"
          >
            <Avatar user={user} />
            <div className="text-right">
              <p className="max-w-[160px] truncate text-sm font-medium text-zinc-200">
                {effectiveName}
              </p>
              <p className="text-[11px] text-zinc-500">{lastSyncedLabel}</p>
            </div>
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="size-8.5 rounded-xl border-border bg-card/60 text-foreground"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle light and dark theme"
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-300" /> : <Moon className="size-4 text-violet-600" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSyncCode}
            className="border-violet-500/40 bg-violet-500/10 text-violet-200 transition-colors hover:bg-violet-500/20 hover:text-white"
          >
            <Zap className="size-3.5 fill-violet-300" />
            <span className="hidden sm:inline">Sync Code</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onAddProblem} className="hidden sm:inline-flex">
            <Plus /> Add problem
          </Button>
          <Button size="sm" onClick={onSync} disabled={syncing || !leetcodeUsername}>
            <RefreshCw className={cn(syncing && "animate-spin")} />
            <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync LeetCode"}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out" title="Sign out">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
