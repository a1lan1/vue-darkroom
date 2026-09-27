<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, nextTick, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import EditControls from '@/components/EditControls.vue'
  import PanelSection from '@/components/PanelSection.vue'
  import { useAppStore } from '@/stores/appStore'
  import { usePhotoStore } from '@/stores/photoStore'
  import { formatBytes } from '@/utils/formatBytes'
  import { isQualitySupported } from '@/utils/imageFilter'

  /**
   * Mirrors the slice of Vuetify's `LocationStrategyData` this strategy reads.
   * `target` is a union upstream: an element, or an `[x, y]` point for overlays
   * anchored to coordinates rather than to an activator.
   */
  interface OverlayPlacementData {
    target: { value: HTMLElement | [x: number, y: number] | undefined }
    contentEl: { value: HTMLElement | undefined }
  }

  type SizeListLocation = (
    data: OverlayPlacementData,
    props: unknown,
    contentStyles: { value: Record<string, string> },
  ) => { updateLocation: () => void }

  /**
   * Places the export size list directly above its field.
   *
   * Vuetify's `connected` strategy resolved this menu hundreds of pixels below
   * the field, leaving the list at y=1196 with the window ending at 900. The
   * list is teleported to the body while the field sits inside a fixed drawer,
   * and the strategy measured the offset against a containing block that
   * matched neither. Measuring both rects ourselves sidesteps that, and the
   * explicit `position: fixed` is required: the built-in strategy only sets it
   * when it recognises a fixed activator, and without it the content falls back
   * to its static position.
   *
   * Opening upwards is not a preference. The select is the last control in a
   * footer pinned to the bottom of the window, so there is roughly 45px of room
   * below it for a 208px list.
   */
  const sizeListLocation: SizeListLocation = (
    data,
    _props,
    contentStyles,
  ) => {
    const updateLocation = () => {
      const field = data.target.value
      const list = data.contentEl.value

      if (!(field instanceof HTMLElement) || !list) {
        return
      }

      const anchor = field.getBoundingClientRect()
      const gap = 4
      const top = Math.max(gap, anchor.top - list.getBoundingClientRect().height - gap)

      Object.assign(contentStyles.value, {
        'position': 'fixed',
        'top': `${Math.round(top)}px`,
        'left': `${Math.round(anchor.left)}px`,
        'minWidth': `${Math.round(anchor.width)}px`,
        'transformOrigin': 'left bottom',
        '--v-overlay-anchor-origin': 'bottom left',
      })
    }

    /**
     * Nothing calls `updateLocation` when the overlay opens: the scroll and
     * resize strategies only react to their own events. The built-in strategy
     * schedules its first pass itself, so ours has to as well, and a second
     * pass on the next frame because the list has no measurable height until
     * it has been laid out.
     */
    nextTick(() => {
      updateLocation()
      requestAnimationFrame(updateLocation)
    })

    return { updateLocation }
  }

  const photoStore = usePhotoStore()
  const appStore = useAppStore()
  const {
    isEmpty,
    isExporting,
    exportProgress,
    exportQuality,
    exportSize,
    exportFormat,
    totalPhotos,
    editedPhotos,
    totalExportedSize,
  } = storeToRefs(photoStore)

  /**
   * Read straight off the store rather than through `storeToRefs`: these are
   * static option lists, not reactive state, and `storeToRefs` only exposes
   * refs and getters. Going through it left the fields `undefined`, which
   * rendered an empty format toggle and a "No data available" select.
   */
  const exportFormatOptions = appStore.exportFormatOptions
  const exportSizeOptions = appStore.exportSizeOptions

  const { mdAndUp, smAndDown } = useDisplay()

  /**
   * On a desktop the panel is a permanent part of the layout and starts open.
   * On a phone it is an overlay covering the whole canvas, so it starts closed
   * and the header button is what brings it back.
   */
  watch(mdAndUp, isDesktop => appStore.togglePanel(isDesktop), { immediate: true })

  /**
   * 320px is right for a fixed desktop column but cramped for a phone overlay,
   * where the format toggle has to fit three options without wrapping. Vuetify
   * runs this prop through `Number()`, so it has to stay numeric — a `min()`
   * string collapses the drawer to `NaN` and it stops sliding away when closed.
   * `max-width: 100%` in Vuetify's own stylesheet caps it on narrow phones.
   */
  const panelWidth = computed(() => (smAndDown.value ? 360 : 320))

  const qualityApplies = computed(() => isQualitySupported(exportFormat.value))
  /*
   * Whole units rather than tenths: the tile is a third of a 320px panel, and a
   * decimal pushed `847.2 KB` onto a second line. The exact size still shows on
   * the thumbnail it belongs to.
   */
  const lastExport = computed(() => (totalExportedSize.value > 0 ? formatBytes(totalExportedSize.value, '—', 0) : '—'))
  const progressPercent = computed(() => {
    const progress = exportProgress.value

    if (!progress || progress.total === 0) {
      return 0
    }

    return Math.round((progress.completed / progress.total) * 100)
  })
</script>

