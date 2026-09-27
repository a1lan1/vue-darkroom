import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useEditorHotkeys } from '@/composables/useEditorHotkeys'
import { usePhotoStore } from '@/stores/photoStore'

vi.mock('@/services/imageExport', () => ({ exportAllPhotos: vi.fn() }))
vi.mock('@/services/photoLoader', async importOriginal => {
  const actual = await importOriginal() as Record<string, unknown>

  return {
    ...actual,
    loadPhoto: vi.fn(async (file: File, id: string) => ({
      id,
      src: `blob:${id}`,
      name: file.name,
    })),
  }
})

/**
 * Vuetify's `useHotkey` listens on `window`, so the event has to bubble up
 * from the document to reach the handler.
 */
function press (key: string, options: KeyboardEventInit = {}): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }))
}

function focusButton (): void {
  const button = document.createElement('button')

  document.body.append(button)
  button.focus()
}

function focusTextInput (): void {
  const input = document.createElement('input')

  input.type = 'text'
  document.body.append(input)
  input.focus()
}

function mountHotkeys () {
  return mount(defineComponent({
    setup () {
      useEditorHotkeys()
      return () => h('div')
    },
  }), { attachTo: document.body })
}

async function seedPhotos (count: number): Promise<void> {
  const store = usePhotoStore()
  const files = Array.from({ length: count }, (_, i) => new File(['data'], `p${i}.png`, { type: 'image/png' }))

  await store.addPhotosFromFiles(files)
}

describe('useEditorHotkeys', () => {
  let wrapper: ReturnType<typeof mountHotkeys>

  beforeEach(async () => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    await seedPhotos(3)
    // The composable registers document listeners on mount, so each test needs
    // its own registration to avoid leaking handlers between cases.
    wrapper = mountHotkeys()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  /**
   * Regression: importing leaves the focus on the trigger button, and the
   * strict guard then swallowed Alt+Arrow until the user clicked a thumbnail.
   */
  it('moves selection with Alt+Arrow even when a button holds the focus', () => {
    const store = usePhotoStore()
    const first = store.photos[0]!.id
    const second = store.photos[1]!.id

    store.setActive(first)
    focusButton()

    press('ArrowRight', { altKey: true })
    expect(store.activePhotoId).toBe(second)

    press('ArrowLeft', { altKey: true })
    expect(store.activePhotoId).toBe(first)
  })

  it('moves selection with Alt+Arrow when nothing is focused', () => {
    const store = usePhotoStore()
    const first = store.photos[0]!.id
    const second = store.photos[1]!.id

    store.setActive(first)
    document.body.focus()

    press('ArrowRight', { altKey: true })
    expect(store.activePhotoId).toBe(second)
  })

  it('leaves the caret alone while the user is typing in a text field', () => {
    const store = usePhotoStore()
    const first = store.photos[0]!.id

    store.setActive(first)
    focusTextInput()

    press('ArrowRight', { altKey: true })
    expect(store.activePhotoId).toBe(first)
  })

  it('stops at the ends of the strip', () => {
    const store = usePhotoStore()
    const first = store.photos[0]!.id
    const last = store.photos.at(-1)!.id

    store.setActive(first)
    press('ArrowLeft', { altKey: true })
    expect(store.activePhotoId).toBe(first)

    store.setActive(last)
    press('ArrowRight', { altKey: true })
    expect(store.activePhotoId).toBe(last)
  })

  /**
   * Deletion is destructive, so it keeps the strict guard: pressing Backspace
   * while a button is focused must not remove the photo.
   */
  it('ignores Backspace while a button holds the focus', () => {
    const store = usePhotoStore()
    const before = store.photos.length

    store.setActive(store.photos[0]!.id)
    focusButton()

    press('Backspace')
    expect(store.photos).toHaveLength(before)
  })

  it('removes the active photo on Backspace with no focus', () => {
    const store = usePhotoStore()
    const before = store.photos.length

    store.setActive(store.photos[0]!.id)
    document.body.focus()

    press('Backspace')
    expect(store.photos).toHaveLength(before - 1)
  })
})
