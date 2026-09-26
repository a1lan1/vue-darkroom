<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { useAppStore } from '@/stores/appStore'

  const appStore = useAppStore()
  const { showHelp } = storeToRefs(appStore)

  const show = computed({
    get: () => showHelp.value,
    set: val => appStore.toggleHelp(val),
  })
</script>

<template>
  <v-dialog v-model="show" max-width="600">
    <v-card>
      <v-card-actions>
        <v-card-title class="text-h5 pb-0">How to use</v-card-title>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="show = false"
        />
      </v-card-actions>

      <v-card-text class="py-0">
        <p class="mb-2">1. Click "Import Photos" or drag and drop images to start editing</p>
        <p class="mb-2">2. Use the side panel to adjust image settings</p>
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
          <span>Rotate 90° counter-clockwise / clockwise</span>
        </div>

        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">'</v-chip>
          <span class="mr-2">/</span>
          <v-chip class="mr-2" color="surface-variant" label size="small">\</v-chip>
          <span>Rotate 1° counter-clockwise / clockwise</span>
        </div>

        <h3 class="text-h6 mb-1">Cropper</h3>

        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">C</v-chip>
          <span>Activate cropper</span>
        </div>

        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">Enter</v-chip>
          <span>Apply cropper</span>
        </div>

        <div class="d-flex align-center mb-2">
          <v-chip class="mr-2" color="surface-variant" label size="small">Esc</v-chip>
          <span>Cancel cropper</span>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
