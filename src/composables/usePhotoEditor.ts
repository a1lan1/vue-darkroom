import { ref, computed, watch, nextTick } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { usePhotoStore } from '@/stores/PhotoStore'

// Ensure cropper CSS is loaded
console.log('Cropper CSS imported')

export function usePhotoEditor() {
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
  watch(() => store.activePhoto, async (photo) => {
    console.log('Active photo changed:', photo?.id)
    
    if (photo) {
      // Wait for next tick to ensure imgRef is available
      await nextTick()
      console.log('After nextTick - imgRef.value:', !!imgRef.value)
      
      if (imgRef.value) {
        console.log('Initializing cropper for image:', imgRef.value.src)
        store.destroyCropper()
        
        // Wait for image to load before initializing cropper
        if (imgRef.value.complete) {
          console.log('Image already complete, initializing cropper')
          initCropper()
        } else {
          console.log('Image not complete, waiting for onload')
          imgRef.value.onload = () => {
            console.log('Image loaded, initializing cropper')
            initCropper()
          }
        }
      } else {
        console.log('imgRef not available after nextTick')
      }
    } else {
      console.log('No active photo')
    }
  })

  function initCropper() {
    if (!imgRef.value) return
    
    console.log('Creating cropper instance')
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
      ready() {
        console.log('Cropper ready')
      },
      cropstart() {
        console.log('Crop started')
      },
    })
    store.setCropper(cropper)
  }

  // Crop functions
  function rotate90() {
    console.log('Rotate 90 called, cropper:', !!store.cropper, 'destroyed:', store.cropper?.destroyed)
    if (store.cropper && !store.cropper.destroyed) {
      store.cropper.rotate(90)
      console.log('Rotate 90 executed successfully')
    } else {
      console.log('Cannot rotate - cropper not available or destroyed')
    }
  }

  function rotateFine(deg: number) {
    console.log('Rotate fine called:', deg, 'cropper:', !!store.cropper, 'destroyed:', store.cropper?.destroyed)
    if (store.cropper && !store.cropper.destroyed) {
      store.cropper.rotate(deg)
      console.log('Rotate fine executed successfully')
    } else {
      console.log('Cannot rotate fine - cropper not available or destroyed')
    }
  }

  function crop() {
    console.log('Crop called, cropper:', !!store.cropper, 'activePhoto:', !!store.activePhoto)
    if (!store.cropper || !store.activePhoto || store.cropper.destroyed) return
    const canvas = store.cropper.getCroppedCanvas()
    store.setEdited(store.activePhoto.id, canvas.toDataURL('image/jpeg'))
  }

  function resetCrop() {
    console.log('Reset crop called, cropper:', !!store.cropper)
    if (store.cropper && !store.cropper.destroyed) {
      store.cropper.reset()
    }
  }

  // Color correction functions
  function applyAutoAdjust() {
    // Simple auto-adjust algorithm
    brightness.value = 5
    contrast.value = 10
    saturation.value = 15
    clarity.value = 5
    temperature.value = 0
    tint.value = 0
  }

  function resetColorCorrection() {
    brightness.value = 0
    contrast.value = 0
    saturation.value = 0
    clarity.value = 0
    temperature.value = 0
    tint.value = 0
  }

  function applyChanges() {
    if (!store.cropper || !store.activePhoto || store.cropper.destroyed) return

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

  function setAspectRatio(ratio: number | undefined) {
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
