<script setup lang="ts">
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
  <v-footer v-if="store.photos.length > 0" app class="pa-2 my-0" height="120">
    <v-slide-group show-arrows>
      <v-slide-group-item
        v-for="(photo, index) in store.photos"
        :key="index"
      >
        <v-card
          class="my-2 mx-1"
          height="80"
          width="100"
          @click="store.setActive(photo.id)"
        >
          <v-img
            cover
            :src="photo.src"
            @contextmenu.prevent
          >
            <v-chip
              class="text-caption font-weight-medium"
              color="black"
              size="x-small"
              variant="elevated"
            >
              {{ formatFileSize(photo.fileSize) }}
            </v-chip>

            <!-- Edit indicator -->
            <div v-if="hasChanges(photo)" class="position-absolute top-0 right-0 pa-0-5">
              <v-icon color="success" size="12">mdi-check-circle</v-icon>
            </div>

            <!-- Active indicator -->
            <div v-if="photo.id === store.activePhotoId" class="position-absolute top-0 left-0 pa-0-5">
              <v-icon color="primary" size="12">mdi-circle</v-icon>
            </div>
          </v-img>
        </v-card>
      </v-slide-group-item>
    </v-slide-group>
  </v-footer>
</template>
