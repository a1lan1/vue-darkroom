<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { onMounted, ref } from 'vue'
  import { useHotkey } from 'vuetify'
  import PhotoEditor from '@/components/PhotoEditor.vue'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { photos, activePhotoId } = storeToRefs(photoStore)
  const { exportAll, setActive, removePhoto, addPhotoFromFile, destroyCropper } = photoStore

  const showHelp = ref(false)
  const isDragOver = ref(false)
  const fileInput = ref<HTMLInputElement>()

  // Hotkeys
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

  useHotkey('Backspace', () => {
    if (activePhotoId.value) {
      removePhoto(activePhotoId.value)
    }
  })

  // Drag & Drop
  function handleDragOver (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragOver.value = true
  }

  function handleDragEnter (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragOver.value = true
  }

  function handleDragLeave (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Only hide overlay if we're leaving the main container
    if (e.currentTarget === e.target) {
      isDragOver.value = false
    }
  }

  function handleDrop (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragOver.value = false

    const files = Array.from(e.dataTransfer?.files || [])

    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        addPhotoFromFile(file)
      }
    }
  }

  function handleFileSelect (e: Event) {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])

    for (const file of files) {
      addPhotoFromFile(file)
    }

    target.value = ''
  }

  // Prevent default drag behavior on document
  onMounted(() => {
    document.addEventListener('dragover', e => {
      e.preventDefault()
    })
    document.addEventListener('drop', e => {
      e.preventDefault()
    })
  })

  onUnmounted(destroyCropper)
</script>

<template>
  <!-- Top Toolbar -->
  <v-app-bar color="grey-darken-4" density="compact" elevation="2">
    <v-toolbar-title class="font-weight-bold">
      <v-icon class="mr-1" size="small">mdi-camera</v-icon>
      VueDarkRoom
    </v-toolbar-title>

    <v-spacer />

    <v-btn
      color="primary"
      density="compact"
      elevation="5"
      prepend-icon="mdi-folder-open"
      variant="text"
      @click="() => fileInput?.click()"
    >
      Import Photos
    </v-btn>

    <v-btn
      v-if="photos.length > 0"
      color="success"
      density="compact"
      elevation="5"
      prepend-icon="mdi-download"
      variant="text"
      @click="exportAll"
    >
      Export All
    </v-btn>

    <v-divider class="mx-2" vertical />

    <v-btn
      icon="mdi-help-circle"
      variant="text"
      @click="showHelp = true"
    />
  </v-app-bar>

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
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
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

  <!-- Help Dialog -->
  <v-dialog v-model="showHelp" max-width="600">
    <v-card>
      <v-card-actions>
        <v-card-title class="text-h5 pb-0">How to use</v-card-title>

        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="showHelp = false"
        />
      </v-card-actions>

      <v-card-text class="py-0">
        <p class="mb-4">1. Click "Import Photos" or drag and drop images to start editing</p>
        <p class="mb-4">2. Use the side panel to adjust image settings</p>
        <p class="mb-4">3. Click "Export All" to download your edited photos</p>
      </v-card-text>

      <v-divider class="mb-4" />

      <v-card-text class="pt-0">
        <h3 class="text-h6 mb-3">Keyboard Shortcuts</h3>

        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">Alt</v-chip>
          <span class="mr-2">+</span>
          <v-chip class="mr-2" color="surface-variant" label size="small">←</v-chip>
          <span class="mr-2">/</span>
          <v-chip class="mr-2" color="surface-variant" label size="small">→</v-chip>
          <span>Navigate between photos</span>
        </div>
        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">Backspace</v-chip>
          <span>Remove current photo</span>
        </div>

        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">[</v-chip>
          <span class="mr-2">/</span>
          <v-chip class="mr-2" color="surface-variant" label size="small">]</v-chip>
          <span>Rotate 90° left/right</span>
        </div>
        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">'</v-chip>
          <span class="mr-2">/</span>
          <v-chip class="mr-2" color="surface-variant" label size="small">\</v-chip>
          <span>Rotate 1° left/right</span>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.border-4 {
  border-width: 4px;
}

.border-dashed {
  border-style: dashed;
}

.border-primary {
  border-color: rgb(var(--v-theme-primary));
}

.bg-primary {
  background-color: rgb(var(--v-theme-primary));
}

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
