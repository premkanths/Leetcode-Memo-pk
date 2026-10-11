import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-zinc-700 bg-zinc-800/80 text-zinc-300",
        outline: "border-zinc-700 text-zinc-400",
        easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        hard: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        mastered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        review: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        confused: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        concept: "border-sky-500/30 bg-sky-500/10 text-sky-300",
        problem: "border-violet-500/30 bg-violet-500/10 text-violet-300",
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
