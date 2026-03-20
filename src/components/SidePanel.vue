<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, ref } from 'vue'
  import EditControls from '@/components/EditControls.vue'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { photos, isExporting, exportQuality, exportSize, exportFormat } = storeToRefs(photoStore)

  const drawerOpen = ref(true)
  const exportPanel = ref([0]) // Keep export panel open by default

  // Computed values
  const totalPhotos = computed(() => photos.value.length)

  const editedPhotos = computed(() => photos.value.filter(p => {
    const hasCrop = !!p.previewSrc || !!p.cropData
    const hasColorChanges = p.brightness !== 0
      || p.contrast !== 0
      || p.saturation !== 0
      || p.sepia !== 0
      || p.invert !== 0
      || p.grayscale !== 0
      || p.blur !== 0

    return hasCrop || hasColorChanges
  }).length)

  const totalFileSize = computed(() => {
    return photos.value.reduce((total, photo) => total + (photo.fileSize || 0), 0)
  })

  const formatFileSize = (bytes: number) => {
    if (!bytes) {
      return '0 B'
    }

    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
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
    v-if="photos.length > 0"
    v-model="drawerOpen"
    class="bg-grey-darken-4"
    location="left"
    permanent
    width="300"
  >
    <v-container class="h-100 d-flex flex-column pa-4">
      <!-- Header -->
      <div class="mb-4">
        <div class="space-y-1">
          <div class="d-flex justify-space-between text-caption">
            <span>Total Photos:</span>
            <span class="font-weight-medium pl-1">{{ totalPhotos }}</span>
          </div>
          <div class="d-flex justify-space-between text-caption">
            <span>Edited:</span>
            <span class="font-weight-medium text-success pl-1">{{ editedPhotos }}</span>
          </div>
          <div v-if="totalFileSize > 0" class="d-flex justify-space-between text-caption">
            <span>Total Size:</span>
            <span class="font-weight-medium pl-1">{{ formatFileSize(totalFileSize) }}</span>
          </div>
        </div>
      </div>

      <v-divider />

      <!-- Edit Controls -->
      <div class="flex-grow-1 overflow-y-auto">
        <EditControls />
      </div>

      <v-divider />

      <v-expansion-panels v-model="exportPanel" multiple>
        <v-expansion-panel>
          <v-expansion-panel-title class="font-weight-medium">Export Settings</v-expansion-panel-title>

          <v-expansion-panel-text>
            <!-- Quality -->
            <div class="mb-4">
              <v-label class="text-subtitle-2">Quality</v-label>
              <v-slider
                v-model="exportQuality"
                color="primary"
                density="compact"
                hide-details
                max="100"
                min="10"
                step="5"
                thumb-label="always"
              />
              <div class="d-flex justify-space-between text-caption text-grey">
                <span>Smaller file</span>
                <span>{{ exportQuality }}%</span>
                <span>Better quality</span>
              </div>
            </div>

            <!-- Format -->
            <div class="mb-4">
              <v-label class="text-subtitle-2 mb-1">Format</v-label>
              <v-btn-toggle
                v-model="exportFormat"
                class="w-100"
                density="compact"
                mandatory
              >
                <v-btn
                  v-for="option in formatOptions"
                  :key="option.value"
                  class="flex-grow-1"
                  size="small"
                  :value="option.value"
                  variant="outlined"
                >
                  {{ option.label }}
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Size -->
            <div class="mb-4">
              <v-select
                v-model="exportSize"
                density="compact"
                hide-details
                item-title="label"
                item-value="value"
                :items="sizeOptions"
                label="Size"
                variant="outlined"
              />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Progress Exporting -->
      <div v-if="isExporting" class="mt-3">
        <v-progress-linear
          color="primary"
          indeterminate
        />
        <p class="text-caption text-center mt-2">Processing photos...</p>
      </div>
    </v-container>
  </v-navigation-drawer>
</template>

<style lang="scss" scoped>
:deep(.v-expansion-panel--active > .v-expansion-panel-title:not(.v-expansion-panel-title--static)) {
  min-height: 10px !important;
  max-height: 18px !important;
}
</style>
