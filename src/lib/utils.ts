import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merge helper used by every shadcn/ui component.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Derive initials from a name when the DB column is empty.
export function initialsFrom(name: string | null | undefined, fallback = "?") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]).join("");
  return letters.toUpperCase() || fallback;
}
