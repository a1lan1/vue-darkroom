import { defineStore } from 'pinia'
import Compressor from 'compressorjs'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import Cropper from 'cropperjs'

export interface PhotoItem {
  id: string
  src: string // original
  editedSrc?: string // processed preview
  fileSize?: number // after export
  quality: number // 0–100
}

export const usePhotoStore = defineStore('photo', {
  state: () => ({
    photos: [] as PhotoItem[],
    activePhotoId: null as string | null,
    exportQuality: 80,
    cropper: null as Cropper | null,
  }),
  getters: {
    activePhoto(state): PhotoItem | null {
      return state.photos.find(p => p.id === state.activePhotoId) || null
    },
  },
  actions: {
    addPhotoFromFile(file: File) {
      console.log('addPhotoFromFile called with:', file.name, file.type, file.size)
      const reader = new FileReader()
      reader.onload = () => {
        console.log('FileReader onload triggered')
        const id = crypto.randomUUID()
        this.photos.push({ id, src: reader.result as string, quality: 80 })
        console.log('Photo added to store, total photos:', this.photos.length)
        if (!this.activePhotoId) this.activePhotoId = id
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
      }
      reader.readAsDataURL(file)
    },
    addPhotoFromSrc(src: string) {
      const id = crypto.randomUUID()
      this.photos.push({ id, src, quality: 80 })
      if (!this.activePhotoId) this.activePhotoId = id
    },
    setEdited(id: string, editedSrc: string) {
      const photo = this.photos.find(p => p.id === id)
      if (photo) photo.editedSrc = editedSrc
    },
    setFileSize(id: string, size: number) {
      const photo = this.photos.find(p => p.id === id)
      if (photo) photo.fileSize = size
    },
    setActive(id: string) {
      this.activePhotoId = id
    },
    removePhoto(id: string) {
      const index = this.photos.findIndex(p => p.id === id)
      if (index > -1) {
        this.photos.splice(index, 1)
        // If we removed the active photo, set the next one as active
        if (this.activePhotoId === id) {
          if (this.photos.length > 0) {
            this.activePhotoId = this.photos[Math.min(index, this.photos.length - 1)].id
          } else {
            this.activePhotoId = null
          }
        }
      }
    },
    
    // Cropper methods
    setCropper(cropper: Cropper | null) {
      this.cropper = cropper
    },
    
    destroyCropper() {
      if (this.cropper) {
        this.cropper.destroy()
        this.cropper = null
      }
    },
    async exportAll() {
      if (this.photos.length === 0) return
      
      const zip = new JSZip()

      for (const photo of this.photos) {
        const file = await new Promise<File>((resolve, reject) => {
          // Convert base64 string to Blob
          const base64Data = photo.editedSrc || photo.src
          const byteCharacters = atob(base64Data.split(',')[1])
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'image/jpeg' })
          
          const store = this
          new Compressor(blob, {
            quality: store.exportQuality / 100,
            mimeType: 'image/jpeg',
            success(result) {
              const f = new File([result], `photo-${photo.id}.jpg`, { type: result.type })
              store.setFileSize(photo.id, f.size)
              resolve(f)
            },
            error(err) { reject(err) },
          })
        })
        zip.file(`photo-${photo.id}.jpg`, file)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'photos.zip')
    },
  },
})
