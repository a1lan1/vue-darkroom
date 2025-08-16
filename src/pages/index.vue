<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useHotkey } from 'vuetify'
  import PhotoCarousel from '@/components/PhotoCarousel.vue'
  import PhotoEditor from '@/components/PhotoEditor.vue'
  import SidePanel from '@/components/SidePanel.vue'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const store = usePhotoStore()
  const isDragOver = ref(false)
  const fileInput = ref<HTMLInputElement>()

  // Prevent default drag behavior on document
  onMounted(() => {
    document.addEventListener('dragover', e => {
      e.preventDefault()
    })
    document.addEventListener('drop', e => {
      e.preventDefault()
    })

    // Add global drag & drop handlers for debugging
    document.addEventListener('dragenter', e => {
      // console.log('Global dragenter:', e.target)
    })

    document.addEventListener('drop', e => {
      // console.log('Global drop event:', e.dataTransfer?.files.length)
    })
  })

  // Hotkeys
  useHotkey('arrow-left', () => {
    const currentIndex = store.photos.findIndex(p => p.id === store.activePhotoId)
    if (currentIndex > 0) {
      store.setActive(store.photos[currentIndex - 1].id)
    }
  })

  useHotkey('arrow-right', () => {
    const currentIndex = store.photos.findIndex(p => p.id === store.activePhotoId)
    if (currentIndex < store.photos.length - 1) {
      store.setActive(store.photos[currentIndex + 1].id)
    }
  })

  useHotkey('delete', () => {
    if (store.activePhotoId) {
      store.removePhoto(store.activePhotoId)
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
        store.addPhotoFromFile(file)
      }
    }
  }

  // File input
  function handleFileSelect (e: Event) {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])

    for (const file of files) {
      store.addPhotoFromFile(file)
    }

    // Reset input
    target.value = ''
  }
</script>

<template>
  <!-- Top Toolbar -->
  <v-app-bar color="grey-darken-4" dense elevation="2">
    <v-toolbar-title class="font-weight-bold">
      <v-icon class="mr-2">mdi-camera</v-icon>
      VueDarkRoom
    </v-toolbar-title>

    <v-spacer />

    <v-btn prepend-icon="mdi-folder-open" variant="text" @click="() => fileInput?.click()">
      Import Photos
    </v-btn>

    <v-btn
      :disabled="store.photos.length === 0"
      prepend-icon="mdi-download"
      variant="text"
      @click="store.exportAll"
    >
      Export All
    </v-btn>

    <v-divider class="mx-2" vertical />

    <v-btn prepend-icon="mdi-help-circle" variant="text">
      Help
    </v-btn>
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
  <v-main
    class="bg-black h-100 text-white pa-0"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
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
        class="position-absolute inset-0 border-4 border-dashed border-primary bg-primary bg-opacity-10 pointer-events-none z-10 d-flex align-center justify-center"
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
</template>

<style scoped>
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.flex-1 {
  flex: 1 1 0%;
}

.h-full {
  height: 100%;
}

.h-32 {
  height: 8rem;
}

.w-80 {
  width: 20rem;
}

.border-t {
  border-top-width: 1px;
}

.border-l {
  border-left-width: 1px;
}

.border-grey-darken-3 {
  border-color: rgb(55 65 81);
}

.relative {
  position: relative;
}

.min-h-0 {
  min-height: 0;
}

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
