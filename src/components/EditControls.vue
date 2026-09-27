<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useHotkey } from 'vuetify'
  import PanelSection from '@/components/PanelSection.vue'
  import SliderField from '@/components/SliderField.vue'
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { guardTextEntry } from '@/composables/useSafeHotkey'
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

  useHotkey('[', guardTextEntry(() => void rotate(90)))
  useHotkey(']', guardTextEntry(() => void rotate(-90)))
  useHotkey('\'', guardTextEntry(() => void rotate(1)))
  useHotkey('\\', guardTextEntry(() => void rotate(-1)))
  useHotkey('c', guardTextEntry(() => void startCropping()))

  /**
   * While the cropper is open, Enter commits the crop.
   *
   * The cropper is usually opened by the `c` shortcut, which leaves the focus
   * on whatever the user came from: the Import button, a ratio button, a
   * thumbnail. A strict guard would swallow Enter in all of those cases and the
   * crop would look frozen. Outside crop mode Enter keeps its native meaning
   * and activates the focused control.
   *
   * Cancel is the single control that keeps Enter to itself, because discarding
   * a crop is the one outcome the user cannot get back.
   */
  useHotkey('enter', (event: KeyboardEvent) => {
    if (!isCropping.value) {
      return
    }

    if (event.target instanceof Element && event.target.closest('.cancel-crop-button') !== null) {
      return
    }

    void applyCrop()
  })

  useHotkey('esc', guardTextEntry(() => {
    if (isCropping.value) {
      cancelCrop()
    }
  }))

  /**
   * Slider definitions live in one place so the ranges stay in sync with the
   * clamp bounds used by `buildImageFilter`. `sepia`, `invert`, `grayscale` and
   * `blur` are one-sided effects and must not accept negative values.
   *
   * The grouping is presentational, not semantic: the three inner groups are
   * separated by a hairline so seven consecutive tracks do not read as one
   * undifferentiated wall. `blur` sits last because it is an effect on the
   * image rather than a grade of the image.
   */
  const adjustmentGroups = [
    [
      { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
    ],
    [
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
      { key: 'invert', label: 'Invert', min: 0, max: 100 },
    ],
    [
      { key: 'blur', label: 'Blur', min: 0, max: 100 },
    ],
  ] as const
</script>

<template>
  <div
    v-if="activePhoto"
    class="edit-controls"
  >
    <PanelSection icon="mdi-crop" title="Crop">
      <template #actions>
        <template v-if="isCropping">
          <v-btn
            color="primary"
            prepend-icon="mdi-check"
            size="small"
            variant="flat"
            @click="applyCrop"
          >
            Apply
          </v-btn>
          <v-btn
            class="cancel-crop-button"
            prepend-icon="mdi-close"
            size="small"
            variant="text"
            @click="cancelCrop"
          >
            Cancel
          </v-btn>
        </template>
        <v-btn
          v-else
          prepend-icon="mdi-crop"
          size="small"
          variant="tonal"
          @click="startCropping"
        >
          Start
        </v-btn>
      </template>

      <div class="ratio">
        <span class="ratio__label">Aspect</span>

        <v-btn-toggle
          v-model="cropAspectRatio"
          class="ratio__toggle"
          density="compact"
          mandatory
        >
          <v-btn
            v-for="ratio in aspectRatios"
            :key="ratio.label"
            class="ratio__option"
            size="x-small"
            :value="ratio.value"
            variant="outlined"
          >
            {{ ratio.label }}
          </v-btn>
        </v-btn-toggle>
      </div>
    </PanelSection>

    <PanelSection icon="mdi-rotate-right" title="Rotate">
      <template #actions>
        <v-btn
          v-tooltip="'Reset crop and rotation'"
          aria-label="Reset crop and rotation"
          icon="mdi-restore"
          size="x-small"
          variant="text"
          @click="resetCrop"
        />
      </template>

      <div class="rotate-grid">
        <v-btn
          prepend-icon="mdi-rotate-right"
          size="small"
          variant="tonal"
          @click="rotate(90)"
        >
          +90°
        </v-btn>
        <v-btn
          prepend-icon="mdi-rotate-left"
          size="small"
          variant="tonal"
          @click="rotate(-90)"
        >
          −90°
        </v-btn>
        <v-btn
          prepend-icon="mdi-rotate-right"
          size="small"
          variant="tonal"
          @click="rotate(1)"
        >
          +1°
        </v-btn>
        <v-btn
          prepend-icon="mdi-rotate-left"
          size="small"
          variant="tonal"
          @click="rotate(-1)"
        >
          −1°
        </v-btn>
      </div>
    </PanelSection>

    <PanelSection icon="mdi-tune-vertical" title="Adjustments">
      <template #actions>
        <v-btn
          v-tooltip="'Reset all adjustments'"
          aria-label="Reset all adjustments"
          icon="mdi-restore"
          size="x-small"
          variant="text"
          @click="resetColorCorrection"
        />
      </template>

      <div
        v-for="(group, index) in adjustmentGroups"
        :key="index"
        class="adjustment-group"
      >
        <SliderField
          v-for="slider in group"
          :key="slider.key"
          v-model="activePhoto[slider.key]"
          :label="slider.label"
          :max="slider.max"
          :min="slider.min"
        />
      </div>
    </PanelSection>
  </div>
</template>

<style lang="scss" scoped>
.edit-controls {
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
}

/* Aspect ratio ---------------------------------------------------------- */

.ratio {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratio__label {
  font-size: 12px;
  font-weight: 550;
  color: rgba(255, 255, 255, 0.78);
}

.ratio__toggle {
  display: flex;
  width: 100%;
}

/* Five ratios have to share one 320px row, so the options take equal tracks
 * and drop the horizontal padding Vuetify adds to small buttons. */
.ratio__option {
  flex: 1 1 0;
  min-width: 0;
  padding-inline: 4px;
}

/* Rotate ---------------------------------------------------------------- */

/* Two columns of two: at 320px a single row of four labelled buttons would put
 * each label under roughly 60px. */
.rotate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.rotate-grid :deep(.v-btn) {
  justify-content: flex-start;
}

/* Adjustments ----------------------------------------------------------- */

.adjustment-group + .adjustment-group {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--dr-hairline);
}
</style>
