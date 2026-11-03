import { useEffect, useState } from 'react'

export interface SuggestedSong {
  title: string
  artist: string
}

export type SuggestionListId =
  | 'open-dancing'
  | 'processionals'
  | 'parent-dances'
  | 'cocktail-dinner'
  | 'introductions'

let lists: Record<SuggestionListId, SuggestedSong[]> | null = null
let loading: Promise<void> | null = null

/** Load the playlist file the first time a song section needs it. */
export function ensureSuggestions(): Promise<void> {
  if (lists) return Promise.resolve()
  if (!loading) {
    loading = import('./suggestions.json').then((mod) => {
      lists = mod.default as Record<SuggestionListId, SuggestedSong[]>
    })
  }
  return loading
}

/** Display names. Add a playlist by giving it a title here and a list in suggestions.json. */
export const SUGGESTION_PLAYLIST_TITLES: Record<SuggestionListId, string> = {
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

export function suggestionPlaylists(
  id: SuggestionListId | readonly SuggestionListId[] | undefined,
): SuggestionPlaylist[] {
  return suggestionIds(id).flatMap((listId) => {
    const songs = lists?.[listId] ?? []
    if (songs.length === 0) return []
    return [{ id: listId, title: SUGGESTION_PLAYLIST_TITLES[listId], songs }]
  })
}

export function suggestedSongs(id: SuggestionListId | readonly SuggestionListId[] | undefined): SuggestedSong[] {
  return suggestionPlaylists(id).flatMap((playlist) => playlist.songs)
}

/**
 * Which saved playlist feeds each song field.
 * Ceremony songs without their own playlist use the processional list.
 * First dance, parent dances, and the private last dance use the parent-dance list.
 * The last song of the night uses the open-dancing list.
 */
export const SONG_FIELD_SUGGESTIONS: Record<string, SuggestionListId> = {
  'Wedding party processional song': 'processionals',
  'Bridal processional song': 'processionals',
  'Recessional song': 'processionals',
  "Couple's first dance song": 'parent-dances',
  'Father/daughter dance song': 'parent-dances',
  'Mother/son dance song': 'parent-dances',
  'Private last dance': 'parent-dances',
  'Last song of the night with guests': 'open-dancing',
  'Introduction songs': 'introductions',
  'Cocktail hour songs': 'cocktail-dinner',
  'Dinner songs': 'cocktail-dinner',
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
