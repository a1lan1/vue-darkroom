<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { usePhotoStore } from '@/stores/PhotoStore'

const store = usePhotoStore()
const imgRef = ref<HTMLImageElement | null>(null)
let cropper: Cropper | null = null

// Color correction settings
const brightness = ref(0)
const contrast = ref(0)
const saturation = ref(0)
const clarity = ref(0)
const temperature = ref(0)
const tint = ref(0)

// Crop settings
const cropAspectRatio = ref<number | undefined>(undefined)

// Computed styles for color correction
const imageStyle = computed(() => {
  const filters = [
    `brightness(${100 + brightness.value}%)`,
    `contrast(${100 + contrast.value}%)`,
    `saturate(${100 + saturation.value}%)`,
    `sepia(${Math.abs(clarity.value)}%)`,
  ]
  
  return {
    filter: filters.join(' '),
    transform: `rotate(${temperature.value}deg)`,
  }
})

watch(() => store.activePhoto, (photo) => {
  if (photo && imgRef.value) {
    cropper?.destroy()
    cropper = new Cropper(imgRef.value, {
      viewMode: 1,
      autoCropArea: 1,
      aspectRatio: cropAspectRatio.value,
      background: false,
      responsive: true,
      restore: false,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    })
  }
})

// Crop functions
function rotate90() {
  cropper?.rotate(90)
}

function rotateFine(deg: number) {
  cropper?.rotate(deg)
}

function crop() {
  if (!cropper || !store.activePhoto) return
  const canvas = cropper.getCroppedCanvas()
  store.setEdited(store.activePhoto.id, canvas.toDataURL('image/jpeg'))
}

function resetCrop() {
  cropper?.reset()
}

// Color correction functions
function applyAutoAdjust() {
  // Simple auto-adjust algorithm
  brightness.value = 5
  contrast.value = 10
  saturation.value = 15
  clarity.value = 5
  temperature.value = 0
  tint.value = 0
}

function resetColorCorrection() {
  brightness.value = 0
  contrast.value = 0
  saturation.value = 0
  clarity.value = 0
  temperature.value = 0
  tint.value = 0
}

function applyChanges() {
  if (!cropper || !store.activePhoto) return
  
  // Apply crop first
  const canvas = cropper.getCroppedCanvas()
  
  // Create a temporary canvas for color correction
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  
  if (tempCtx) {
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    
    // Apply color correction
    tempCtx.filter = imageStyle.value.filter
    tempCtx.drawImage(canvas, 0, 0)
    
    // Get final result
    const finalDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9)
    store.setEdited(store.activePhoto.id, finalDataUrl)
  }
}

// Aspect ratio presets
const aspectRatios = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4/3 },
  { label: '3:2', value: 3/2 },
  { label: '16:9', value: 16/9 },
  { label: '3:4', value: 3/4 },
  { label: '2:3', value: 2/3 },
  { label: '9:16', value: 9/16 },
]

function setAspectRatio(ratio: number | undefined) {
  cropAspectRatio.value = ratio
  if (cropper) {
    cropper.setAspectRatio(ratio || NaN)
  }
}
</script>

<template>
  <div v-if="store.activePhoto" class="h-full flex flex-col photo-editor">
    <!-- Main Editor Area -->
    <div class="flex-1 flex items-center justify-center bg-black relative overflow-hidden p-2">
      <img 
        :src="store.activePhoto.editedSrc || store.activePhoto.src" 
        ref="imgRef" 
        class="max-h-full max-w-full object-contain"
        :style="imageStyle"
        @contextmenu.prevent
        draggable="false"
      />
    </div>

    <!-- Toolbar -->
    <div class="bg-grey-darken-4 border-t border-grey-darken-3 p-3">
      <!-- Crop Tools -->
      <v-expansion-panels variant="accordion" class="mb-3">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-crop</v-icon>
            Crop & Rotate
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="space-y-3">
              <!-- Aspect Ratio -->
              <div>
                <v-label class="text-caption mb-1">Aspect Ratio</v-label>
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
              <div class="flex gap-1">
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
            <div class="space-y-3">
              <!-- Auto Adjust -->
              <div class="flex gap-1">
                <v-btn color="success" @click="applyAutoAdjust" prepend-icon="mdi-auto-fix" size="small">
                  Auto Adjust
                </v-btn>
                <v-btn color="secondary" @click="resetColorCorrection" prepend-icon="mdi-refresh" size="small">
                  Reset
                </v-btn>
              </div>

              <!-- Sliders -->
              <div class="grid grid-cols-2 gap-3">
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
      <div class="flex gap-2 justify-center">
        <v-btn color="primary" @click="crop" prepend-icon="mdi-crop" size="small">
          Apply Crop
        </v-btn>
        <v-btn color="success" @click="applyChanges" prepend-icon="mdi-check" size="small">
          Apply All Changes
        </v-btn>
      </div>
    </div>
  </div>
  <div v-else class="h-full flex items-center justify-center text-grey">
    <div class="text-center">
      <v-icon size="48" class="mb-3">mdi-image</v-icon>
      <h3 class="text-h5 mb-2">No Photo Selected</h3>
      <p class="text-body-1">Import photos to start editing</p>
    </div>
  </div>
</template>

<style scoped>
.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-3 {
  gap: 0.75rem;
}

.flex-wrap {
  flex-wrap: wrap;
}
</style>