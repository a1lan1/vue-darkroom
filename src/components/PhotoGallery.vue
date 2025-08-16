<script setup lang="ts">
import { computed } from 'vue'
import { usePhotoStore } from '@/stores/PhotoStore'

const store = usePhotoStore()

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return 'N/A'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const hasChanges = (photo: any) => {
  return photo.editedSrc && photo.editedSrc !== photo.src
}
</script>

<template>
  <div class="h-full bg-grey-darken-4 p-2">
    <div v-if="store.photos.length === 0" class="h-full flex items-center justify-center text-grey">
      <div class="text-center">
        <v-icon size="24" class="mb-1">mdi-image-multiple</v-icon>
        <p class="text-caption">No photos imported</p>
      </div>
    </div>
    
    <div v-else class="h-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2 px-1">
        <h3 class="text-subtitle-2 font-weight-medium">
          Photos ({{ store.photos.length }})
        </h3>
        <v-chip size="x-small" color="primary" variant="tonal">
          {{ store.activePhoto ? store.photos.findIndex(p => p.id === store.activePhotoId) + 1 : 0 }}/{{ store.photos.length }}
        </v-chip>
      </div>

      <!-- Photo Grid -->
      <div class="h-[calc(100%-32px)] overflow-x-auto">
        <div class="flex gap-1 p-1" style="min-height: 80px;">
          <div
            v-for="photo in store.photos"
            :key="photo.id"
            class="relative group cursor-pointer flex-shrink-0"
            @click="store.setActive(photo.id)"
          >
            <!-- Photo Thumbnail -->
            <div 
              class="w-20 h-16 bg-black rounded overflow-hidden border-2 transition-all duration-200"
              :class="{
                'border-primary': photo.id === store.activePhotoId,
                'border-transparent hover:border-grey-lighten-1': photo.id !== store.activePhotoId
              }"
            >
              <img 
                :src="photo.editedSrc || photo.src" 
                :alt="`Photo ${photo.id}`"
                class="w-full h-full object-cover"
                @contextmenu.prevent
                draggable="false"
              />
              
              <!-- Overlay with file size -->
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-end">
                <div class="w-full p-1">
                  <v-chip 
                    size="x-small" 
                    color="black" 
                    variant="elevated"
                    class="text-caption font-weight-medium"
                  >
                    {{ formatFileSize(photo.fileSize) }}
                  </v-chip>
                </div>
              </div>

              <!-- Edit indicator -->
              <div v-if="hasChanges(photo)" class="absolute top-0.5 right-0.5">
                <v-icon size="12" color="success">mdi-check-circle</v-icon>
              </div>

              <!-- Active indicator -->
              <div v-if="photo.id === store.activePhotoId" class="absolute top-0.5 left-0.5">
                <v-icon size="12" color="primary">mdi-circle</v-icon>
              </div>
            </div>

            <!-- Photo info on hover -->
            <div class="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded">
              <div class="text-center text-white">
                <v-icon size="16" class="mb-1">mdi-eye</v-icon>
                <p class="text-caption">Click to view</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex {
  display: flex;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.w-20 {
  width: 5rem;
}

.h-16 {
  height: 4rem;
}

.border-2 {
  border-width: 2px;
}

.border-primary {
  border-color: rgb(var(--v-theme-primary));
}

.border-transparent {
  border-color: transparent;
}

.border-grey-lighten-1 {
  border-color: rgb(var(--v-theme-grey-lighten-1));
}

.bg-opacity-0 {
  background-color: rgba(0, 0, 0, 0);
}

.bg-opacity-30 {
  background-color: rgba(0, 0, 0, 0.3);
}

.bg-opacity-75 {
  background-color: rgba(0, 0, 0, 0.75);
}

.opacity-0 {
  opacity: 0;
}

.group:hover .opacity-100 {
  opacity: 1;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.duration-200 {
  transition-duration: 200ms;
}

.overflow-x-auto {
  overflow-x: auto;
}

.top-0\.5 {
  top: 0.125rem;
}

.right-0\.5 {
  right: 0.125rem;
}

.left-0\.5 {
  left: 0.125rem;
}
</style>
