import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePhotoStore } from '@/stores/photoStore'

vi.mock('@/services/imageExport', () => ({
  exportAllPhotos: vi.fn(),
}))

vi.mock('@/services/photoLoader', async importOriginal => {
  const actual = await importOriginal() as Record<string, unknown>

  return {
    ...actual,
    loadPhoto: vi.fn(async (file: File, id: string) => ({
      id,
      src: `blob:${file.name}`,
      name: file.name,
    })),
  }
})

const { exportAllPhotos } = await import('@/services/imageExport')

function createFile (name: string): File {
  return new File(['data'], name, { type: 'image/jpeg' })
}

describe('photoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('activates the first imported photo', async () => {
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg')])

    expect(store.photos).toHaveLength(1)
    expect(store.activePhotoId).toBe(store.photos[0].id)
  })

  it('keeps the requested order regardless of decode timing', async () => {
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg'), createFile('b.jpg'), createFile('c.jpg')])

    expect(store.photos.map(photo => photo.name)).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
  })

  it('revokes the object URL when a photo is removed', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg'), createFile('b.jpg')])

    const [first, second] = store.photos
    store.removePhoto(first.id)

    expect(revoke).toHaveBeenCalledWith('blob:a.jpg')
    // The remaining photo is promoted so the editor never goes blank.
    expect(store.activePhotoId).toBe(second.id)
  })

  it('revokes every object URL when all photos are cleared', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg'), createFile('b.jpg')])

    store.clearPhotos()

    expect(revoke).toHaveBeenCalledTimes(2)
    expect(store.isEmpty).toBe(true)
    expect(store.activePhotoId).toBeNull()
  })

  it('keeps the photos that loaded when a sibling file fails', async () => {
    const { loadPhoto } = await import('@/services/photoLoader')
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    vi.mocked(loadPhoto)
      .mockImplementationOnce(async (file: File, id: string) => ({
        id,
        src: `blob:${file.name}`,
        name: file.name,
      }))
      .mockImplementationOnce(() => Promise.reject(new Error('unreadable')))

    const store = usePhotoStore()
    const result = await store.addPhotosFromFiles([createFile('a.jpg'), createFile('b.jpg')])

    // Losing an unreadable file must not cost the user the whole batch.
    expect(result.imported).toHaveLength(1)
    expect(result.failed).toEqual(['b.jpg'])
    expect(store.photos.map(photo => photo.name)).toEqual(['a.jpg'])
    expect(store.activePhotoId).toBe(store.photos[0].id)
    error.mockRestore()
  })

  it('builds a filter that matches the correction values', async () => {
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg')])

    expect(store.imageFilter).toBe(
      'brightness(100%) contrast(100%) saturate(100%) sepia(0%) grayscale(0%) invert(0%) blur(0px)',
    )

    const photo = store.activePhoto
    if (photo) {
      photo.brightness = 20
      photo.blur = 50
    }

    expect(store.imageFilter).toContain('brightness(120%)')
    expect(store.imageFilter).toContain('blur(5px)')
  })

  it('clamps out-of-range corrections in the filter', async () => {
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg')])

    const photo = store.activePhoto
    if (photo) {
      photo.brightness = 500
      photo.invert = -50
    }

    // Out-of-range values are clamped to the slider bounds, not dropped.
    expect(store.imageFilter).toContain('brightness(200%)')
    expect(store.imageFilter).toContain('invert(0%)')
  })

  it('resets the active photo corrections', async () => {
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg')])

    const photo = store.activePhoto
    if (photo) {
      photo.brightness = 30
      photo.sepia = 40
    }

    store.resetAdjustments()

    expect(photo?.brightness).toBe(0)
    expect(photo?.sepia).toBe(0)
    expect(store.editedPhotos).toBe(0)
  })

  it('counts edited photos', async () => {
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg'), createFile('b.jpg')])

    const [first] = store.photos
    if (first) {
      first.contrast = 10
    }

    expect(store.editedPhotos).toBe(1)
  })

  it('resets the crop back to the untouched frame', async () => {
    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg')])

    const photo = store.activePhoto
    if (photo) {
      photo.isCropped = true
      photo.x = 10
      photo.width = 500
      photo.rotate = 90
      photo.scaleX = 2
    }

    store.resetCrop()

    expect(photo?.isCropped).toBe(false)
    expect(photo?.rotate).toBe(0)
    expect(photo?.width).toBe(0)
    expect(photo?.scaleX).toBe(1)
  })

  it('ignores a second export while one is running', async () => {
    let resolveExport: (() => void) | undefined
    const gate = new Promise<void>(resolve => {
      resolveExport = resolve
    })

    vi.mocked(exportAllPhotos).mockImplementation(() => gate.then(() => ({
      filename: 'a.zip',
      size: 1,
      exported: [],
      failed: [],
    })))

    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg')])

    const first = store.exportAll()
    const second = store.exportAll()

    resolveExport?.()
    await Promise.all([first, second])

    expect(exportAllPhotos).toHaveBeenCalledTimes(1)
  })

  it('always clears the exporting flag, even when the export throws', async () => {
    vi.mocked(exportAllPhotos).mockRejectedValue(new Error('zip failed'))

    const store = usePhotoStore()
    await store.addPhotosFromFiles([createFile('a.jpg')])
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(store.exportAll()).rejects.toThrow('zip failed')

    expect(store.isExporting).toBe(false)
    expect(store.exportProgress).toBeNull()
    error.mockRestore()
  })

  it('does nothing when there is nothing to export', async () => {
    const store = usePhotoStore()

    await store.exportAll()

    expect(exportAllPhotos).not.toHaveBeenCalled()
  })
})