<template>
  <v-navigation-drawer
    v-if="!isEmpty"
    v-model="appStore.panelOpen"
    class="panel"
    :permanent="mdAndUp"
    :temporary="!mdAndUp"
    :width="panelWidth"
  >
    <div class="panel__inner">
      <div class="stats">
        <div class="stat">
          <span class="stat__value tnum">{{ totalPhotos }}</span>
          <span class="stat__label">Photos</span>
        </div>
        <div class="stat">
          <span class="stat__value stat__value--accent tnum">{{ editedPhotos }}</span>
          <span class="stat__label">Edited</span>
        </div>
        <div class="stat">
          <span class="stat__value tnum">{{ lastExport }}</span>
          <span class="stat__label">Export</span>
        </div>
      </div>

      <div class="panel__scroll">
        <EditControls />
      </div>

      <div class="panel__footer">
        <PanelSection icon="mdi-tray-arrow-down" title="Export">
          <div class="field">
            <div class="field__head">
              <span class="field__label">Quality</span>
              <span
                v-if="qualityApplies"
                class="field__value tnum"
              >{{ exportQuality }}%</span>
              <span
                v-else
                class="field__value field__value--muted"
              >Not for {{ exportFormat.toUpperCase() }}</span>
            </div>

            <v-slider
              v-model="exportQuality"
              :disabled="!qualityApplies"
              max="100"
              min="10"
              step="5"
              thumb-label="always"
            />

            <div class="field__hint">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          <div class="field">
            <span class="field__label">Format</span>

            <!--
              `variant` and `rounded` belong on the toggle, not on each button.
              `v-btn-group` forwards them to its children and then collapses
              their corners and shared edges, so the three options read as one
              segmented control. Putting `variant="outlined"` on the buttons
              instead gave every option its own separate outline with gaps
              between them, which looked like three unrelated buttons.
            -->
            <v-btn-toggle
              v-model="exportFormat"
              border
              class="format-toggle"
              density="compact"
              divided
              mandatory
              rounded="lg"
              variant="outlined"
            >
              <v-btn
                v-for="option in exportFormatOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <div class="field">
            <!--
              The size list needs a location strategy of its own. The select is
              the last control in a footer pinned to the bottom of the window,
              so a 208px list only fits above the field, and Vuetify's own
              strategy placed it at y=1196 with the window ending at 900, which
              is why the dropdown looked like it never opened. See
              `sizeListLocation`.
            -->
            <v-select
              v-model="exportSize"
              item-title="label"
              item-value="value"
              :items="exportSizeOptions"
              label="Size"
              :menu-props="{ contentClass: 'dr-overlay', locationStrategy: sizeListLocation }"
            />
          </div>

          <div
            v-if="isExporting"
            class="export-progress"
          >
            <v-progress-linear :model-value="progressPercent" />
            <p class="export-progress__label tnum">
              Processing {{ exportProgress?.completed ?? 0 }} of {{ exportProgress?.total ?? 0 }}…
            </p>
          </div>
        </PanelSection>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style lang="scss" scoped>
.panel {
  border-right: 1px solid var(--dr-hairline);
  background: rgba(var(--v-theme-surface, 20, 22, 25), 0.72);
  backdrop-filter: blur(16px) saturate(140%);
}

.panel__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Library stats --------------------------------------------------------- */

/*
 * A fixed three-column grid rather than a conditional list: the export tile
 * only fills in after the first run, and a row that appears late would shove
 * the controls below it down the panel.
 */
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 16px 16px 4px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid var(--dr-hairline);
  border-radius: var(--dr-radius-md);
  background: rgba(255, 255, 255, 0.03);
}

.stat__value {
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.1;
  /*
   * A stat tile that wraps reads as two separate numbers. Clipping to an
   * ellipsis is the graceful failure for the sizes that still do not fit.
   */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.stat__value--accent {
  color: var(--dr-brand-core);
}

.stat__label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.48);
}

/* Scrollable controls --------------------------------------------------- */

.panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px;
}

/* Pinned export card ---------------------------------------------------- */

.panel__footer {
  flex: none;
  padding: 0 16px 4px;
  border-top: 1px solid var(--dr-hairline);
  background: rgba(var(--v-theme-surface, 20, 22, 25), 0.5);
}

/* Fields ---------------------------------------------------------------- */

.field + .field {
  margin-top: 18px;
}

.field__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.field__label {
  font-size: 12px;
  font-weight: 550;
  color: rgba(255, 255, 255, 0.78);
}

.field__value {
  font-size: 12px;
  font-weight: 600;
  color: var(--dr-brand-core);
}

.field__value--muted {
  color: rgba(255, 255, 255, 0.42);
}

.field__hint {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.4);
}

/*
 * The three formats share one connected control so the row width never depends
 * on the longest label. `v-btn-group` locks its own height per density (36px at
 * compact) and stretches the children to fill it, so that height is the only
 * thing to override for a denser row — overriding the buttons instead would
 * break the shared-border rendering.
 */
.format-toggle {
  width: 100%;
  margin-top: 8px;
}

.format-toggle.v-btn-group--density-compact {
  height: 32px;
}

/*
 * The group is an `inline-flex`, so the three buttons kept their intrinsic
 * widths and left a third of the row showing bare panel. `rounded` also lands
 * on every child separately, which turned a segmented control into three
 * unrelated pills. Filling the row and flattening the shared edges is what
 * makes it read as one control.
 */
.format-toggle :deep(.v-btn) {
  flex: 1 1 0;
  min-width: 0;
  border-radius: 0 !important;
}

.format-toggle :deep(.v-btn:first-child) {
  border-start-start-radius: var(--dr-radius-md) !important;
  border-end-start-radius: var(--dr-radius-md) !important;
}

.format-toggle :deep(.v-btn:last-child) {
  border-start-end-radius: var(--dr-radius-md) !important;
  border-end-end-radius: var(--dr-radius-md) !important;
}

.export-progress {
  margin-top: 18px;
}

.export-progress__label {
  margin: 8px 0 0;
  font-size: 11px;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
}

/* On a phone the drawer spans the screen, so the footer and the stats have to
 * fit without a horizontal scroll. */
@media (max-width: 599px) {
  .stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 12px 12px 4px;
  }

  .stat {
    padding: 8px 9px;
  }

  .stat__value {
    font-size: 16px;
  }

  .panel__scroll,
  .panel__footer {
    padding-inline: 12px;
  }
}
</style>
