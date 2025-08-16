<script setup lang="ts">
  import { usePhotoEditor } from '@/composables/usePhotoEditor'

  const {
    brightness,
    contrast,
    saturation,
    clarity,
    temperature,
    tint,
    cropAspectRatio,
    aspectRatios,
    rotate90,
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
  <div>
    <!-- Crop Tools -->
    <v-expansion-panels class="mb-2" elevation="5" variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-crop</v-icon>
          Crop & Rotate
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="space-y-4">
            <!-- Aspect Ratio -->
            <div>
              <v-label class="text-caption mb-2">Ratio</v-label>
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
                  size="x-small"
                  :value="ratio.value"
                  variant="outlined"
                >
                  {{ ratio.label }}
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Rotate Controls -->
            <div class="d-flex justify-space-between">
              <v-btn color="primary" prepend-icon="mdi-rotate-right" size="x-small" @click="rotate90">
                Rotate 90°
              </v-btn>
              <v-btn color="primary" prepend-icon="mdi-rotate-left" size="x-small" @click="() => rotateFine(-1)">
                -1°
              </v-btn>
              <v-btn color="primary" prepend-icon="mdi-rotate-right" size="x-small" @click="() => rotateFine(1)">
                +1°
              </v-btn>
              <v-btn color="secondary" prepend-icon="mdi-refresh" size="x-small" @click="resetCrop">
                Reset
              </v-btn>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-palette</v-icon>
          Color Correction
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="space-y-4">
            <!-- Auto Adjust -->
            <div class="d-flex gap-2">
              <v-btn color="success" prepend-icon="mdi-auto-fix" size="small" @click="applyAutoAdjust">
                Auto Adjust
              </v-btn>
              <v-btn color="secondary" prepend-icon="mdi-refresh" size="small" @click="resetColorCorrection">
                Reset
              </v-btn>
            </div>

            <!-- Sliders -->
            <div class="d-grid grid-cols-2 gap-4">
              <v-slider
                v-model="brightness"
                color="primary"
                density="compact"
                label="Brightness"
                max="50"
                min="-50"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model="contrast"
                color="primary"
                density="compact"
                label="Contrast"
                max="50"
                min="-50"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model="saturation"
                color="primary"
                density="compact"
                label="Saturation"
                max="50"
                min="-50"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model="clarity"
                color="primary"
                density="compact"
                label="Clarity"
                max="20"
                min="-20"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model="temperature"
                color="primary"
                density="compact"
                label="Temperature"
                max="30"
                min="-30"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model="tint"
                color="primary"
                density="compact"
                label="Tint"
                max="30"
                min="-30"
                step="1"
                thumb-label="always"
              />
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Action Buttons -->
    <div class="d-flex justify-space-between">
      <v-btn color="primary" prepend-icon="mdi-crop" size="small" @click="crop">
        Apply Crop
      </v-btn>
      <v-btn color="success" prepend-icon="mdi-check" size="small" @click="applyChanges">
        Apply All Changes
      </v-btn>
    </div>
  </div>
</template>
