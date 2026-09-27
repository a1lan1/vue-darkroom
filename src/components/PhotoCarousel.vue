<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { isPhotoEdited, usePhotoStore } from '@/stores/photoStore'
  import { formatBytes } from '@/utils/formatBytes'

  const photoStore = usePhotoStore()
  const { setActive, removePhoto } = photoStore
  const { isEmpty, photos, activePhotoId } = storeToRefs(photoStore)
</script>

<template>
  <v-footer
    v-if="!isEmpty"
    app
    class="filmstrip"
    height="104"
  >
    <v-slide-group
      class="filmstrip__track"
      show-arrows
    >
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
          class="thumb"
          :class="{ 'thumb--active': photo.id === activePhotoId }"
          height="72"
          role="button"
          :tabindex="0"
          width="100"
          @click="setActive(photo.id)"
          @keydown.enter.prevent="setActive(photo.id)"
          @keydown.space.prevent="setActive(photo.id)"
        >
          <v-img
            v-tooltip="`${photo.name} · Alt+←/→ to switch`"
            class="thumb__image"
            cover
            :src="photo.thumbnailSrc ?? photo.src"
            @contextmenu.prevent
          >
            <template #placeholder>
              <div class="thumb__placeholder" />
            </template>

            <span
              v-if="isPhotoEdited(photo)"
              v-tooltip="'Edited'"
              :aria-label="`${photo.name} has been edited`"
              class="thumb__badge thumb__badge--edited"
            >
              <v-icon
                icon="mdi-check"
                size="11"
              />
            </span>

            <span
              v-if="photo.exportedSize"
              class="thumb__badge thumb__badge--size tnum"
            >
              {{ formatBytes(photo.exportedSize) }}
            </span>
          </v-img>

          <v-btn
            :aria-label="`Remove ${photo.name}`"
            class="thumb__remove"
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
.filmstrip {
  padding-inline: 12px;
  border-top: 1px solid var(--dr-hairline);
  background: rgba(var(--v-theme-surface, 20, 22, 25), 0.72);
  backdrop-filter: blur(16px) saturate(140%);
}

.filmstrip__track {
  padding: 4px 0;
}

/* Thumbnail -------------------------------------------------------------- */

.thumb {
  position: relative;
  margin: 10px 5px;
  overflow: hidden;
  border: 1px solid var(--dr-hairline-strong);
  cursor: pointer;
  transition:
    box-shadow var(--dr-dur-base) var(--dr-ease),
    transform var(--dr-dur-base) var(--dr-ease),
    border-color var(--dr-dur-base) var(--dr-ease);
}

.thumb:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

/*
 * The active thumbnail is marked by a ring in the accent rather than a
 * brightness change: the thumbnails are photographs, and tinting one of them
 * would misrepresent the colours the user is grading.
 */
.thumb--active {
  border-color: transparent;
  box-shadow: 0 0 0 2px var(--dr-brand-core), var(--dr-shadow-accent);
  transform: translateY(-2px);
}

.thumb__image {
  width: 100%;
  height: 100%;
}

.thumb__placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
}

/* Badges ----------------------------------------------------------------- */

/*
 * `v-img` renders its slot content absolutely positioned, so every badge is
 * placed explicitly. The corners are divided: edited state top-left, exported
 * size bottom-right.
 */
.thumb__badge {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  padding: 0 5px;
  border-radius: var(--dr-radius-xs);
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(4px);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
  pointer-events: none;
}

.thumb__badge--edited {
  top: 4px;
  left: 4px;
  width: 16px;
  padding: 0;
  color: var(--dr-brand-core);
}

.thumb__badge--size {
  right: 4px;
  bottom: 4px;
}

/* Remove control --------------------------------------------------------- */

/*
 * Positioned over the thumbnail rather than in a `v-badge`: a badge keeps its
 * own background painted, so fading only the button left a bare grey circle
 * behind. On a pointer device it waits for a hover so the strip stays quiet;
 * the active thumbnail keeps it permanently visible, and devices without a
 * hover (touch) never hide it, because a control that only appears on hover is
 * unreachable there.
 *
 * The global icon-button rule sizes every `.v-btn--icon` for the app bar, which
 * inflated this one to 40px on a 72px thumbnail. The compound selector is what
 * outranks it, and the pseudo-element then restores a 28px hit area around the
 * 20px button so it stays tappable.
 *
 * `height`/`width` are literal rather than derived from `--v-btn-height`:
 * Vuetify renders an icon button as `calc(var(--v-btn-height) + 12px)` at the
 * default density, so the token would have to be set to 8px to land on 20.
 */
.thumb .thumb__remove {
  --v-btn-size: 14px;
  min-width: 0;
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 2;
  width: 20px;
  height: 20px;
}

.thumb .thumb__remove::after {
  position: absolute;
  inset: -4px;
  content: '';
}

@media (hover: hover) and (pointer: fine) {
  .thumb__remove {
    opacity: 0;
    transition: opacity var(--dr-dur-fast) var(--dr-ease);
  }

  .thumb:hover .thumb__remove,
  .thumb:focus-within .thumb__remove,
  .thumb--active .thumb__remove {
    opacity: 1;
  }
}

/* Slide group arrows ----------------------------------------------------- */

.filmstrip__track :deep(.v-slide-group__content) {
  align-items: center;
}

.filmstrip__track :deep(.v-slide-group__prev),
.filmstrip__track :deep(.v-slide-group__next) {
  opacity: 0.55;
  transition: opacity var(--dr-dur-fast) var(--dr-ease);
}

.filmstrip__track :deep(.v-slide-group__prev:hover),
.filmstrip__track :deep(.v-slide-group__next:hover) {
  opacity: 1;
}
</style>
