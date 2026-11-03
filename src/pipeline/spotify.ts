import type { ListedSong } from './songs'

/** Public Spotify app client ID (PKCE, no secret). Redirect URI is SPOTIFY_REDIRECT_URI. */
export const SPOTIFY_CLIENT_ID = 'c3486538573a4e229a3f43589fb2f793'

/** Registered on the Spotify app. Do not add a query string or drop the trailing slash. */
export const SPOTIFY_REDIRECT_URI = 'https://andershyatt.github.io/anders/pipeline/'

/** Private playlists need the private scope. Spotify also expects the public scope on the current create call. */
const REQUIRED_SCOPES = ['playlist-modify-private', 'playlist-modify-public']
const REAUTH_KEY = 'anders-pipeline-spotify-reauth'

const TOKEN_KEY = 'anders-pipeline-spotify-token'
const VERIFIER_KEY = 'anders-pipeline-spotify-verifier'
const STATE_KEY = 'anders-pipeline-spotify-state'
const PENDING_KEY = 'anders-pipeline-spotify-pending'

export interface PendingPlaylist {
  name: string
  songs: ListedSong[]
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

export function rememberPlaylist(pending: PendingPlaylist) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
}

function readPending(): PendingPlaylist | null {
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingPlaylist
    if (!parsed || typeof parsed.name !== 'string' || !Array.isArray(parsed.songs)) return null
    return parsed
  } catch {
    return null
  }
}

function clearPending() {
  localStorage.removeItem(PENDING_KEY)
}

export async function beginSpotifyLogin(forcePrompt = false): Promise<void> {
  const clientId = SPOTIFY_CLIENT_ID
  const verifier = randomVerifier()
  const state = randomVerifier()
  localStorage.setItem(VERIFIER_KEY, verifier)
  localStorage.setItem(STATE_KEY, state)
  const codeChallenge = await challenge(verifier)
  const url = new URL('https://accounts.spotify.com/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', REQUIRED_SCOPES.join(' '))
  if (forcePrompt || consentPromptNeeded()) url.searchParams.set('show_dialog', 'true')
  window.location.assign(url.toString())
}

interface SpotifyToken {
  access: string
  refresh: string
  expires: number
  scopes: string
}

export class SpotifyApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'SpotifyApiError'
    this.status = status
  }
}

function tokenHasScopes(token: SpotifyToken): boolean {
  const have = new Set(token.scopes.split(/[\s,]+/).filter(Boolean))
  return REQUIRED_SCOPES.every((scope) => have.has(scope))
}

/** A saved login from before both playlist scopes were requested cannot create playlists. */
export function consentPromptNeeded(): boolean {
  const token = readToken()
  return Boolean(token && !tokenHasScopes(token))
}

export function shouldReauthorize(error: unknown): boolean {
  if (!(error instanceof SpotifyApiError)) return false
  if (error.status !== 401 && error.status !== 403) return false
  if (/not registered|developer dashboard/i.test(error.message)) return false
  return sessionStorage.getItem(REAUTH_KEY) !== '1'
}

export function markReauthorize() {
  sessionStorage.setItem(REAUTH_KEY, '1')
}

export function clearReauthorize() {
  sessionStorage.removeItem(REAUTH_KEY)
}

function readToken(): SpotifyToken | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SpotifyToken
    if (!parsed.access || !parsed.expires) return null
    if (typeof parsed.scopes !== 'string') parsed.scopes = ''
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
  return Boolean(token && tokenHasScopes(token) && (token.expires > Date.now() + 30_000 || token.refresh))
}

function spotifyDetail(data: { error?: string | { message?: string; reason?: string }; error_description?: string }): string {
  if (typeof data.error_description === 'string' && data.error_description.trim()) return data.error_description.trim()
  if (typeof data.error === 'string' && data.error.trim()) return data.error.trim()
  const record = data.error
  if (record && typeof record === 'object') {
    if (typeof record.message === 'string' && record.message.trim()) return record.message.trim()
    if (typeof record.reason === 'string' && record.reason.trim()) return record.reason.trim()
  }
  return ''
}

