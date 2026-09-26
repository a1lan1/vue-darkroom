import type { ExportFormat, ExportSize } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Static option lists. They live at module scope so every store instance
 * shares the same frozen arrays instead of re-allocating them per request.
 */
export const EXPORT_FORMAT_OPTIONS: ReadonlyArray<{ label: string, value: ExportFormat }> = [
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'WebP', value: 'webp' },
]

export const EXPORT_SIZE_OPTIONS: ReadonlyArray<{ label: string, value: ExportSize }> = [
  { label: 'Original', value: 'original' },
  { label: '1920px', value: '1920' },
  { label: '1280px', value: '1280' },
  { label: '800px', value: '800' },
]

export const useAppStore = defineStore('app', () => {
  const showHelp = ref(false)

  /**
   * Incremented to request a file picker from whichever component owns the
   * hidden `<input type="file">`. A counter is used instead of a boolean so
   * repeated clicks always re-trigger the dialog.
   */
  const importTrigger = ref(0)

  /** Transient message shown in a snackbar. */
  const notification = ref<string | null>(null)

  function toggleHelp (value?: boolean): void {
    showHelp.value = value ?? !showHelp.value
  }

  function triggerImport (): void {
    importTrigger.value += 1
  }

  function notify (message: string): void {
    notification.value = message
  }

  function dismissNotification (): void {
    notification.value = null
  }

  return {
    showHelp,
    importTrigger,
    notification,
    exportFormatOptions: EXPORT_FORMAT_OPTIONS,
    exportSizeOptions: EXPORT_SIZE_OPTIONS,
    toggleHelp,
    triggerImport,
    notify,
    dismissNotification,
  }
})
