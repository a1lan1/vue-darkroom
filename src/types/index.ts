export interface PhotoItem {
  id: string
  src: string // original
  editedSrc?: string // processed preview
  fileSize?: number // after export
  quality: number // 0–100

  // Color correction settings
  brightness: number
  contrast: number
  saturation: number
  sepia: number
  invert: number
  grayscale: number
  blur: number

  // Crop data
  cropData?: {
    x: number
    y: number
    width: number
    height: number
    rotate: number
    scaleX: number
    scaleY: number
  }
  aspectRatio?: number
  cropAspectRatio?: number
}

export interface PhotoStoreState {
  photos: PhotoItem[]
  isExporting: boolean
  activePhotoId: string | null
  exportQuality: number // 0–100
  cropper: Cropper | null
}
