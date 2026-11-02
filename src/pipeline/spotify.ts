import type { ListedSong } from './songs'

const CLIENT_KEY = 'anders-pipeline-spotify-client'
const TOKEN_KEY = 'anders-pipeline-spotify-token'
const VERIFIER_KEY = 'anders-pipeline-spotify-verifier'

export function storedSpotifyClientId(): string {
  return localStorage.getItem(CLIENT_KEY) ?? ''
}

export function saveSpotifyClientId(clientId: string) {
  localStorage.setItem(CLIENT_KEY, clientId.trim())
}

export function pipelineRedirectUri(): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  if (url.pathname.endsWith('/index.html')) url.pathname = url.pathname.slice(0, -'index.html'.length)
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url.toString()
}

function randomVerifier(): string {
  const bytes = new Uint8Array(48)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let text = ''
  for (const byte of view) text += String.fromCharCode(byte)
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(digest)
}

export function beginSpotifyLogin(clientId: string) {
  const verifier = randomVerifier()
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  saveSpotifyClientId(clientId)
  void challenge(verifier).then((codeChallenge) => {
    const url = new URL('https://accounts.spotify.com/authorize')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', pipelineRedirectUri())
    url.searchParams.set('code_challenge_method', 'S256')
    url.searchParams.set('code_challenge', codeChallenge)
    url.searchParams.set('scope', 'playlist-modify-private')
    window.location.assign(url.toString())
  })
}

interface SpotifyToken {
  access: string
  refresh: string
  expires: number
}

function readToken(): SpotifyToken | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SpotifyToken
    if (!parsed.access || !parsed.expires) return null
    return parsed
  } catch {
    return null
  }
}

function writeToken(token: SpotifyToken) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export function spotifyConnected(): boolean {
  const token = readToken()
  return Boolean(token && token.expires > Date.now() + 30_000)
}

async function refreshToken(clientId: string, refresh: string): Promise<SpotifyToken> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: clientId,
  })
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) throw new Error('Spotify did not refresh the login.')
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error('Spotify did not refresh the login.')
  const token = {
    access: data.access_token,
    refresh: data.refresh_token || refresh,
    expires: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  writeToken(token)
  return token
}

export async function finishSpotifyLogin(code: string): Promise<void> {
  const clientId = storedSpotifyClientId()
  const verifier = sessionStorage.getItem(VERIFIER_KEY) ?? ''
  if (!clientId || !verifier) throw new Error('Spotify login could not be finished. Connect again.')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: pipelineRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  })
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) throw new Error('Spotify rejected the login.')
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error('Spotify rejected the login.')
  writeToken({
    access: data.access_token,
    refresh: data.refresh_token ?? '',
    expires: Date.now() + (data.expires_in ?? 3600) * 1000,
  })
  sessionStorage.removeItem(VERIFIER_KEY)
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  window.history.replaceState({}, '', url.toString())
}

async function accessToken(): Promise<string> {
  const clientId = storedSpotifyClientId()
  const current = readToken()
  if (!current) throw new Error('Connect Spotify first.')
  if (current.expires > Date.now() + 30_000) return current.access
  if (!current.refresh) throw new Error('Connect Spotify again.')
  return (await refreshToken(clientId, current.refresh)).access
}

async function spotify(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = await accessToken()
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) throw new Error('Spotify could not finish that request.')
  if (response.status === 204) return null
  return response.json()
}

async function findTrack(song: ListedSong): Promise<string | null> {
  const query = song.artist ? `track:${song.title} artist:${song.artist}` : song.title
  const data = (await spotify(`/search?type=track&limit=1&q=${encodeURIComponent(query)}`)) as {
    tracks?: { items?: Array<{ uri?: string }> }
  }
  return data.tracks?.items?.[0]?.uri ?? null
}

export async function createSpotifyPlaylist(name: string, songs: ListedSong[]): Promise<{ url: string; missing: string[] }> {
  const me = (await spotify('/me')) as { id?: string }
  if (!me.id) throw new Error('Spotify did not return your account.')
  const playlist = (await spotify(`/users/${me.id}/playlists`, {
    method: 'POST',
    body: JSON.stringify({ name, public: false, description: 'Created from the Anders Hyatt pipeline.' }),
  })) as { id?: string; external_urls?: { spotify?: string } }
  if (!playlist.id) throw new Error('Spotify did not create the playlist.')
  const uris: string[] = []
  const missing: string[] = []
  for (const song of songs) {
    const uri = await findTrack(song)
    if (uri) uris.push(uri)
    else missing.push(song.artist ? `${song.title} - ${song.artist}` : song.title)
  }
  for (let index = 0; index < uris.length; index += 100) {
    await spotify(`/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: uris.slice(index, index + 100) }),
    })
  }
  return { url: playlist.external_urls?.spotify || 'https://open.spotify.com/', missing }
}
