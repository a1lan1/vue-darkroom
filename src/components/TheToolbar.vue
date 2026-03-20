<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const emit = defineEmits<{
    'import': []
    'show-help': []
  }>()

  const photoStore = usePhotoStore()
  const { photos } = storeToRefs(photoStore)
  const { exportAll } = photoStore
</script>

<template>
  <v-app-bar color="grey-darken-4" density="compact" elevation="2">
    <v-toolbar-title class="font-weight-bold">
      <v-icon class="mr-1" size="small">mdi-camera</v-icon>
      DarkRoom
    </v-toolbar-title>

    <v-spacer />

    <v-btn
      color="primary"
      density="compact"
      elevation="5"
      prepend-icon="mdi-folder-open"
      variant="text"
      @click="emit('import')"
    >
      Import Photos
    </v-btn>

    <v-btn
      v-if="photos.length > 0"
      color="success"
      density="compact"
      elevation="5"
      prepend-icon="mdi-download"
      variant="text"
      @click="exportAll"
    >
      Export All
    </v-btn>

    <v-divider class="mx-2" vertical />

    <v-btn
      icon="mdi-help-circle"
      variant="text"
      @click="emit('show-help')"
    />
  </v-app-bar>
</template>
