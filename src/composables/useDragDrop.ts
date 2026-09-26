import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Tracks whether a drag is hovering the target element.
 *
 * A plain boolean is not enough: `dragleave` also fires when the cursor moves
 * onto a child element, which makes the overlay flicker. Counting enter/leave
 * pairs keeps it stable for nested content, and a counter going negative is
 * treated as zero so a missing initial `dragenter` cannot wedge the state.
 */
export function useDragDrop (onFilesDropped: (files: File[]) => void) {
  const isDragOver = ref(false)
  let depth = 0

  function setDragOver (value: boolean): void {
    if (isDragOver.value === value) {
      return
    }

    isDragOver.value = value

    if (value) {
      depth = 1
    }
  }

  function handleDragOver (event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
  }

  function handleDragEnter (event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    depth += 1
    setDragOver(true)
  }

  function handleDragLeave (event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()

    depth = Math.max(0, depth - 1)

    if (depth === 0) {
      isDragOver.value = false
    }
  }

  function handleDrop (event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)

    const files = Array.from(event.dataTransfer?.files ?? [])
    const images = files.filter(file => file.type.startsWith('image/'))

    if (images.length > 0) {
      onFilesDropped(images)
    }
  }

  /**
   * Suppresses the browser's default "open the dropped file" behaviour, which
   * fires outside the drop zone and would navigate away from the app.
   */
  function preventDefault (event: Event): void {
    event.preventDefault()
  }

  /**
   * Covers the case where the drag is released outside the window, where no
   * `drop` or `dragleave` is delivered and the overlay would stay visible.
   */
  function handleWindowDragEnd (): void {
    setDragOver(false)
  }

  onMounted(() => {
    document.addEventListener('dragover', preventDefault)
    document.addEventListener('drop', preventDefault)
    window.addEventListener('dragend', handleWindowDragEnd)
    window.addEventListener('blur', handleWindowDragEnd)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('dragover', preventDefault)
    document.removeEventListener('drop', preventDefault)
    window.removeEventListener('dragend', handleWindowDragEnd)
    window.removeEventListener('blur', handleWindowDragEnd)
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
