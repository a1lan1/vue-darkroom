import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type CanvasContextStub, stubCanvasContext } from '@/__tests__/canvasStub'
import { computeCropTransform, renderCrop, renderRotatedSource } from '@/services/cropRenderer'
import { createDefaultCropState } from '@/types'

const NATURAL_WIDTH = 4000
const NATURAL_HEIGHT = 3000

describe('computeCropTransform', () => {
  it('keeps the full frame when the crop box covers the source', () => {
    const transform = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      x: 0,
      y: 0,
      width: NATURAL_WIDTH,
      height: NATURAL_HEIGHT,
    })

    expect(transform.width).toBe(NATURAL_WIDTH)
    expect(transform.height).toBe(NATURAL_HEIGHT)
    expect(transform.fullWidth).toBe(NATURAL_WIDTH)
    expect(transform.fullHeight).toBe(NATURAL_HEIGHT)
  })

  it('swaps the rotated frame on a quarter turn', () => {
    const transform = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      rotate: 90,
      x: 0,
      y: 0,
      width: NATURAL_HEIGHT,
      height: NATURAL_WIDTH,
    })

    // The rotated canvas is as wide as the source is tall, mirroring
    // cropper.js, which swaps naturalWidth/naturalHeight.
    expect(transform.fullWidth).toBe(NATURAL_HEIGHT)
    expect(transform.fullHeight).toBe(NATURAL_WIDTH)
    expect(transform.width).toBe(NATURAL_HEIGHT)
    expect(transform.height).toBe(NATURAL_WIDTH)
  })

  it('treats 270 degrees as a quarter turn', () => {
    const transform = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      rotate: 270,
    })

    expect(transform.fullWidth).toBe(NATURAL_HEIGHT)
    expect(transform.fullHeight).toBe(NATURAL_WIDTH)
  })

  it('normalises negative and overflowing rotations', () => {
    const transform = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      rotate: -90,
    })

    expect(transform.rotate).toBe(270)
    expect(transform.fullWidth).toBe(NATURAL_HEIGHT)

    const wrapped = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      rotate: 450,
    })

    expect(wrapped.rotate).toBe(90)
  })

  it('clamps a crop box that points outside the source', () => {
    const transform = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      x: -500,
      y: -100,
      width: NATURAL_WIDTH + 5000,
      height: NATURAL_HEIGHT + 5000,
    })

    expect(transform.sx).toBe(0)
    expect(transform.sy).toBe(0)
    expect(transform.sWidth).toBe(NATURAL_WIDTH)
    expect(transform.sHeight).toBe(NATURAL_HEIGHT)
    expect(transform.width).toBe(NATURAL_WIDTH)
    expect(transform.height).toBe(NATURAL_HEIGHT)
  })

  it('truncates a crop box that runs past the right or bottom edge', () => {
    const transform = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      x: 3500,
      y: 2500,
      width: 1000,
      height: 1000,
    })

    expect(transform.sx).toBe(3500)
    expect(transform.sy).toBe(2500)
    expect(transform.sWidth).toBe(500)
    expect(transform.sHeight).toBe(500)
  })

  it('never produces a zero sized canvas for a degenerate crop box', () => {
    const transform = computeCropTransform(NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      x: NATURAL_WIDTH,
      y: NATURAL_HEIGHT,
      width: 0,
      height: 0,
    })

    expect(transform.width).toBeGreaterThanOrEqual(1)
    expect(transform.height).toBeGreaterThanOrEqual(1)
  })
})

describe('rendering', () => {
  let context: CanvasContextStub
  let restore: () => void

  beforeEach(() => {
    const stub = stubCanvasContext()
    context = stub.context
    restore = stub.restore
  })

  afterEach(() => {
    restore()
  })

  const source = { naturalWidth: NATURAL_WIDTH, naturalHeight: NATURAL_HEIGHT } as CanvasImageSource

  it('scales the zoom in the rotated frame, like cropper.js', () => {
    renderRotatedSource(source, NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      rotate: 90,
      scaleX: 1.5,
      scaleY: 1.5,
    })

    const scale = context.calls.find(([name]) => name === 'scale')
    expect(scale?.[1]).toBe(1.5)
    expect(scale?.[2]).toBe(1.5)

    // Rotation is applied before the zoom.
    const order = context.calls.map(([name]) => name)
    expect(order.indexOf('rotate')).toBeLessThan(order.indexOf('scale'))
  })

  it('draws the source at its unrotated natural size', () => {
    renderRotatedSource(source, NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      rotate: 90,
    })

    const draw = context.calls.find(([name]) => name === 'drawImage')
    // image, dx, dy, dWidth, dHeight
    expect(draw?.slice(2)).toEqual([
      -NATURAL_WIDTH / 2,
      -NATURAL_HEIGHT / 2,
      NATURAL_WIDTH,
      NATURAL_HEIGHT,
    ])
  })

  it('cuts the crop box out of the rotated source', () => {
    const canvas = renderCrop(source, NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      x: 100,
      y: 50,
      width: 800,
      height: 600,
    })

    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(600)

    // The second drawImage is the crop: full source, then source rect to dest.
    const draws = context.calls.filter(([name]) => name === 'drawImage')
    expect(draws).toHaveLength(2)
    expect(draws[1].slice(2)).toEqual([100, 50, 800, 600, 0, 0, 800, 600])
  })

  it('falls back to the whole rotated frame when zoomed out', () => {
    // Zooming out cannot shrink the canvas, so the full frame is returned
    // instead of a smaller image with transparent borders.
    const canvas = renderCrop(source, NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      scaleX: 0.5,
      scaleY: 0.5,
    })

    expect(canvas.width).toBe(NATURAL_WIDTH)
    expect(canvas.height).toBe(NATURAL_HEIGHT)
    expect(context.calls.filter(([name]) => name === 'drawImage')).toHaveLength(1)
  })

  it('sizes the canvas by the rotated natural dimensions', () => {
    const unrotated = renderRotatedSource(source, NATURAL_WIDTH, NATURAL_HEIGHT, createDefaultCropState())
    expect(unrotated.width).toBe(NATURAL_WIDTH)
    expect(unrotated.height).toBe(NATURAL_HEIGHT)

    const quarterTurned = renderRotatedSource(source, NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      rotate: 90,
    })
    expect(quarterTurned.width).toBe(NATURAL_HEIGHT)
    expect(quarterTurned.height).toBe(NATURAL_WIDTH)
  })

  it('does not grow the canvas when the cropper is zoomed in', () => {
    // A zoomed-in frame is larger than the natural size but the canvas stays
    // fixed, exactly like cropper.js: the overflow is what gets cropped.
    const canvas = renderRotatedSource(source, NATURAL_WIDTH, NATURAL_HEIGHT, {
      ...createDefaultCropState(),
      scaleX: 2,
      scaleY: 2,
    })

    expect(canvas.width).toBe(NATURAL_WIDTH)
    expect(canvas.height).toBe(NATURAL_HEIGHT)
  })
})
