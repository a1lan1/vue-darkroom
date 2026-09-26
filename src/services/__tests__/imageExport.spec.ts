import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type CanvasContextStub, stubCanvasContext } from '@/__tests__/canvasStub'
import { type Archive, exportAllPhotos, type ExportDependencies } from '@/services/imageExport'
import { createDefaultCropState, type ExportProgress, type RenderablePhoto } from '@/types'

const NATURAL_WIDTH = 4000
const NATURAL_HEIGHT = 3000

function createPhoto (overrides: Partial<RenderablePhoto> = {}): RenderablePhoto {
  return {
    id: 'photo-1',
    src: 'blob:photo-1',
    name: 'sunset.jpg',
    isCropped: false,
    ...createDefaultCropState(),
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sepia: 0,
    invert: 0,
    grayscale: 0,
    blur: 0,
    ...overrides,
  }
}

function createHarness () {
  const added: Array<{ name: string, size: number }> = []
  const saved: Array<{ filename: string, size: number }> = []
  const progress: ExportProgress[] = []

  const archive: Archive = {
    add: (name, file) => void added.push({ name, size: file.size }),
    generate: () => Promise.resolve(new Blob([new Uint8Array(1024)], { type: 'application/zip' })),
  }

  const dependencies: Partial<ExportDependencies> = {
    loadImage: () => Promise.resolve({
      naturalWidth: NATURAL_WIDTH,
      naturalHeight: NATURAL_HEIGHT,
    } as HTMLImageElement),
    createArchive: () => Promise.resolve(archive),
    yieldToMainThread: () => Promise.resolve(),
    save: (blob, filename) => {
      saved.push({ filename, size: blob.size })

      return Promise.resolve()
    },
  }

  return { added, saved, progress, dependencies }
}

describe('exportAllPhotos', () => {
  let context: CanvasContextStub
  let restore: () => void

  /**
   * The draw that scales into an explicit destination rect. The very last
   * `drawImage` is the 1:1 copy onto the filtered canvas.
   */
  function geometryPass () {
    return context.calls
      .filter(([name]) => name === 'drawImage')
      .findLast(call => call.length > 5)
  }

  beforeEach(() => {
    const stub = stubCanvasContext()
    context = stub.context
    restore = stub.restore
  })

  afterEach(() => {
    restore()
  })

  it('renders a single photo at its natural size', async () => {
    const harness = createHarness()

    const result = await exportAllPhotos({
      photos: [createPhoto()],
      options: { quality: 80, size: 'original', format: 'jpeg' },
      ...harness,
      dependencies: harness.dependencies,
    })

    expect(result.exported).toHaveLength(1)
    expect(result.exported[0].entryName).toBe('sunset.jpg')
    expect(result.exported[0].photoId).toBe('photo-1')
    expect(harness.saved[0].filename).toContain('_darkroom_quality_80')
  })

  it('strips the original extension from the archive entry', async () => {
    const harness = createHarness()

    await exportAllPhotos({
      photos: [createPhoto({ name: 'holiday.photo.png' })],
      options: { quality: 80, size: 'original', format: 'webp' },
      dependencies: harness.dependencies,
    })

    expect(harness.added[0].name).toBe('holiday.photo.webp')
  })

  it('renders the crop before applying colour correction', async () => {
    const harness = createHarness()

    await exportAllPhotos({
      photos: [createPhoto({
        isCropped: true,
        x: 0,
        y: 0,
        width: 1000,
        height: 800,
      })],
      options: { quality: 80, size: 'original', format: 'jpeg' },
      dependencies: harness.dependencies,
    })

    const draws = context.calls.filter(([name]) => name === 'drawImage')

    // 1: rotated full frame, 2: crop rect, 3: geometry, 4: filtered copy.
    expect(draws).toHaveLength(4)
    expect(draws[1].slice(2)).toEqual([0, 0, 1000, 800, 0, 0, 1000, 800])
  })

  it('downscales to the requested export size', async () => {
    const harness = createHarness()

    await exportAllPhotos({
      photos: [createPhoto()],
      options: { quality: 80, size: '1920', format: 'jpeg' },
      dependencies: harness.dependencies,
    })

    // 4000x3000 limited to a 1920px long edge. The geometry pass is the draw
    // that carries explicit destination dimensions; the final pass draws the
    // geometry canvas 1:1 and only exists to apply the colour filter.
    expect(geometryPass()?.slice(2)).toEqual([0, 0, 1920, 1440])
  })

  it('never upscales a small photo', async () => {
    const harness = createHarness()

    harness.dependencies.loadImage = () => Promise.resolve({
      naturalWidth: 800,
      naturalHeight: 600,
    } as HTMLImageElement)

    await exportAllPhotos({
      photos: [createPhoto()],
      options: { quality: 80, size: '1920', format: 'jpeg' },
      dependencies: harness.dependencies,
    })

    expect(geometryPass()?.slice(2)).toEqual([0, 0, 800, 600])
  })

  it('reports progress once per photo, including the initial state', async () => {
    const harness = createHarness()
    const seen: ExportProgress[] = []

    await exportAllPhotos({
      photos: [createPhoto({ id: 'a', name: 'a.jpg' }), createPhoto({ id: 'b', name: 'b.jpg' })],
      options: { quality: 80, size: 'original', format: 'jpeg' },
      onProgress: progress => void seen.push(progress),
      dependencies: harness.dependencies,
    })

    expect(seen).toEqual([
      { completed: 0, total: 2 },
      { completed: 1, total: 2 },
      { completed: 2, total: 2 },
    ])
  })

  it('keeps going when a single photo fails', async () => {
    const harness = createHarness()
    let call = 0

    harness.dependencies.loadImage = () => {
      call += 1

      if (call === 1) {
        return Promise.reject(new Error('corrupt file'))
      }

      return Promise.resolve({
        naturalWidth: NATURAL_WIDTH,
        naturalHeight: NATURAL_HEIGHT,
      } as HTMLImageElement)
    }

    const result = await exportAllPhotos({
      photos: [createPhoto({ id: 'a', name: 'a.jpg' }), createPhoto({ id: 'b', name: 'b.jpg' })],
      options: { quality: 80, size: 'original', format: 'jpeg' },
      dependencies: harness.dependencies,
    })

    expect(result.failed).toEqual(['a.jpg'])
    expect(result.exported.map(file => file.photoId)).toEqual(['b'])
    expect(harness.added).toHaveLength(1)
  })

  it('throws when every photo fails, so no empty archive is offered', async () => {
    const harness = createHarness()
    harness.dependencies.loadImage = () => Promise.reject(new Error('corrupt file'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(exportAllPhotos({
      photos: [createPhoto()],
      options: { quality: 80, size: 'original', format: 'jpeg' },
      dependencies: harness.dependencies,
    })).rejects.toThrow('None of the photos could be processed')

    expect(harness.saved).toHaveLength(0)
    error.mockRestore()
  })

  it('rejects an empty photo list', async () => {
    const harness = createHarness()

    await expect(exportAllPhotos({
      photos: [],
      options: { quality: 80, size: 'original', format: 'jpeg' },
      dependencies: harness.dependencies,
    })).rejects.toThrow('Nothing to export')
  })
})
