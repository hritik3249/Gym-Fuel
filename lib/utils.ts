import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes, resolving conflicts in favor of the rightmost class. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
}

/** Percentage of a goal reached, capped at 140% so over-achievement still reads cleanly in UI. */
export function clampProgress(consumed: number, goal: number) {
  if (!goal) return 0;
  return Math.min(Math.round((consumed / goal) * 100), 140);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
