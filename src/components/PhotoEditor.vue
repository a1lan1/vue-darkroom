<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const { imgRef, isCropping } = usePhotoEditor()
  const photoStore = usePhotoStore()
  const { activePhoto, imageFilter } = storeToRefs(photoStore)

  const imageSource = computed(() => {
    if (!activePhoto.value) return ''
    // When cropping, always use the original source
    if (isCropping.value) {
      return activePhoto.value.src
    }
    // Otherwise, show the cropped preview if it exists
    return activePhoto.value.previewSrc || activePhoto.value.src
  })
</script>

<template>
  <div class="w-100 h-100 d-flex align-center justify-center pa-4">
    <div
      v-if="activePhoto"
      class="w-100 h-100 d-flex align-center justify-center position-relative"
    >
      <img
        ref="imgRef"
        alt="photo"
        class="image-fit"
        draggable="false"
        :src="imageSource"
        :style="{ filter: imageFilter }"
        @contextmenu.prevent
      >
    </div>
    <div v-else class="text-center">
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

// This is for applying filters when cropper is active
:deep(.cropper-bg) {
  filter: v-bind(imageFilter);
}
</style>
