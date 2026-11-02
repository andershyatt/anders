import type { Song } from '../types/song'

export interface SongFilters {
  query: string
  genre: string
  decade: string
  pace: string
  tag: string
  sortBy: 'artist' | 'title'
}

export const EMPTY_SONG_FILTERS: SongFilters = {
  query: '',
  genre: '',
  decade: '',
  pace: '',
  tag: '',
  sortBy: 'artist',
}

function uniqueSorted(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b))
}

/** Same search, filters, and sort as the Build Playlist page. */
export function filterSongs(songs: Song[], filters: SongFilters): Song[] {
  const query = filters.query.trim().toLowerCase()
  const list = songs.filter((song) => {
    if (query && !`${song.title} ${song.artist}`.toLowerCase().includes(query)) return false
    if (filters.genre && !(song.genres ?? []).includes(filters.genre) && song.genre !== filters.genre) return false
    if (filters.decade && song.decade !== filters.decade) return false
    if (filters.pace && song.pace !== filters.pace) return false
    if (filters.tag && !(song.tags ?? []).includes(filters.tag)) return false
    return true
  })
  return [...list].sort((a, b) => {
    if (filters.sortBy === 'title') {
      const byTitle = a.title.localeCompare(b.title)
      return byTitle || a.artist.localeCompare(b.artist)
    }
    const byArtist = a.artist.localeCompare(b.artist)
    return byArtist || a.title.localeCompare(b.title)
  })
}

export function songFilterChoices(songs: Song[]) {
  return {
    genres: uniqueSorted(songs.flatMap((song) => song.genres ?? (song.genre ? [song.genre] : []))),
    decades: uniqueSorted(songs.map((song) => song.decade)),
    paces: uniqueSorted(songs.map((song) => song.pace)),
    tags: uniqueSorted(songs.flatMap((song) => song.tags ?? [])),
  }
}
