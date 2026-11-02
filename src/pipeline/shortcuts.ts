const URL_LIMIT = 7000

export async function copyAndRunShortcut(name: string, text: string): Promise<string> {
  await navigator.clipboard.writeText(text)
  const url = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=text&text=${encodeURIComponent(text)}`
  if (url.length > URL_LIMIT) {
    return `Copied to the clipboard. The list is too long to pass through the shortcut link, so open “${name}” and paste.`
  }
  window.location.href = url
  return `Copied to the clipboard and opened “${name}”. On a Mac or iPhone with that shortcut installed, it receives the text. Elsewhere, paste from the clipboard.`
}
