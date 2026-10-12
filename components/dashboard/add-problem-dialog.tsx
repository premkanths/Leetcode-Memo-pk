"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";
import type { LeetCodeProblem } from "@/lib/types";

interface AddProblemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: string) => Promise<LeetCodeProblem>;
  onAdded: (problem: LeetCodeProblem) => void;
}

/** Backfill older solves that fall outside LeetCode's recent-submissions window. */
export function AddProblemDialog({ open, onOpenChange, onAdd, onAdded }: AddProblemDialogProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setValue("");
      setError(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const problem = await onAdd(value);
      onAdded(problem);
      handleOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not add that problem."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a solved problem</DialogTitle>
          <DialogDescription>
            Paste a LeetCode link or slug. Useful for older solves that are no longer in your recent submissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="problem-input" className="text-xs font-medium text-muted-foreground">
              Problem URL or slug
            </label>
            <Input
              id="problem-input"
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
              autoComplete="off"
              spellCheck={false}
            />
            {error && (
              <p role="alert" className="text-xs text-status-confused-text">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!value.trim() || submitting}>
              {submitting ? "Adding…" : "Add to hub"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
