import Cropper from 'cropperjs'
import { computed, type ComputedRef, inject, type InjectionKey, nextTick, onScopeDispose, provide, ref, type Ref, watch, type WritableComputedRef } from 'vue'
import { renderCrop, rotatedFrameSize } from '@/services/cropRenderer'
import { loadImage } from '@/services/photoLoader'
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
const MIN_CANVAS_EDGE = 1

export interface PhotoEditorController {
  /** Registers the image the cropper attaches to. Owned by the editor view. */
  registerImage: (element: HTMLImageElement | null) => void
  /** Rendered crop preview. Falls back to the original while cropping. */
  previewSrc: Ref<string | undefined>
  /** Source to display on screen. */
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

function createPhotoEditor (): PhotoEditorController {
  const store = usePhotoStore()

  const image = ref<HTMLImageElement | null>(null)
  const previewSrc = ref<string | undefined>()

  /**
   * Guards the asynchronous cropper bootstrap.
   *
   * Constructing a cropper needs a DOM tick, so a cancel arriving in that
   * window would otherwise leave an orphaned cropper bound to the image. Every
   * await re-checks the token and bails out when the editor has moved on.
   */
  let initToken = 0
  let previewFrame = 0
  let previewRevision = 0

  /**
   * Decoded copies of the originals, keyed by object URL.
   *
   * Previews must never be rendered from the on-screen `<img>`: while cropping
   * the cropper hides it, and once a preview exists that element shows the
   * downscaled preview instead of the original. Re-decoding the original keeps
   * every crop at full resolution.
   */
  const sourceImages = new Map<string, Promise<HTMLImageElement>>()

  function getSourceImage (src: string): Promise<HTMLImageElement> {
    const cached = sourceImages.get(src)

    if (cached) {
      return cached
    }

    const pending = loadImage(src).catch((error: unknown) => {
      // Do not cache failures: a later attempt may succeed.
      sourceImages.delete(src)

      throw error
    })

    sourceImages.set(src, pending)

    return pending
  }

  function registerImage (element: HTMLImageElement | null): void {
    image.value = element
  }

  const isCropping = computed(() => store.isCropping)

  // The cropper reads its transform from the rendered element, so while
  // cropping it must always point at the untouched original.
  const displaySrc = computed<string>(() => {
    const photo = store.activePhoto

    if (!photo) {
      return ''
    }

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
   * Rebuilds a display-sized preview of the crop straight from the original.
   *
   * The preview is a cache, never the source of truth, so cropping repeatedly
   * cannot degrade the image.
   */
  async function renderPreview (photo: PhotoItem): Promise<void> {
    const revision = ++previewRevision

    let image: HTMLImageElement

    try {
      image = await getSourceImage(photo.src)
    } catch (error) {
      console.warn('[crop] could not read the original', error)
      return
    }

    if (revision !== previewRevision) {
      return
    }

    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight

    if (!naturalWidth || !naturalHeight) {
      return
    }

    try {
      const cropped = renderCrop(image, naturalWidth, naturalHeight, photo)
      const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(cropped.width, cropped.height))
      const width = Math.max(MIN_CANVAS_EDGE, Math.round(cropped.width * scale))
      const height = Math.max(MIN_CANVAS_EDGE, Math.round(cropped.height * scale))

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

  /** Coalesces the flood of crop events into one render per frame. */
  function schedulePreview (): void {
    cancelPendingPreview()

    previewFrame = requestAnimationFrame(() => {
      previewFrame = 0

      const photo = store.activePhoto

      if (photo && hasCrop(photo, photo.isCropped)) {
        void renderPreview(photo)
      }
    })
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

    if (token !== initToken || !store.isCropping || image.value !== element) {
      return
    }

    /**
     * Cropper.js applies `options.data` through `setData()` before it fires
     * `ready`, so passing the saved crop here restores it whether the image
     * was already decoded (synchronous `ready`) or still loading.
     */
    const data = hasCrop(photo, photo.isCropped)
      ? {
          x: photo.x,
          y: photo.y,
          width: photo.width,
          height: photo.height,
          rotate: photo.rotate,
          scaleX: photo.scaleX,
          scaleY: photo.scaleY,
        }
      : undefined

    // cropper.js is not an event emitter: interaction is observed through the
    // callbacks declared in its options.
    const cropper = new Cropper(element, {
      aspectRatio: photo.aspectRatio,
      viewMode: 1,
      autoCrop: true,
      zoomOnWheel: false,
      data,
      crop: schedulePreview,
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

  function applyCrop (): Promise<void> {
    if (!store.cropper) {
      return Promise.resolve()
    }

    initToken += 1
    store.persistCrop()
    store.isCropping = false
    store.destroyCropper()
    clearPreview()

    const photo = store.activePhoto

    return photo && hasCrop(photo, photo.isCropped) ? renderPreview(photo) : Promise.resolve()
  }

  function cancelCrop (): void {
    initToken += 1
    store.isCropping = false
    store.destroyCropper()
    clearPreview()

    const photo = store.activePhoto

    if (photo && hasCrop(photo, photo.isCropped)) {
      void renderPreview(photo)
    }
  }

  function resetCrop (): void {
    store.resetCrop()
    clearPreview()
  }

  function resetColorCorrection (): void {
    store.resetAdjustments()
  }

  /**
   * Rotates the photo without starting the cropper.
   *
   * Rotation is an edit in its own right; the cropper is only needed when the
   * user is actively framing a shot. While it *is* active the live instance is
   * used so the crop box follows the rotation on screen.
   */
  async function rotate (degrees: number): Promise<void> {
    const photo = store.activePhoto

    if (!photo) {
      return
    }

    const cropper = store.cropper

    if (cropper) {
      const data = cropper.getData()
      cropper.rotate((data.rotate ?? 0) + degrees)

      return
    }

    let naturalWidth = 0
    let naturalHeight = 0

    try {
      const image = await getSourceImage(photo.src)
      naturalWidth = image.naturalWidth
      naturalHeight = image.naturalHeight
    } catch (error) {
      console.warn('[crop] could not read the original for rotation', error)

      return
    }

    if (!naturalWidth || !naturalHeight) {
      return
    }

    const rotated = ((photo.rotate ?? 0) + degrees) % 360
    const nextRotate = rotated < 0 ? rotated + 360 : rotated
    const wasCropped = hasCrop(photo, photo.isCropped)

    photo.rotate = nextRotate

    // cropper.js keeps the crop rectangle numerically stable across a rotation
    // and only swaps the frame dimensions, so an existing crop is left alone.
    if (!wasCropped) {
      const frame = rotatedFrameSize(naturalWidth, naturalHeight, nextRotate)

      photo.x = 0
      photo.y = 0
      photo.width = frame.width
      photo.height = frame.height
      photo.isCropped = true
    }

    clearPreview()
    await renderPreview(photo)
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
      clearPreview()

      const photo = store.activePhoto

      if (photo && hasCrop(photo, photo.isCropped)) {
        void renderPreview(photo)
      }
    },
  )

  onScopeDispose(() => {
    initToken += 1
    cancelPendingPreview()
    store.destroyCropper()
    sourceImages.clear()
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
 *
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
