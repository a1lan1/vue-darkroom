<template>
  <v-main>
    <router-view />
  </v-main>

  <SidePanel />
  <PhotoCarousel />
</template>

<script lang="ts" setup>
  import PhotoCarousel from '@/components/PhotoCarousel.vue'
  import SidePanel from '@/components/SidePanel.vue'
</script>
