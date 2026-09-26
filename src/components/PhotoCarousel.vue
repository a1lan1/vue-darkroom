<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { isPhotoEdited, usePhotoStore } from '@/stores/photoStore'
  import { formatBytes } from '@/utils/formatBytes'

  const photoStore = usePhotoStore()
  const { setActive, removePhoto } = photoStore
  const { photos, activePhotoId } = storeToRefs(photoStore)
</script>

<template>
  <v-footer
    v-if="!photoStore.isEmpty"
    app
    class="px-0"
    height="100"
  >
    <v-slide-group show-arrows>
      <v-slide-group-item
        v-for="photo in photos"
        :key="photo.id"
        :aria-current="photo.id === activePhotoId"
        role="button"
        :tabindex="0"
      >
        <v-badge offset-x="10" offset-y="14">
          <template #badge>
            <v-btn
              :aria-label="`Remove ${photo.name}`"
              class="remove-button"
              density="compact"
              icon="mdi-close"
              size="x-small"
              variant="elevated"
              @click.stop="removePhoto(photo.id)"
            />
          </template>

          <v-card
            class="my-2 mx-1 d-flex align-center"
            :class="{ 'border-md border-primary': photo.id === activePhotoId }"
            height="80"
            :tabindex="-1"
            width="100"
            @click="setActive(photo.id)"
            @keydown.enter.prevent="setActive(photo.id)"
            @keydown.space.prevent="setActive(photo.id)"
          >
            <v-img
              cover
              :src="photo.thumbnailSrc ?? photo.src"
              @contextmenu.prevent
            >
              <v-chip
                v-if="photo.exportedSize"
                class="text-caption font-weight-medium"
                color="black"
                size="x-small"
                variant="elevated"
              >
                {{ formatBytes(photo.exportedSize) }}
              </v-chip>

              <v-icon
                v-if="isPhotoEdited(photo)"
                v-tooltip="'Edited'"
                aria-label="Edited"
                class="edited-indicator"
                color="success"
                size="14"
              >
                mdi-check-circle
              </v-icon>
            </v-img>
          </v-card>
        </v-badge>
      </v-slide-group-item>
    </v-slide-group>
  </v-footer>
</template>

<style lang="scss" scoped>
.remove-button {
  opacity: 0;
  transition: opacity 120ms ease-in-out;
}

// Keyboard users must always be able to reach the remove control.
:deep(.v-slide-group-item):focus-within .remove-button {
  opacity: 1;
}

:deep(.v-slide-group-item):hover .remove-button {
  opacity: 1;
}

:deep(.remove-button:focus-visible) {
  opacity: 1;
}

.edited-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>
