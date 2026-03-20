import Cropper from 'cropperjs'
import { computed, nextTick, ref, watch } from 'vue'
import { usePhotoStore } from '@/stores/PhotoStore'
import 'cropperjs/dist/cropper.css'

const imgRef = ref<HTMLImageElement | null>(null)
const isCropping = ref(false)

export function usePhotoEditor () {
  const store = usePhotoStore()

  // Watch active photo to reset cropping state if needed, or re-init
  watch(() => store.activePhotoId, async (newId, oldId) => {
    if (newId !== oldId) {
      isCropping.value = false
      if (store.cropper) {
        store.destroyCropper()
      }
    }
  })

  const cropAspectRatio = computed({
    get: (): number | undefined => store.activePhoto?.aspectRatio,
    set: (val: number | undefined): void => {
      if (store.cropper) {
        store.cropper.setAspectRatio(val ?? Number.NaN)
      }
      if (store.activePhoto) {
        store.activePhoto.aspectRatio = val
      }
    },
  })

  async function initCropper () {
    if (!imgRef.value || !store.activePhoto) {
      return
    }

    // Destroy existing
    if (store.cropper) {
      store.destroyCropper()
    }

    await nextTick() // Ensure DOM is ready

    const options: Cropper.Options = {
      aspectRatio: cropAspectRatio.value,
      viewMode: 1,
      autoCrop: true,
      ready () {
        // If we have saved crop data, restore it
        if (store.activePhoto?.cropData) {
          store.cropper?.setData(store.activePhoto.cropData)
        }
      },
    }

    store.setCropper(new Cropper(imgRef.value, options))
  }

  function startCropping () {
    if (isCropping.value) {
      return
    }
    isCropping.value = true
    initCropper()
  }

  function applyCrop () {
    if (!store.cropper || !store.activePhoto) {
      return
    }

    // Save data
    store.activePhoto.cropData = store.cropper.getData()
    store.activePhoto.aspectRatio = cropAspectRatio.value

    // Generate preview
    const canvas = store.cropper.getCroppedCanvas()
    if (canvas) {
      store.setPreviewSrc(canvas.toDataURL('image/jpeg'))
    }

    // Exit mode
    isCropping.value = false
    store.destroyCropper()
  }

  function cancelCrop () {
    isCropping.value = false
    store.destroyCropper()
  }

  function resetCrop () {
    store.resetCrop()
    if (isCropping.value && store.cropper) {
      store.cropper.reset()
    }
  }

  function rotateFine (deg: number) {
    if (isCropping.value) {
      store.cropper?.rotate(deg)
    } else {
      startCropping()
      // Wait for init
      setTimeout(() => {
        store.cropper?.rotate(deg)
      }, 100)
    }
  }

  function setAspectRatio (ratio: number | undefined) {
    cropAspectRatio.value = ratio
    if (!isCropping.value) {
      startCropping()
    } else if (store.cropper) {
      store.cropper.setAspectRatio(ratio || Number.NaN)
    }
  }

  const aspectRatios = [
    { label: 'Free', value: undefined },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '3:2', value: 3 / 2 },
  ]

  return {
    imgRef,
    isCropping,
    cropAspectRatio,
    aspectRatios,
    rotateFine,
    startCropping,
    applyCrop,
    cancelCrop,
    resetCrop,
    resetColorCorrection: () => store.resetColorCorrection(),
    setAspectRatio,
  }
}
