import type {
  ExportedFile,
  ExportFormat,
  ExportOptions,
  ExportProgress,
  ExportResult,
  RenderablePhoto,
} from '@/types'
import { renderCrop } from '@/services/cropRenderer'
import { hasCrop } from '@/types'
import { buildImageFilter, isQualitySupported, toFileExtension, toMimeType } from '@/utils/imageFilter'

/**
 * Max edge of an intermediate canvas. Anything larger is scaled down first so
 * that browser canvas limits cannot silently truncate a large photo.
 */
const RENDER_MAX_EDGE = 8192

const ZIP_DEFLATE_LEVEL = 6

export interface Archive {
  add: (name: string, file: Blob) => void
  generate: () => Promise<Blob>
}

export interface ExportDependencies {
  /** Loads a URL into a decoded, drawable image. */
  loadImage: (src: string) => Promise<HTMLImageElement>
  /** Persists the generated archive. */
  save: (blob: Blob, filename: string) => Promise<void>
  /** Bundles files into a zip archive. */
  createArchive: () => Promise<Archive>
  /** Yields to the event loop so the progress UI can repaint. */
  yieldToMainThread: () => Promise<void>
}

function createDefaultDependencies (): ExportDependencies {
  return {
    async loadImage (src) {
      const image = new Image()
      image.src = src

      await (typeof image.decode === 'function'
        ? image.decode()
        : new Promise<void>((resolve, reject) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener(
            'error',
            () => reject(new Error('Image decode failed')),
            { once: true },
          )
        }))

      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error('Image has no intrinsic size')
      }

      return image
    },
    async save (blob, filename) {
      const { saveAs } = await import('file-saver')
      saveAs(blob, filename)
    },
    async createArchive () {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      return {
        add: (name, file) => void zip.file(name, file),
        generate: () => zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: ZIP_DEFLATE_LEVEL },
        }),
      }
    },
    yieldToMainThread: () => new Promise(resolve => setTimeout(resolve, 0)),
  }
}

function resolveTargetSize (
  naturalWidth: number,
  naturalHeight: number,
  options: ExportOptions,
): { width: number, height: number } {
  let scale = 1

  if (options.size !== 'original') {
    scale = Math.min(1, Number(options.size) / Math.max(naturalWidth, naturalHeight))
  }

  scale = Math.min(scale, RENDER_MAX_EDGE / Math.max(naturalWidth, naturalHeight))

  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  }
}

function canvasToBlob (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error(`Failed to encode canvas as ${mimeType}`))
        }
      },
      mimeType,
      quality,
    )
  })
}

/**
 * Renders a single photo: crop first, then color correction in a second pass.
 *
 * Two passes are required because `filter` applies to the whole source
 * rectangle, so cropping and filtering in one step would sample the filtered
 * pixels outside the crop bounds and darken the corners.
 */
async function renderPhoto (
  photo: RenderablePhoto,
  options: ExportOptions,
  deps: ExportDependencies,
): Promise<Blob> {
  const image = await deps.loadImage(photo.src)
  const { naturalWidth, naturalHeight } = image

  const cropped = hasCrop(photo, photo.isCropped)
    ? renderCrop(image, naturalWidth, naturalHeight, photo)
    : null

  const { width, height } = resolveTargetSize(
    cropped?.width ?? naturalWidth,
    cropped?.height ?? naturalHeight,
    options,
  )

  const geometry = document.createElement('canvas')
  geometry.width = width
  geometry.height = height

  const geometryContext = geometry.getContext('2d')

  if (!geometryContext) {
    throw new Error('Canvas 2D context is unavailable')
  }

  geometryContext.drawImage(cropped ?? image, 0, 0, width, height)

  // Second pass: color correction over the already-cropped pixels. Because the
  // filter is applied while drawing onto a canvas of the final size, the
  // browser expands the output for blur automatically.
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }

  context.filter = buildImageFilter(photo)
  context.drawImage(geometry, 0, 0)

  const mimeType = toMimeType(options.format)

  return canvasToBlob(
    canvas,
    mimeType,
    isQualitySupported(options.format) ? options.quality / 100 : undefined,
  )
}

function buildArchiveName (options: ExportOptions, timestamp: number): string {
  const quality = isQualitySupported(options.format) ? `_quality_${options.quality}` : ''

  return `${timestamp}_darkroom${quality}_size_${options.size}.zip`
}

function buildEntryName (photo: RenderablePhoto, format: ExportFormat, index: number): string {
  const base = photo.name.replace(/\.[^.]+$/, '') || `photo-${index + 1}`

  return `${base}.${toFileExtension(format)}`
}

export interface ExportAllInput {
  photos: RenderablePhoto[]
  options: ExportOptions
  onProgress?: (progress: ExportProgress) => void
  dependencies?: Partial<ExportDependencies>
}

/**
 * Renders every photo and downloads them as a single zip archive.
 *
 * A single failing photo is reported in the result instead of aborting the
 * whole batch, so one corrupt file cannot cost the user the entire export.
 */
export async function exportAllPhotos (input: ExportAllInput): Promise<ExportResult> {
  const { photos, options, onProgress, dependencies: overrides } = input
  const deps: ExportDependencies = { ...createDefaultDependencies(), ...overrides }

  if (photos.length === 0) {
    throw new Error('Nothing to export')
  }

  const archive = await deps.createArchive()
  const exported: ExportedFile[] = []
  const failed: string[] = []
  let completed = 0

  onProgress?.({ completed, total: photos.length })

  for (const [index, photo] of photos.entries()) {
    const entryName = buildEntryName(photo, options.format, index)

    try {
      const blob = await renderPhoto(photo, options, deps)
      archive.add(entryName, blob)
      exported.push({ photoId: photo.id, entryName, size: blob.size })
    } catch (error) {
      failed.push(entryName)
      console.error(`[export] failed to render ${entryName}`, error)
    }

    completed += 1
    onProgress?.({ completed, total: photos.length })

    await deps.yieldToMainThread()
  }

  if (exported.length === 0) {
    throw new Error('None of the photos could be processed')
  }

  const content = await archive.generate()
  const filename = buildArchiveName(options, Date.now())

  await deps.save(content, filename)

  return { filename, size: content.size, exported, failed }
}
