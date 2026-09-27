import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import EditControls from '@/components/EditControls.vue'
import { PHOTO_EDITOR_KEY, type PhotoEditorController } from '@/composables/usePhotoEditor'
import { usePhotoStore } from '@/stores/photoStore'

const vuetify = createVuetify({ components, directives })

const KEY = { Enter: 13, Escape: 27, c: 67 }

/**
 * Vuetify's `useHotkey` listens on `window`, so the event has to bubble up
 * from the document to reach the handler.
 */
function press (key: string, options: KeyboardEventInit = {}): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }))
}

function createController (): PhotoEditorController {
  return {
    registerImage: vi.fn(),
    previewSrc: { value: undefined },
    displaySrc: { value: '' },
    isCropping: { value: false },
    aspectRatios: [],
    cropAspectRatio: { value: undefined },
    startCropping: vi.fn(),
    applyCrop: vi.fn(),
    cancelCrop: vi.fn(),
    resetCrop: vi.fn(),
    resetColorCorrection: vi.fn(),
    rotate: vi.fn(),
    setAspectRatio: vi.fn(),
  } as unknown as PhotoEditorController
}

function mountControls (controller: PhotoEditorController) {
  return mount(EditControls, {
    global: { plugins: [vuetify], provide: { [PHOTO_EDITOR_KEY as symbol]: controller } },
  })
}

function seedPhoto (): void {
  const store = usePhotoStore()

  store.photos.push({ id: 'p1', name: 'a.png', src: 'blob:a', rotation: 0, x: 0, y: 0, width: 0, height: 0, isCropped: false, scaleX: 1, scaleY: 1, aspectRatio: undefined, brightness: 0, contrast: 0, saturation: 0, sepia: 0, blur: 0, invert: 0, grayscale: 0, rotate: 0, exportedSize: undefined } as never)
  store.setActive('p1')
}

describe('EditControls hotkeys', () => {
  let controller: PhotoEditorController
  let wrapper: ReturnType<typeof mountControls>

  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    seedPhoto()
    controller = createController()
    wrapper = mountControls(controller)
  })

  it('applies the crop on Enter even while a button holds the focus', () => {
    const button = document.createElement('button')

    document.body.append(button)
    button.focus()

    controller.isCropping.value = true

    press('Enter')

    expect(controller.applyCrop).toHaveBeenCalledTimes(1)
  })

  it('applies the crop on Enter after the cropper was opened by the c shortcut', () => {
    const button = document.createElement('button')

    document.body.append(button)
    button.focus()

    press('c')
    controller.isCropping.value = true

    press('Enter')

    expect(controller.applyCrop).toHaveBeenCalledTimes(1)
  })

  it('leaves Enter alone when no crop is in progress', () => {
    const button = document.createElement('button')

    document.body.append(button)
    button.focus()

    press('Enter')

    expect(controller.applyCrop).not.toHaveBeenCalled()
  })

  it('leaves Enter to a focused Cancel button', async () => {
    controller.isCropping.value = true
    await wrapper.vm.$nextTick()

    const cancel = wrapper.find('.cancel-crop-button')

    expect(cancel.exists()).toBe(true)

    const element = cancel.element as HTMLElement

    element.focus()
    press('Enter', { key: KEY.Enter as never } as KeyboardEventInit)

    expect(controller.applyCrop).not.toHaveBeenCalled()
  })

  it('cancels the crop on Escape', () => {
    controller.isCropping.value = true

    press('Escape')

    expect(controller.cancelCrop).toHaveBeenCalledTimes(1)
  })
})
