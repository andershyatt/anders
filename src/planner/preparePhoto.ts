export const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const MAX_EDGE = 1600
const PHOTO_QUALITY = 0.85

export class PhotoTooLargeError extends Error {
  constructor() {
    super('photo too large')
    this.name = 'PhotoTooLargeError'
  }
}

export interface PreparedPhoto {
  filename: string
  mimeType: string
  blob: Blob
  /** Object URL of a browser-decoded preview. Null when the file could not be decoded. */
  previewUrl: string | null
}

function photoFilename(name: string, mimeType: string): string {
  const base = name.replace(/\.[^.]+$/, '').trim() || 'couple-photo'
  return `${base}.${mimeType === 'image/webp' ? 'webp' : 'jpg'}`
}

function decodeImage(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      if (image.naturalWidth < 1 || image.naturalHeight < 1) {
        resolve(null)
        return
      }
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    image.src = url
  })
}

function canvasFor(image: HTMLImageElement): HTMLCanvasElement | null {
  const longEdge = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

function blobOf(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, PHOTO_QUALITY)
  })
}

async function encodePhoto(image: HTMLImageElement): Promise<{ blob: Blob; mimeType: string } | null> {
  const canvas = canvasFor(image)
  if (!canvas) return null
  const webp = await blobOf(canvas, 'image/webp')
  const jpeg = await blobOf(canvas, 'image/jpeg')
  if (webp && jpeg) return webp.size < jpeg.size ? { blob: webp, mimeType: 'image/webp' } : { blob: jpeg, mimeType: 'image/jpeg' }
  if (webp) return { blob: webp, mimeType: 'image/webp' }
  if (jpeg) return { blob: jpeg, mimeType: 'image/jpeg' }
  return null
}

export async function prepareCouplePhoto(file: File): Promise<PreparedPhoto> {
  const image = await decodeImage(file)
  if (!image) {
    if (file.size > MAX_PHOTO_BYTES) throw new PhotoTooLargeError()
    return {
      filename: file.name || 'couple-photo',
      mimeType: file.type || 'application/octet-stream',
      blob: file,
      previewUrl: null,
    }
  }

  const encoded = await encodePhoto(image)
  if (!encoded) {
    if (file.size > MAX_PHOTO_BYTES) throw new PhotoTooLargeError()
    return {
      filename: file.name || 'couple-photo',
      mimeType: file.type || 'application/octet-stream',
      blob: file,
      previewUrl: null,
    }
  }
  if (encoded.blob.size > MAX_PHOTO_BYTES) throw new PhotoTooLargeError()
  return {
    filename: photoFilename(file.name, encoded.mimeType),
    mimeType: encoded.mimeType,
    blob: encoded.blob,
    previewUrl: URL.createObjectURL(encoded.blob),
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}
