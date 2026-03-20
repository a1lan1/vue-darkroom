<script setup lang="ts">
  import { ref } from 'vue'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { addPhotoFromFile } = photoStore

  const fileInput = ref<HTMLInputElement>()

  function triggerImport () {
    fileInput.value?.click()
  }

  function handleFileSelect (e: Event) {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])

    for (const file of files) {
      addPhotoFromFile(file)
    }

    target.value = ''
  }

  defineExpose({
    triggerImport,
  })
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
