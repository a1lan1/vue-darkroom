const UNITS = ['B', 'KB', 'MB', 'GB'] as const
const UNIT_STEP = 1024

/**
 * Formats a byte count for display, e.g. `1.5 MB`.
 * Returns `fallback` when the size is unknown.
 *
 * `precision` is the number of decimals. Pass 0 where the value has to fit a
 * narrow slot: the sidebar's export tile is three columns wide, and `847.2 KB`
 * wraps onto a second line there while `847 KB` does not.
 */
export function formatBytes (bytes: number | undefined, fallback = 'N/A', precision = 1): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) {
    return fallback
  }

  let exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(UNIT_STEP)),
    UNITS.length - 1,
  )

  let value = bytes / UNIT_STEP ** exponent

  /*
   * Rounding can carry into the next unit: 1023.7 B at zero precision is 1024,
   * which would read as a kilobyte. Promoting keeps the number and the unit
   * telling the same story.
   */
  if (precision <= 0 && Math.round(value) >= UNIT_STEP && exponent < UNITS.length - 1) {
    exponent += 1
    value = bytes / UNIT_STEP ** exponent
  }

  /*
   * `Number()` rather than the raw `toFixed()` string so a whole number reads as
   * "512 B" instead of "512.0 B": the trailing zero carried no information, and
   * in the thumbnail filmstrip it made the labels change width as sizes moved.
   */
  return `${Number(value.toFixed(precision))} ${UNITS[exponent]}`
}
