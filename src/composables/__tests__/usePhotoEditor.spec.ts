import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { renderCrop } from '@/services/cropRenderer'
import { usePhotoStore } from '@/stores/photoStore'

/**
 * The public surface of cropperjs@1.5.x, and nothing else.
 *
 * The instance deliberately has no `on`/`off`: cropper.js is not an
 * EventEmitter and only accepts interaction callbacks through its options.
 * A previous implementation type-cast its way past the type definitions and
 * called `cropper.on(...)`, which threw at runtime and broke cropping entirely.
 */
class CropperStub {
  static instances: CropperStub[] = []
  static options: Record<string, unknown>[] = []

  data: Record<string, number> = {}
  destroyed = false

  constructor (readonly element: HTMLImageElement, options: Record<string, unknown>) {
    CropperStub.instances.push(this)
    CropperStub.options.push(options)
  }

  setData (data: Record<string, number>): void {
    this.data = { ...this.data, ...data }
  }

  getData (): Record<string, number> {
    return { ...this.data }
  }

  setAspectRatio (ratio: number): void {
    this.data.aspectRatio = ratio
  }

  rotate (degree: number): void {
    this.data.rotate = degree
  }

  reset (): void {
    this.data = {}
  }

  destroy (): void {
    this.destroyed = true
  }
}

vi.mock('cropperjs', () => ({ default: CropperStub }))
vi.mock('cropperjs/dist/cropper.css', () => ({}))

vi.mock('@/services/photoLoader', async importOriginal => {
  const actual = await importOriginal() as Record<string, unknown>

  return {
    ...actual,
    loadPhoto: vi.fn(async (file: File, id: string) => ({
      id,
      src: `blob:${id}`,
      name: file.name,
      width: 900,
      height: 600,
    })),
    loadImage: vi.fn(async (src: string) => {
      const image = new Image()
      Object.defineProperty(image, 'naturalWidth', { value: 900, configurable: true })
      Object.defineProperty(image, 'naturalHeight', { value: 600, configurable: true })
      image.src = src
      return image
    }),
  }
})

vi.mock('@/services/cropRenderer', async importOriginal => {
  const actual = await importOriginal() as Record<string, unknown>

  return {
    ...actual,
    renderCrop: vi.fn((_image, naturalWidth, naturalHeight, photo) => ({
      canvas: document.createElement('canvas'),
      width: photo?.isCropped ? photo.width : naturalWidth,
      height: photo?.isCropped ? photo.height : naturalHeight,
    })),
  }
})

const { renderCropMock } = { renderCropMock: renderCrop }
const { providePhotoEditor } = await import('@/composables/usePhotoEditor')
type PhotoEditorController = ReturnType<typeof providePhotoEditor>

/** Canvas context stub: preview rendering needs a 2d context to exist. */
function stubCanvas (): void {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: vi.fn(),
  })) as never
  HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/jpeg;base64,mock') as never
}

async function seedPhoto (): Promise<void> {
  const store = usePhotoStore()
  await store.addPhotosFromFiles([new File(['data'], 'a.png', { type: 'image/png' })])
}

