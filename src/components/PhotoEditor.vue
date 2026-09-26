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
  <div class="w-100 h-100 d-flex align-center justify-center pa-4">
    <div
      v-if="activePhoto"
      class="w-100 h-100 d-flex align-center justify-center position-relative"
    >
      <img
        ref="imageRef"
        :alt="`Editing ${activePhoto.name}`"
        class="image-fit"
        draggable="false"
        :src="displaySrc"
        :style="{ filter: imageFilter }"
        @contextmenu.prevent
      >
    </div>
    <div
      v-else
      class="text-center"
    >
      <v-icon class="mb-4" color="grey-darken-2" size="64">mdi-image-multiple-outline</v-icon>
      <h2 class="text-h5 mb-2">No Photo Selected</h2>
      <p class="text-body-1 mb-4">Drag and drop an image here or click the button above</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.image-fit {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

// Keeps the cropper backdrop consistent with the filtered preview.
:deep(.cropper-bg) {
  filter: v-bind(imageFilter);
}
</style>
