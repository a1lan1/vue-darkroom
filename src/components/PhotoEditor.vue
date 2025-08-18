<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { activePhoto, imageFilter } = storeToRefs(photoStore)

  const { imgRef } = usePhotoEditor()
</script>

<template>
  <div class="fill-height d-flex align-center justify-center">
    <div v-if="activePhoto" class="h-75 d-flex align-center justify-center bg-black pa-5">
      <img
        ref="imgRef"
        alt="photo"
        class="h-screen"
        draggable="false"
        :src="activePhoto.editedSrc || activePhoto.src"
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
::v-deep(.cropper-bg) {
  filter: v-bind(imageFilter);
}
</style>