describe('usePhotoEditor cropper integration', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    CropperStub.instances = []
    CropperStub.options = []
    renderCropMock.mockClear()
    stubCanvas()
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0)
      return 1
    })
    await seedPhoto()
    await nextTick()
  })

  /**
   * Mounts a host component so the controller is created inside a real setup()
   * context. Unmounting exercises the same `onScopeDispose` teardown the layout
   * relies on when the editor is torn down.
   */
  function mountController () {
    const captured: { controller?: PhotoEditorController } = {}

    const wrapper = mount(defineComponent({
      setup () {
        captured.controller = providePhotoEditor()
        return () => h('div')
      },
    }))

    return { controller: captured.controller!, stop: () => wrapper.unmount() }
  }

  function attachImage (): HTMLImageElement {
    return new Image()
  }

  it('creates the cropper using only documented API', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.startCropping()

    expect(CropperStub.instances).toHaveLength(1)
    expect(CropperStub.instances[0].destroyed).toBe(false)
    stop()
  })

  it('observes interaction through the options callback, not on/off', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.startCropping()

    const options = CropperStub.options[0]
    expect(typeof options.crop).toBe('function')

    const instance = CropperStub.instances[0] as unknown as Record<string, unknown>
    expect(instance.on).toBeUndefined()
    expect(instance.off).toBeUndefined()

    stop()
  })

  it('renders a preview when the crop callback fires', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.startCropping()

    // Simulate the user dragging the crop box.
    const store = usePhotoStore()
    const photo = store.activePhoto!
    photo.x = 40
    photo.y = 30
    photo.width = 400
    photo.height = 300
    photo.isCropped = true

    const cropCallback = CropperStub.options[0].crop as () => void
    cropCallback()
    await nextTick()
    await nextTick()

    expect(renderCropMock).toHaveBeenCalled()
    expect(controller.previewSrc.value).toBe('data:image/jpeg;base64,mock')
    stop()
  })

  it('destroys the cropper on apply and keeps the crop state', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.startCropping()

    const store = usePhotoStore()
    const photo = store.activePhoto!
    photo.x = 10
    photo.y = 20
    photo.width = 500
    photo.height = 400
    photo.rotate = 0
    photo.scaleX = 1
    photo.scaleY = 1

    const instance = CropperStub.instances[0]
    instance.setData({ x: 10, y: 20, width: 500, height: 400, rotate: 0, scaleX: 1, scaleY: 1 })

    await controller.applyCrop()

    expect(instance.destroyed).toBe(true)
    expect(store.isCropping).toBe(false)
    expect(photo.isCropped).toBe(true)
    expect(photo.width).toBe(500)
    stop()
  })

  it('destroys the cropper on cancel and leaves the crop untouched', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.startCropping()
    const instance = CropperStub.instances[0]
    controller.cancelCrop()

    expect(instance.destroyed).toBe(true)
    expect(usePhotoStore().isCropping).toBe(false)
    stop()
  })

  /**
   * Rotation is an edit in its own right. An earlier implementation called
   * `startCropping()` first, so pressing Rotate threw the crop UI at the user.
   */
  it('rotates without starting the cropper', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.rotate(90)

    expect(CropperStub.instances).toHaveLength(0)
    expect(usePhotoStore().isCropping).toBe(false)

    const photo = usePhotoStore().activePhoto!
    expect(photo.rotate).toBe(90)
    // A quarter turn of a 900x600 source is a 600x900 frame.
    expect(photo.width).toBe(600)
    expect(photo.height).toBe(900)
    expect(photo.isCropped).toBe(true)
    stop()
  })

  it('normalises the rotation angle', async () => {
    const { controller, stop } = mountController()
    controller.registerImage(attachImage())

    const photo = usePhotoStore().activePhoto!
    photo.rotate = 270

    await controller.rotate(90)
    expect(photo.rotate).toBe(0)

    await controller.rotate(-90)
    expect(photo.rotate).toBe(270)
    stop()
  })

  it('delegates to the live cropper while cropping is active', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.startCropping()
    const instance = CropperStub.instances[0]
    instance.setData({ x: 0, y: 0, width: 900, height: 600, rotate: 0, scaleX: 1, scaleY: 1 })

    await controller.rotate(90)

    expect(instance.data.rotate).toBe(90)
    expect(CropperStub.instances).toHaveLength(1)
    stop()
  })

  it('destroys the cropper when the controller scope is disposed', async () => {
    const { controller, stop } = mountController()
    const image = attachImage()
    controller.registerImage(image)

    await controller.startCropping()
    const instance = CropperStub.instances[0]

    stop()

    expect(instance.destroyed).toBe(true)
  })

  it('restores a saved crop through the data option', async () => {
    const store = usePhotoStore()
    const photo = store.activePhoto!
    photo.x = 25
    photo.y = 35
    photo.width = 600
    photo.height = 450
    photo.rotate = 90
    photo.scaleX = 1
    photo.scaleY = 1
    photo.isCropped = true

    const { controller, stop } = mountController()
    controller.registerImage(attachImage())

    await controller.startCropping()

    const options = CropperStub.options[0]
    expect(options.data).toMatchObject({ x: 25, y: 35, width: 600, height: 450, rotate: 90 })
    stop()
  })
})
