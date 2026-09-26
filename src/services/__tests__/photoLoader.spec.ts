import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubCanvasContext } from '@/__tests__/canvasStub'
import { createPhotoItem, loadPhoto, releasePhotoSource } from '@/services/photoLoader'

function createFile (name = 'a.jpg'): File {
  return new File(['data'], name, { type: 'image/jpeg' })
}

/**
 * jsdom never loads `img.src`, so a decodable image has to be simulated. The
 * `naturalWidth`/`naturalHeight` are readonly accessors and are redefined to
 * mimic a decoded 4000x3000 photo.
 */
function mockDecodedImage (width = 4000, height = 3000): void {
  vi.spyOn(Image.prototype, 'addEventListener').mockImplementation(((
    event: string,
    handler: EventListener,
  ) => {
    queueMicrotask(() => handler(new Event(event)))

    return undefined
  }) as never)

  for (const property of ['naturalWidth', 'naturalHeight'] as const) {
    Object.defineProperty(HTMLImageElement.prototype, property, {
      value: property === 'naturalWidth' ? width : height,
      configurable: true,
    })
  }
}

describe('loadPhoto', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:photo')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns an object URL instead of a base64 data URL', async () => {
    mockDecodedImage()

    const photo = await loadPhoto(createFile(), 'id-1')

    expect(photo.id).toBe('id-1')
    expect(photo.src).toBe('blob:photo')
    expect(photo.name).toBe('a.jpg')
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(File))
  })

  it('falls back to no thumbnail when the canvas is unavailable', async () => {
    mockDecodedImage()

    // jsdom returns no 2D context, which must degrade to the full-size source
    // instead of failing the whole import.
    const photo = await loadPhoto(createFile(), 'id-1')

    expect(photo.thumbnailSrc).toBeUndefined()
    expect(photo.src).toBe('blob:photo')
  })

  it('degrades to no thumbnail when the canvas cannot be encoded', async () => {
    mockDecodedImage()
    const stub = stubCanvasContext()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    // A tainted or oversized canvas makes `toDataURL` throw.
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new Error('tainted canvas')
    })

    const photo = await loadPhoto(createFile(), 'id-1')

    expect(photo.thumbnailSrc).toBeUndefined()
    expect(photo.src).toBe('blob:photo')

    stub.restore()
    warn.mockRestore()
  })

  it('releases the object URL when loading rejects', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    vi.spyOn(Image.prototype, 'addEventListener').mockImplementation(((
      _event: string,
      handler: EventListener,
    ) => {
      queueMicrotask(() => handler(new Event('error')))

      return undefined
    }) as never)

    const photo = await loadPhoto(createFile(), 'id-1')

    // A failed decode is not fatal: the browser may still decode the object
    // URL when it is painted.
    expect(photo.src).toBe('blob:photo')
    expect(photo.thumbnailSrc).toBeUndefined()
    expect(revoke).not.toHaveBeenCalled()
  })
})

describe('releasePhotoSource', () => {
  it('revokes the object URL of a photo', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const photo = createPhotoItem({ id: 'id-1', src: 'blob:photo', name: 'a.jpg' })
    releasePhotoSource(photo)

    expect(revoke).toHaveBeenCalledWith('blob:photo')
  })
})

describe('createPhotoItem', () => {
  it('starts with a neutral correction and an untouched crop', () => {
    const photo = createPhotoItem({ id: 'id-1', src: 'blob:photo', name: 'a.jpg' })

    expect(photo).toMatchObject({
      isCropped: false,
      rotate: 0,
      scaleX: 1,
      scaleY: 1,
      width: 0,
      height: 0,
      brightness: 0,
      blur: 0,
    })
  })
})
