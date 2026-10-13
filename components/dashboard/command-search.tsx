"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SolvedProblem } from "@/lib/types";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problems: SolvedProblem[];
  onSelect: (problem: SolvedProblem) => void;
}

export function CommandSearch({ open, onOpenChange, problems, onSelect }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? problems.filter((problem) => {
          const haystack = `${problem.title} ${problem.titleSlug} ${problem.topics.join(" ")} ${problem.notes}`.toLowerCase();
          return haystack.includes(q);
        })
      : [...problems].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return pool.slice(0, 12);
  }, [problems, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const pick = (problem: SolvedProblem) => {
    onSelect(problem);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search problems</DialogTitle>
          <DialogDescription>Jump to a saved LeetCode problem</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && results[activeIndex]) {
                event.preventDefault();
                pick(results[activeIndex]);
              }
            }}
            placeholder="Search title, topic, or notes…"
            className="h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Search problems"
          />
          <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">No matching problems</li>
          )}
          {results.map((problem, index) => (
            <li key={problem.titleSlug}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(problem)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left",
                  index === activeIndex ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted",
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    {problem.pinned && <Pin className="size-3 fill-current text-primary" />}
                    <span className="truncate text-sm font-medium">{problem.title}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {problem.topics.slice(0, 3).join(" · ") || problem.titleSlug}
                  </span>
                </span>
                <Badge variant={problem.difficulty.toLowerCase() as "easy" | "medium" | "hard"}>{problem.difficulty}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
