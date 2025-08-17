import Cropper from 'cropperjs'
import { computed, nextTick, ref, watch } from 'vue'
import { usePhotoStore } from '@/stores/PhotoStore'
import 'cropperjs/dist/cropper.css'

// Store state per photo ID
type PhotoState = {
  brightness: number
  contrast: number
  saturation: number
  clarity: number
  temperature: number
  tint: number
  cropAspectRatio: number | undefined
  cropData: any
}

const photoStates = new Map<string, PhotoState>()

export function usePhotoEditor () {
  const store = usePhotoStore()
  const imgRef = ref<HTMLImageElement | null>(null)

  // Get or create state for current photo
  const getPhotoState = () => {
    if (!store.activePhoto) {
      return null
    }

    if (!photoStates.has(store.activePhoto.id)) {
      photoStates.set(store.activePhoto.id, {
        brightness: store.activePhoto.brightness || 0,
        contrast: store.activePhoto.contrast || 0,
        saturation: store.activePhoto.saturation || 0,
        clarity: store.activePhoto.clarity || 0,
        temperature: store.activePhoto.temperature || 0,
        tint: store.activePhoto.tint || 0,
        cropAspectRatio: store.activePhoto.aspectRatio,
        cropData: store.activePhoto.cropData,
      })
    }

    return photoStates.get(store.activePhoto.id)!
  }

  // Current photo state
  const currentState = computed(() => getPhotoState())

  // Color correction refs with proper TypeScript types
  const brightness = computed({
    get: (): number => currentState.value?.brightness ?? 0,
    set: (val: number): void => {
      if (currentState.value) {
        currentState.value.brightness = val
      }
      if (store.activePhoto) {
        store.activePhoto.brightness = val
      }
      applyChanges()
    },
  })

  const contrast = computed({
    get: (): number => currentState.value?.contrast ?? 0,
    set: (val: number): void => {
      if (currentState.value) {
        currentState.value.contrast = val
      }
      if (store.activePhoto) {
        store.activePhoto.contrast = val
      }
      applyChanges()
    },
  })

  const saturation = computed({
    get: (): number => currentState.value?.saturation ?? 0,
    set: (val: number): void => {
      if (currentState.value) {
        currentState.value.saturation = val
      }
      if (store.activePhoto) {
        store.activePhoto.saturation = val
      }
      applyChanges()
    },
  })

  const clarity = computed({
    get: (): number => currentState.value?.clarity ?? 0,
    set: (val: number): void => {
      if (currentState.value) {
        currentState.value.clarity = val
      }
      if (store.activePhoto) {
        store.activePhoto.clarity = val
      }
      applyChanges()
    },
  })

  const temperature = computed({
    get: (): number => currentState.value?.temperature ?? 0,
    set: (val: number): void => {
      if (currentState.value) {
        currentState.value.temperature = val
      }
      if (store.activePhoto) {
        store.activePhoto.temperature = val
      }
      applyChanges()
    },
  })

  const tint = computed({
    get: (): number => currentState.value?.tint ?? 0,
    set: (val: number): void => {
      if (currentState.value) {
        currentState.value.tint = val
      }
      if (store.activePhoto) {
        store.activePhoto.tint = val
      }
      applyChanges()
    },
  })

  const cropAspectRatio = computed({
    get: (): number | undefined => currentState.value?.cropAspectRatio,
    set: (val: number | undefined): void => {
      if (currentState.value) {
        currentState.value.cropAspectRatio = val
      }
      if (store.activePhoto) {
        store.activePhoto.aspectRatio = val
      }
      if (store.cropper) {
        store.cropper.setAspectRatio(val ?? Number.NaN)
      }
    },
  })

  // Computed styles for color correction
  const imageStyle = computed(() => {
    const filters = [
      `brightness(${100 + brightness.value}%)`,
      `contrast(${100 + contrast.value}%)`,
      `saturate(${100 + saturation.value}%)`,
      `sepia(${Math.abs(clarity.value)}%)`,
    ]

    return {
      filter: filters.join(' '),
      transform: `rotate(${temperature.value}deg)`,
    }
  })

  // Watch for active photo changes
  watch(
    () => store.activePhoto,
    async (newPhoto, oldPhoto) => {
      // Save current crop data before switching
      if (oldPhoto && store.cropper) {
        const cropData = store.cropper.getData()
        const oldState = photoStates.get(oldPhoto.id)

        if (oldState) {
          oldState.cropData = cropData
          oldState.cropAspectRatio = cropAspectRatio.value
        }

        oldPhoto.cropData = cropData
        oldPhoto.aspectRatio = cropAspectRatio.value
      }

      if (newPhoto) {
        // Get or create state for the new photo
        const state = getPhotoState()

        if (!state) {
          return
        }

        // Update store with saved state
        Object.assign(newPhoto, {
          brightness: state.brightness,
          contrast: state.contrast,
          saturation: state.saturation,
          clarity: state.clarity,
          temperature: state.temperature,
          tint: state.tint,
          aspectRatio: state.cropAspectRatio,
          cropData: state.cropData,
        })

        // Wait for the DOM to update and initialize cropper
        await nextTick()

        if (imgRef.value) {
          initCropper()
        }
      }
    },
    { immediate: true, flush: 'post' },
  )

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
        const state = getPhotoState()
        if (state?.cropData && store.cropper) {
          // Use setTimeout to ensure the cropper is fully initialized
          setTimeout(() => {
            if (store.cropper && state.cropData) {
              store.cropper.setData(state.cropData)
            }
          }, 0)
        }

        // Set aspect ratio if specified
        if (cropAspectRatio.value && store.cropper) {
          store.cropper.setAspectRatio(cropAspectRatio.value)
        }
      },
      crop: () => {
        // Save crop data on every crop event
        if (store.activePhoto && store.cropper) {
          const cropData = store.cropper.getData()
          const state = getPhotoState()
          if (state) {
            state.cropData = cropData
          }
          store.activePhoto.cropData = cropData
          store.activePhoto.aspectRatio = cropAspectRatio.value
        }
      },
    }

    const cropper = new Cropper(imgRef.value, options)
    store.setCropper(cropper)
  }

  // Save crop data for a photo
  function saveCropData (photoId: string) {
    if (!store.cropper) {
      return
    }

    const cropData = store.cropper.getData()
    const photo = store.photos.find(p => p.id === photoId)

    if (photo) {
      photo.cropData = cropData

      if (!photo.aspectRatio) {
        const container = store.cropper.getContainerData()
        photo.aspectRatio = container.width / container.height
      }
    }
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
      tempCtx.filter = imageStyle.value.filter
      tempCtx.drawImage(canvas, 0, 0)

      const finalDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9)

      store.setEditedSrc(finalDataUrl)
    }
  }

  // Rotate image 90 degrees
  function rotate90 () {
    if (!store.cropper) {
      return
    }

    store.cropper.rotate(90)
    if (store.activePhoto) {
      saveCropData(store.activePhoto.id)
    }
  }

  // Rotate by a specific number of degrees (fine control)
  function rotateFine (deg: number) {
    if (store.cropper) {
      store.cropper.rotate(deg)
    }
  }

  // Apply auto-adjust to colors
  function applyAutoAdjust () {
    if (!store.activePhoto) {
      return
    }

    const updates = {
      brightness: 5,
      contrast: 10,
      saturation: 15,
      clarity: 5,
      temperature: 0,
      tint: 0,
    }

    brightness.value = updates.brightness
    contrast.value = updates.contrast
    saturation.value = updates.saturation
    clarity.value = updates.clarity
    temperature.value = updates.temperature
    tint.value = updates.tint

    Object.assign(store.activePhoto, updates)
    applyChanges()
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

    const resetValues = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      clarity: 0,
      temperature: 0,
      tint: 0,
    }

    brightness.value = 0
    contrast.value = 0
    saturation.value = 0
    clarity.value = 0
    temperature.value = 0
    tint.value = 0

    Object.assign(store.activePhoto, resetValues)
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
    imageStyle,
    brightness,
    contrast,
    saturation,
    clarity,
    temperature,
    tint,
    cropAspectRatio,
    aspectRatios,
    rotate90,
    rotateFine,
    crop,
    resetCrop,
    applyAutoAdjust,
    resetColorCorrection,
    applyChanges,
    setAspectRatio,
  }
}
