/**
 * Restricts a number to the inclusive `[min, max]` range.
 * Non-finite input collapses to `min`.
 */
export function clamp (value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}
