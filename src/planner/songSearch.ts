export interface SongMatch {
  id: string
  title: string
  artist: string
  artwork: string
  /** What gets written into the field. */
  label: string
}

interface ItunesTrack {
  trackId?: number
  trackName?: string
  artistName?: string
  artworkUrl60?: string
}

interface ItunesResponse {
  results?: ItunesTrack[]
}

const SEARCH_URL = 'https://itunes.apple.com/search'

export function songLabel(title: string, artist: string): string {
  return artist ? `${title} – ${artist}` : title
}

export async function searchSongs(query: string, signal: AbortSignal): Promise<SongMatch[]> {
  const url = new URL(SEARCH_URL)
  url.searchParams.set('term', query)
  url.searchParams.set('media', 'music')
  url.searchParams.set('entity', 'song')
  url.searchParams.set('limit', '8')

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`song search ${response.status}`)
  const data = (await response.json()) as ItunesResponse
  const matches: SongMatch[] = []
  for (const track of data.results ?? []) {
    const title = track.trackName?.trim()
    if (!title || track.trackId == null) continue
    const artist = track.artistName?.trim() ?? ''
    matches.push({
      id: String(track.trackId),
      title,
      artist,
      artwork: track.artworkUrl60 ?? '',
      label: songLabel(title, artist),
    })
  }
  return matches
}

/** Ranges of songs on one line. Artist names may contain commas. */
function lineEntries(line: string): { start: number; end: number }[] {
  if (!line.includes(',')) return [{ start: 0, end: line.length }]
  if (!line.includes(' – ')) {
    const entries: { start: number; end: number }[] = []
    let start = 0
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ',') continue
      entries.push({ start, end: i })
      start = i + 1
    }
    entries.push({ start, end: line.length })
    return entries
  }

  const entries: { start: number; end: number }[] = []
  let start = 0
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== ',') continue
    const rest = line.slice(i + 1)
    const nextComma = rest.indexOf(',')
    const window = nextComma === -1 ? rest : rest.slice(0, nextComma)
    if (!window.includes(' – ')) continue
    entries.push({ start, end: i })
    start = i + 1
  }
  entries.push({ start, end: line.length })
  return entries
}

/** The line, or comma-separated entry, the caret is editing. */
export function songSegment(value: string, caret: number): { start: number; end: number; query: string } {
  const safeCaret = Math.max(0, Math.min(caret, value.length))
  const lineStart = value.lastIndexOf('\n', safeCaret - 1) + 1
  const nextBreak = value.indexOf('\n', safeCaret)
  const lineEnd = nextBreak === -1 ? value.length : nextBreak
  const line = value.slice(lineStart, lineEnd)
  const caretInLine = safeCaret - lineStart
  const entries = lineEntries(line)
  const entry =
    entries.find((item) => caretInLine >= item.start && caretInLine <= item.end) ??
    entries[entries.length - 1]
  return {
    start: lineStart + entry.start,
    end: lineStart + entry.end,
    query: line.slice(entry.start, entry.end).trim(),
  }
}

/** Replace the current line or comma entry. Other lines stay put. */
export function replaceSongSegment(
  value: string,
  start: number,
  end: number,
  label: string,
): { value: string; caret: number } {
  let before = value.slice(0, start).replace(/[ \t]+$/, '')
  let after = value.slice(end).replace(/^[ \t]+/, '')
  if (before.endsWith(',')) before += ' '
  else if (before.length > 0 && !before.endsWith('\n')) before += ' '
  if (after.startsWith(',') && !after.startsWith(', ')) after = `, ${after.slice(1).trimStart()}`
  else if (after.length > 0 && !after.startsWith('\n') && !after.startsWith(',')) after = ` ${after}`
  return { value: `${before}${label}${after}`, caret: before.length + label.length }
}