async function readError(response: Response, path: string): Promise<SpotifyApiError> {
  let detail = ''
  try {
    detail = spotifyDetail((await response.json()) as { error?: string | { message?: string; reason?: string }; error_description?: string })
  } catch {
    detail = ''
  }
  const raw = detail || response.statusText || 'no details'
  if (/invalid_client/i.test(raw)) {
    return new SpotifyApiError(
      `Spotify said “${raw}” (HTTP ${response.status}). The redirect URI on the app must be exactly https://andershyatt.github.io/anders/pipeline/.`,
      response.status,
    )
  }
  if (/invalid_grant|code_verifier/i.test(raw)) {
    return new SpotifyApiError(`Spotify said “${raw}”. That login expired. Please try the playlist again.`, response.status)
  }
  if (/not registered|developer dashboard/i.test(raw)) {
    return new SpotifyApiError(
      `Spotify said “${raw}” (HTTP ${response.status} on ${path}). In the Spotify dashboard, open this app, then User Management, and add the Spotify account that is signing in.`,
      response.status,
    )
  }
  return new SpotifyApiError(`Spotify said “${raw}” (HTTP ${response.status} on ${path}).`, response.status)
}

async function refreshToken(clientId: string, refresh: string, scopes: string): Promise<SpotifyToken> {
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
  if (!response.ok) throw await readError(response, 'POST /api/token')
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string }
  if (!data.access_token) throw new Error('Spotify could not refresh the login.')
  const token = {
    access: data.access_token,
    refresh: data.refresh_token || refresh,
    expires: Date.now() + (data.expires_in ?? 3600) * 1000,
    scopes: data.scope || scopes,
  }
  writeToken(token)
  return token
}

function cleanReturnUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

let finishTask: Promise<PendingPlaylist | null> | null = null

async function exchangeCode(code: string, state: string): Promise<PendingPlaylist | null> {
  const expected = localStorage.getItem(STATE_KEY) ?? ''
  if (!state || state !== expected) {
    clearPending()
    throw new Error('Spotify sent back a login this page did not start. Please try the playlist again.')
  }
  const clientId = SPOTIFY_CLIENT_ID
  const verifier = localStorage.getItem(VERIFIER_KEY) ?? ''
  if (!verifier) {
    throw new Error('Spotify login could not be finished. Please try the playlist again.')
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id: clientId,
    code_verifier: verifier,
  })
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) throw await readError(response, 'POST /api/token')
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string }
  if (!data.access_token) throw new Error('Spotify rejected the login.')
  writeToken({
    access: data.access_token,
    refresh: data.refresh_token ?? '',
    expires: Date.now() + (data.expires_in ?? 3600) * 1000,
    scopes: data.scope || REQUIRED_SCOPES.join(' '),
  })
  localStorage.removeItem(VERIFIER_KEY)
  localStorage.removeItem(STATE_KEY)
  const pending = readPending()
  clearPending()
  cleanReturnUrl()
  return pending
}

/** Completes PKCE and returns the playlist that was waiting, if any. */
export function finishSpotifyLogin(code: string, state: string): Promise<PendingPlaylist | null> {
  if (!finishTask) finishTask = exchangeCode(code, state)
  return finishTask
}

export function spotifyReturnError(code: string): string {
  if (code === 'access_denied') return 'Spotify sign-in was cancelled. The playlist was not created.'
  return 'Spotify could not sign in. Please try the playlist again.'
}

async function accessToken(): Promise<string> {
  const clientId = SPOTIFY_CLIENT_ID
  const current = readToken()
  if (!current || !tokenHasScopes(current)) throw new SpotifyApiError('Spotify needs you to sign in again.', 401)
  if (current.expires > Date.now() + 30_000) return current.access
  if (!current.refresh || !clientId) throw new SpotifyApiError('Spotify needs you to sign in again.', 401)
  return (await refreshToken(clientId, current.refresh, current.scopes)).access
}

async function spotify(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = await accessToken()
  const method = init.method ?? 'GET'
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    const error = await readError(response, `${method} ${path}`)
    if (error instanceof SpotifyApiError && (error.status === 401 || error.status === 403)) localStorage.removeItem(TOKEN_KEY)
    throw error
  }
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

export interface SpotifyPlaylistResult {
  name: string
  url: string
  total: number
  missing: string[]
}

export async function createSpotifyPlaylist(name: string, songs: ListedSong[]): Promise<SpotifyPlaylistResult> {
  if (songs.length === 0) throw new Error('That section has no songs to add.')
  const playlist = (await spotify('/me/playlists', {
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
    await spotify(`/playlists/${playlist.id}/items`, {
      method: 'POST',
      body: JSON.stringify({ uris: uris.slice(index, index + 100) }),
    })
  }
  return { name, url: playlist.external_urls?.spotify || 'https://open.spotify.com/', total: songs.length, missing }
}
