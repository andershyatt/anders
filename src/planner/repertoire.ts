import songsData from '../data/songs.json'
import type { Song } from '../types/song'
import type { SongMatch } from './songSearch'

const songs = songsData as Song[]

export function repertoireCatalog(): Song[] {
  return songs
}

export function repertoireMatch(query: string, limit = 8): SongMatch[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  const matches: SongMatch[] = []
  for (const song of songs) {
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
  return songs.map((song) => ({ title: song.title, artist: song.artist }))
}

/** A saved "Title – Artist" value is in the repertoire when both parts match. */
export function songInRepertoire(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  const parts = trimmed.split(/\s+[–-]\s+/)
  const title = (parts[0] ?? '').trim().toLowerCase()
  const artist = parts.slice(1).join(' - ').trim().toLowerCase()
  return songs.some((song) => {
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
  'Recessional style': 'Recessional song',
  'First dance format (live/DJ, full/shortened)': "Couple's first dance song",
  'Father/daughter format': 'Father/daughter dance song',
  'Mother/son format': 'Mother/son dance song',
}

export const SONG_LIVE_CONTROL: Record<string, string> = Object.fromEntries(
  Object.entries(LIVE_SONG_CONTROLS).map(([control, song]) => [song, control]),
)

export const REMOVED_LIVE_SONG = "Song choice removed because it's not in the live repertoire"
