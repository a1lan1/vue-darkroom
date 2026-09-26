<script setup lang="ts">
  import PhotoCarousel from '@/components/PhotoCarousel.vue'
  import SidePanel from '@/components/SidePanel.vue'
  import TheToolbar from '@/components/TheToolbar.vue'
  import { providePhotoEditor } from '@/composables/usePhotoEditor'

  // The layout is the closest common ancestor of the editor view and the crop
  // controls, so it owns the single editor controller.
  providePhotoEditor()
</script>

<template>
  <TheToolbar />
  <SidePanel />

  <v-main>
    <router-view />
  </v-main>

  <PhotoCarousel />
</template>
