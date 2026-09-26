import { vi } from 'vitest'

/**
 * jsdom ships no canvas implementation, and adding the native `canvas`
 * package just to assert sizes would be a heavy dependency. These specs only
 * care about geometry and call order, so a recording stub is enough.
 */
export interface CanvasContextStub {
  calls: Array<[string, ...unknown[]]>
  drawImage: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
  restore: ReturnType<typeof vi.fn>
  translate: ReturnType<typeof vi.fn>
  rotate: ReturnType<typeof vi.fn>
  scale: ReturnType<typeof vi.fn>
  filter: string
  fillStyle: string
  imageSmoothingEnabled: boolean
}

export function createCanvasContextStub (): CanvasContextStub {
  const calls: Array<[string, ...unknown[]]> = []
  const record = (name: string) => vi.fn((...args: unknown[]) => {
    calls.push([name, ...args])
  })

  return {
    calls,
    drawImage: record('drawImage'),
    save: record('save'),
    restore: record('restore'),
    translate: record('translate'),
    rotate: record('rotate'),
    scale: record('scale'),
    filter: '',
    fillStyle: '',
    imageSmoothingEnabled: true,
  }
}

/**
 * Installs a recording 2D context on `HTMLCanvasElement` and returns a
 * function that restores the previous implementation.
 */
export function stubCanvasContext (): {
  context: CanvasContextStub
  restore: () => void
} {
  const context = createCanvasContextStub()
  const previousGetContext = HTMLCanvasElement.prototype.getContext
  const previousToBlob = HTMLCanvasElement.prototype.toBlob

  HTMLCanvasElement.prototype.getContext = vi.fn(() => context) as never

  // jsdom has no rasteriser, so `toBlob` never fires its callback. Emitting an
  // empty blob of the requested type keeps the async encode paths reachable.
  HTMLCanvasElement.prototype.toBlob = function toBlob (
    callback: BlobCallback,
    type?: string,
  ) {
    callback(new Blob([new Uint8Array(0)], { type: type ?? 'application/octet-stream' }))
  }

  return {
    context,
    restore () {
      HTMLCanvasElement.prototype.getContext = previousGetContext
      HTMLCanvasElement.prototype.toBlob = previousToBlob
    },
  }
}
