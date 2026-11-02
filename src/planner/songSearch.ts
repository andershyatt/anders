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

import { PLANNER_API_URL } from './config'

const SEARCH_URL = 'https://itunes.apple.com/search'
const cache = new Map<string, SongMatch[]>()

/**
 * iPhone Safari and Chrome on iOS send an iPhone user agent. Apple answers
 * itunes.apple.com/search with a 301 to musics://… instead of JSON, so the
 * browser never receives song results. iPad and desktop user agents get JSON.
 */
export function iphoneSongSearch(): boolean {
  return /iPhone|iPod/i.test(navigator.userAgent)
}

export function songLabel(title: string, artist: string): string {
  return artist ? `${title} – ${artist}` : title
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function tracksFrom(data: ItunesResponse): SongMatch[] {
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

function searchUrl(query: string, callback?: string): string {
  const url = new URL(SEARCH_URL)
  url.searchParams.set('term', query)
  url.searchParams.set('media', 'music')
  url.searchParams.set('entity', 'song')
  url.searchParams.set('limit', '8')
  if (callback) url.searchParams.set('callback', callback)
  return url.toString()
}

async function searchByFetch(query: string, signal: AbortSignal): Promise<SongMatch[]> {
  const response = await fetch(searchUrl(query), { signal })
  if (!response.ok) throw new Error(`song search ${response.status}`)
  return tracksFrom((await response.json()) as ItunesResponse)
}

/** iOS sometimes drops the CORS fetch. The same endpoint accepts a callback. */
function searchByJsonp(query: string, signal: AbortSignal): Promise<SongMatch[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const callback = `andersSongSearch${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`
    const script = document.createElement('script')
    const scope = window as unknown as Record<string, ((data: ItunesResponse) => void) | undefined>
    let settled = false
    const cleanup = () => {
      settled = true
      window.clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      delete scope[callback]
      script.remove()
    }
    const onAbort = () => {
      if (settled) return
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      if (settled) return
      cleanup()
      reject(new Error('song search timeout'))
    }, 8000)
    scope[callback] = (data) => {
      if (settled) return
      cleanup()
      resolve(tracksFrom(data))
    }
    script.onerror = () => {
      if (settled) return
      cleanup()
      reject(new Error('song search failed'))
    }
    signal.addEventListener('abort', onAbort)
    script.src = searchUrl(query, callback)
    document.head.appendChild(script)
  })
}

function matchesFromProxy(value: unknown): SongMatch[] {
  if (!value || typeof value !== 'object') return []
  const songs = (value as { songs?: unknown }).songs
  if (!Array.isArray(songs)) return []
  const matches: SongMatch[] = []
  for (const item of songs) {
    if (!item || typeof item !== 'object') continue
    const record = item as { id?: unknown; title?: unknown; artist?: unknown; artwork?: unknown }
    const title = typeof record.title === 'string' ? record.title.trim() : ''
    if (!title) continue
    const artist = typeof record.artist === 'string' ? record.artist.trim() : ''
    matches.push({
      id: typeof record.id === 'string' && record.id ? record.id : songLabel(title, artist),
      title,
      artist,
      artwork: typeof record.artwork === 'string' ? record.artwork : '',
      label: songLabel(title, artist),
    })
  }
  return matches
}

/** Apps Script fetches iTunes with a desktop user agent, so iPhone gets real JSON. */
async function searchByProxy(query: string, signal: AbortSignal): Promise<SongMatch[]> {
  const response = await fetch(PLANNER_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'searchSongs', q: query }),
    signal,
  })
  const text = (await response.text()).trim()
  if (!text.startsWith('{')) throw new Error('song search proxy')
  const data = JSON.parse(text) as { ok?: boolean }
  if (!data.ok) throw new Error('song search proxy')
  return matchesFromProxy(data)
}

export async function searchSongs(query: string, signal: AbortSignal): Promise<SongMatch[]> {
  const key = query.trim().toLowerCase()
  const hit = cache.get(key)
  if (hit) return hit
  const store = (matches: SongMatch[]) => {
    cache.set(key, matches)
    return matches
  }
  if (iphoneSongSearch()) return store(await searchByProxy(query, signal))
  try {
    return store(await searchByFetch(query, signal))
  } catch (error) {
    if (isAbort(error)) throw error
    try {
      return store(await searchByJsonp(query, signal))
    } catch (jsonpError) {
      if (isAbort(jsonpError)) throw jsonpError
      return store(await searchByProxy(query, signal))
    }
  }
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
