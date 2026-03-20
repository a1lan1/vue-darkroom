import { storeToRefs } from 'pinia'
import { useHotkey } from 'vuetify'
import { usePhotoStore } from '@/stores/PhotoStore'

export function useEditorHotkeys () {
  const photoStore = usePhotoStore()
  const { photos, activePhotoId } = storeToRefs(photoStore)
  const { setActive, removePhoto } = photoStore

  // Navigate photos
  useHotkey('Alt+ArrowLeft', () => {
    const currentIndex = photos.value.findIndex(p => p.id === activePhotoId.value)
    if (currentIndex > 0) {
      setActive(photos.value[currentIndex - 1].id)
    }
  })

  useHotkey('Alt+ArrowRight', () => {
    const currentIndex = photos.value.findIndex(p => p.id === activePhotoId.value)
    if (currentIndex < photos.value.length - 1) {
      setActive(photos.value[currentIndex + 1].id)
    }
  })

  // Remove photo
  useHotkey('Backspace', () => {
    if (activePhotoId.value) {
      removePhoto(activePhotoId.value)
    }
  })
}
