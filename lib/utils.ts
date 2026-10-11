import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "5 minutes ago", "yesterday", or a short date for anything older than a month. */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "Never";
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) return "just now";
  if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 86_400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (absSeconds < 86_400 * 30) return rtf.format(Math.round(diffSeconds / 86_400), "day");
  return formatDate(date);
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
