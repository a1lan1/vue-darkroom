import { storeToRefs } from 'pinia'
import { useHotkey } from 'vuetify'
import { guardHotkey, guardTextEntry } from '@/composables/useSafeHotkey'
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

  // Navigation is an application-level action, so it must not depend on which
  // control holds the focus. Importing leaves the focus on the trigger button,
  // and a strict guard silently swallowed these shortcuts until the user
  // clicked a thumbnail.
  useHotkey('Alt+ArrowLeft', guardTextEntry(() => moveActive(-1)))
  useHotkey('Alt+ArrowRight', guardTextEntry(() => moveActive(1)))

  // Deleting is destructive and would fight with the focused control, so this
  // one keeps the strict guard.
  useHotkey('Backspace', guardHotkey(() => {
    if (activePhotoId.value) {
      removePhoto(activePhotoId.value)
    }
  }))
}
