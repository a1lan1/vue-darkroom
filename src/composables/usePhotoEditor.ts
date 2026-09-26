import Cropper from 'cropperjs'
import { computed, type ComputedRef, inject, type InjectionKey, nextTick, onScopeDispose, provide, ref, type Ref, watch, type WritableComputedRef } from 'vue'
import { renderCrop } from '@/services/cropRenderer'
import { usePhotoStore } from '@/stores/photoStore'
import { hasCrop, type PhotoItem } from '@/types'
import 'cropperjs/dist/cropper.css'

export interface AspectRatioOption {
  label: string
  value: number | undefined
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
]

const PREVIEW_MAX_EDGE = 1600
const PREVIEW_QUALITY = 0.9

/**
 * cropper.js is an event emitter, but its bundled typings only describe the
 * chainable command surface. This narrows the instance to the events this
 * composable actually subscribes to.
 */
type CropperWithEvents = Cropper & {
  on: (event: 'crop', handler: () => void) => void
  off: (event: 'crop', handler: () => void) => void
}

export interface PhotoEditorController {
  /** Registers the image the cropper attaches to. Owned by the editor view. */
  registerImage: (element: HTMLImageElement | null) => void
  /** Rendered crop preview. Undefined when the photo is not cropped. */
  previewSrc: Ref<string | undefined>
  /** Source to display: the untouched original while cropping. */
  displaySrc: ComputedRef<string>
  isCropping: ComputedRef<boolean>
  aspectRatios: AspectRatioOption[]
  cropAspectRatio: WritableComputedRef<number | undefined>
  startCropping: () => Promise<void>
  applyCrop: () => void
  cancelCrop: () => void
  resetCrop: () => void
  resetColorCorrection: () => void
  rotate: (degrees: number) => Promise<void>
  setAspectRatio: (ratio: number | undefined) => void
}

/**
 * Guards the asynchronous cropper bootstrap.
 *
 * Constructing a cropper requires a DOM tick, so a cancel that arrives in that
 * window would otherwise leave an orphaned cropper attached to the image. Every
 * await re-checks the token and bails out when the editor moved on.
 */
let initToken = 0

