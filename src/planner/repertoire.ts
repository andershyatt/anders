import { getSongCatalog } from '../lib/songCatalog'
import type { SongMatch } from './songSearch'

function songs() {
  return getSongCatalog().songs
}

export function repertoireCatalog() {
  return songs()
}

export function repertoireMatch(query: string, limit = 8): SongMatch[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  const matches: SongMatch[] = []
  for (const song of songs()) {
    if (!`${song.title} ${song.artist}`.toLowerCase().includes(needle)) continue
    const label = song.artist ? `${song.title} – ${song.artist}` : song.title
    matches.push({
      id: song.id,
      title: song.title,
      artist: song.artist,
      artwork: '',
      label,
    })
    if (matches.length === limit) break
  }
  return matches
}

export function repertoireChoices(): Array<{ title: string; artist: string }> {
  return songs().map((song) => ({ title: song.title, artist: song.artist }))
}

/** A saved "Title – Artist" value is in the repertoire when both parts match. */
export function songInRepertoire(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  // Don't clear a saved song while the live sheet is still loading.
  if (getSongCatalog().status === 'loading') return true
  const parts = trimmed.split(/\s+[–-]\s+/)
  const title = (parts[0] ?? '').trim().toLowerCase()
  const artist = parts.slice(1).join(' - ').trim().toLowerCase()
  return songs().some((song) => {
    if (song.title.trim().toLowerCase() !== title) return false
    if (!artist) return true
    return song.artist.trim().toLowerCase() === artist
  })
}

export function isLivePerformance(value: string): boolean {
  const text = value.trim().toLowerCase()
  if (!text || text.startsWith('dj')) return false
  return text.startsWith('live')
}

export function isLiveOrMixture(value: string): boolean {
  const text = value.trim().toLowerCase()
  if (!text || text.startsWith('dj')) return false
  return text.startsWith('live') || text.includes('mixture')
}

export const LIVE_SONG_CONTROLS: Record<string, string> = {
  'Wedding party processional style (instrumental/vocals)': 'Wedding party processional song',
  'Bridal processional style': 'Bridal processional song',
  'Additional processional style': 'Additional processional song',
  'Recessional style': 'Recessional song',
  'First dance format (live/DJ, full/shortened)': "Couple's first dance song",
  'Father/daughter format': 'Father/daughter dance song',
  'Mother/son format': 'Mother/son dance song',
}

export const SONG_LIVE_CONTROL: Record<string, string> = Object.fromEntries(
  Object.entries(LIVE_SONG_CONTROLS).map(([control, song]) => [song, control]),
)

/** User-facing copy for switching a song to the live repertoire. Keep these strings together. */
export const LIVE_SONG_PICKER_TITLE = 'Did you mean one of these from the live repertoire?'
export const LIVE_SONG_REMOVE = 'Remove song'
export const LIVE_SONG_REMOVED =
  "Song removed because you switched to a live style and it's not in the live repertoire. Search the list to pick a live song."

export function liveSongSwitched(label: string): string {
  return `Switched to the live version: ${label}`
}

export function repertoireLabel(song: { title: string; artist: string }): string {
  return song.artist ? `${song.artist} - ${song.title}` : song.title
}

export type LiveSongResolution =
  | { kind: 'empty' }
  | { kind: 'loading' }
  | { kind: 'already' }
  | { kind: 'switch'; value: string; note: string }
  | { kind: 'picker'; options: string[] }
  | { kind: 'remove' }

function stripTitleSuffixes(value: string): string {
  return value.replace(/\s*[([].*?\b(?:feat\.?|ft\.?|featuring|live|cover)\b.*?[)\]]/gi, ' ')
}

/** Lowercase, drop punctuation and apostrophes, drop a leading "the", collapse spaces. */
export function normalizeSongTitle(raw: string): string {
  let text = stripTitleSuffixes(raw).toLowerCase()
  text = text.replace(/['’`]/g, '')
  text = text.replace(/[^a-z0-9\s]/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  text = text.replace(/^the\s+/, '')
  return text
}

function damerau(left: string, right: string): number {
  const rows = left.length + 1
  const cols = right.length + 1
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0))
  for (let i = 0; i < rows; i++) grid[i][0] = i
  for (let j = 0; j < cols; j++) grid[0][j] = j
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        grid[i][j] = Math.min(grid[i][j], grid[i - 2][j - 2] + 1)
      }
    }
  }
  return grid[left.length][right.length]
}

function titleRatio(left: string, right: string): number {
  if (!left && !right) return 1
  if (!left || !right) return 0
  if (left === right) return 1
  return 1 - damerau(left, right) / Math.max(left.length, right.length)
}

function tokenClose(left: string, right: string): boolean {
  const leftTokens = left.split(' ').filter(Boolean)
  const rightTokens = right.split(' ').filter(Boolean)
  if (!leftTokens.length || leftTokens.length !== rightTokens.length) return false
  return leftTokens.every((token, index) => {
    const other = rightTokens[index]
    const limit = Math.max(token.length, other.length) >= 8 ? 2 : 1
    return damerau(token, other) <= limit
  })
}

function titleCandidates(value: string): string[] {
  const stripped = stripTitleSuffixes(value).trim()
  const parts = stripped
    .split(/\s+[–—-]\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : [stripped]
}

function sameSavedSong(value: string, song: { title: string; artist: string }): boolean {
  const folded = value.trim().toLowerCase()
  const forms = [repertoireLabel(song), song.artist ? `${song.title} – ${song.artist}` : song.title, song.title]
  return forms.some((form) => form.trim().toLowerCase() === folded)
}

/** Match a typed or Apple Music song to Anders's live repertoire by title. */
export function resolveLiveSong(value: string): LiveSongResolution {
  const trimmed = value.trim()
  if (!trimmed) return { kind: 'empty' }
  if (getSongCatalog().status === 'loading') return { kind: 'loading' }
  const catalog = songs()
  type Ranked = { song: (typeof catalog)[number]; ratio: number; token: boolean; exact: boolean }
  let best: Ranked[] = []
  for (const candidate of titleCandidates(trimmed)) {
    const normalized = normalizeSongTitle(candidate)
    if (!normalized) continue
    const ranked = catalog
      .map((song) => {
        const title = normalizeSongTitle(song.title)
        const ratio = titleRatio(normalized, title)
        return { song, ratio, token: tokenClose(normalized, title), exact: title === normalized }
      })
      .filter((item) => item.exact || item.token || item.ratio >= 0.72)
      .sort((left, right) => right.ratio - left.ratio || left.song.title.localeCompare(right.song.title))
    if ((ranked[0]?.ratio ?? 0) > (best[0]?.ratio ?? 0)) best = ranked
  }
  const exact = best.filter((item) => item.exact)
  const strong = best.filter((item) => item.ratio >= 0.85)
  const tokens = best.filter((item) => item.token)
  const options = (items: Ranked[]) => items.slice(0, 5).map((item) => repertoireLabel(item.song))
  const switched = (song: Ranked['song']): LiveSongResolution => {
    const label = repertoireLabel(song)
    if (sameSavedSong(trimmed, song)) return { kind: 'already' }
    return { kind: 'switch', value: label, note: liveSongSwitched(label) }
  }
  if (exact.length === 1) return switched(exact[0].song)
  if (exact.length > 1) return { kind: 'picker', options: options(exact) }
  if (strong.length === 1 && (best[1]?.ratio ?? 0) < 0.85) return switched(strong[0].song)
  if (tokens.length === 1 && strong.length === 0) return switched(tokens[0].song)
  if (best.length > 0) return { kind: 'picker', options: options(best) }
  return { kind: 'remove' }
}
