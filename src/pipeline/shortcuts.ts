import { downloadBlob } from './files'

const URL_LIMIT = 7000
const DOC_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function clientFolderName(date: string, names: string): string {
  const compact = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replaceAll('-', '') : 'Undated'
  const who = names.trim() || 'Couple'
  return `${compact} ${who}`.replace(/[\\/:*?"<>|]/g, '').slice(0, 120)
}

export function isAppleDevice(): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isAppleMobile(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Hand a generated document to the Save Client Doc shortcut.
 * A download always happens, because a web page cannot write iCloud Drive itself.
 */
export async function saveClientDocument(blob: Blob, filename: string, folder: string): Promise<string> {
  downloadBlob(blob, filename)
  const instruction = `${folder}\n${filename}`
  const path = `iCloud Drive > Documents > AH Music > Docs > CLIENTS > ${folder}`
  let clipboard = false
  try {
    if (typeof ClipboardItem !== 'undefined') {
      const file = new File([blob], filename, { type: DOC_TYPE })
      await navigator.clipboard.write([
        new ClipboardItem({
          [DOC_TYPE]: file,
          'text/plain': new Blob([instruction], { type: 'text/plain' }),
        }),
      ])
      clipboard = true
    }
  } catch {
    clipboard = false
  }
  if (!isAppleDevice()) {
    return `Downloaded ${filename}. This device can't open Apple Shortcuts, so move that file into ${path}.`
  }
  const url = `shortcuts://run-shortcut?name=${encodeURIComponent('Save Client Doc')}&input=text&text=${encodeURIComponent(instruction)}`
  if (url.length <= URL_LIMIT) window.location.href = url
  if (isAppleMobile()) {
    return `Downloaded ${filename} and opened “Save Client Doc”. On iPhone the shortcut uses the newest download and saves it to ${path}.`
  }
  return clipboard
    ? `Opened “Save Client Doc” with ${filename} on the clipboard. It saves into ${path}. The download is a backup.`
    : `Downloaded ${filename} and opened “Save Client Doc” for ${path}. If the shortcut does not see a file, use the download.`
}

export async function copyAndRunShortcut(name: string, text: string): Promise<string> {
  await navigator.clipboard.writeText(text)
  const url = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=text&text=${encodeURIComponent(text)}`
  if (url.length > URL_LIMIT) {
    return `Copied to the clipboard. The list is too long to pass through the shortcut link, so open “${name}” and paste.`
  }
  window.location.href = url
  return `Copied to the clipboard and opened “${name}”. On a Mac or iPhone with that shortcut installed, it receives the text. Elsewhere, paste from the clipboard.`
}
