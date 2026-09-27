<script setup lang="ts">
  import { computed } from 'vue'

  /**
   * SliderField
   *
   * One adjustment control: label, live readout, track.
   *
   * The readout is part of the control instead of a thumb tooltip, because the
   * seven adjustment sliders share a single 320px column and a value you can
   * only see while dragging is a value you cannot compare against its
   * neighbours.
   */
  const props = defineProps<{
    label: string
    max: number
    min: number
    modelValue: number
  }>()

  const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

  /** Tonal adjustments take negatives, so they read as signed; filters do not. */
  const isBipolar = computed(() => props.min < 0)
  const isNeutral = computed(() => props.modelValue === 0)

  const displayValue = computed(() => (
    isBipolar.value && props.modelValue > 0 ? `+${props.modelValue}` : String(props.modelValue)
  ))

  function reset (): void {
    emit('update:modelValue', 0)
  }
</script>

<template>
  <div class="slider-field">
    <div class="slider-field__head">
      <span class="slider-field__label">{{ label }}</span>

      <button
        v-tooltip="'Reset to 0'"
        :aria-label="`Reset ${label} to 0`"
        class="slider-field__value tnum"
        :class="{ 'slider-field__value--neutral': isNeutral }"
        type="button"
        @click="reset"
      >
        {{ displayValue }}
      </button>
    </div>

    <v-slider
      :max="max"
      :min="min"
      :model-value="modelValue"
      step="1"
      @dblclick="reset"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.slider-field + .slider-field {
  margin-top: 12px;
}

.slider-field__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: -2px;
}

.slider-field__label {
  font-size: 12px;
  font-weight: 550;
  color: rgba(255, 255, 255, 0.78);
}

.slider-field__value {
  padding: 2px 6px;
  margin: -2px -6px -2px 0;
  border: 0;
  border-radius: var(--dr-radius-xs);
  background: transparent;
  color: var(--dr-brand-core);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background-color var(--dr-dur-fast) var(--dr-ease);
}

.slider-field__value:hover {
  background: var(--dr-accent-soft);
}

/* At rest the numbers recede so a tuned slider is the one that stands out. */
.slider-field__value--neutral {
  color: rgba(255, 255, 255, 0.38);
}
</style>
