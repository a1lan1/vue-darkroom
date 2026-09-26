<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { ref, watch } from 'vue'
  import { useAppStore } from '@/stores/appStore'
  import { usePhotoStore } from '@/stores/photoStore'

  const photoStore = usePhotoStore()
  const appStore = useAppStore()
  const { importTrigger } = storeToRefs(appStore)

  const fileInput = ref<HTMLInputElement | null>(null)

  function openPicker (): void {
    fileInput.value?.click()
  }
  async function handleFileSelect (event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])

    // Reset before awaiting so selecting the same file twice still fires
    // `change`.
    input.value = ''

    const images = files.filter(file => file.type.startsWith('image/'))

    if (images.length === 0) {
      return
    }

    const { imported, failed } = await photoStore.addPhotosFromFiles(images)

    if (imported.length > 0) {
      appStore.notify(
        failed.length > 0
          ? `Imported ${imported.length} photo(s), skipped ${failed.length}`
          : `Imported ${imported.length} photo(s)`,
      )
    }

    if (failed.length > 0) {
      appStore.notify(`Could not import ${failed.join(', ')}`)
    }
  }

  // The store owns a request counter; this component owns the hidden input.
  watch(importTrigger, () => openPicker())
</script>

<template>
  <input
    ref="fileInput"
    accept="image/*"
    class="d-none"
    multiple
    type="file"
    @change="handleFileSelect"
  >
</template>
