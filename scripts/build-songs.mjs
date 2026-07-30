/**
 * Build src/data/songs.json from the master song CSV.
 * Run: node scripts/build-songs.mjs
 *
 * Looks for the newest *.csv under songscsv/ (or data/songs.csv).
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outPath = join(root, 'src', 'data', 'songs.json')

const GENRE_COLS = [
  'Folk',
  'Pop',
  'Country',
  'Rock',
  'Indie',
  'Alternative',
  'Reggae',
  'Soul',
  'Funk',
  'Punk',
  'Acoustic',
  'R&B',
  'Children',
  'Blues',
  'Jazz',
  'Dance',
  'International',
  'Rap',
  'Religious',
  'Vocal',
  'Hip Hop',
  'Singer-Songwriter',
  'Bluegrass',
  'Jam',
  'Classical',
]

const TAG_COLS = [
  'Favorites',
  'Sing-Along',
  'Love Song',
  'Processional Ideas',
  'Recessional Ideas',
  'First Dance',
  'Father/Daughter',
  'Mother/Son',
  'Angella',
]

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
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
    } else if (ch === '\r') {
      // skip
    } else {
      cell += ch
    }
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

function yes(v) {
  return String(v || '')
    .trim()
    .toLowerCase() === 'yes'
}

function slugId(title, artist, index) {
  const base = `${title}-${artist}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `${base || 'song'}-${index}`
}

function decadeFromYear(year) {
  if (!year || Number.isNaN(year)) return undefined
  const d = Math.floor(year / 10) * 10
  return `${d}s`
}

function parseYear(releaseDate) {
  if (!releaseDate) return undefined
  const m = String(releaseDate).match(/(\d{4})/)
  if (!m) return undefined
  const y = Number(m[1])
  return y >= 1900 && y <= 2100 ? y : undefined
}

function paceFromRow(get) {
  if (yes(get('Pace: Upbeat'))) return 'Upbeat'
  if (yes(get('Pace: Medium'))) return 'Medium'
  if (yes(get('Pace: Slow'))) return 'Slow'
  return undefined
}

async function findCsv() {
  const preferred = join(root, 'data', 'songs.csv')
  try {
    await readFile(preferred)
    return preferred
  } catch {
    // fall through
  }
  const dir = join(root, 'songscsv')
  const files = (await readdir(dir))
    .filter((f) => extname(f).toLowerCase() === '.csv')
    .sort()
  if (!files.length) throw new Error('No CSV found in songscsv/ or data/songs.csv')
  return join(dir, files[files.length - 1])
}

const csvPath = await findCsv()
console.log('Reading', csvPath)
const text = await readFile(csvPath, 'utf8')
const rows = parseCsv(text.replace(/^\uFEFF/, ''))
const headers = rows[0].map((h) => h.trim())
const headerIndex = Object.fromEntries(headers.map((h, i) => [h, i]))

// Normalize header keys that may have leading spaces (e.g. " Reggae")
for (const h of [...headers]) {
  const trimmed = h.trim()
  if (trimmed !== h && headerIndex[trimmed] == null) {
    headerIndex[trimmed] = headerIndex[h]
  }
}

const songs = []
for (let i = 1; i < rows.length; i++) {
  const cols = rows[i]
  const get = (name) => {
    const idx = headerIndex[name] ?? headerIndex[name.trim()]
    if (idx == null) return ''
    return (cols[idx] ?? '').trim()
  }

  const title = get('Song Title')
  const artist = get('Artist')
  if (!title || !artist) continue

  const year = parseYear(get('Release Date'))
  const genres = GENRE_COLS.filter((g) => yes(get(g)))
  const tags = TAG_COLS.filter((t) => yes(get(t))).map((t) =>
    t === 'Angella' ? 'Duo - Angella' : t,
  )
  const pace = paceFromRow(get)
  const link = get('Link')

  const song = {
    id: slugId(title, artist, i),
    title,
    artist,
  }
  if (genres.length) song.genres = genres
  if (genres[0]) song.genre = genres[0]
  if (year) song.year = year
  const decade = decadeFromYear(year)
  if (decade) song.decade = decade
  if (pace) song.pace = pace
  if (tags.length) song.tags = tags
  if (link && link.toLowerCase() !== 'lyrics') song.link = link

  songs.push(song)
}

await mkdir(dirname(outPath), { recursive: true })
await writeFile(outPath, JSON.stringify(songs, null, 2) + '\n')
console.log(`Wrote ${songs.length} songs to ${outPath}`)