function createPhotoEditor (): PhotoEditorController {
  const store = usePhotoStore()

  const image = ref<HTMLImageElement | null>(null)
  const previewSrc = ref<string | undefined>()

  let previewFrame = 0
  let previewRevision = 0

  function registerImage (element: HTMLImageElement | null): void {
    image.value = element
  }

  const isCropping = computed(() => store.isCropping)

  const displaySrc = computed<string>(() => {
    const photo = store.activePhoto

    if (!photo) {
      return ''
    }

    // The cropper reads its transform from the rendered element, so it must
    // always point at the untouched original.
    return isCropping.value ? photo.src : (previewSrc.value ?? photo.src)
  })

  const cropAspectRatio = computed<number | undefined>({
    get: () => store.activePhoto?.aspectRatio,
    set: value => {
      const photo = store.activePhoto

      if (!photo) {
        return
      }

      photo.aspectRatio = value
      // cropper.js expects NaN to mean "free crop".
      store.cropper?.setAspectRatio(value ?? Number.NaN)
    },
  })

  function cancelPendingPreview (): void {
    if (previewFrame) {
      cancelAnimationFrame(previewFrame)
      previewFrame = 0
    }
  }

  function clearPreview (): void {
    previewRevision += 1
    cancelPendingPreview()
    previewSrc.value = undefined
  }

  /**
   * Rebuilds a display-sized preview of the crop from the original.
   *
   * The crop is a cache, never the source of truth: the original object URL is
   * always re-rendered, so cropping repeatedly cannot degrade the image.
   */
  function renderPreview (photo: PhotoItem): void {
    const element = image.value

    if (!element?.naturalWidth || !element.naturalHeight) {
      return
    }

    const revision = ++previewRevision

    try {
      const cropped = renderCrop(element, element.naturalWidth, element.naturalHeight, photo)
      const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(cropped.width, cropped.height))
      const width = Math.max(1, Math.round(cropped.width * scale))
      const height = Math.max(1, Math.round(cropped.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      context.drawImage(cropped, 0, 0, width, height)

      if (revision !== previewRevision) {
        return
      }

      previewSrc.value = canvas.toDataURL('image/jpeg', PREVIEW_QUALITY)
    } catch (error) {
      // Browsers throw on oversized canvases; the original render stays valid.
      console.warn('[crop] preview render failed', error)
      clearPreview()
    }
  }

  function schedulePreview (): void {
    cancelPendingPreview()

    previewFrame = requestAnimationFrame(() => {
      previewFrame = 0

      const photo = store.activePhoto

      if (photo && hasCrop(photo, photo.isCropped)) {
        renderPreview(photo)
      }
    })
  }

  async function renderPreviewWhenReady (photo: PhotoItem): Promise<void> {
    // The <img> src has just changed, so decoding must settle first.
    await nextTick()

    const element = image.value

    if (!element?.decode) {
      renderPreview(photo)

      return
    }

    try {
      await element.decode()
    } catch {
      return
    }

    renderPreview(photo)
  }

  async function initCropper (): Promise<void> {
    const element = image.value
    const photo = store.activePhoto

    if (!element || !photo) {
      return
    }

    const token = ++initToken

    store.destroyCropper()
    await nextTick()

    if (token !== initToken || !store.isCropping) {
      return
    }

    const cropper = new Cropper(element, {
      aspectRatio: photo.aspectRatio,
      viewMode: 1,
      autoCrop: true,
      zoomOnWheel: false,
      ready () {
        if (token !== initToken) {
          return
        }

        if (hasCrop(photo, photo.isCropped)) {
          cropper.setData(photo)
        }
      },
    })

    store.setCropper(cropper)
  }

  async function startCropping (): Promise<void> {
    if (store.isCropping) {
      return
    }

    // A fresh crop starts from a clean slate; keeping the previous preview
    // would show stale pixels behind the cropper.
    clearPreview()
    store.isCropping = true

    await initCropper()
  }

  function applyCrop (): void {
    if (!store.cropper) {
      return
    }

    initToken += 1
    store.persistCrop()
    store.isCropping = false
    store.destroyCropper()

    const photo = store.activePhoto

    if (photo && hasCrop(photo, photo.isCropped)) {
      void renderPreviewWhenReady(photo)
    }
  }

  function cancelCrop (): void {
    initToken += 1
    store.isCropping = false
    store.destroyCropper()

    const photo = store.activePhoto

    if (photo && hasCrop(photo, photo.isCropped)) {
      void renderPreviewWhenReady(photo)
    }
  }

  function resetCrop (): void {
    store.resetCrop()
    clearPreview()
  }

  function resetColorCorrection (): void {
    store.resetAdjustments()
  }

  async function rotate (degrees: number): Promise<void> {
    if (!store.isCropping) {
      await startCropping()
    }

    if (!store.cropper) {
      return
    }

    const data = store.cropper.getData()
    store.cropper.rotate((data.rotate ?? 0) + degrees)
  }

  function setAspectRatio (ratio: number | undefined): void {
    cropAspectRatio.value = ratio

    if (!store.isCropping) {
      void startCropping()
    }
  }

  // Switching photos tears the cropper down and refreshes the preview.
  watch(
    () => store.activePhotoId,
    () => {
      initToken += 1
      store.isCropping = false
      store.destroyCropper()

      const photo = store.activePhoto

      if (photo?.isCropped) {
        void renderPreviewWhenReady(photo)
      } else {
        clearPreview()
      }
    },
  )

  // Live updates while the cropper is dragged, coalesced per animation frame.
  watch(
    () => store.cropper,
    (cropper, previous) => {
      ;(previous as CropperWithEvents | null)?.off('crop', schedulePreview)
      ;(cropper as CropperWithEvents | null)?.on('crop', schedulePreview)
    },
  )

  onScopeDispose(() => {
    initToken += 1
    cancelPendingPreview()
    ;(store.cropper as CropperWithEvents | null)?.off('crop', schedulePreview)
    store.destroyCropper()
  })

  return {
    registerImage,
    previewSrc,
    displaySrc,
    isCropping,
    aspectRatios: ASPECT_RATIOS,
    cropAspectRatio,
    startCropping,
    applyCrop,
    cancelCrop,
    resetCrop,
    resetColorCorrection,
    rotate,
    setAspectRatio,
  }
}

export const PHOTO_EDITOR_KEY: InjectionKey<PhotoEditorController> = Symbol('photoEditor')

/**
 * Creates the single editor controller and exposes it to the subtree.
 * Must be called by the layout, which is the closest common ancestor of the
 * editor view and the crop controls.
 */
export function providePhotoEditor (): PhotoEditorController {
  const controller = createPhotoEditor()

  provide(PHOTO_EDITOR_KEY, controller)

  return controller
}

export function usePhotoEditor (): PhotoEditorController {
  const controller = inject(PHOTO_EDITOR_KEY, null)

  if (!controller) {
    throw new Error('[photo-editor] usePhotoEditor() must be called below a providePhotoEditor()')
  }

  return controller
}

export { type CropState } from '@/types'
