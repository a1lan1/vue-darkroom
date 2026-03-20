import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const showHelp = ref(false)
  const importTrigger = ref(0)

  function toggleHelp (value?: boolean) {
    showHelp.value = value ?? !showHelp.value
  }

  function triggerImport () {
    importTrigger.value++
  }

  return {
    showHelp,
    importTrigger,
    toggleHelp,
    triggerImport,
  }
})
