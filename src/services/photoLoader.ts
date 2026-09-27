import { createDefaultCropState, type PhotoItem } from '@/types'

const THUMBNAIL_MAX_EDGE = 240
const THUMBNAIL_QUALITY = 0.7
const THUMBNAIL_MIME = 'image/jpeg'

/**
 * Canvas implementations refuse to allocate beyond this area. Browsers throw
 * instead of returning a smaller canvas, so oversized crops are rejected up
 * front rather than blowing up mid-export.
 */
const MAX_CANVAS_AREA = 16_777_216

export function exceedsCanvasLimits (width: number, height: number): boolean {
  return width * height > MAX_CANVAS_AREA
}

/**
 * Decodes a URL into a drawable image.
 *
 * Exported so the crop preview can re-read the untouched original instead of
 * the on-screen element, which may be showing a downscaled preview already.
 */
export function loadImage (src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener(
      'error',
      () => reject(new Error(`Failed to load image: ${src.slice(0, 64)}`)),
      { once: true },
    )

    image.src = src
  })
}

/**
 * Renders a small preview used by the filmstrip. The original is never
 * touched: only the object URL of the source file is read.
 *
 * Returns `undefined` when the browser refuses to rasterize the image so the
 * caller can fall back to the full-size source.
 */
export async function renderThumbnail (src: string): Promise<string | undefined> {
  let image: HTMLImageElement

  try {
    image = await loadImage(src)
  } catch {
    return undefined
  }

  const { naturalWidth: width, naturalHeight: height } = image

  if (!width || !height) {
    return undefined
  }

  const scale = Math.min(1, THUMBNAIL_MAX_EDGE / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')

  if (!context) {
    return undefined
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  try {
    return canvas.toDataURL(THUMBNAIL_MIME, THUMBNAIL_QUALITY)
  } catch {
    // Safari throws when the canvas is tainted or too large.
    return undefined
  }
}

export interface LoadedPhoto {
  id: string
  src: string
  thumbnailSrc?: string
  name: string
}

/**
 * Turns a `File` into a `PhotoItem` payload backed by an object URL.
 *
 * Object URLs keep the file in its original encoding instead of inflating it
 * into a base64 data URL, and they are cheap to create. The caller owns the
 * returned URL and must release it via {@link releasePhotoSource}.
 */
export async function loadPhoto (file: File, id: string): Promise<LoadedPhoto> {
  const src = URL.createObjectURL(file)

  try {
    const thumbnailSrc = await renderThumbnail(src)

    return {
      id,
      src,
      thumbnailSrc,
      name: file.name,
    }
  } catch (error) {
    // The URL is already registered, so it has to be released here or it
    // leaks for the lifetime of the document.
    URL.revokeObjectURL(src)

    throw error
  }
}

export function createPhotoItem (photo: LoadedPhoto): PhotoItem {
  return {
    ...photo,
    ...createDefaultCropState(),
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sepia: 0,
    invert: 0,
    grayscale: 0,
    blur: 0,
    isCropped: false,
  }
}

export function releasePhotoSource (photo: PhotoItem): void {
  URL.revokeObjectURL(photo.src)
}
