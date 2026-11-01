export const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const MAX_EDGE = 2000
const JPEG_QUALITY = 0.85

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

function jpegFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').trim() || 'couple-photo'
  return `${base}.jpg`
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

function encodeJpeg(image: HTMLImageElement): Promise<Blob | null> {
  const longEdge = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)
  context.drawImage(image, 0, 0, width, height)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', JPEG_QUALITY)
  })
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

  const blob = await encodeJpeg(image)
  if (!blob) {
    if (file.size > MAX_PHOTO_BYTES) throw new PhotoTooLargeError()
    return {
      filename: file.name || 'couple-photo',
      mimeType: file.type || 'application/octet-stream',
      blob: file,
      previewUrl: null,
    }
  }
  if (blob.size > MAX_PHOTO_BYTES) throw new PhotoTooLargeError()
  return {
    filename: jpegFilename(file.name),
    mimeType: 'image/jpeg',
    blob,
    previewUrl: URL.createObjectURL(blob),
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
