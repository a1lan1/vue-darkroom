import { describe, expect, it } from 'vitest'
import { formatBytes } from '@/utils/formatBytes'

const KB = 1024
const MB = KB * 1024
const GB = MB * 1024

describe('formatBytes', () => {
  it('falls back for sizes that are missing or not positive', () => {
    expect(formatBytes(undefined)).toBe('N/A')
    expect(formatBytes(Number.NaN)).toBe('N/A')
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('N/A')
    expect(formatBytes(0)).toBe('N/A')
    expect(formatBytes(-1)).toBe('N/A')
  })

  it('uses the fallback it was given instead of the default one', () => {
    expect(formatBytes(0, '—')).toBe('—')
  })

  it('keeps a decimal by default', () => {
    expect(formatBytes(847 * KB + 200)).toBe('847.2 KB')
    expect(formatBytes(1.5 * MB)).toBe('1.5 MB')
  })

  /*
   * `Number()` rather than the raw `toFixed()` string, so a whole number reads
   * as "512 B" instead of "512.0 B". The trailing zero carried no information
   * and made the thumbnail labels jitter as sizes changed.
   */
  it('drops a trailing zero decimal', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1 * MB)).toBe('1 MB')
  })

  /*
   * The sidebar's export tile is a third of a 320px panel wide. A decimal
   * pushed "847.2 KB" onto a second line there, so the tile asks for whole
   * units instead. These lock that narrower form down.
   */
  it('drops the decimal when precision is zero', () => {
    expect(formatBytes(847 * KB + 200, '—', 0)).toBe('847 KB')
    expect(formatBytes(1.5 * MB, '—', 0)).toBe('2 MB')
    expect(formatBytes(2 * GB, '—', 0)).toBe('2 GB')
  })

  /*
   * Rounding can carry into the next unit. 1023.7 B rounds to 1024, which as
   * plain bytes would read as a kilobyte and be a kibibyte out.
   */
  it('promotes to the next unit when rounding carries over', () => {
    expect(formatBytes(1023.7, '—', 0)).toBe('1 KB')
    expect(formatBytes(1023, '—', 0)).toBe('1023 B')
  })

  it('never reports a rounded zero for a size that exists', () => {
    expect(formatBytes(1, '—', 0)).toBe('1 B')
    expect(formatBytes(0.4 * KB, '—', 0)).toBe('410 B')
  })

  it('clamps to the largest unit instead of inventing a bigger one', () => {
    expect(formatBytes(4096 * GB, '—', 0)).toBe('4096 GB')
  })
})
