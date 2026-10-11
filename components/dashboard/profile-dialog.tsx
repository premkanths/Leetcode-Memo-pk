"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, CheckCircle2, ExternalLink, Globe, Layers, Link2, Sparkles, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
      <DialogContent className="max-w-md gap-5 rounded-2xl border-white/[0.1] bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40">
              <UserIcon className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold text-zinc-100">Profile & Connection</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Customize your learner profile and connect your official LeetCode account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Your Name / Handle
            </label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder-zinc-500 focus:border-violet-500"
            />
          </div>

          {/* Primary Language */}
          <div className="space-y-1.5">
            <label htmlFor="preferred-lang" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Primary Coding Language
            </label>
            <select
              id="preferred-lang"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
            >
              <option value="java">Java (Recommended)</option>
              <option value="python3">Python 3</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="csharp">C#</option>
              <option value="go">Go</option>
            </select>
          </div>

          {/* LeetCode Connection Section */}
          <div className="space-y-2 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="size-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-zinc-200">LeetCode Account</span>
              </div>
              {isConnected && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                  <CheckCircle2 className="size-3" />
                  Connected
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Input
                id="leetcode-username"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="LeetCode username (e.g. OHntGXNFKf)"
                className="border-zinc-800 bg-zinc-950 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-violet-500"
              />
              {invalid && (
                <p className="text-[11px] text-rose-400">Use letters, numbers, hyphens or underscores only.</p>
              )}
            </div>

            {trimmedUsername && (
              <a
                href={`https://leetcode.com/u/${trimmedUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-violet-400 transition-colors hover:underline"
              >
                <span>View leetcode.com/u/{trimmedUsername}</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {success && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="size-3.5" /> Profile updated & connected successfully!
            </p>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={invalid || saving}
              className="gap-1.5 bg-violet-600 text-xs text-white hover:bg-violet-500"
            >
              <Link2 className="size-3.5" />
              <span>{saving ? "Connecting…" : "Connect & Save"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
