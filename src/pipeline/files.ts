export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function sheetTitle(names: string, kind: 'info sheet' | 'cheat sheet'): string {
  const base = names.trim() || 'Couple'
  return `${base} ${kind}`
}

export function sheetFileName(names: string, kind: 'info sheet' | 'cheat sheet'): string {
  return `${sheetTitle(names, kind)}.docx`
}
