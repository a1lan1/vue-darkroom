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

  // Group photos into slides (4 photos per slide)
  const photoSlides = computed(() => {
    const slides = []
    for (let i = 0; i < store.photos.length; i += 4) {
      slides.push(store.photos.slice(i, i + 4))
    }
    return slides
  })
</script>

<template>
  <v-footer class="bg-grey-darken-4 pa-0" height="120">
    <v-container class="h-100 pa-0">
      <div v-if="store.photos.length === 0" class="h-100 d-flex align-center justify-center text-grey">
        <div class="text-center">
          <v-icon class="mb-1" size="24">mdi-image-multiple</v-icon>
          <p class="text-caption">No photos imported</p>
        </div>
      </div>
      <div v-else class="h-100">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between pa-2">
          <v-chip color="primary" size="x-small" variant="tonal">
            {{ store.activePhoto ? store.photos.findIndex(p => p.id === store.activePhotoId) + 1 : 0 }}/{{ store.photos.length }}
          </v-chip>
        </div>

        <!-- Photo slides -->
        <v-sheet elevation="8">
          <v-slide-group show-arrows>
            <v-slide-group-item
              v-for="(file, index) in photoSlides"
              :key="index"
              v-slot="{ isSelected, toggle }"
              @click="store.setActive(file.id)"
            >
              <v-card
                class="my-2 mx-1"
                :color="isSelected ? 'primary' : 'grey-lighten-1'"
                height="50"
                width="100"
                @click="toggle"
              >
                <v-img
                  cover
                  :src="file.url"
                  @contextmenu.prevent
                >
                  <div class="d-flex fill-height align-center justify-center">
                    <v-scale-transition>
                      <v-icon
                        v-if="isSelected"
                        color="primary"
                        icon="mdi-check-circle"
                        size="30"
                      />
                    </v-scale-transition>
                  </div>

                  <v-chip
                    class="text-caption font-weight-medium"
                    color="black"
                    size="x-small"
                    variant="elevated"
                  >
                    {{ formatFileSize(file.fileSize) }}
                  </v-chip>

                  <!-- Edit indicator -->
                  <div v-if="hasChanges(file)" class="position-absolute top-0 right-0 pa-0-5">
                    <v-icon color="success" size="12">mdi-check-circle</v-icon>
                  </div>

                  <!-- Active indicator -->
                  <div v-if="file.id === store.activePhotoId" class="position-absolute top-0 left-0 pa-0-5">
                    <v-icon color="primary" size="12">mdi-circle</v-icon>
                  </div>
                </v-img>
              </v-card>
            </v-slide-group-item>
          </v-slide-group>
        </v-sheet>
      </div>
    </v-container>
  </v-footer>
</template>
