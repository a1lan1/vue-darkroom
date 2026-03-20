<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { setActive, removePhoto } = photoStore
  const { photos, activePhotoId } = storeToRefs(photoStore)

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const hasChanges = (photo: any): boolean => {
    return Boolean(photo.editedSrc && photo.editedSrc !== photo.src)
  }
</script>

<template>
  <v-footer v-if="photos.length > 0" app class="px-0" height="100">
    <v-slide-group show-arrows>
      <v-slide-group-item
        v-for="(photo, index) in photos"
        :key="index"
      >
        <v-badge offset-x="10" offset-y="14">
          <template #badge>
            <v-icon
              icon="mdi-close"
              @click="removePhoto(photo.id)"
            />
          </template>

          <v-card
            class="my-2 mx-1 d-flex align-center"
            :class="{ 'border-md border-primary': photo.id === activePhotoId }"
            height="80"
            width="100"
            @click="setActive(photo.id)"
          >
            <v-img
              cover
              :src="photo.src"
              @contextmenu.prevent
            >
              <v-chip
                v-if="photo.fileSize"
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
            </v-img>
          </v-card>
        </v-badge>
      </v-slide-group-item>
    </v-slide-group>
  </v-footer>
</template>
