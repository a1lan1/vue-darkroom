<script setup lang="ts">
  import { onUnmounted, ref } from 'vue'
  import HelpDialog from '@/components/HelpDialog.vue'
  import PhotoEditor from '@/components/PhotoEditor.vue'
  import TheToolbar from '@/components/TheToolbar.vue'
  import { useDragDrop } from '@/composables/useDragDrop'
  import { useEditorHotkeys } from '@/composables/useEditorHotkeys'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { addPhotoFromFile, destroyCropper } = photoStore

  const showHelp = ref(false)
  const fileInput = ref<HTMLInputElement>()

  // Logic
  useEditorHotkeys()

  const { isDragOver, dragEvents } = useDragDrop(files => {
    for (const file of files) {
      addPhotoFromFile(file)
    }
  })

  function handleFileSelect (e: Event) {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])

    for (const file of files) {
      addPhotoFromFile(file)
    }

    target.value = ''
  }

  onUnmounted(destroyCropper)
</script>

<template>
  <TheToolbar
    @import="() => fileInput?.click()"
    @show-help="showHelp = true"
  />

  <!-- Hidden file input -->
  <input
    ref="fileInput"
    accept="image/*"
    class="d-none"
    multiple
    type="file"
    @change="handleFileSelect"
  >

  <!-- Main Content -->
  <v-main class="bg-black text-white pa-0 h-100">
    <div
      class="h-100 d-flex align-center justify-center"
      v-bind="dragEvents"
    >
      <!-- Drag Indicator -->
      <div
        v-if="isDragOver"
        class="position-absolute inset-0 bg-opacity-10 pointer-events-none z-10 d-flex align-center justify-center"
      >
        <div class="text-center bg-grey-darken-4 pa-8 rounded-lg">
          <v-icon class="mb-4" color="primary" size="64">mdi-cloud-upload</v-icon>
          <h2 class="text-h4 text-primary font-weight-bold mb-2">Drop Images Here</h2>
          <p class="text-body-1 text-grey">Release to import your photos</p>
          <v-progress-circular
            class="mt-4"
            color="primary"
            indeterminate
            size="32"
          />
        </div>
      </div>

      <PhotoEditor />
    </div>
  </v-main>

  <HelpDialog v-model="showHelp" />
</template>

<style lang="scss" scoped>
.bg-opacity-10 {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.pointer-events-none {
  pointer-events: none;
}

.z-10 {
  z-index: 10;
}
</style>
