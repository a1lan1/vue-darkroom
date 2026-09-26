const UNITS = ['B', 'KB', 'MB', 'GB'] as const
const UNIT_STEP = 1024

/**
 * Formats a byte count for display, e.g. `1.5 MB`.
 * Returns `fallback` when the size is unknown.
 */
export function formatBytes (bytes: number | undefined, fallback = 'N/A'): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) {
    return fallback
  }

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(UNIT_STEP)),
    UNITS.length - 1,
  )

  return `${(bytes / UNIT_STEP ** exponent).toFixed(1)} ${UNITS[exponent]}`
}
