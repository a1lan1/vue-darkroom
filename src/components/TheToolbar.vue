<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import BrandMark from '@/components/BrandMark.vue'
  import { useAppStore } from '@/stores/appStore'
  import { usePhotoStore } from '@/stores/photoStore'

  const photoStore = usePhotoStore()
  const { isEmpty, isExporting, totalPhotos } = storeToRefs(photoStore)
  const { exportAll } = photoStore

  const appStore = useAppStore()
  const { triggerImport } = appStore

  const exportIcon = computed(() => (isExporting.value ? undefined : 'mdi-tray-arrow-down'))

  /**
   * The counts come from the result of `exportAll()`, not from `exportProgress`:
   * the store clears the progress state before the promise resolves, so reading
   * it after the await always reported zero.
   */
  async function handleExport (): Promise<void> {
    try {
      const result = await exportAll()

      if (!result) {
        return
      }

      const exported = result.exported.length
      const failed = result.failed.length

      appStore.notify(
        failed > 0
          ? `Exported ${exported} photo(s), ${failed} failed`
          : `Exported ${exported} photo(s)`,
      )
    } catch (error) {
      console.error('[export] failed', error)
      appStore.notify('Export failed. Please try again.')
    }
  }
</script>

<template>
  <v-app-bar
    app
    class="app-bar"
    height="60"
  >
    <v-btn
      :aria-label="appStore.panelOpen ? 'Hide editing panel' : 'Show editing panel'"
      class="panel-toggle"
      icon="mdi-tune-variant"
      size="small"
      variant="text"
      @click="appStore.togglePanel()"
    />

    <div class="brand">
      <BrandMark :size="30" />

      <span class="brand__wordmark">Dark<span class="brand__wordmark-accent">Room</span></span>

      <span
        v-if="!isEmpty"
        :aria-label="`${totalPhotos} photos loaded`"
        class="brand__count tnum"
      >
        {{ totalPhotos }}
      </span>
    </div>

    <v-spacer />

    <div class="actions">
      <v-btn
        aria-label="Import photos"
        class="action action--import"
        prepend-icon="mdi-folder-open"
        variant="tonal"
        @click="triggerImport"
      >
        <span class="action__label">Import Photos</span>
      </v-btn>

      <v-btn
        v-if="!isEmpty"
        :aria-label="isExporting ? 'Exporting photos' : 'Export all photos'"
        class="action action--export"
        color="primary"
        :disabled="isExporting"
        :prepend-icon="exportIcon"
        variant="flat"
        @click="handleExport"
      >
        <v-progress-circular
          v-if="isExporting"
          class="mr-2"
          indeterminate
          size="16"
          width="2"
        />
        <span class="action__label">{{ isExporting ? 'Exporting…' : 'Export All' }}</span>
      </v-btn>

      <v-divider class="actions__divider" vertical />

      <v-btn
        aria-label="Open keyboard shortcuts and help"
        icon="mdi-keyboard-outline"
        variant="text"
        @click="appStore.toggleHelp()"
      />
    </div>
  </v-app-bar>
</template>

<style lang="scss" scoped>
/*
 * Translucent over a blurred backdrop: the canvas scrolls behind the chrome, and
 * an opaque bar would cut the photograph off with a hard horizontal seam.
 */
.app-bar {
  background: rgba(var(--v-theme-surface, 20, 22, 25), 0.72);
  backdrop-filter: blur(16px) saturate(140%);
  border-bottom: 1px solid var(--dr-hairline);
}

/*
 * Vuetify pads the toolbar with `4px 8px`, which left the aperture sitting
 * 4px from the window edge. 16px matches the gutter the panel and the filmstrip
 * use, so all three chrome elements share one left margin. The panel toggle
 * also loses its compensating negative margin, which was there only to claw
 * that space back.
 */
.app-bar :deep(.v-toolbar__content) {
  padding-inline: 16px;
}

/* Brand ---------------------------------------------------------------- */

/*
 * The panel is a permanent drawer from md up, so the toggle that collapses it
 * into an overlay only exists on small screens. Keeping it in the DOM at every
 * width would put a button in the bar that does nothing.
 */
.panel-toggle {
  display: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand__wordmark {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1;
  white-space: nowrap;
}

.brand__wordmark-accent {
  color: var(--dr-brand-core);
}

.brand__count {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border: 1px solid var(--dr-hairline-strong);
  border-radius: var(--dr-radius-pill);
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

/* Actions -------------------------------------------------------------- */

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions__divider {
  height: 24px;
  margin: 0 4px;
  border-color: var(--dr-hairline-strong);
}

.action {
  white-space: nowrap;
}

/*
 * Export is the payoff action, so it is the only solid fill in the bar;
 * Import stays tonal so the two never compete for the same weight.
 */
.action--export {
  box-shadow: var(--dr-shadow-accent);
}

/*
 * The panel is a permanent drawer from md up, so the toggle that collapses it
 * into an overlay only exists on small screens. Keeping it in the DOM at every
 * width would put a button in the bar that does nothing.
 */
@media (max-width: 959px) {
  .panel-toggle {
    display: inline-grid;
  }

  .brand {
    margin-left: 6px;
  }
}

/*
 * Below the sm breakpoint the labels are dropped rather than the actions: the
 * bar keeps the same three targets, they just become icons. Their `aria-label`
 * stays, so the buttons keep their accessible name once the text is hidden.
 *
 * Without this the bar overflows a 390px viewport, and because `.brand` is the
 * only flex item allowed to shrink it collapsed from 98px to 14px.
 */
@media (max-width: 599px) {
  .actions__divider {
    display: none;
  }

  .action__label {
    display: none;
  }

  /*
   * 44px is the smallest height that stays reliably tappable. The 60px bar has
   * room for it, and Vuetify's 36px default is a mouse-sized target.
   */
  .action--import,
  .action--export {
    min-width: 48px;
    padding: 0 12px;
    --v-btn-height: 44px;
  }
}

@media (max-width: 400px) {
  .brand__wordmark {
    display: none;
  }
}
</style>
