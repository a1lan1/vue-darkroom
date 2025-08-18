<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useHotkey } from 'vuetify/framework'
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { activePhoto } = storeToRefs(photoStore)

  const {
    cropAspectRatio,
    aspectRatios,
    rotateFine,
    crop,
    resetCrop,
    resetColorCorrection,
    applyChanges,
    setAspectRatio,
  } = usePhotoEditor()

  // Hotkeys
  useHotkey('[', () => rotateFine(90))
  useHotkey(']', () => rotateFine(-90))
  useHotkey('\'', () => rotateFine(1))
  useHotkey('\\', () => rotateFine(-1))
</script>

<template>
  <!-- Crop Tools -->
  <v-list
    v-if="activePhoto"
    variant="flat"
  >
    <v-list-item class="px-0">
      <template #title>
        <span class="text-h6">Crop & Rotate</span>
      </template>

      <!-- Aspect Ratio -->
      <div class="my-2 d-flex justify-center">
        <v-label class="text-caption mr-2">Ratio</v-label>
        <v-btn-toggle
          v-model="cropAspectRatio"
          class="flex-wrap"
          density="compact"
          mandatory
          @update:model-value="setAspectRatio"
        >
          <v-btn
            v-for="ratio in aspectRatios"
            :key="ratio.label"
            density="compact"
            size="x-small"
            :value="ratio.value"
            variant="outlined"
          >
            {{ ratio.label }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <!-- Rotate Controls -->
      <v-btn-group
        class="d-flex justify-center"
        density="compact"
        variant="tonal"
      >
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-right"
          size="x-small"
          @click="() => rotateFine(90)"
        >
          +90°
        </v-btn>
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-left"
          size="x-small"
          @click="() => rotateFine(-90)"
        >
          -90°
        </v-btn>
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-left"
          size="x-small"
          @click="() => rotateFine(-1)"
        >
          -1°
        </v-btn>
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-right"
          size="x-small"
          @click="() => rotateFine(1)"
        >
          +1°
        </v-btn>
        <v-btn
          color="error"
          prepend-icon="mdi-refresh"
          size="x-small"
          @click="resetCrop"
        >
          Reset
        </v-btn>
      </v-btn-group>

      <div class="d-flex justify-space-around mt-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-crop"
          size="x-small"
          @click="crop"
        >
          Apply Crop
        </v-btn>

        <v-btn
          color="success"
          prepend-icon="mdi-check"
          size="x-small"
          @click="applyChanges"
        >
          Apply Changes
        </v-btn>
      </div>
    </v-list-item>

    <v-divider class="mt-4 mb-3" />

    <v-list-item class="px-0">
      <template #title>
        <div class="d-flex justify-space-between align-center">
          <span class="text-h6">Color Correction</span>

          <v-btn
            color="error"
            prepend-icon="mdi-refresh"
            size="x-small"
            @click="resetColorCorrection"
          >
            Reset
          </v-btn>
        </div>
      </template>

      <!-- Sliders -->
      <div class="mt-1 px-1">
        <v-slider
          v-model="activePhoto.brightness"
          density="compact"
          hide-details
          label="Brightness"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="() => activePhoto.brightness = 0"
        />
        <v-slider
          v-model="activePhoto.contrast"
          density="compact"
          hide-details
          label="Contrast"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="() => activePhoto.contrast = 0"
        />
        <v-slider
          v-model="activePhoto.saturation"
          density="compact"
          hide-details
          label="Saturation"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="() => activePhoto.saturation = 0"
        />
        <v-slider
          v-model="activePhoto.sepia"
          density="compact"
          hide-details
          label="Sepia"
          max="100"
          min="0"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="() => activePhoto.sepia = 0"
        />
        <v-slider
          v-model="activePhoto.blur"
          density="compact"
          hide-details
          label="Blur"
          max="100"
          min="0"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="() => activePhoto.blur = 0"
        />
        <v-slider
          v-model="activePhoto.invert"
          density="compact"
          hide-details
          label="Invert"
          max="100"
          min="0"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="() => activePhoto.invert = 0"
        />
        <v-slider
          v-model="activePhoto.grayscale"
          density="compact"
          hide-details
          label="Grayscale"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="() => activePhoto.grayscale = 0"
        />
      </div>
    </v-list-item>
  </v-list>
</template>
