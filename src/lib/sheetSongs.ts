import type { Pace, Song } from '../types/song'

const SHEET_ID = '1vCEMBf_JghO5LQ4zZr5Z1yUsxJGwxqMq-KeEDOPdyT8'

/** Direct CSV. The export URL redirects; gviz returns the sheet with CORS for GitHub Pages. */
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`

/** Sheet genre columns, in order. HipHop is labeled Hip Hop so it matches the old filter name. */
const GENRE_COLS: [header: string, label: string][] = [
  ['Folk', 'Folk'],
  ['Pop', 'Pop'],
  ['Country', 'Country'],
  ['Rock', 'Rock'],
  ['Indie', 'Indie'],
  ['Alternative', 'Alternative'],
  ['Reggae', 'Reggae'],
  ['Soul', 'Soul'],
  ['Funk', 'Funk'],
  ['Punk', 'Punk'],
  ['R&B', 'R&B'],
  ['Blues', 'Blues'],
  ['Jazz', 'Jazz'],
  ['HipHop', 'Hip Hop'],
  ['Classical', 'Classical'],
]

/** Flag columns that still feed the tag filter, using the names the old list used. */
const TAG_COLS: [header: string, label: string][] = [
  ['Angella', 'Duo - Angella'],
  ['Ben', 'Duo - Ben'],
  ['Trio', 'Trio'],
  ['Favorites', 'Favorites'],
  ['singalong', 'Sing-Along'],
  ['lovesong', 'Love Song'],
  ['instrumental', 'Instrumental'],
  ['processional', 'Processional Ideas'],
  ['recessional', 'Recessional Ideas'],
  ['firstdance', 'First Dance'],
  ['father', 'Father/Daughter'],
  ['mother', 'Mother/Son'],
]

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (ch !== '\r') {
      cell += ch
    }
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

function yes(value: string): boolean {
  return value.trim().toLowerCase() === 'yes'
}

function decadeLabel(raw: string, year?: number): string | undefined {
  const value = raw.trim()
  if (/^\d{4}s$/.test(value)) return value
  if (/^\d{4}$/.test(value)) return `${value}s`
  if (year) return `${Math.floor(year / 10) * 10}s`
  return undefined
}

function paceFrom(get: (name: string) => string): Pace | undefined {
  if (yes(get('upbeat'))) return 'Upbeat'
  if (yes(get('medium'))) return 'Medium'
  if (yes(get('slow'))) return 'Slow'
  return undefined
}

export function songsFromSheetCsv(text: string): Song[] {
  const rows = parseCsv(text)
  if (!rows.length) return []
  const headers = rows[0].map((header) => header.trim())
  const headerIndex = new Map(headers.map((header, index) => [header.toLowerCase(), index]))
  const getFrom = (cols: string[]) => (name: string) => {
    const index = headerIndex.get(name.toLowerCase())
    if (index == null) return ''
    return (cols[index] ?? '').trim()
  }

  const songs: Song[] = []
  for (let i = 1; i < rows.length; i++) {
    const get = getFrom(rows[i])
    const title = get('songtitle')
    const artist = get('Artist')
    if (!title || !artist) continue

    const yearNum = Number(get('releaseyear'))
    const year = yearNum >= 1900 && yearNum <= 2100 ? yearNum : undefined
    const genres = GENRE_COLS.filter(([header]) => yes(get(header))).map(([, label]) => label)
    const tags = TAG_COLS.filter(([header]) => yes(get(header))).map(([, label]) => label)
    const pace = paceFrom(get)
    const decade = decadeLabel(get('decade'), year)
    const sheetId = get('id')

    const song: Song = {
      id: sheetId || `sheet-row-${i}`,
      title,
      artist,
    }
    if (genres.length) {
      song.genres = genres
      song.genre = genres[0]
    }
    if (year) song.year = year
    if (decade) song.decade = decade
    if (pace) song.pace = pace
    if (tags.length) song.tags = tags
    songs.push(song)
  }
  return songs
}

export async function fetchSheetSongs(): Promise<Song[]> {
  const response = await fetch(SHEET_CSV_URL)
  if (!response.ok) throw new Error(`Song sheet responded ${response.status}`)
  const songs = songsFromSheetCsv(await response.text())
  if (!songs.length) throw new Error('Song sheet was empty')
  return songs
}
