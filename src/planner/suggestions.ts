import suggestions from './suggestions.json'

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

const LISTS = suggestions as Record<SuggestionListId, SuggestedSong[]>

export function suggestedSongs(id: SuggestionListId | undefined): SuggestedSong[] {
  if (!id) return []
  return LISTS[id] ?? []
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
