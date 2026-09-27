import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createVuetify } from 'vuetify'
import { VApp } from 'vuetify/components'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VIconBtn } from 'vuetify/labs/VIconBtn'
import SidePanel from '@/components/SidePanel.vue'
import { providePhotoEditor } from '@/composables/usePhotoEditor'
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

// Mirrors src/plugins/vuetify.ts, including the labs component the app relies on.
const vuetify = createVuetify({
  components: { ...components, VIconBtn },
  directives,
})

describe('SidePanel export options', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    // The drawer is only rendered once the library holds at least one photo.
    await usePhotoStore().addPhotosFromFiles([new File(['data'], 'a.png', { type: 'image/png' })])
  })

  /** `v-navigation-drawer` resolves its app bar/footer offsets from `v-app`. */
  function renderPanel () {
    // `EditControls` reads the editor controller the layout normally provides.
    return mount(defineComponent({
      setup () {
        providePhotoEditor()
        return () => h(VApp, () => h(SidePanel))
      },
    }), { global: { plugins: [vuetify] }, attachTo: document.body })
  }

  /**
   * `storeToRefs` exposes only refs and getters. Reading the static option
   * lists through it left them `undefined`, which rendered an empty format
   * toggle and a select reporting "No data available".
   */
  it('renders the format toggle from the store options', () => {
    const wrapper = renderPanel()
    const labels = wrapper.findAll('button').map(b => b.text())

    expect(labels).toEqual(expect.arrayContaining(['JPEG', 'PNG', 'WebP']))
    wrapper.unmount()
  })

  /**
   * The "No data available" placeholder is only painted once the menu opens,
   * which jsdom never triggers. Asserting the bound `items` catches the same
   * defect at its source: `undefined` items on the select.
   */
  it('binds the size select to real options, not undefined', () => {
    const wrapper = renderPanel()
    const select = wrapper.findComponent({ name: 'VSelect' })

    expect(select.exists(), 'size select not rendered').toBe(true)

    const items = select.props('items') as Array<{ label: string, value: unknown }>

    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    expect(items.map(i => i.label)).toEqual(
      expect.arrayContaining(['Original', '1920px', '1280px', '800px']),
    )
    expect(items.every(i => i.value !== undefined)).toBe(true)
    wrapper.unmount()
  })
})
