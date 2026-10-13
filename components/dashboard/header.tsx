"use client";

import type { User } from "firebase/auth";
import { Image as ImageIcon, LogOut, Menu, Moon, Pencil, Plus, RefreshCw, Search, Sun, Zap } from "lucide-react";
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
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
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
  onOpenSidebar,
  onOpenSearch,
}: DashboardHeaderProps) {
  const { theme, toggleTheme, cycleBackground, currentBackgroundOption } = useTheme();
  const effectiveName = displayName || user.displayName || user.email || "Learner";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/75 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="lg:hidden"
            aria-label="Open dashboard panel"
          >
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{effectiveName}</p>
            <button
              type="button"
              onClick={onEditUsername}
              className="inline-flex max-w-full cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="hidden gap-1.5 text-xs sm:inline-flex"
            title="Search problems (Ctrl/⌘ K)"
          >
            <Search className="size-3.5" />
            Search
            <kbd className="ml-1 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenSearch} className="sm:hidden" aria-label="Search problems">
            <Search className="size-4" />
          </Button>

          <button
            type="button"
            onClick={onEditUsername}
            className="mr-1 hidden cursor-pointer items-center gap-2 rounded-xl border border-transparent p-1 transition-colors hover:border-border hover:bg-muted md:flex"
            title="Edit Profile & LeetCode connection"
          >
            <Avatar user={user} />
            <p className="text-[10px] text-muted-foreground">{lastSyncedLabel}</p>
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={cycleBackground}
            className="size-8.5 rounded-xl border-border"
            title={`Wallpaper: ${currentBackgroundOption.name} (Click to switch)`}
            aria-label="Switch background wallpaper"
          >
            <ImageIcon className="size-4 text-primary" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="size-8.5 rounded-xl"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle light and dark theme"
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-300" /> : <Moon className="size-4 text-zinc-600" />}
          </Button>

          <Button variant="outline" size="sm" onClick={onAddProblem} className="hidden gap-1.5 text-xs sm:inline-flex">
            <Plus className="size-3.5" /> <span>Add</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onOpenSyncCode} className="gap-1.5 text-xs" title="Sync accepted solutions">
            <Zap className="size-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sync Code</span>
          </Button>

          <Button
            size="sm"
            onClick={onSync}
            disabled={syncing || !leetcodeUsername}
            className="gap-1.5 text-xs"
            title="Fetch recent LeetCode progress"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync"}</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out" title="Sign out" className="size-8.5 text-muted-foreground hover:text-foreground">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
