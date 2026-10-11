"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isValidLeetCodeUsername } from "@/lib/leetcode-links";
import { getErrorMessage } from "@/lib/utils";

interface UsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  /** Required on first run: the dialog cannot be dismissed without a username. */
  required: boolean;
  onSave: (username: string) => Promise<void>;
}

export function UsernameDialog({ open, onOpenChange, initialValue, required, onSave }: UsernameDialogProps) {
  // `draft` is null until the user types, so the field always reflects the saved value by default.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = draft ?? initialValue;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDraft(null);
      setError(null);
    }
    onOpenChange(next);
  };

  const trimmed = value.trim();
  const invalid = trimmed.length > 0 && !isValidLeetCodeUsername(trimmed);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || invalid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      handleOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your username."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !required && handleOpenChange(next)}>
      <DialogContent onEscapeKeyDown={(event) => required && event.preventDefault()}
        onPointerDownOutside={(event) => required && event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{required ? "Connect your LeetCode account" : "LeetCode username"}</DialogTitle>
          <DialogDescription>
            We assume your GitHub login matches your LeetCode username so sign-in is one click. If it differs, enter
            your LeetCode username here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="leetcode-username" className="text-xs font-medium text-zinc-400">
              LeetCode username
            </label>
            <Input
              id="leetcode-username"
              autoFocus
              value={value}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="e.g. jane_doe"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={invalid}
            />
            {invalid && <p className="text-xs text-rose-400">Use letters, numbers, hyphens or underscores only.</p>}
            {error && (
              <p role="alert" className="text-xs text-rose-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {!required && (
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!trimmed || invalid || saving}>
              {saving ? "Syncing…" : "Save & sync"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
