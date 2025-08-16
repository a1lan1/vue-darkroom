<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHotkey } from 'vuetify'
import PhotoGallery from '@/components/PhotoGallery.vue'
import PhotoEditor from '@/components/PhotoEditor.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import { usePhotoStore } from '@/stores/PhotoStore'

const store = usePhotoStore()
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

// Prevent default drag behavior on document
onMounted(() => {
  document.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
  document.addEventListener('drop', (e) => {
    e.preventDefault()
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
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = true
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (e.currentTarget === e.target) {
    isDragOver.value = false
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
  
  const files = Array.from(e.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length > 0) {
    imageFiles.forEach(file => {
      store.addPhotoFromFile(file)
    })
  }
}

// File input
function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  files.forEach(file => {
    store.addPhotoFromFile(file)
  })
  
  // Reset input
  target.value = ''
}
</script>

<template>
  <!-- Top Toolbar -->
  <v-app-bar color="grey-darken-4" dense elevation="2">
    <v-toolbar-title class="font-weight-bold">
      <v-icon class="mr-2">mdi-camera</v-icon>
      Lightroom Clone
    </v-toolbar-title>
    
    <v-spacer />
    
    <v-btn variant="text" prepend-icon="mdi-folder-open" @click="() => fileInput?.click()">
      Import Photos
    </v-btn>
    
    <v-btn 
      variant="text" 
      prepend-icon="mdi-download" 
      :disabled="!store.photos.length"
      @click="store.exportAll"
    >
      Export All
    </v-btn>
    
    <v-divider vertical class="mx-2" />
    
    <v-btn variant="text" prepend-icon="mdi-help-circle">
      Help
    </v-btn>
  </v-app-bar>

  <!-- Hidden file input -->
  <input
    ref="fileInput"
    type="file"
    multiple
    accept="image/*"
    class="d-none"
    @change="handleFileSelect"
  />

  <!-- Main Content -->
  <v-main class="bg-black text-white pa-0">
    <div 
      class="h-[calc(100vh-64px)] relative"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Drag Indicator -->
      <div 
        v-if="isDragOver"
        class="absolute inset-0 border-4 border-dashed border-primary bg-primary bg-opacity-10 pointer-events-none z-10 flex items-center justify-center"
      >
        <div class="text-center bg-grey-darken-4 pa-8 rounded-lg">
          <v-icon size="64" color="primary" class="mb-4">mdi-cloud-upload</v-icon>
          <h2 class="text-h4 text-primary font-weight-bold mb-2">Drop Images Here</h2>
          <p class="text-body-1 text-grey">Release to import your photos</p>
          <v-progress-circular
            indeterminate
            color="primary"
            size="32"
            class="mt-4"
          />
        </div>
      </div>

      <!-- Main Layout -->
      <div class="h-full flex">
        <!-- Left Panel: Editor + Gallery -->
        <div class="flex-1 flex flex-col">
          <!-- Photo Editor -->
          <div class="flex-1 relative min-h-0">
            <PhotoEditor />
          </div>
          
          <!-- Photo Gallery -->
          <div class="h-32 border-t border-grey-darken-3 bg-grey-darken-4">
            <PhotoGallery />
          </div>
        </div>
        
        <!-- Right Panel: Export & Settings -->
        <div class="w-80 border-l border-grey-darken-3 bg-grey-darken-4">
          <ExportPanel />
        </div>
      </div>
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