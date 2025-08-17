import type Cropper from 'cropperjs'
import Compressor from 'compressorjs'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { defineStore } from 'pinia'

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
  clarity: number
  temperature: number
  tint: number
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
}

interface PhotoStoreState {
  photos: PhotoItem[]
  isExporting: boolean
  activePhotoId: string | null
  exportQuality: number // 0–100
  cropper: Cropper | null
}

export const usePhotoStore = defineStore('photo', {
  state: (): PhotoStoreState => ({
    photos: [],
    isExporting: false,
    activePhotoId: null,
    exportQuality: 80,
    cropper: null,
  }),

  getters: {
    activePhoto (state): PhotoItem | null {
      return state.photos.find(p => p.id === state.activePhotoId) || null
    },
  },

  actions: {
    addPhotoFromFile (file: File) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        const id = crypto.randomUUID()
        this.photos.push({
          id,
          src: reader.result as string,
          quality: 80,
          brightness: 0,
          contrast: 0,
          saturation: 0,
          clarity: 0,
          temperature: 0,
          tint: 0,
        })

        if (!this.activePhotoId) {
          this.activePhotoId = id
        }
      })
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      reader.onerror = error => {
        console.error('FileReader error:', error)
      }
      reader.readAsDataURL(file)
    },
    addPhotoFromSrc (src: string) {
      const id = crypto.randomUUID()
      this.photos.push({
        id,
        src,
        quality: 80,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        clarity: 0,
        temperature: 0,
        tint: 0,
      })
      if (!this.activePhotoId) {
        this.activePhotoId = id
      }
    },
    setEditedSrc (editedSrc: string) {
      if (this.activePhoto) {
        this.activePhoto.editedSrc = editedSrc
      }
    },
    setFileSize (id: string, size: number) {
      const photo = this.photos.find(p => p.id === id)
      if (photo) {
        photo.fileSize = size
      }
    },
    setActive (id: string) {
      // Сохраняем состояние кропа для текущего активного фото
      if (this.cropper && this.activePhoto) {
        this.activePhoto.cropData = this.cropper.getData()
        const container = this.cropper.getContainerData()
        this.activePhoto.aspectRatio = container.width / container.height
      }
      // Переключаемся на новое фото
      this.activePhotoId = id
    },
    removePhoto (id: string) {
      const index = this.photos.findIndex(p => p.id === id)
      if (index !== -1) {
        this.photos.splice(index, 1)
        // If we removed the active photo, set the next one as active
        if (this.activePhotoId === id) {
          this.activePhotoId = this.photos.length > 0 ? this.photos[Math.min(index, this.photos.length - 1)].id : null
        }
      }
    },

    // Cropper methods
    setCropper (cropper: Cropper | null) {
      this.cropper = cropper
    },

    destroyCropper () {
      if (this.cropper) {
        this.cropper.destroy()
        this.cropper = null
      }
    },
    async exportAll () {
      if (this.photos.length === 0) return

      this.isExporting = true

      const zip = new JSZip()

      for (const photo of this.photos) {
        const file = await new Promise<File>((resolve, reject) => {
          // Convert base64 string to Blob
          const base64Data = photo.editedSrc || photo.src
          const base64DataPart = base64Data.split(',')[1]
          const byteCharacters = atob(base64DataPart)
          const byteNumbers = new Uint8Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.codePointAt(i) || 0
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'image/jpeg' })

          new Compressor(blob, {
            quality: this.exportQuality / 100,
            mimeType: 'image/jpeg',
            success: result => {
              const f = new File([result], `photo-${photo.id}.jpg`, { type: result.type })
              this.setFileSize(photo.id, f.size)
              resolve(f)
            },
            error (err) {
              reject(err)
            },
          })
        })
        zip.file(`photo-${photo.id}.jpg`, file)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'photos.zip')
    },
  },
})
