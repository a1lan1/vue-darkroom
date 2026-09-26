import { storeToRefs } from 'pinia'
import { useHotkey } from 'vuetify'
import { guardHotkey } from '@/composables/useSafeHotkey'
import { usePhotoStore } from '@/stores/photoStore'

export function useEditorHotkeys () {
  const photoStore = usePhotoStore()
  const { photos, activePhotoId } = storeToRefs(photoStore)
  const { setActive, removePhoto } = photoStore

  function moveActive (offset: number): void {
    const currentIndex = photos.value.findIndex(photo => photo.id === activePhotoId.value)

    if (currentIndex === -1) {
      return
    }

    const nextIndex = currentIndex + offset
    const next = photos.value[nextIndex]

    if (next) {
      setActive(next.id)
    }
  }

  useHotkey('Alt+ArrowLeft', guardHotkey(() => moveActive(-1)))
  useHotkey('Alt+ArrowRight', guardHotkey(() => moveActive(1)))

  useHotkey('Backspace', guardHotkey(() => {
    if (activePhotoId.value) {
      removePhoto(activePhotoId.value)
    }
  }))
}
