/**
 * Rebuild src/planner/suggestions.json with every track from the suggestion playlists.
 * The Spotify embed page only includes the first 100 tracks, so this pages the
 * partner playlist API until the full list is stored.
 * Run: node scripts/build-suggestions.mjs
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'src', 'planner', 'suggestions.json')

/** Key order matches suggestions.ts. Values are public Spotify playlist ids. */
const PLAYLISTS = [
  ['open-dancing', '3icA1NtCbQ4SWzHPDDdkvZ'],
  ['processionals', '0w0jWmXKwfPjpM0QoADETd'],
  ['parent-dances', '0ksAHmMbedyz10NQeKfuhJ'],
  ['cocktail-dinner', '3zmqaKs2MXAqH9nffkUfay'],
  ['introductions', '6ASFE5RiZQVxysqhwvVAPs'],
]

const HASH = '21ea11a6ac75a5f3e01fd365d29c18e0a4a8b7dc09f89bbb5d73910190c6acaf'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

async function accessToken(playlistId) {
  const res = await fetch(`https://open.spotify.com/embed/playlist/${playlistId}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
  })
  if (!res.ok) throw new Error(`embed ${playlistId} HTTP ${res.status}`)
  const html = await res.text()
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)
  if (!match) throw new Error(`embed ${playlistId} has no playlist data`)
  const data = JSON.parse(match[1])
  const token = data?.props?.pageProps?.state?.settings?.session?.accessToken
  if (!token) throw new Error(`embed ${playlistId} has no access token`)
  return token
}

function trackFrom(item) {
  const data = item?.itemV2?.data
  if (!data) return null
  const title = typeof data.name === 'string' ? data.name.trim() : ''
  if (!title) return null
  const artists = (data.artists?.items ?? [])
    .map((artist) => artist?.profile?.name)
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => name.trim())
  return { title, artist: artists.join(', ') }
}

async function fetchPage(token, playlistId, offset) {
  const res = await fetch('https://api-partner.spotify.com/pathfinder/v1/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: JSON.stringify({
      operationName: 'fetchPlaylistContents',
      variables: { uri: `spotify:playlist:${playlistId}`, offset, limit: 100 },
      extensions: { persistedQuery: { version: 1, sha256Hash: HASH } },
    }),
  })
  if (res.status === 401) return { unauthorized: true }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`playlist ${playlistId} offset ${offset} HTTP ${res.status} ${text.slice(0, 180)}`)
  }
  const json = await res.json()
  const content = json?.data?.playlistV2?.content
  if (!content || !Array.isArray(content.items)) {
    throw new Error(`playlist ${playlistId} offset ${offset} returned no tracks`)
  }
  return content
}

async function fetchPlaylist(playlistId) {
  let token = await accessToken(playlistId)
  const songs = []
  let skipped = 0
  let offset = 0
  let total = Infinity
  while (offset < total) {
    let content = await fetchPage(token, playlistId, offset)
    if (content.unauthorized) {
      token = await accessToken(playlistId)
      content = await fetchPage(token, playlistId, offset)
      if (content.unauthorized) throw new Error(`playlist ${playlistId} rejected the access token`)
    }
    const items = content.items
    total = typeof content.totalCount === 'number' ? content.totalCount : offset + items.length
    if (items.length === 0) break
    for (const item of items) {
      const song = trackFrom(item)
      if (song) songs.push(song)
      else skipped += 1
    }
    const next = offset + items.length
    if (next <= offset) break
    offset = next
    if (offset < total) await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return { songs, total, skipped }
}

const out = {}
for (const [key, id] of PLAYLISTS) {
  const { songs, total, skipped } = await fetchPlaylist(id)
  if (songs.length === 0) throw new Error(`${key} returned no tracks`)
  out[key] = songs
  console.log(`${key}\tstored=${songs.length}\ttotal=${total}\tskipped=${skipped}`)
  await new Promise((resolve) => setTimeout(resolve, 400))
}

await writeFile(outPath, `${JSON.stringify(out, null, 2)}\n`)
console.log(`wrote ${outPath}`)
