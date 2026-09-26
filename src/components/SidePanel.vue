<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, ref } from 'vue'
  import EditControls from '@/components/EditControls.vue'
  import { useAppStore } from '@/stores/appStore'
  import { usePhotoStore } from '@/stores/photoStore'
  import { formatBytes } from '@/utils/formatBytes'
  import { isQualitySupported } from '@/utils/imageFilter'

  const photoStore = usePhotoStore()
  const appStore = useAppStore()
  const { isExporting, exportProgress, exportQuality, exportSize, exportFormat, totalExportedSize } = storeToRefs(photoStore)
  const { exportFormatOptions, exportSizeOptions } = storeToRefs(appStore)

  const drawerOpen = ref(true)
  const exportPanel = ref([0])

  const qualityApplies = computed(() => isQualitySupported(exportFormat.value))
  const progressPercent = computed(() => {
    const progress = exportProgress.value

    if (!progress || progress.total === 0) {
      return 0
    }

    return Math.round((progress.completed / progress.total) * 100)
  })
</script>

<template>
  <v-navigation-drawer
    v-if="!photoStore.isEmpty"
    v-model="drawerOpen"
    class="bg-grey-darken-4"
    location="left"
    permanent
    width="300"
  >
    <v-container class="h-100 d-flex flex-column pa-4">
      <v-list class="flex-grow-1 overflow-y-auto py-0" density="compact">
        <v-list-item class="px-0">
          <v-list-item-title class="text-caption">
            <div class="d-flex justify-space-between">
              <span>Total Photos:</span>
              <span class="font-weight-medium pl-1">{{ photoStore.totalPhotos }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span>Edited:</span>
              <span class="font-weight-medium text-success pl-1">{{ photoStore.editedPhotos }}</span>
            </div>
            <div
              v-if="totalExportedSize > 0"
              class="d-flex justify-space-between"
            >
              <span>Last Export:</span>
              <span class="font-weight-medium pl-1">{{ formatBytes(totalExportedSize) }}</span>
            </div>
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider />

      <div class="flex-grow-1 overflow-y-auto">
        <EditControls />
      </div>

      <v-divider />

      <v-expansion-panels
        v-model="exportPanel"
        class="mt-2"
        multiple
      >
        <v-expansion-panel>
          <v-expansion-panel-title class="font-weight-medium">Export Settings</v-expansion-panel-title>

          <v-expansion-panel-text>
            <div class="mb-4">
              <v-label class="text-subtitle-2">Quality</v-label>
              <v-slider
                v-model="exportQuality"
                color="primary"
                density="compact"
                :disabled="!qualityApplies"
                hide-details
                max="100"
                min="10"
                step="5"
                thumb-label="always"
              />
              <div class="d-flex justify-space-between text-caption text-grey">
                <span>Smaller file</span>
                <span v-if="qualityApplies">{{ exportQuality }}%</span>
                <span v-else>Not supported for {{ exportFormat.toUpperCase() }}</span>
                <span>Better quality</span>
              </div>
            </div>

            <div class="mb-4">
              <v-label class="text-subtitle-2 mb-1">Format</v-label>
              <v-btn-toggle
                v-model="exportFormat"
                class="w-100"
                density="compact"
                mandatory
              >
                <v-btn
                  v-for="option in exportFormatOptions"
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

            <div class="mb-4">
              <v-select
                v-model="exportSize"
                density="compact"
                hide-details
                item-title="label"
                item-value="value"
                :items="exportSizeOptions"
                label="Size"
                variant="outlined"
              />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div
        v-if="isExporting"
        class="mt-3"
      >
        <v-progress-linear
          color="primary"
          :model-value="progressPercent"
        />
        <p class="text-caption text-center mt-2">
          Processing {{ exportProgress?.completed ?? 0 }} of {{ exportProgress?.total ?? 0 }}…
        </p>
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
