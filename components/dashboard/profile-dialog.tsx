"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  Moon,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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

function ProfileFormContent({
  profile,
  defaultName,
  defaultLeetcode,
  onSave,
  onSyncLeetcode,
  onClose,
}: {
  profile: UserProfile | null;
  defaultName: string;
  defaultLeetcode: string;
  onSave: (data: { displayName: string; leetcodeUsername: string; preferredLanguage: string }) => Promise<void>;
  onSyncLeetcode?: (username: string) => Promise<void>;
  onClose: () => void;
}) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(() => profile?.displayName || defaultName || "");
  const [leetcodeUsername, setLeetcodeUsername] = useState(() => profile?.leetcodeUsername || defaultLeetcode || "");
  const [preferredLanguage, setPreferredLanguage] = useState(() => profile?.preferredLanguage || "java");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        onClose();
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Full-screen top header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl sm:px-10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
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
            {theme === "dark" ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-muted-foreground" />}
            <span className="hidden sm:inline">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
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
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Theme & Visual Experience</h3>
                  <p className="text-xs text-muted-foreground">Choose between soft charcoal dark mode or calm paper light mode.</p>
                </div>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border">
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
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-muted/40 hover:border-foreground/20"
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground border border-border">
                    <Moon className="size-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Soft Charcoal Dark</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gentle, low-glare dark study mode with soft warm charcoal paper tones.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-all",
                    theme === "light"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-muted/40 hover:border-foreground/20"
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-amber-500 border border-border">
                    <Sun className="size-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Calm Paper Light</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Crisp, high-contrast, peaceful notebook feel for daytime study and review.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Learner Identity & Preferences Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
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
                    className="border-border bg-background text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary"
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
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
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
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Globe className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">LeetCode Account Sync</h3>
                    <p className="text-xs text-muted-foreground">Connect your public LeetCode username to pull accepted solves.</p>
                  </div>
                </div>
                {isConnected && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-status-mastered-border bg-status-mastered-bg px-3 py-1 text-xs font-medium text-status-mastered-text">
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
                    className="border-border bg-background font-mono text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  {invalid && (
                    <p className="text-xs text-status-confused-text">Please use letters, numbers, hyphens or underscores only.</p>
                  )}
                </div>

                {trimmedUsername && (
                  <a
                    href={`https://leetcode.com/u/${trimmedUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <span>View profile: leetcode.com/u/{trimmedUsername}</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Feedback Notifications */}
            {error && (
              <div className="rounded-xl border border-status-confused-border bg-status-confused-bg p-4 text-xs text-status-confused-text">
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-status-mastered-border bg-status-mastered-bg p-4 text-xs text-status-mastered-text">
                <Check className="size-4" />
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
                  onClick={onClose}
                  disabled={saving}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={invalid || saving}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link2 className="size-4" />
                  <span>{saving ? "Saving Changes…" : "Save Customization"}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
    </>
  );
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 top-0 left-0 z-50 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl overflow-y-auto">
        {open && (
          <ProfileFormContent
            key={profile?.leetcodeUsername || defaultLeetcode || "profile-open"}
            profile={profile}
            defaultName={defaultName}
            defaultLeetcode={defaultLeetcode}
            onSave={onSave}
            onSyncLeetcode={onSyncLeetcode}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
