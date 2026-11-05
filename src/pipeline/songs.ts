import { usesLiveOnlyTemplate } from '../planner/fields'
import { isLiveOrMixture, isLivePerformance } from '../planner/repertoire'
import type { PipelineDetail } from './types'

export interface ListedSong {
  title: string
  artist: string
  mustPlay: boolean
  note: string
  who: string
}

export interface SongGroup {
  title: string
  lines: string[]
}

export function songLine(song: ListedSong): string {
  const name = song.artist ? `${song.title} - ${song.artist}` : song.title
  const extra = [song.mustPlay ? 'must play' : '', song.who ? `for ${song.who}` : '', song.note].filter(Boolean)
  return extra.length ? `${name} (${extra.join('; ')})` : name
}

export function parseSongList(raw: string): ListedSong[] {
  const trimmed = raw.trim()
  if (!trimmed) return []
  try {
    const data = JSON.parse(trimmed) as unknown
    if (!Array.isArray(data)) return linesToSongs(trimmed)
    const songs: ListedSong[] = []
    for (const item of data) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title.trim() : ''
      if (!title) continue
      songs.push({
        title,
        artist: typeof record.artist === 'string' ? record.artist.trim() : '',
        mustPlay: record.mustPlay === true,
        note: typeof record.note === 'string' ? record.note.trim() : '',
        who: typeof record.who === 'string' ? record.who.trim() : '',
      })
    }
    return songs
  } catch {
    return linesToSongs(trimmed)
  }
}

function linesToSongs(raw: string): ListedSong[] {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+[–-]\s+/)
      return {
        title: (parts[0] ?? line).trim(),
        artist: parts.slice(1).join(' - ').trim(),
        mustPlay: false,
        note: '',
        who: '',
      }
    })
}

export function field(detail: PipelineDetail, key: string): string {
  return (detail.fields[key] ?? '').trim()
}

function group(title: string, songs: ListedSong[]): SongGroup | null {
  if (songs.length === 0) return null
  return { title, lines: songs.map(songLine) }
}

function single(title: string, value: string): SongGroup | null {
  const songs = parseSongList(value)
  if (songs.length === 0 && value.trim()) return { title, lines: [value.trim()] }
  return group(title, songs)
}

/** Live-only couples have no DJ, so every kept song is a live song even when the style says Instrumental or Vocals. */
function treatAsLive(detail: PipelineDetail, value: string): boolean {
  if (usesLiveOnlyTemplate(detail.services)) return true
  return isLivePerformance(value)
}

/** Text the Make Serato Crate shortcut receives, and the clipboard copy. */
export function seratoText(detail: PipelineDetail): string {
  const liveOnly = usesLiveOnlyTemplate(detail.services)
  const groups: Array<SongGroup | null> = []
  const cocktailType = field(detail, 'Cocktail hour music type')
  const dinnerType = field(detail, 'Dinner music type')
  if (!treatAsLive(detail, cocktailType)) groups.push(group('Cocktail hour', parseSongList(field(detail, 'Cocktail hour songs'))))
  if (!treatAsLive(detail, dinnerType)) groups.push(group('Dinner', parseSongList(field(detail, 'Dinner songs'))))
  if (!liveOnly) {
    groups.push(group('Open dancing', parseSongList(field(detail, 'Open dancing songs'))))
    groups.push(group('Slow songs', parseSongList(field(detail, 'Slow dance songs'))))
    groups.push(single('Introductions', field(detail, 'Introduction songs')))
  }
  if (!treatAsLive(detail, field(detail, 'Wedding party processional style (instrumental/vocals)'))) {
    groups.push(single('Wedding party processional', field(detail, 'Wedding party processional song')))
  }
  if (!treatAsLive(detail, field(detail, 'Bridal processional style'))) {
    groups.push(single('Bridal processional', field(detail, 'Bridal processional song')))
  }
  if (!treatAsLive(detail, field(detail, 'Recessional style'))) {
    groups.push(single('Recessional', field(detail, 'Recessional song')))
  }
  if (!treatAsLive(detail, field(detail, 'First dance format (live/DJ, full/shortened)'))) {
    groups.push(single("Couple's first dance", field(detail, "Couple's first dance song")))
  }
  if (!treatAsLive(detail, field(detail, 'Father/daughter format'))) {
    groups.push(single('Father-daughter dance', field(detail, 'Father/daughter dance song')))
  }
  if (!treatAsLive(detail, field(detail, 'Mother/son format'))) {
    groups.push(single('Mother-son dance', field(detail, 'Mother/son dance song')))
  }
  if (!liveOnly) {
    groups.push(single('Last song of the night', field(detail, 'Last song of the night with guests')))
    groups.push(single('Private last dance', field(detail, 'Private last dance')))
  }
  return groups
    .filter((item): item is SongGroup => item !== null && item.lines.length > 0)
    .map((item) => `${item.title.toUpperCase()}\n${item.lines.join('\n')}`)
    .join('\n\n')
}

