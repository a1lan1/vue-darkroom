<script setup lang="ts">
  /**
   * DragOverlay
   *
   * The drop target shown while files are over the window.
   */
  defineProps<{
    show: boolean
  }>()
</script>

<template>
  <div
    v-if="show"
    class="drop-overlay"
  >
    <div class="drop-overlay__panel">
      <div class="drop-overlay__badge">
        <v-icon
          icon="mdi-tray-arrow-down"
          size="28"
        />
      </div>

      <h2 class="drop-overlay__title">
        Drop to import
      </h2>

      <p class="drop-overlay__text">
        Release to add the images to your library
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(var(--v-theme-background, 12, 13, 15), 0.72);
  backdrop-filter: blur(6px);
  pointer-events: none;
  animation: drop-overlay-in var(--dr-dur-base) var(--dr-ease);
}

.drop-overlay__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 380px;
  padding: 40px 32px;
  border: 2px dashed var(--dr-accent-ring);
  border-radius: var(--dr-radius-lg);
  background: rgba(var(--v-theme-surface, 20, 22, 25), 0.9);
  box-shadow: var(--dr-shadow-accent);
  text-align: center;
}

.drop-overlay__badge {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: var(--dr-accent-soft);
  color: var(--dr-brand-core);
}

.drop-overlay__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.drop-overlay__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.55);
}

@keyframes drop-overlay-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
