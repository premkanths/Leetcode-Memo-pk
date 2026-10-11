import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native select styled to the design system. Keeps keyboard and mobile behaviour for free. */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-lg border border-zinc-800 bg-zinc-950/70 py-2 pl-3 pr-9 text-sm text-zinc-100 transition-colors focus-visible:border-violet-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
    </div>
  ),
);
Select.displayName = "Select";

export { Select };
