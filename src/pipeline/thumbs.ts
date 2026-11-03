/** Shrink a data-URL photo for a pipeline card. Leaves non-images and tiny files alone. */
export function thumbnailDataUrl(dataUrl: string, edge = 160): Promise<string> {
  if (!dataUrl.startsWith('data:image') || dataUrl.length < 12_000) return Promise.resolve(dataUrl)
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const longEdge = Math.max(image.naturalWidth, image.naturalHeight)
      if (longEdge < 1) {
        resolve(dataUrl)
        return
      }
      const scale = longEdge > edge ? edge / longEdge : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        resolve(dataUrl)
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(dataUrl)
            return
          }
          const reader = new FileReader()
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : dataUrl)
          reader.onerror = () => resolve(dataUrl)
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        0.8,
      )
    }
    image.onerror = () => resolve(dataUrl)
    image.src = dataUrl
  })
}
