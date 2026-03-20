<script lang="ts" setup>
  import PhotoCarousel from '@/components/PhotoCarousel.vue'
  import SidePanel from '@/components/SidePanel.vue'
  import TheToolbar from '@/components/TheToolbar.vue'
</script>

<template>
  <TheToolbar />
  <SidePanel />

  <v-main>
    <router-view />
  </v-main>

  <PhotoCarousel />
</template>
