import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class name inputs with Tailwind-aware deduplication.
 * Pure utility suitable for the shared kernel layer.
 *
 * @example
 * cn("flex", "bg-red-500", isActive && "ring-2")
 * // Returns merged Tailwind classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}