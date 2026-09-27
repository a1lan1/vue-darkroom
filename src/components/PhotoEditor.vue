<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { ref, watch } from 'vue'
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { usePhotoStore } from '@/stores/photoStore'

  const photoStore = usePhotoStore()
  const { activePhoto, imageFilter } = storeToRefs(photoStore)

  const { registerImage, displaySrc } = usePhotoEditor()

  const imageRef = ref<HTMLImageElement | null>(null)

  // `flush: 'post'` guarantees the element is in the DOM before the cropper
  // receives it; `null` releases it on unmount.
  watch(imageRef, registerImage, { immediate: true, flush: 'post' })
</script>

<template>
  <div class="canvas">
    <div
      v-if="activePhoto"
      class="canvas__frame"
    >
      <img
        ref="imageRef"
        :alt="`Editing ${activePhoto.name}`"
        class="canvas__image"
        draggable="false"
        :src="displaySrc"
        :style="{ filter: imageFilter }"
        @contextmenu.prevent
      >
    </div>

    <div
      v-else
      class="empty-state"
    >
      <div class="empty-state__badge">
        <v-icon
          icon="mdi-image-multiple-outline"
          size="28"
        />
      </div>

      <h2 class="empty-state__title">
        No photos yet
      </h2>

      <p class="empty-state__text">
        Drag images anywhere onto the window, or use <strong>Import Photos</strong> in the header to
        start editing.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
}

.canvas__frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/*
 * The canvas sits on near-black, so the photograph needs a cast shadow to
 * separate from the background: without it a dark photo bleeds into the page.
 */
.canvas__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  border-radius: 2px;
  object-fit: contain;
  box-shadow: var(--dr-shadow-image);
}

// Keeps the image inside the cropper consistent with the filtered preview.
//
// The filter must never reach `.cropper-container`: cropper.js puts the crop
// box, the view box, the guide lines and the resize handles inside it, so a
// filter on the container blurs, sepias and inverts the tool itself. Only the
// image layer (`.cropper-canvas`) may carry the effect.
:deep(.cropper-canvas) {
  filter: v-bind(imageFilter);
}

// cropper.js ships its own palette. Left alone the crop box stays grey while
// the rest of the product is amber, so the one surface where the user is making
// the actual decision is the least branded part of the app.
:deep(.cropper-view-box) {
  outline: 1px solid var(--dr-accent-ring);
}

:deep(.cropper-dashed) {
  border-color: rgba(255, 255, 255, 0.32);
}

:deep(.cropper-handle),
:deep(.cropper-point) {
  background-color: var(--dr-brand-core);
}

/* Empty state ------------------------------------------------------------ */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 340px;
  padding: 36px 28px;
  border: 1px dashed var(--dr-hairline-strong);
  border-radius: var(--dr-radius-lg);
  text-align: center;
}

.empty-state__badge {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin-bottom: 18px;
  border: 1px solid var(--dr-hairline);
  border-radius: var(--dr-radius-lg);
  background: var(--dr-accent-soft);
  color: var(--dr-brand-core);
}

.empty-state__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.empty-state__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.55);
}

.empty-state__text strong {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.82);
}

@media (max-width: 599px) {
  .canvas {
    padding: 12px;
  }

  .empty-state {
    padding: 28px 20px;
  }
}
</style>
