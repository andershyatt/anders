import { useEffect, useState } from 'react'
import { getSongCatalog } from '../lib/songCatalog'
import type { Song } from '../types/song'

export interface SuggestedSong {
  title: string
  artist: string
}

/** Playlists that stay in suggestions.json. */
type SavedSuggestionListId =
  | 'open-dancing'
  | 'processionals'
  | 'parent-dances'
  | 'cocktail-dinner'
  | 'introductions'

/** Ceremony and special-dance lists filled from the live song sheet. */
export type SheetSuggestionListId =
  | 'sheet-processional'
  | 'sheet-recessional'
  | 'sheet-first-dance'
  | 'sheet-father'
  | 'sheet-mother'
  | 'sheet-parents'

export type SuggestionListId = SavedSuggestionListId | SheetSuggestionListId

const SHEET_SUGGESTIONS: Record<
  SheetSuggestionListId,
  { title: string; tags: string[]; fallback: SavedSuggestionListId }
> = {
  'sheet-processional': { title: 'Processionals', tags: ['Processional Ideas'], fallback: 'processionals' },
  'sheet-recessional': { title: 'Recessionals', tags: ['Recessional Ideas'], fallback: 'processionals' },
  'sheet-first-dance': { title: 'First dances', tags: ['First Dance'], fallback: 'parent-dances' },
  'sheet-father': { title: 'Father/daughter dances', tags: ['Father/Daughter'], fallback: 'parent-dances' },
  'sheet-mother': { title: 'Mother/son dances', tags: ['Mother/Son'], fallback: 'parent-dances' },
  'sheet-parents': {
    title: 'Parent dances',
    tags: ['Father/Daughter', 'Mother/Son'],
    fallback: 'parent-dances',
  },
}

let lists: Record<SavedSuggestionListId, SuggestedSong[]> | null = null
let loading: Promise<void> | null = null

/** Load the playlist file the first time a song section needs it. */
export function ensureSuggestions(): Promise<void> {
  if (lists) return Promise.resolve()
  if (!loading) {
    loading = import('./suggestions.json').then((mod) => {
      lists = mod.default as Record<SavedSuggestionListId, SuggestedSong[]>
    })
  }
  return loading
}

/** Display names. Add a playlist by giving it a title here and a list in suggestions.json. */
export const SUGGESTION_PLAYLIST_TITLES: Record<SavedSuggestionListId, string> = {
  'open-dancing': 'Open dancing',
  processionals: 'Processionals',
  'parent-dances': 'Special dances',
  'cocktail-dinner': 'Cocktail hour and dinner',
  introductions: 'Introductions',
}

export interface SuggestionPlaylist {
  id: SuggestionListId
  title: string
  songs: SuggestedSong[]
}

export function suggestionIds(
  id: SuggestionListId | readonly SuggestionListId[] | undefined,
): SuggestionListId[] {
  if (!id) return []
  if (typeof id === 'string') return [id]
  return [...id]
}

function byArtistThenTitle(a: SuggestedSong, b: SuggestedSong): number {
  const byArtist = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' })
  return byArtist || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
}

/** Songs whose sheet tags include any of `tags`, one row per title and artist. */
export function songsForTags(songs: Song[], tags: readonly string[]): SuggestedSong[] {
  const wanted = new Set(tags)
  const seen = new Set<string>()
  const matches: SuggestedSong[] = []
  for (const song of songs) {
    if (!(song.tags ?? []).some((tag) => wanted.has(tag))) continue
    const title = song.title.trim()
    const artist = song.artist.trim()
    if (!title) continue
    const key = `${title.toLowerCase()}|${artist.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    matches.push({ title, artist })
  }
  return matches.sort(byArtistThenTitle)
}

function isSheetList(id: SuggestionListId): id is SheetSuggestionListId {
  return id in SHEET_SUGGESTIONS
}

function songsForList(listId: SuggestionListId): { title: string; songs: SuggestedSong[] } | null {
  if (isSheetList(listId)) {
    const sheet = SHEET_SUGGESTIONS[listId]
    const catalog = getSongCatalog()
    const live = catalog.status === 'sheet' ? songsForTags(catalog.songs, sheet.tags) : []
    const songs = live.length > 0 ? live : (lists?.[sheet.fallback] ?? [])
    if (songs.length === 0) return null
    return { title: sheet.title, songs }
  }
  const songs = lists?.[listId] ?? []
  if (songs.length === 0) return null
  return { title: SUGGESTION_PLAYLIST_TITLES[listId], songs }
}

export function suggestionPlaylists(
  id: SuggestionListId | readonly SuggestionListId[] | undefined,
): SuggestionPlaylist[] {
  return suggestionIds(id).flatMap((listId) => {
    const playlist = songsForList(listId)
    if (!playlist) return []
    return [{ id: listId, title: playlist.title, songs: playlist.songs }]
  })
}

/** Title for a live-sheet browse list. Saved playlists keep the field label. */
export function suggestionBrowseTitle(
  id: SuggestionListId | readonly SuggestionListId[] | undefined,
): string | undefined {
  const ids = suggestionIds(id)
  if (ids.length !== 1 || !isSheetList(ids[0])) return undefined
  return SHEET_SUGGESTIONS[ids[0]].title
}

export function suggestedSongs(id: SuggestionListId | readonly SuggestionListId[] | undefined): SuggestedSong[] {
  return suggestionPlaylists(id).flatMap((playlist) => playlist.songs)
}

/**
 * Which playlist feeds each song field.
 * Ceremony and special dances prefer the live sheet tag, and fall back to the saved list.
 * Cocktail hour and dinner do not use a suggested list. Open dancing and introductions stay on the saved lists.
 * Gender-neutral parent dances combine the father and mother tags in neutralizeField.
 */
export const SONG_FIELD_SUGGESTIONS: Record<string, SuggestionListId> = {
  'Wedding party processional song': 'sheet-processional',
  'Bridal processional song': 'sheet-processional',
  'Additional processional song': 'sheet-processional',
  'Recessional song': 'sheet-recessional',
  "Couple's first dance song": 'sheet-first-dance',
  'Father/daughter dance song': 'sheet-father',
  'Mother/son dance song': 'sheet-mother',
  'Private last dance': 'sheet-first-dance',
  'Last song of the night with guests': 'open-dancing',
  'Introduction songs': 'introductions',
  'Open dancing songs': 'open-dancing',
}

/** True once the playlist file is available. Loads it only after the planner is open. */
export function useSuggestionLists(enabled: boolean): boolean {
  const [ready, setReady] = useState(lists !== null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    void ensureSuggestions().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [enabled])
  return ready
}
