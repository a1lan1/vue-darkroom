<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/stores/appStore'
  import { usePhotoStore } from '@/stores/photoStore'

  const photoStore = usePhotoStore()
  const { isExporting } = storeToRefs(photoStore)
  const { exportAll } = photoStore

  const appStore = useAppStore()
  const { triggerImport } = appStore

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
  <v-app-bar app color="grey-darken-4" density="compact" elevation="2">
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
      @click="triggerImport"
    >
      Import Photos
    </v-btn>

    <v-btn
      v-if="!photoStore.isEmpty"
      color="success"
      density="compact"
      :disabled="isExporting"
      elevation="5"
      prepend-icon="mdi-download"
      variant="text"
      @click="handleExport"
    >
      {{ isExporting ? 'Exporting…' : 'Export All' }}
    </v-btn>

    <v-divider class="mx-2" vertical />

    <v-btn
      aria-label="Open keyboard shortcuts and help"
      icon="mdi-help-circle"
      variant="text"
      @click="appStore.toggleHelp()"
    />
  </v-app-bar>
</template>
