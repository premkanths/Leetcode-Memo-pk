"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  Layers,
  Link2,
  Mail,
  Moon,
  Shield,
  Sparkles,
  Sun,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { isValidLeetCodeUsername } from "@/lib/leetcode-links";
import { cn, getErrorMessage } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
  defaultName: string;
  defaultLeetcode: string;
  onSave: (data: { displayName: string; leetcodeUsername: string; preferredLanguage: string }) => Promise<void>;
  onSyncLeetcode?: (username: string) => Promise<void>;
}

export function ProfileDialog({
  open,
  onOpenChange,
  profile,
  defaultName,
  defaultLeetcode,
  onSave,
  onSyncLeetcode,
}: ProfileDialogProps) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("java");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(profile?.displayName || defaultName || "");
      setLeetcodeUsername(profile?.leetcodeUsername || defaultLeetcode || "");
      setPreferredLanguage(profile?.preferredLanguage || "java");
      setError(null);
      setSuccess(false);
    }
  }, [open, profile, defaultName, defaultLeetcode]);

  const trimmedUsername = leetcodeUsername.trim();
  const invalid = trimmedUsername.length > 0 && !isValidLeetCodeUsername(trimmedUsername);
  const isConnected = !!profile?.leetcodeUsername;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (invalid || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave({
        displayName: displayName.trim(),
        leetcodeUsername: trimmedUsername,
        preferredLanguage,
      });

      if (onSyncLeetcode && trimmedUsername) {
        await onSyncLeetcode(trimmedUsername);
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 top-0 left-0 z-50 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl overflow-y-auto">
        {/* Full-screen top header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl sm:px-10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40">
              <UserIcon className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Profile & Workspace Customization
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Customize your learner identity, preferred language, theme appearance, and official LeetCode connection.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick theme toggle in top bar */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2 border-border bg-card/60 text-foreground"
            >
              {theme === "dark" ? <Sun className="size-4 text-amber-300" /> : <Moon className="size-4 text-violet-600" />}
              <span className="hidden sm:inline">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close full-screen profile"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Full-screen body content */}
        <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Theme Appearance Card */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Theme & Visual Experience</h3>
                  <p className="text-xs text-muted-foreground">Choose between obsidian dark mode or clean high-contrast light mode.</p>
                </div>
                <span className="rounded-md bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/20">
                  {theme.toUpperCase()} MODE ACTIVE
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-all",
                    theme === "dark"
                      ? "border-violet-500/60 bg-violet-500/10 ring-2 ring-violet-500/40"
                      : "border-border bg-muted/40 hover:border-violet-500/30"
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-amber-300 ring-1 ring-white/10">
                    <Moon className="size-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Obsidian Dark Mode</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gentle on the eyes for late-night coding sessions, reduced glare, with soft neon accents.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-all",
                    theme === "light"
                      ? "border-violet-500/60 bg-violet-500/10 ring-2 ring-violet-500/40"
                      : "border-border bg-muted/40 hover:border-violet-500/30"
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500 shadow-md ring-1 ring-black/10">
                    <Sun className="size-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Clean Light Mode</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Crisp, high-contrast, beautiful readability for daytime study and interview review.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Learner Identity & Preferences Card */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-xl">
              <h3 className="mb-4 text-base font-bold text-foreground">Learner Profile</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Display Name / Handle
                  </label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Premkanth KS"
                    className="border-border bg-background text-sm text-foreground focus:border-violet-500"
                  />
                  <p className="text-[11px] text-muted-foreground">This name is displayed on your personal dashboard header and cards.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="preferred-lang" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Primary Coding Language
                  </label>
                  <select
                    id="preferred-lang"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-violet-500 focus:outline-none"
                  >
                    <option value="java">Java (Recommended)</option>
                    <option value="python3">Python 3</option>
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="sql">SQL</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">Used by Gemini AI when generating solution walkthroughs and syntax.</p>
                </div>
              </div>
            </div>

            {/* LeetCode Connection Section */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                    <Globe className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">LeetCode Account Sync</h3>
                    <p className="text-xs text-muted-foreground">Connect your public LeetCode username to pull accepted solves.</p>
                  </div>
                </div>
                {isConnected && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                    <CheckCircle2 className="size-3.5" />
                    Connected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="leetcode-username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    LeetCode Username
                  </label>
                  <Input
                    id="leetcode-username"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    placeholder="Enter username (e.g. OHntGXNFKf)"
                    className="border-border bg-background font-mono text-sm text-foreground focus:border-violet-500"
                  />
                  {invalid && (
                    <p className="text-xs text-rose-400">Please use letters, numbers, hyphens or underscores only.</p>
                  )}
                </div>

                {trimmedUsername && (
                  <a
                    href={`https://leetcode.com/u/${trimmedUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 hover:underline"
                  >
                    <span>View profile: leetcode.com/u/{trimmedUsername}</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Feedback Notifications */}
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                <Check className="size-4 text-emerald-400" />
                <span>Profile updated & connected successfully!</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <p className="text-xs text-muted-foreground">
                Settings persist automatically in your cloud profile.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={invalid || saving}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-500 hover:to-indigo-500"
                >
                  <Link2 className="size-4" />
                  <span>{saving ? "Saving Changes…" : "Save Customization"}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
