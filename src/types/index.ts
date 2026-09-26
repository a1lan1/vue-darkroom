/**
 * Supported export image formats
 */
export type ExportFormat = 'jpeg' | 'png' | 'webp'

/**
 * Supported export image sizes (width in pixels or 'original')
 */
export type ExportSize = 'original' | '1920' | '1280' | '800'

/**
 * Non-destructive color correction applied to a photo.
 * All ranges are inclusive and expressed in percent.
 */
export interface ColorCorrection {
  /** Brightness adjustment (-100..100) */
  brightness: number
  /** Contrast adjustment (-100..100) */
  contrast: number
  /** Saturation adjustment (-100..100) */
  saturation: number
  /** Sepia effect (0..100) */
  sepia: number
  /** Invert colors (0..100) */
  invert: number
  /** Grayscale effect (0..100) */
  grayscale: number
  /** Blur strength (0..100), mapped to a 0..10px CSS radius */
  blur: number
}

/**
 * Non-destructive crop description, stored exactly as reported by
 * `Cropper#getData()`.
 *
 * The values are kept in the original's pixel units and are only resolved to a
 * canvas transform at render time, so a photo can be re-cropped any number of
 * times without ever re-encoding the source. `src` therefore always points at
 * the untouched file.
 */
export interface CropState {
  /** Left edge of the crop box inside the rotated source canvas */
  x: number
  /** Top edge of the crop box inside the rotated source canvas */
  y: number
  /** Crop box width in source pixels */
  width: number
  /** Crop box height in source pixels */
  height: number
  /** Rotation in degrees, 0..360 */
  rotate: number
  /** Horizontal zoom applied by the cropper, 1 = unzoomed */
  scaleX: number
  scaleY: number
  /** Target aspect ratio, `undefined` means free crop */
  aspectRatio?: number
}

/** Crop state of a photo that has not been cropped yet. */
export function createDefaultCropState (): CropState {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotate: 0,
    scaleX: 1,
    scaleY: 1,
  }
}

/** True when the photo carries a crop that differs from the untouched frame. */
export function hasCrop (crop: CropState, isCropped: boolean): boolean {
  return isCropped && (crop.width > 0 && crop.height > 0)
}

export interface PhotoItem extends ColorCorrection, CropState {
  id: string
  /** Object URL of the original, unre-encoded file. Revoked on removal. */
  src: string
  /** Small data URL used by the filmstrip. Generated on import. */
  thumbnailSrc?: string
  /** Human readable name of the imported file, used for export naming */
  name: string
  /** Byte size of the file as produced by the last export */
  exportedSize?: number
  /** True once a crop has been applied at least once */
  isCropped: boolean
}

export interface ExportOptions {
  quality: number
  size: ExportSize
  format: ExportFormat
}

/**
 * Minimal shape needed to render a photo. Keeps the export pipeline
 * independent of the store and of any Vue specific type.
 */
export interface RenderablePhoto extends ColorCorrection, CropState {
  /** Store id, used to attach export results back to the photo */
  id: string
  /** Object URL of the original file */
  src: string
  /** Human readable name, used for export naming and error reporting */
  name: string
  isCropped: boolean
}

export interface ExportProgress {
  /** Number of photos already written to the archive */
  completed: number
  total: number
}

export interface ExportedFile {
  /** Photo id, so the caller can attach the size back to its own record */
  photoId: string
  /** Name used inside the archive */
  entryName: string
  /** Byte size of the rendered file */
  size: number
}

export interface ExportResult {
  filename: string
  /** Byte size of the generated archive */
  size: number
  exported: ExportedFile[]
  /** Entry names that could not be processed */
  failed: string[]
}
