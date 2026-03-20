/**
 * Supported export image formats
 */
export type ExportFormat = 'jpeg' | 'png' | 'webp'

/**
 * Supported export image sizes (width in pixels or 'original')
 */
export type ExportSize = 'original' | '1920' | '1280' | '800'

export interface PhotoItem {
  id: string
  /** Original image source (base64 or URL) */
  src: string
  /** Cropped preview image source (base64) without filters */
  previewSrc?: string
  /** File size in bytes after export */
  fileSize?: number
  /** Compression quality (0-100) */
  quality: number

  // Color correction settings
  /** Brightness adjustment (-100 to 100) */
  brightness: number
  /** Contrast adjustment (-100 to 100) */
  contrast: number
  /** Saturation adjustment (-100 to 100) */
  saturation: number
  /** Sepia effect (0 to 100) */
  sepia: number
  /** Invert colors (0 to 100) */
  invert: number
  /** Grayscale effect (0 to 100) */
  grayscale: number
  /** Blur radius in pixels (0 to 100) */
  blur: number

  // Crop data
  cropData?: Cropper.Data
  aspectRatio?: number
}

export interface PhotoStoreState {
  photos: PhotoItem[]
  isExporting: boolean
  activePhotoId: string | null
  /** Global export quality setting (0-100) */
  exportQuality: number
  /** Global export size setting */
  exportSize: ExportSize
  /** Global export format setting */
  exportFormat: ExportFormat
  cropper: Cropper | null
}
