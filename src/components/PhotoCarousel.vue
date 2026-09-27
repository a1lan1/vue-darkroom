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
      >
        <!--
          The interactive semantics live on the card: `v-slide-group-item`
          renders no element of its own, so attributes placed on it were
          dropped without warning, which left the thumbnails unreachable by
          keyboard and unselectable by assistive technology.
        -->
        <v-card
          :aria-current="photo.id === activePhotoId ? 'true' : undefined"
          class="my-2 mx-1 d-flex align-center position-relative"
          :class="{ 'border-md border-primary': photo.id === activePhotoId }"
          height="80"
          role="button"
          :tabindex="0"
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
              class="exported-size text-caption font-weight-medium"
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

          <v-btn
            :aria-label="`Remove ${photo.name}`"
            class="remove-button"
            density="compact"
            icon="mdi-close"
            size="x-small"
            variant="elevated"
            @click.stop="removePhoto(photo.id)"
          />
        </v-card>
      </v-slide-group-item>
    </v-slide-group>
  </v-footer>
</template>

<style lang="scss" scoped>
/*
 * The remove control is positioned over the thumbnail instead of living in a
 * `v-badge`: a badge keeps its own background painted, so fading only the
 * button left a bare grey circle behind. It stays visible at all times because
 * a control that only appears on hover is unreachable for touch users and for
 * anyone scanning the filmstrip.
 */
.remove-button {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
}

/*
 * The top-right corner belongs to the remove control, so the edited marker
 * sits opposite it and the exported size moves to the bottom-left. All three
 * are placed explicitly: `v-img` content is absolutely positioned, and the
 * default flow order would stack them on top of each other.
 */
.edited-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 1;
}

.exported-size {
  position: absolute;
  bottom: 2px;
  left: 2px;
  z-index: 1;
}
</style>
