import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        outline: "border-border text-muted-foreground",
        easy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        medium: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        hard: "border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-300",
        mastered: "border-[var(--status-mastered-border)] bg-[var(--status-mastered-bg)] text-[var(--status-mastered-fg)]",
        review: "border-[var(--status-review-border)] bg-[var(--status-review-bg)] text-[var(--status-review-fg)]",
        confused: "border-[var(--status-confused-border)] bg-[var(--status-confused-bg)] text-[var(--status-confused-fg)]",
        concept: "border-border bg-muted text-foreground",
        problem: "border-border bg-muted text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
