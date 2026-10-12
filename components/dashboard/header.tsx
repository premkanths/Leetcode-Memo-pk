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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photoURL}
        alt={user.displayName ?? "GitHub avatar"}
        referrerPolicy="no-referrer"
        className="size-8 rounded-full ring-1 ring-border"
      />
    );
  }
  const initial = (user.displayName ?? user.email ?? "?").charAt(0).toUpperCase();
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground ring-1 ring-border">
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
  const effectiveName = displayName || user.displayName || user.email || "Learner";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookMarked className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">LeetCode Memory Hub</p>
            <button
              type="button"
              onClick={onEditUsername}
              className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Change profile or LeetCode username"
            >
              <span className="truncate font-medium text-primary">
                {leetcodeUsername ? `@${leetcodeUsername}` : "Connect LeetCode"}
              </span>
              <Pencil className="size-2.5 opacity-60" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditUsername}
            className="mr-1 hidden cursor-pointer items-center gap-2 rounded-xl border border-transparent p-1 transition-colors hover:border-border hover:bg-muted md:flex"
            title="Edit Profile & LeetCode connection"
          >
            <Avatar user={user} />
            <div className="text-right">
              <p className="max-w-[150px] truncate text-xs font-medium text-foreground">
                {effectiveName}
              </p>
              <p className="text-[10px] text-muted-foreground">{lastSyncedLabel}</p>
            </div>
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="size-8.5 rounded-xl border-border bg-card text-foreground"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle light and dark theme"
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-300" /> : <Moon className="size-4 text-zinc-600" />}
          </Button>

          {/* Secondary Action: Add problem */}
          <Button variant="outline" size="sm" onClick={onAddProblem} className="hidden sm:inline-flex gap-1.5 text-xs">
            <Plus className="size-3.5" /> <span>Add problem</span>
          </Button>

          {/* Sync Code Extension / Dialog Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSyncCode}
            className="text-xs gap-1.5 border-border bg-card hover:bg-muted"
            title="Sync accepted solutions & code via extension or clipboard"
          >
            <Zap className="size-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sync Code</span>
          </Button>

          {/* Primary Quick Sync from LeetCode Profile */}
          <Button
            size="sm"
            onClick={onSync}
            disabled={syncing || !leetcodeUsername}
            className="text-xs gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
            title="Fetch recent LeetCode progress directly from public profile"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync LeetCode"}</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out" title="Sign out" className="size-8.5 text-muted-foreground hover:text-foreground">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
