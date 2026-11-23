export function clientFolderName(date: string, names: string): string {
  const compact = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replaceAll('-', '') : 'Undated'
  const who = names.trim() || 'Couple'
  return `${compact} ${who}`.replace(/[\\/:*?"<>|]/g, '').slice(0, 120)
}

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
