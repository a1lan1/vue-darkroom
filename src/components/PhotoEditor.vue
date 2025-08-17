<script setup lang="ts">
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const store = usePhotoStore()
  const { imgRef, imageStyle } = usePhotoEditor()
</script>

<template>
  <div v-if="store.activePhoto" class="h-75 d-flex align-center justify-center bg-black pa-10">
    <img
      ref="imgRef"
      alt="photo"
      class="w-100"
      draggable="false"
      :src="store.activePhoto.editedSrc || store.activePhoto.src"
      :style="imageStyle"
      @contextmenu.prevent
    >
  </div>
  <div v-else class="h-100 d-flex align-center justify-center text-grey">
    <div class="text-center">
      <v-icon class="mb-3" size="48">mdi-image</v-icon>
      <h3 class="text-h5 mb-2">No Photo Selected</h3>
      <p class="text-body-1">Import photos to start editing</p>
    </div>
  </div>
</template>
