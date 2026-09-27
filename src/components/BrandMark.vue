<script setup lang="ts">
  import { useId } from 'vue'

  /**
   * The mark is a six-blade aperture. Each blade is a chord of the outer rim
   * held 4 units off centre, which is what makes the openings read as a
   * physical iris rather than a decorative starburst.
   */
  const BLADES: ReadonlyArray<readonly [number, number, number, number]> = [
    [2.83, 16, 21.17, 16],
    [10.88, 21.94, 20.05, 6.06],
    [3.95, 6.06, 13.12, 21.94],
    [13.12, 2.06, 3.95, 17.94],
    [21.17, 8, 2.83, 8],
    [20.05, 17.94, 10.88, 2.06],
  ]

  /**
   * The safelight bleed is the one filter in the document, and `id`s must stay
   * unique per instance or a second mark would silently reuse the first one's
   * gradient and paint the glow at the wrong radius.
   */
  const glowId = `dr-safelight-${useId()}`

  withDefaults(defineProps<{ size?: number }>(), {
    size: 32,
  })
</script>

<template>
  <svg
    aria-hidden="true"
    class="brand-mark"
    fill="none"
    focusable="false"
    :height="size"
    :viewBox="'0 0 24 24'"
    :width="size"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient
        :id="glowId"
        cx="50%"
        cy="50%"
        r="50%"
      >
        <stop
          offset="0%"
          stop-color="var(--dr-brand-core)"
          stop-opacity="0.5"
        />
        <stop
          offset="55%"
          stop-color="var(--dr-brand-core)"
          stop-opacity="0.12"
        />
        <stop
          offset="100%"
          stop-color="var(--dr-brand-core)"
          stop-opacity="0"
        />
      </radialGradient>
    </defs>

    <circle
      :cx="12"
      :cy="12"
      :fill="`url(#${glowId})`"
      r="9.5"
    />

    <circle
      class="brand-mark__rim"
      cx="12"
      cy="12"
      r="10"
    />

    <line
      v-for="blade in BLADES"
      :key="blade.join('-')"
      class="brand-mark__blade"
      :x1="blade[0]"
      :x2="blade[2]"
      :y1="blade[1]"
      :y2="blade[3]"
    />

    <circle
      class="brand-mark__core"
      cx="12"
      cy="12"
      r="1.9"
    />
  </svg>
</template>

<style lang="scss" scoped>
.brand-mark {
  display: block;
  flex: none;
  overflow: visible;
}

.brand-mark__rim {
  stroke: var(--dr-brand-rim);
  stroke-width: 1.1;
}

.brand-mark__blade {
  stroke: var(--dr-brand-blade);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.brand-mark__core {
  fill: var(--dr-brand-core);
}
</style>
