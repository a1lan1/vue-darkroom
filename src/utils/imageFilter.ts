import type { ColorCorrection, ExportFormat } from '@/types'
import { clamp } from '@/utils/number'

const BLUR_RANGE_PX = 10
const ADJUSTMENT_RANGE = 100

const MIME_TYPES: Record<ExportFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
}

/**
 * Only lossy formats honour the quality setting. PNG re-encodes losslessly, so
 * exposing a quality slider next to it would be misleading.
 */
const LOSSLESS_FORMATS: ReadonlySet<ExportFormat> = new Set<ExportFormat>(['png'])

export function isQualitySupported (format: ExportFormat): boolean {
  return !LOSSLESS_FORMATS.has(format)
}

export function toMimeType (format: ExportFormat): string {
  return MIME_TYPES[format]
}

export function toFileExtension (format: ExportFormat): string {
  return FILE_EXTENSIONS[format]
}

/**
 * Builds the CSS `filter` value used for on-screen previews.
 *
 * The exact same string is handed to `CanvasRenderingContext2D.filter` during
 * export, which is what keeps the preview and the exported file identical.
 * Keep this function the single source of truth for both paths.
 */
export function buildImageFilter (correction: ColorCorrection): string {
  const brightness = clamp(correction.brightness, -ADJUSTMENT_RANGE, ADJUSTMENT_RANGE)
  const contrast = clamp(correction.contrast, -ADJUSTMENT_RANGE, ADJUSTMENT_RANGE)
  const saturation = clamp(correction.saturation, -ADJUSTMENT_RANGE, ADJUSTMENT_RANGE)
  const sepia = clamp(correction.sepia, 0, ADJUSTMENT_RANGE)
  const invert = clamp(correction.invert, 0, ADJUSTMENT_RANGE)
  const grayscale = clamp(correction.grayscale, 0, ADJUSTMENT_RANGE)
  const blurPx = clamp(correction.blur, 0, ADJUSTMENT_RANGE) / ADJUSTMENT_RANGE * BLUR_RANGE_PX

  return [
    `brightness(${100 + brightness}%)`,
    `contrast(${100 + contrast}%)`,
    `saturate(${100 + saturation}%)`,
    `sepia(${sepia}%)`,
    `grayscale(${grayscale}%)`,
    `invert(${invert}%)`,
    `blur(${blurPx}px)`,
  ].join(' ')
}
