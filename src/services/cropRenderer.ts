/**
 * Non-destructive crop rendering.
 *
 * The crop is stored as the data reported by cropper.js (`getData()`) and is
 * resolved to pixels here, straight from the untouched original. Nothing is
 * ever re-encoded, so a photo can be re-cropped and re-exported any number of
 * times without generational loss.
 *
 * The transform intentionally mirrors cropper.js' own `getSourceCanvas()` and
 * `getCroppedCanvas()` implementations (cropperjs@1.5.x) so the exported image
 * is pixel-identical to what the crop box showed on screen. Re-deriving this
 * geometry by hand is what previously made the preview and the export
 * disagree.
 *
 * cropper.js reports the crop box in pixels of the *rotated* canvas, measured
 * from the canvas origin, and undoes the display zoom while doing so. The
 * source is therefore rebuilt as a full-size rotated canvas first, and the
 * crop rectangle is then cut out of it.
 */
import type { CropState } from '@/types'

export interface CropTransform {
  /** Target canvas size in pixels */
  width: number
  height: number
  /** Rotation in degrees, 0..360 */
  rotate: number
  /** Full-size rotated source canvas */
  fullWidth: number
  fullHeight: number
  /** Crop rectangle inside the rotated source, in pixels */
  sx: number
  sy: number
  sWidth: number
  sHeight: number
}

function normalizeDegrees (degrees: number): number {
  const normalized = degrees % 360

  return normalized < 0 ? normalized + 360 : normalized
}

function isQuarterTurned (degrees: number): boolean {
  return degrees === 90 || degrees === 270
}

/**
 * Pixel size of the full frame after `degrees` of rotation.
 *
 * cropper.js swaps the natural dimensions on a quarter turn, so the rotated
 * canvas is as wide as the source is tall. Callers that apply a rotation
 * without a live cropper need the same numbers to describe a full-frame crop.
 */
export function rotatedFrameSize (
  naturalWidth: number,
  naturalHeight: number,
  degrees: number,
): { width: number, height: number } {
  return isQuarterTurned(normalizeDegrees(degrees))
    ? { width: naturalHeight, height: naturalWidth }
    : { width: naturalWidth, height: naturalHeight }
}

/**
 * Resolves stored crop state into a concrete pixel transform.
 *
 * `naturalWidth`/`naturalHeight` are the unrotated natural dimensions of the
 * original image.
 */
export function computeCropTransform (
  naturalWidth: number,
  naturalHeight: number,
  crop: CropState,
): CropTransform {
  const rotate = normalizeDegrees(crop.rotate)
  const { width: fullWidth, height: fullHeight } = rotatedFrameSize(naturalWidth, naturalHeight, rotate)

  // cropper.js stores the box in the source's own pixel units; clamp it so a
  // stale value can never read outside the rebuilt canvas.
  const sx = Math.min(Math.max(crop.x, 0), fullWidth)
  const sy = Math.min(Math.max(crop.y, 0), fullHeight)
  const sWidth = Math.min(Math.max(crop.width, 1), fullWidth - sx)
  const sHeight = Math.min(Math.max(crop.height, 1), fullHeight - sy)

  return {
    width: Math.max(1, Math.round(sWidth)),
    height: Math.max(1, Math.round(sHeight)),
    rotate,
    fullWidth,
    fullHeight,
    sx,
    sy,
    sWidth,
    sHeight,
  }
}

/**
 * Draws the full image rotated and zoomed the way cropper.js renders it.
 *
 * Exported for tests and reused by callers that need the whole transformed
 * frame rather than the cropped region.
 */
export function renderRotatedSource (
  image: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
  crop: CropState,
): HTMLCanvasElement {
  const rotate = normalizeDegrees(crop.rotate)
  const { width, height } = rotatedFrameSize(naturalWidth, naturalHeight, rotate)

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }

  context.save()
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate((rotate * Math.PI) / 180)
  // Zoom is applied in the rotated frame, exactly like cropper.js does.
  context.scale(crop.scaleX || 1, crop.scaleY || 1)
  context.drawImage(
    image,
    -naturalWidth / 2,
    -naturalHeight / 2,
    naturalWidth,
    naturalHeight,
  )
  context.restore()

  return canvas
}

/**
 * Draws the cropped region of `image` onto a fresh canvas at natural size.
 *
 * `context.filter` must be empty when calling this: colour correction is
 * applied by the caller in a second pass, so that rotation and zoom never
 * sample outside the filtered layer.
 */
export function renderCrop (
  image: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
  crop: CropState,
): HTMLCanvasElement {
  const transform = computeCropTransform(naturalWidth, naturalHeight, crop)

  // The zoomed-out case (scaleX < 1) is expressed as an explicit rectangle
  // covering the whole rotated frame, which keeps the output free of the
  // transparent corners a smaller canvas would introduce.
  if ((crop.scaleX || 1) < 1 || (crop.scaleY || 1) < 1) {
    return renderRotatedSource(image, naturalWidth, naturalHeight, crop)
  }

  const full = renderRotatedSource(image, naturalWidth, naturalHeight, crop)
  const canvas = document.createElement('canvas')
  canvas.width = transform.width
  canvas.height = transform.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }

  context.drawImage(
    full,
    transform.sx,
    transform.sy,
    transform.sWidth,
    transform.sHeight,
    0,
    0,
    transform.width,
    transform.height,
  )

  return canvas
}
