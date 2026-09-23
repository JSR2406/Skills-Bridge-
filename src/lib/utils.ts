// ── LIB: utils
// `cn()` merges Tailwind classes (clsx + tailwind-merge) — the standard
// classnames helper used across all components.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
