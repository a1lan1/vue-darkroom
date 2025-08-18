<script setup lang="ts">
  import { storeToRefs } from 'pinia'
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
    applyAutoAdjust,
    resetColorCorrection,
    applyChanges,
    setAspectRatio,
  } = usePhotoEditor()
</script>

<template>
  <!-- Crop Tools -->
  <v-list
    v-if="activePhoto"
    class="mt-1"
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

      <v-slider
        class="mt-2"
        density="compact"
        hide-details
        label="Horizon"
        max="10"
        min="-10"
        step="1"
        thumb-label
        thumb-size="10"
        @update:model-value="(deg) => rotateFine(deg)"
      />

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
        <span class="text-h6">Color Correction</span>
      </template>

      <!-- Sliders -->
      <div class="mt-1">
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
        />
        <v-slider
          v-model="activePhoto.clarity"
          density="compact"
          hide-details
          label="Sepia clarity"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
        />
        <v-slider
          v-model="activePhoto.blur"
          density="compact"
          hide-details
          label="blur"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
        />
        <v-slider
          v-model="activePhoto.temperature"
          density="compact"
          hide-details
          label="Temperature invert"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
        />
        <v-slider
          v-model="activePhoto.tint"
          density="compact"
          hide-details
          label="Tint grayscale"
          max="100"
          min="-100"
          step="1"
          thumb-label
          thumb-size="10"
        />
      </div>

      <!-- Auto Adjust -->
      <div class="d-flex justify-space-around mt-2">
        <v-btn
          color="success"
          prepend-icon="mdi-auto-fix"
          size="x-small"
          @click="applyAutoAdjust"
        >
          Auto Adjust
        </v-btn>
        <v-btn
          color="error"
          prepend-icon="mdi-refresh"
          size="x-small"
          @click="resetColorCorrection"
        >
          Reset
        </v-btn>
      </div>
    </v-list-item>
  </v-list>
</template>
