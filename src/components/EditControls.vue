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
    <v-expansion-panels variant="accordion" class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-crop</v-icon>
          Crop & Rotate
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="space-y-4">
            <!-- Aspect Ratio -->
            <div>
              <v-label class="text-caption mb-2">Aspect Ratio</v-label>
              <v-btn-toggle
                v-model="cropAspectRatio"
                mandatory
                @update:model-value="setAspectRatio"
                class="flex-wrap"
                density="compact"
              >
                <v-btn
                  v-for="ratio in aspectRatios"
                  :key="ratio.label"
                  :value="ratio.value"
                  size="small"
                  variant="outlined"
                >
                  {{ ratio.label }}
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Rotate Controls -->
            <div class="d-flex gap-2">
              <v-btn color="primary" @click="rotate90" prepend-icon="mdi-rotate-right" size="small">
                Rotate 90°
              </v-btn>
              <v-btn color="primary" @click="() => rotateFine(-1)" prepend-icon="mdi-rotate-left" size="small">
                -1°
              </v-btn>
              <v-btn color="primary" @click="() => rotateFine(1)" prepend-icon="mdi-rotate-right" size="small">
                +1°
              </v-btn>
              <v-btn color="secondary" @click="resetCrop" prepend-icon="mdi-refresh" size="small">
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
              <v-btn color="success" @click="applyAutoAdjust" prepend-icon="mdi-auto-fix" size="small">
                Auto Adjust
              </v-btn>
              <v-btn color="secondary" @click="resetColorCorrection" prepend-icon="mdi-refresh" size="small">
                Reset
              </v-btn>
            </div>

            <!-- Sliders -->
            <div class="d-grid grid-cols-2 gap-4">
              <v-slider
                v-model="brightness"
                min="-50"
                max="50"
                step="1"
                label="Brightness"
                thumb-label="always"
                color="primary"
                density="compact"
              />
              <v-slider
                v-model="contrast"
                min="-50"
                max="50"
                step="1"
                label="Contrast"
                thumb-label="always"
                color="primary"
                density="compact"
              />
              <v-slider
                v-model="saturation"
                min="-50"
                max="50"
                step="1"
                label="Saturation"
                thumb-label="always"
                color="primary"
                density="compact"
              />
              <v-slider
                v-model="clarity"
                min="-20"
                max="20"
                step="1"
                label="Clarity"
                thumb-label="always"
                color="primary"
                density="compact"
              />
              <v-slider
                v-model="temperature"
                min="-30"
                max="30"
                step="1"
                label="Temperature"
                thumb-label="always"
                color="primary"
                density="compact"
              />
              <v-slider
                v-model="tint"
                min="-30"
                max="30"
                step="1"
                label="Tint"
                thumb-label="always"
                color="primary"
                density="compact"
              />
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Action Buttons -->
    <div class="d-flex gap-2 justify-center">
      <v-btn color="primary" @click="crop" prepend-icon="mdi-crop" size="small">
        Apply Crop
      </v-btn>
      <v-btn color="success" @click="applyChanges" prepend-icon="mdi-check" size="small">
        Apply All Changes
      </v-btn>
    </div>
  </div>
</template>
