import type Cropper from 'cropperjs'
import type { PhotoItem, PhotoStoreState } from '@/types'
import Compressor from 'compressorjs'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { defineStore } from 'pinia'

export const usePhotoStore = defineStore('photo', {
  state: (): PhotoStoreState => ({
    photos: [],
    isExporting: false,
    activePhotoId: null,
    exportQuality: 80,
    exportSize: 'original',
    exportFormat: 'jpeg',
    cropper: null,
  }),

  getters: {
    activePhoto (state): PhotoItem | undefined {
      return state.photos.find(p => p.id === state.activePhotoId)
    },
    imageFilter (): string {
      const filters = [
        `brightness(${100 + (this.activePhoto?.brightness || 0)}%)`,
        `contrast(${100 + (this.activePhoto?.contrast || 0)}%)`,
        `saturate(${100 + (this.activePhoto?.saturation || 0)}%)`,
        `sepia(${Math.abs(this.activePhoto?.sepia || 0)}%)`,
        `grayscale(${Math.abs(this.activePhoto?.grayscale || 0)}%)`,
        `invert(${Math.max(0, Math.min(100, this.activePhoto?.invert || 0))}%)`,
        `blur(${Math.max(0, Math.abs(this.activePhoto?.blur || 0) / 10)}px)`,
      ]

      return filters.join(' ')
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
          blur: 0,
          saturation: 0,
          sepia: 0,
          invert: 0,
          grayscale: 0,
        })

        if (!this.activePhotoId) {
          this.activePhotoId = id
        }
      })

      reader.readAsDataURL(file)
    },
    setPreviewSrc (previewSrc: string) {
      if (this.activePhoto) {
        this.activePhoto.previewSrc = previewSrc
      }
    },
    setFileSize (id: string, size: number) {
      const photo = this.photos.find(p => p.id === id)
      if (photo) {
        photo.fileSize = size
      }
    },
    setActive (id: string) {
      // Save current crop state if active
      if (this.cropper && this.activePhoto) {
        this.activePhoto.cropData = this.cropper.getData()
      }
      this.activePhotoId = id
    },
    removePhoto (id: string) {
      const index = this.photos.findIndex(p => p.id === id)
      if (index !== -1) {
        this.photos.splice(index, 1)
        if (this.activePhotoId === id) {
          this.activePhotoId = this.photos.length > 0 ? this.photos[Math.min(index, this.photos.length - 1)].id : null
        }
      }
    },
    setCropper (cropper: Cropper | null) {
      this.cropper = cropper
    },
    destroyCropper () {
      if (this.cropper) {
        this.cropper.destroy()
        this.cropper = null
      }
    },
    resetCrop () {
      if (this.activePhoto) {
        this.activePhoto.previewSrc = undefined
        this.activePhoto.cropData = undefined
        this.activePhoto.aspectRatio = undefined
      }
    },
    resetColorCorrection () {
      if (this.activePhoto) {
        this.activePhoto.brightness = 0
        this.activePhoto.contrast = 0
        this.activePhoto.saturation = 0
        this.activePhoto.sepia = 0
        this.activePhoto.invert = 0
        this.activePhoto.grayscale = 0
        this.activePhoto.blur = 0
      }
    },
    async exportAll () {
      if (this.photos.length === 0) {
        return
      }

      this.isExporting = true

      const zip = new JSZip()
      const maxWidth = this.exportSize === 'original' ? undefined : Number(this.exportSize)
      const mimeType = `image/${this.exportFormat}`
      const extension = this.exportFormat === 'jpeg' ? 'jpg' : this.exportFormat

      for (const photo of this.photos) {
        // Create a temporary canvas to apply filters
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        const img = new Image()

        // Use previewSrc (cropped) or src (original)
        img.src = photo.previewSrc || photo.src

        await new Promise<void>(resolve => {
          if (img.complete) {
            resolve()
          } else {
            img.addEventListener('load', () => resolve())
          }
        })

        if (!tempCtx) {
          continue
        }

        tempCanvas.width = img.naturalWidth
        tempCanvas.height = img.naturalHeight

        // Construct filter string for this specific photo
        const filters = [
          `brightness(${100 + photo.brightness}%)`,
          `contrast(${100 + photo.contrast}%)`,
          `saturate(${100 + photo.saturation}%)`,
          `sepia(${Math.abs(photo.sepia)}%)`,
          `grayscale(${Math.abs(photo.grayscale)}%)`,
          `invert(${Math.max(0, Math.min(100, photo.invert))}%)`,
          `blur(${Math.max(0, Math.abs(photo.blur) / 10)}px)`,
        ].join(' ')

        tempCtx.filter = filters
        tempCtx.drawImage(img, 0, 0)

        // Convert canvas to blob
        const blob = await new Promise<Blob | null>(resolve =>
          tempCanvas.toBlob(resolve, mimeType, this.exportQuality / 100),
        )

        if (!blob) {
          continue
        }

        const file = await new Promise<File>((resolve, reject) => {
          new Compressor(blob, {
            quality: this.exportQuality / 100, // Compressor also takes quality, but we already applied it on canvas export mostly. It's fine to double check.
            mimeType,
            maxWidth,
            success: result => {
              const f = new File([result], `photo-${photo.id}.${extension}`, { type: result.type })
              this.setFileSize(photo.id, f.size)
              resolve(f)
            },
            error (err) {
              reject(err)
            },
          })
        })
        zip.file(`photo-${photo.id}.${extension}`, file)
      }

      const content = await zip.generateAsync({ type: 'blob' })

      const timestamp = Date.now()
      const filename = `${timestamp}_photos_quality_${this.exportQuality}_size_${this.exportSize}_format_${this.exportFormat}.zip`

      saveAs(content, filename)

      this.isExporting = false
    },
  },
})
