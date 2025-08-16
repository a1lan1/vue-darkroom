import Cropper from 'cropperjs'
import { computed, nextTick, ref, watch } from 'vue'
import { usePhotoStore } from '@/stores/PhotoStore'
import 'cropperjs/dist/cropper.css'

export function usePhotoEditor () {
  const store = usePhotoStore()
  const imgRef = ref<HTMLImageElement | null>(null)

  // Color correction settings
  const brightness = ref(0)
  const contrast = ref(0)
  const saturation = ref(0)
  const clarity = ref(0)
  const temperature = ref(0)
  const tint = ref(0)

  // Crop settings
  const cropAspectRatio = ref<number | undefined>(undefined)

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
  watch(() => store.activePhoto, async photo => {
    if (photo) {
      // Wait for next tick to ensure imgRef is available
      await nextTick()

      if (imgRef.value) {
        store.destroyCropper()

        // Wait for image to load before initializing cropper
        if (imgRef.value.complete) {
          initCropper()
        } else {
          imgRef.value.addEventListener('load', () => {
            initCropper()
          })
        }
      }
    }
  })

  function initCropper () {
    if (!imgRef.value) {
      return
    }

    const cropper = new Cropper(imgRef.value, {
      viewMode: 1,
      autoCropArea: 1,
      aspectRatio: cropAspectRatio.value,
      background: false,
      responsive: true,
      restore: false,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready () {
        // console.log('Cropper ready')
      },
      cropstart () {
        // console.log('Crop started')
      },
    })
    store.setCropper(cropper)
  }

  // Crop functions
  function rotate90 () {
    if (store.cropper && !store.cropper.destroyed) {
      store.cropper.rotate(90)
    }
  }

  function rotateFine (deg: number) {
    if (store.cropper && !store.cropper.destroyed) {
      store.cropper.rotate(deg)
    }
  }

  function crop () {
    if (!store.cropper || !store.activePhoto || store.cropper.destroyed) {
      return
    }
    const canvas = store.cropper.getCroppedCanvas()
    store.setEdited(store.activePhoto.id, canvas.toDataURL('image/jpeg'))
  }

  function resetCrop () {
    if (store.cropper && !store.cropper.destroyed) {
      store.cropper.reset()
    }
  }

  // Color correction functions
  function applyAutoAdjust () {
    // Simple auto-adjust algorithm
    brightness.value = 5
    contrast.value = 10
    saturation.value = 15
    clarity.value = 5
    temperature.value = 0
    tint.value = 0
  }

  function resetColorCorrection () {
    brightness.value = 0
    contrast.value = 0
    saturation.value = 0
    clarity.value = 0
    temperature.value = 0
    tint.value = 0
  }

  function applyChanges () {
    if (!store.cropper || !store.activePhoto || store.cropper.destroyed) {
      return
    }

    // Apply crop first
    const canvas = store.cropper.getCroppedCanvas()

    // Create a temporary canvas for color correction
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    if (tempCtx) {
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height

      // Apply color correction
      tempCtx.filter = imageStyle.value.filter
      tempCtx.drawImage(canvas, 0, 0)

      // Get final result
      const finalDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9)
      store.setEdited(store.activePhoto.id, finalDataUrl)
    }
  }

  // Aspect ratio presets
  const aspectRatios = [
    { label: 'Free', value: undefined },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '16:9', value: 16 / 9 },
    { label: '3:4', value: 3 / 4 },
    { label: '2:3', value: 2 / 3 },
    { label: '9:16', value: 9 / 16 },
  ]

  function setAspectRatio (ratio: number | undefined) {
    cropAspectRatio.value = ratio
    if (store.cropper && !store.cropper.destroyed) {
      store.cropper.setAspectRatio(ratio || Number.NaN)
    }
  }

  return {
    imgRef,
    brightness,
    contrast,
    saturation,
    clarity,
    temperature,
    tint,
    cropAspectRatio,
    imageStyle,
    aspectRatios,
    rotate90,
    rotateFine,
    crop,
    resetCrop,
    applyAutoAdjust,
    resetColorCorrection,
    applyChanges,
    setAspectRatio,
    initCropper,
  }
}
