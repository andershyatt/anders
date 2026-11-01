export interface CocktailSong {
  title: string
  artist: string
  artwork: string
  mustPlay: boolean
  note: string
}

export const MAX_COCKTAIL_SONGS = 30
export const MAX_COCKTAIL_MUST_PLAYS = 10

export function parseCocktailSongs(raw: string): CocktailSong[] {
  if (!raw.trim()) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const songs: CocktailSong[] = []
    for (const item of data) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title.trim() : ''
      if (!title) continue
      songs.push({
        title,
        artist: typeof record.artist === 'string' ? record.artist.trim() : '',
        artwork: typeof record.artwork === 'string' ? record.artwork : '',
        mustPlay: record.mustPlay === true,
        note: typeof record.note === 'string' ? record.note : '',
      })
      if (songs.length === MAX_COCKTAIL_SONGS) break
    }
    return songs
  } catch {
    return []
  }
}

export function serializeCocktailSongs(songs: CocktailSong[]): string {
  if (songs.length === 0) return ''
  return JSON.stringify(
    songs.map((song) => ({
      title: song.title,
      artist: song.artist,
      artwork: song.artwork,
      mustPlay: song.mustPlay,
      note: song.note,
    })),
  )
}

export function typedCocktailSong(query: string): CocktailSong | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  const parts = trimmed.split(' – ')
  const title = parts[0]?.trim() ?? ''
  if (!title) return null
  return {
    title,
    artist: parts.slice(1).join(' – ').trim(),
    artwork: '',
    mustPlay: false,
    note: '',
  }
}