/** Text the Tag Song Charts shortcut receives. */
export function liveChartText(detail: PipelineDetail): string {
  const groups: Array<SongGroup | null> = []
  if (treatAsLive(detail, field(detail, 'Wedding party processional style (instrumental/vocals)'))) {
    groups.push(single('Wedding party processional', field(detail, 'Wedding party processional song')))
  }
  if (treatAsLive(detail, field(detail, 'Bridal processional style'))) {
    groups.push(single('Bridal processional', field(detail, 'Bridal processional song')))
  }
  if (treatAsLive(detail, field(detail, 'Recessional style'))) {
    groups.push(single('Recessional', field(detail, 'Recessional song')))
  }
  if (treatAsLive(detail, field(detail, 'First dance format (live/DJ, full/shortened)'))) {
    groups.push(single("Couple's first dance", field(detail, "Couple's first dance song")))
  }
  if (treatAsLive(detail, field(detail, 'Father/daughter format'))) {
    groups.push(single('Father-daughter dance', field(detail, 'Father/daughter dance song')))
  }
  if (treatAsLive(detail, field(detail, 'Mother/son format'))) {
    groups.push(single('Mother-son dance', field(detail, 'Mother/son dance song')))
  }
  const cocktailType = field(detail, 'Cocktail hour music type')
  if (treatAsLive(detail, cocktailType) || isLiveOrMixture(cocktailType)) {
    groups.push(group(isLiveOrMixture(cocktailType) && !treatAsLive(detail, cocktailType) ? 'Cocktail hour (mixture)' : 'Cocktail hour', parseSongList(field(detail, 'Cocktail hour songs'))))
  }
  const dinnerType = field(detail, 'Dinner music type')
  if (treatAsLive(detail, dinnerType) || isLiveOrMixture(dinnerType)) {
    groups.push(group(isLiveOrMixture(dinnerType) && !treatAsLive(detail, dinnerType) ? 'Dinner (mixture)' : 'Dinner', parseSongList(field(detail, 'Dinner songs'))))
  }
  return groups
    .filter((item): item is SongGroup => item !== null && item.lines.length > 0)
    .map((item) => `${item.title.toUpperCase()}\n${item.lines.join('\n')}`)
    .join('\n\n')
}

const PLAYLIST_LISTS: Array<{ key: string; label: string }> = [
  { key: 'Cocktail hour songs', label: 'cocktails' },
  { key: 'Dinner songs', label: 'dinner' },
  { key: 'Open dancing songs', label: 'dance' },
  { key: 'Do not play songs', label: "don't play" },
  { key: 'Slow dance songs', label: 'slow songs' },
  { key: 'Introduction songs', label: 'introductions' },
]

/** "Sarah & Mike" becomes "SarahMike cocktails". */
export function couplePlaylistName(names: string, section: string): string {
  const compact = names.replace(/[\s&]+/g, '')
  return `${compact} ${section}`.trim()
}

const LIVE_ONLY_PLAYLIST_SKIP = new Set([
  'Open dancing songs',
  'Do not play songs',
  'Slow dance songs',
  'Introduction songs',
])

export function playlistChoices(detail: PipelineDetail): Array<{ key: string; label: string; songs: ListedSong[] }> {
  const liveOnly = usesLiveOnlyTemplate(detail.services)
  return PLAYLIST_LISTS.flatMap((list) => {
    if (liveOnly && LIVE_ONLY_PLAYLIST_SKIP.has(list.key)) return []
    const songs = parseSongList(field(detail, list.key))
    return songs.length ? [{ ...list, songs }] : []
  })
}

export function groupedText(groups: SongGroup[]): string {
  return groups
    .filter((group) => group.lines.length > 0)
    .map((group) => `${group.title.toUpperCase()}\n${group.lines.join('\n')}`)
    .join('\n\n')
}
