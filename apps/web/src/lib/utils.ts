import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a price in cents to a USD string. */
export function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "Free";
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format a number with K/M shorthand. */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Truncate a string to maxLength with ellipsis. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/** Delay for a given number of milliseconds (used in testing/demo). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
