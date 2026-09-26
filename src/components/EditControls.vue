<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useHotkey } from 'vuetify'
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { guardHotkey } from '@/composables/useSafeHotkey'
  import { usePhotoStore } from '@/stores/photoStore'

  const photoStore = usePhotoStore()
  const { activePhoto } = storeToRefs(photoStore)

  const {
    isCropping,
    aspectRatios,
    cropAspectRatio,
    startCropping,
    applyCrop,
    cancelCrop,
    resetCrop,
    resetColorCorrection,
    rotate,
  } = usePhotoEditor()

  useHotkey('[', guardHotkey(() => void rotate(90)))
  useHotkey(']', guardHotkey(() => void rotate(-90)))
  useHotkey('\'', guardHotkey(() => void rotate(1)))
  useHotkey('\\', guardHotkey(() => void rotate(-1)))
  useHotkey('c', guardHotkey(() => void startCropping()))
  useHotkey('enter', guardHotkey(() => {
    if (isCropping.value) {
      applyCrop()
    }
  }))
  useHotkey('esc', guardHotkey(() => {
    if (isCropping.value) {
      cancelCrop()
    }
  }))

  /**
   * Slider definitions live in one place so the ranges stay in sync with the
   * clamp bounds used by `buildImageFilter`. `sepia`, `invert`, `grayscale` and
   * `blur` are one-sided effects and must not accept negative values.
   */
  const adjustmentSliders = [
    { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
    { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
    { key: 'blur', label: 'Blur', min: 0, max: 100 },
    { key: 'invert', label: 'Invert', min: 0, max: 100 },
    { key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
  ] as const
</script>

<template>
  <v-list
    v-if="activePhoto"
    variant="flat"
  >
    <v-list-item class="px-0">
      <template #title>
        <div class="d-flex justify-space-between align-center">
          <span class="text-h6">Crop</span>

          <div class="d-flex justify-center ga-2">
            <template v-if="isCropping">
              <v-btn
                color="success"
                density="comfortable"
                prepend-icon="mdi-check"
                size="small"
                variant="elevated"
                @click="applyCrop"
              >
                Apply
              </v-btn>
              <v-btn
                color="grey"
                density="comfortable"
                prepend-icon="mdi-close"
                size="small"
                variant="elevated"
                @click="cancelCrop"
              >
                Cancel
              </v-btn>
            </template>
            <template v-else>
              <v-icon-btn
                v-tooltip="'Crop'"
                aria-label="Start cropping"
                color="primary"
                density="compact"
                icon="mdi-crop"
                size="small"
                variant="elevated"
                @click="startCropping"
              />
            </template>
          </div>
        </div>
      </template>

      <div class="my-2 d-flex justify-center">
        <v-label class="text-caption mr-2">Ratio</v-label>
        <v-btn-toggle
          v-model="cropAspectRatio"
          class="flex-wrap"
          density="compact"
          mandatory
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
    </v-list-item>

    <v-divider class="mb-2" />

    <v-list-item class="px-0">
      <template #title>
        <span class="text-h6">Rotate</span>
      </template>

      <v-btn-group
        class="d-flex justify-center"
        density="compact"
        variant="tonal"
      >
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-right"
          size="x-small"
          @click="rotate(90)"
        >
          +90°
        </v-btn>
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-left"
          size="x-small"
          @click="rotate(-90)"
        >
          −90°
        </v-btn>
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-left"
          size="x-small"
          @click="rotate(-1)"
        >
          −1°
        </v-btn>
        <v-btn
          color="dark"
          prepend-icon="mdi-rotate-right"
          size="x-small"
          @click="rotate(1)"
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
    </v-list-item>

    <v-divider class="mt-2 mb-2" />

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

      <div class="mt-1 px-1">
        <v-slider
          v-for="slider in adjustmentSliders"
          :key="slider.key"
          v-model="activePhoto[slider.key]"
          density="compact"
          hide-details
          :label="slider.label"
          :max="slider.max"
          :min="slider.min"
          step="1"
          thumb-label
          thumb-size="10"
          @dblclick="activePhoto[slider.key] = 0"
        />
      </div>
    </v-list-item>
  </v-list>
</template>
