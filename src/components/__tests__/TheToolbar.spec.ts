import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import TheToolbar from '@/components/TheToolbar.vue'
import { exportAllPhotos } from '@/services/imageExport'
import { useAppStore } from '@/stores/appStore'
import { usePhotoStore } from '@/stores/photoStore'

vi.mock('@/services/imageExport', () => ({ exportAllPhotos: vi.fn() }))

const vuetify = createVuetify({ components, directives })

/** `v-app-bar` must live inside a `v-app` layout. */
function exportButton () {
  return wrapper => wrapper.findAll('button').find(b => b.text().includes('Export All'))
}

function mountToolbar () {
  return mount({ components: { TheToolbar }, template: '<v-app><the-toolbar /></v-app>' }, { global: { plugins: [vuetify] } })
}

const exportAllPhotosMock = vi.mocked(exportAllPhotos)

function seedPhotos (count: number): void {
  const store = usePhotoStore()

  for (let index = 0; index < count; index += 1) {
    store.photos.push({ id: `p${index}`, name: `${index}.png`, src: `blob:${index}` } as never)
  }

  store.setActive('p0')
}

function result (exported: number, failed: number) {
  return {
    filename: 'photos.zip',
    size: 1024,
    exported: Array.from({ length: exported }, (_, index) => ({ photoId: `p${index}`, entryName: `${index}.jpg`, size: 128 })),
    failed: Array.from({ length: failed }, (_, index) => `${index}.jpg`),
  }
}

describe('TheToolbar export notification', () => {
  let notify: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    notify = vi.fn()
    vi.spyOn(useAppStore(), 'notify').mockImplementation(notify as never)
  })

  it('reports the number of photos actually written', async () => {
    seedPhotos(6)
    exportAllPhotosMock.mockResolvedValue(result(6, 0))

    const wrapper = mountToolbar()

    await exportButton()(wrapper)!.trigger('click')
    await flushPromises()

    expect(notify).toHaveBeenCalledWith('Exported 6 photo(s)')
  })

  it('reports skipped photos instead of the attempted total', async () => {
    seedPhotos(6)
    exportAllPhotosMock.mockResolvedValue(result(4, 2))

    const wrapper = mountToolbar()

    await exportButton()(wrapper)!.trigger('click')
    await flushPromises()

    expect(notify).toHaveBeenCalledWith('Exported 4 photo(s), 2 failed')
  })

  it('stays silent when the export never started', async () => {
    const wrapper = mountToolbar()

    // No photos imported, so the Export button is not rendered at all.
    expect(exportButton()(wrapper)).toBeUndefined()
    expect(notify).not.toHaveBeenCalled()
  })
})
