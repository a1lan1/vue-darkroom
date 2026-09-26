import type Cropper from 'cropperjs'
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { exportAllPhotos } from '@/services/imageExport'
import { createPhotoItem, loadPhoto, releasePhotoSource } from '@/services/photoLoader'
import { type ColorCorrection, createDefaultCropState, type ExportFormat, type ExportProgress, type ExportSize, type PhotoItem } from '@/types'
import { buildImageFilter } from '@/utils/imageFilter'

const NEUTRAL_CORRECTION: ColorCorrection = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sepia: 0,
  invert: 0,
  grayscale: 0,
  blur: 0,
}

/**
 * Fallback for insecure contexts where `crypto.randomUUID` is unavailable,
 * e.g. when the app is served over plain HTTP on a LAN address.
 */
function createId (): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export interface ImportResult {
  /** Photos that were added to the store */
  imported: PhotoItem[]
  /** Names of the files that could not be read */
  failed: string[]
}

export function isPhotoEdited (photo: PhotoItem): boolean {
  return photo.isCropped
    || photo.brightness !== 0
    || photo.contrast !== 0
    || photo.saturation !== 0
    || photo.sepia !== 0
    || photo.invert !== 0
    || photo.grayscale !== 0
    || photo.blur !== 0
}

export const usePhotoStore = defineStore('photo', {
  state: () => ({
    photos: [] as PhotoItem[],
    activePhotoId: null as string | null,
    isExporting: false,
    exportProgress: null as ExportProgress | null,
    exportQuality: 80,
    exportSize: 'original' as ExportSize,
    exportFormat: 'jpeg' as ExportFormat,
    isCropping: false,
    /**
     * The live cropper is a DOM-bound third-party instance. `markRaw` keeps it
     * out of the reactivity system so Vue never proxies it.
     */
    cropper: null as Cropper | null,
  }),

  getters: {
    activePhoto (state): PhotoItem | undefined {
      return state.photos.find(photo => photo.id === state.activePhotoId)
    },

    totalPhotos (state): number {
      return state.photos.length
    },

    editedPhotos (state): number {
      return state.photos.filter(photo => isPhotoEdited(photo)).length
    },

    /** Combined size of the files produced by the last export. */
    totalExportedSize (state): number {
      return state.photos.reduce((total, photo) => total + (photo.exportedSize ?? 0), 0)
    },

    isEmpty (state): boolean {
      return state.photos.length === 0
    },

    /**
     * CSS filter for the active photo. The export pipeline rebuilds the exact
     * same string, which is what keeps the preview and the file identical.
     */
    imageFilter (): string {
      return buildImageFilter(this.activePhoto ?? NEUTRAL_CORRECTION)
    },
  },

  actions: {
    resetColorCorrection (photo: PhotoItem | undefined): void {
      if (photo) {
        Object.assign(photo, NEUTRAL_CORRECTION)
      }
    },

    /**
     * Imports a batch of files.
     *
     * Every file is independent: one unreadable image is reported instead of
     * discarding the photos that loaded fine. Order follows the input, so the
     * filmstrip does not reshuffle depending on which thumbnail decoded first.
     */
    async addPhotosFromFiles (files: File[]): Promise<ImportResult> {
      const settled = await Promise.allSettled(
        files.map(async file => createPhotoItem(await loadPhoto(file, createId()))),
      )

      const imported: PhotoItem[] = []
      const failed: string[] = []

      for (const [index, result] of settled.entries()) {
        if (result.status === 'fulfilled') {
          imported.push(result.value)
        } else {
          failed.push(files[index]?.name ?? 'unknown')
          console.error(`[import] failed for ${files[index]?.name ?? 'unknown'}`, result.reason)
        }
      }

      if (imported.length > 0) {
        this.photos.unshift(...imported)
        this.activePhotoId ??= imported[0]?.id ?? null
      }

      return { imported, failed }
    },

    setActive (id: string): void {
      this.persistCrop()
      this.activePhotoId = id
    },

    removePhoto (id: string): void {
      const index = this.photos.findIndex(photo => photo.id === id)

      if (index === -1) {
        return
      }

      const [removed] = this.photos.splice(index, 1)
      releasePhotoSource(removed)

      if (this.activePhotoId === id) {
        this.activePhotoId = this.photos[Math.min(index, this.photos.length - 1)]?.id ?? null
      }
    },

    clearPhotos (): void {
      for (const photo of this.photos) {
        releasePhotoSource(photo)
      }

      this.photos = []
      this.activePhotoId = null
    },

    setExportedSize (id: string, size: number): void {
      const photo = this.photos.find(item => item.id === id)

      if (photo) {
        photo.exportedSize = size
      }
    },

    /**
     * Renders every photo into a zip archive.
     *
     * Re-entrant calls are ignored and `isExporting` is always cleared, so the
     * progress indicator can never get stuck.
     */
    async exportAll (): Promise<void> {
      if (this.isExporting || this.photos.length === 0) {
        return
      }

      const total = this.photos.length

      this.isExporting = true
      this.exportProgress = { completed: 0, total }

      try {
        const result = await exportAllPhotos({
          photos: this.photos.map(photo => ({ ...photo })),
          options: {
            quality: this.exportQuality,
            size: this.exportSize,
            format: this.exportFormat,
          },
          onProgress: progress => {
            this.exportProgress = progress
          },
        })

        if (result.failed.length > 0) {
          console.warn(`[export] skipped ${result.failed.length} photo(s)`, result.failed)
        }

        for (const file of result.exported) {
          this.setExportedSize(file.photoId, file.size)
        }
      } catch (error) {
        console.error('[export] failed', error)
        throw error
      } finally {
        this.isExporting = false
        this.exportProgress = null
      }
    },

    resetCrop (): void {
      const photo = this.activePhoto

      if (!photo) {
        return
      }

      Object.assign(photo, createDefaultCropState())
      photo.isCropped = false

      this.cropper?.reset()
    },

    resetAdjustments (): void {
      this.resetColorCorrection(this.activePhoto)
    },

    setCropper (cropper: Cropper | null): void {
      this.cropper = cropper ? markRaw(cropper) : null
    },

    destroyCropper (): void {
      this.cropper?.destroy()
      this.cropper = null
    },

    /**
     * Copies the live cropper transform onto the active photo so the crop
     * survives navigation away from the editor.
     */
    persistCrop (): void {
      const photo = this.activePhoto

      if (!photo || !this.cropper) {
        return
      }

      const data = this.cropper.getData()

      if (data.width <= 0 || data.height <= 0) {
        return
      }

      Object.assign(photo, {
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        rotate: data.rotate ?? 0,
        scaleX: data.scaleX || 1,
        scaleY: data.scaleY || 1,
        aspectRatio: photo.aspectRatio,
      })
      photo.isCropped = true
    },
  },
})
