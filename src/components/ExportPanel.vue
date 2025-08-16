<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePhotoStore } from '@/stores/PhotoStore'

const store = usePhotoStore()
const isExporting = ref(false)

// Export settings
const exportQuality = ref(80)
const exportFormat = ref('jpeg')
const exportSize = ref('original')

// Computed values
const totalPhotos = computed(() => store.photos.length)
const editedPhotos = computed(() => store.photos.filter(p => p.editedSrc && p.editedSrc !== p.src).length)
const totalFileSize = computed(() => {
  return store.photos.reduce((total, photo) => total + (photo.fileSize || 0), 0)
})

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// Export functions
async function exportAll() {
  if (store.photos.length === 0) return
  
  isExporting.value = true
  store.exportQuality = exportQuality.value
  
  try {
    await store.exportAll()
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

function exportSelected() {
  if (!store.activePhoto) return
  // TODO: Implement single photo export
}

// Format options
const formatOptions = [
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'WebP', value: 'webp' },
]

// Size options
const sizeOptions = [
  { label: 'Original', value: 'original' },
  { label: '1920px', value: '1920' },
  { label: '1280px', value: '1280' },
  { label: '800px', value: '800' },
]
</script>

<template>
  <div class="h-full bg-grey-darken-4 flex flex-col">
    <!-- Header -->
    <div class="p-3 border-b border-grey-darken-3">
      <h2 class="text-h6 font-weight-bold mb-2">Export Settings</h2>
      <div class="space-y-1">
        <div class="flex justify-between text-caption">
          <span>Total Photos:</span>
          <span class="font-weight-medium">{{ totalPhotos }}</span>
        </div>
        <div class="flex justify-between text-caption">
          <span>Edited:</span>
          <span class="font-weight-medium text-success">{{ editedPhotos }}</span>
        </div>
        <div class="flex justify-between text-caption">
          <span>Total Size:</span>
          <span class="font-weight-medium">{{ formatFileSize(totalFileSize) }}</span>
        </div>
      </div>
    </div>

    <!-- Export Settings -->
    <div class="flex-1 p-3 space-y-3 overflow-y-auto">
      <!-- Quality -->
      <div>
        <v-label class="text-subtitle-2 mb-1">Quality</v-label>
        <v-slider
          v-model="exportQuality"
          min="10"
          max="100"
          step="5"
          thumb-label="always"
          color="primary"
          class="mb-1"
        />
        <div class="flex justify-between text-caption text-grey">
          <span>Smaller file</span>
          <span>{{ exportQuality }}%</span>
          <span>Better quality</span>
        </div>
      </div>

      <!-- Format -->
      <div>
        <v-label class="text-subtitle-2 mb-1">Format</v-label>
        <v-btn-toggle
          v-model="exportFormat"
          mandatory
          class="w-full"
          density="compact"
        >
          <v-btn
            v-for="option in formatOptions"
            :key="option.value"
            :value="option.value"
            variant="outlined"
            class="flex-1"
            size="small"
          >
            {{ option.label }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <!-- Size -->
      <div>
        <v-label class="text-subtitle-2 mb-1">Size</v-label>
        <v-select
          v-model="exportSize"
          :items="sizeOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
        />
      </div>

      <!-- Export Options -->
      <div>
        <v-label class="text-subtitle-2 mb-1">Options</v-label>
        <div class="space-y-1">
          <v-checkbox
            label="Include metadata"
            density="compact"
            hide-details
          />
          <v-checkbox
            label="Optimize for web"
            density="compact"
            hide-details
          />
          <v-checkbox
            label="Create backup"
            density="compact"
            hide-details
          />
        </div>
      </div>
    </div>

    <!-- Export Actions -->
    <div class="p-3 border-t border-grey-darken-3 space-y-2">
      <v-btn
        color="primary"
        block
        :loading="isExporting"
        :disabled="!store.photos.length"
        @click="exportAll"
        prepend-icon="mdi-download"
        size="small"
      >
        {{ isExporting ? 'Exporting...' : 'Export All Photos' }}
      </v-btn>
      
      <v-btn
        variant="outlined"
        block
        :disabled="!store.activePhoto"
        @click="exportSelected"
        prepend-icon="mdi-download-single"
        size="small"
      >
        Export Selected
      </v-btn>
    </div>

    <!-- Progress -->
    <div v-if="isExporting" class="p-3 border-t border-grey-darken-3">
      <v-progress-linear
        indeterminate
        color="primary"
      />
      <p class="text-caption text-center mt-2">Processing photos...</p>
    </div>
  </div>
</template>

<style scoped>
.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.flex-1 {
  flex: 1 1 0%;
}

.overflow-y-auto {
  overflow-y: auto;
}

.w-full {
  width: 100%;
}
</style>