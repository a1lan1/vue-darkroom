import Cropper from 'cropperjs'
import { computed, nextTick, ref, watch } from 'vue'
import { usePhotoStore } from '@/stores/PhotoStore'
import 'cropperjs/dist/cropper.css'

const DEFAULT_COLOR_SETTINGS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sepia: 0,
  blur: 0,
  invert: 0,
  grayscale: 0,
}

const imgRef = ref<HTMLImageElement | null>(null)

export function usePhotoEditor () {
  const store = usePhotoStore()

  const cropAspectRatio = computed({
    get: (): number | undefined => store.activePhoto?.cropAspectRatio,
    set: (val: number | undefined): void => {
      if (store.cropper) {
        store.cropper.setAspectRatio(val ?? Number.NaN)
      }
    },
  })

  // Watch for active photo changes
  watch(() => store.activePhoto, async (newPhoto, oldPhoto) => {
    // Save current crop data before switching
    if (oldPhoto && store.cropper) {
      oldPhoto.cropData = store.cropper.getData()
      oldPhoto.aspectRatio = cropAspectRatio.value
    }

    if (newPhoto && imgRef.value) {
      await nextTick()

      initCropper()

      if (newPhoto.cropData && store.cropper) {
        store.cropper.setData(newPhoto.cropData)
      }

      if (newPhoto.aspectRatio) {
        cropAspectRatio.value = newPhoto.aspectRatio
      }
    }
  }, { immediate: true, flush: 'post' })

  // Initialize cropper
  function initCropper (): void {
    if (!imgRef.value || !store.activePhoto) {
      return
    }

    // Destroy existing cropper if any
    if (store.cropper) {
      store.cropper.destroy()
    }

    const options: Cropper.Options = {
      aspectRatio: cropAspectRatio.value || undefined,
      viewMode: 1,
      autoCrop: true,
      autoCropArea: 1,
      ready: () => {
        // Restore crop data if it exists
        if (store.activePhoto?.cropData && store.cropper) {
          // Use setTimeout to ensure the cropper is fully initialized
          setTimeout(() => store.cropper?.setData(store.activePhoto?.cropData || {}), 0)

          // Set aspect ratio if specified
          if (cropAspectRatio.value) {
            store.cropper.setAspectRatio(cropAspectRatio.value)
          }
        }
      },
      crop: () => {
        // Save crop data on every crop event
        if (store.activePhoto && store.cropper) {
          store.activePhoto.cropData = store.cropper.getData()
          store.activePhoto.aspectRatio = cropAspectRatio.value
        }
      },
    }

    store.setCropper(new Cropper(imgRef.value, options))
  }

  // Apply changes to the photo
  function applyChanges () {
    if (!store.cropper || !store.activePhoto) {
      return
    }

    const canvas = store.cropper.getCroppedCanvas()
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    if (tempCtx) {
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCtx.filter = store.imageFilter
      tempCtx.drawImage(canvas, 0, 0)

      const finalDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9)

      store.setEditedSrc(finalDataUrl)
    }
  }

  // Rotate by a specific number of degrees (fine control)
  function rotateFine (deg: number) {
    if (store.cropper) {
      store.cropper.rotate(deg)
    }
  }

  function crop () {
    if (!store.cropper || !store.activePhoto) {
      return
    }
    const canvas = store.cropper.getCroppedCanvas()
    if (canvas) {
      store.setEditedSrc(canvas.toDataURL('image/jpeg'))
    }
  }

  function resetCrop () {
    if (store.cropper) {
      store.cropper.reset()
    }
  }

  // Reset color correction to default values
  function resetColorCorrection () {
    if (!store.activePhoto) {
      return
    }

    Object.assign(store.activePhoto, DEFAULT_COLOR_SETTINGS)
    applyChanges()
  }

  // Set aspect ratio for cropping
  function setAspectRatio (ratio: number | undefined) {
    cropAspectRatio.value = ratio
    if (store.cropper) {
      store.cropper.setAspectRatio(ratio || Number.NaN)
    }
  }

  // Available aspect ratios
  const aspectRatios = [
    { label: 'Free', value: undefined },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '3:2', value: 3 / 2 },
  ]

  return {
    imgRef,
    cropAspectRatio,
    aspectRatios,
    rotateFine,
    crop,
    resetCrop,
    resetColorCorrection,
    applyChanges,
    setAspectRatio,
  }
}
