<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePhotoStore } from '@/stores/PhotoStore'
import EditControls from './EditControls.vue'

const store = usePhotoStore()
const isExporting = ref(false)
const drawerOpen = ref(true)

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
  if (!bytes) {
    return 0
  }

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
  <v-navigation-drawer
    v-model="drawerOpen"
    permanent
    location="right"
    width="350"
    class="bg-grey-darken-4"
  >
    <v-container class="h-100 d-flex flex-column pa-4">
      <!-- Header -->
      <div class="mb-4">
        <h2 class="text-h6 font-weight-bold mb-2">Photo Editor</h2>
        <div class="space-y-1">
          <div class="d-flex justify-space-between text-caption">
            <span>Total Photos:</span>
            <span class="font-weight-medium pl-1">{{ totalPhotos }}</span>
          </div>
          <div class="d-flex justify-space-between text-caption">
            <span>Edited:</span>
            <span class="font-weight-medium text-success pl-1">{{ editedPhotos }}</span>
          </div>
          <div class="d-flex justify-space-between text-caption">
            <span>Total Size:</span>
            <span class="font-weight-medium pl-1">{{ formatFileSize(totalFileSize) }}</span>
          </div>
        </div>
      </div>

      <!-- Edit Controls -->
      <div class="flex-grow-1 overflow-y-auto">
        <EditControls />
      </div>

      <!-- Export Section -->
      <v-divider class="my-4" />
      
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-3">Export Settings</h3>
        
        <!-- Quality -->
        <div class="mb-4">
          <v-label class="text-subtitle-2 mb-2">Quality</v-label>
          <v-slider
            v-model="exportQuality"
            min="10"
            max="100"
            step="5"
            thumb-label="always"
            color="primary"
            density="compact"
            hide-details
          />
          <div class="d-flex justify-space-between text-caption text-grey">
            <span>Smaller file</span>
            <span>{{ exportQuality }}%</span>
            <span>Better quality</span>
          </div>
        </div>

        <!-- Format -->
        <div class="mb-4">
          <v-label class="text-subtitle-2 mb-2">Format</v-label>
          <v-btn-toggle
            v-model="exportFormat"
            mandatory
            class="w-100"
            density="compact"
          >
            <v-btn
              v-for="option in formatOptions"
              :key="option.value"
              :value="option.value"
              variant="outlined"
              size="small"
              class="flex-grow-1"
            >
              {{ option.label }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <!-- Size -->
        <div class="mb-4">
          <v-select
            v-model="exportSize"
            :items="sizeOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
            label="Size"
          />
        </div>

        <!-- Export Options -->
        <div class="mb-4">
          <v-label class="text-subtitle-2 mb-2">Options</v-label>
          <div>
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

        <!-- Export Actions -->
        <div class="space-y-2">
          <v-btn
            color="primary"
            block
            :loading="isExporting"
            :disabled="store.photos.length === 0"
            @click="exportAll"
            prepend-icon="mdi-download"
            size="small"
          >
            {{ isExporting ? 'Exporting...' : 'Export All Photos' }}
          </v-btn>

          <v-btn
            block
            :disabled="!store.activePhoto"
            @click="exportSelected"
            prepend-icon="mdi-download-single"
            size="small"
            variant="outlined"
          >
            Export Selected
          </v-btn>
        </div>

        <!-- Progress -->
        <div v-if="isExporting" class="mt-3">
          <v-progress-linear
            indeterminate
            color="primary"
          />
          <p class="text-caption text-center mt-2">Processing photos...</p>
        </div>
      </div>
    </v-container>
  </v-navigation-drawer>
</template>
