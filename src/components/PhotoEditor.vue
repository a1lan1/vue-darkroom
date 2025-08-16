<script setup lang="ts">
  import { onMounted } from 'vue'
  import { usePhotoEditor } from '@/composables/usePhotoEditor'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const store = usePhotoStore()
  const { imgRef, imageStyle, initCropper } = usePhotoEditor()

  console.log('PhotoEditor setup - imgRef:', !!imgRef.value)

  onMounted(() => {
    console.log('PhotoEditor mounted - imgRef:', !!imgRef.value)
    if (store.activePhoto && imgRef.value) {
      console.log('Initializing cropper on mount')
      initCropper()
    }
  })
</script>

<template>
  <div v-if="store.activePhoto" class="h-100 d-flex align-center justify-center bg-black pa-4">
    <img
      ref="imgRef"
      class="max-h-100 max-w-100 object-contain"
      draggable="false"
      :src="store.activePhoto.editedSrc || store.activePhoto.src"
      :style="imageStyle"
      @contextmenu.prevent
      @load="() => console.log('Image loaded in PhotoEditor:', store.activePhoto?.id)"
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
