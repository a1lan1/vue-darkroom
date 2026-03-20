import { onMounted, onUnmounted, ref } from 'vue'

export function useDragDrop (onFilesDropped: (files: File[]) => void) {
  const isDragOver = ref(false)

  function handleDragOver (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragOver.value = true
  }

  function handleDragEnter (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragOver.value = true
  }

  function handleDragLeave (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Only hide overlay if we're leaving the main container
    if (e.currentTarget === e.target) {
      isDragOver.value = false
    }
  }

  function handleDrop (e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragOver.value = false

    const files = Array.from(e.dataTransfer?.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      onFilesDropped(imageFiles)
    }
  }

  // Prevent default drag behavior on document to avoid opening the file in browser
  const preventDefault = (e: Event) => e.preventDefault()

  onMounted(() => {
    document.addEventListener('dragover', preventDefault)
    document.addEventListener('drop', preventDefault)
  })

  onUnmounted(() => {
    document.removeEventListener('dragover', preventDefault)
    document.removeEventListener('drop', preventDefault)
  })

  return {
    isDragOver,
    dragEvents: {
      onDragenter: handleDragEnter,
      onDragleave: handleDragLeave,
      onDragover: handleDragOver,
      onDrop: handleDrop,
    },
  }
}
