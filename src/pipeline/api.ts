import { PLANNER_API_URL } from '../planner/config'
import { thumbnailDataUrl } from './thumbs'
import { stageOf, type BookingStage, type PipelineCouple, type PipelineDetail } from './types'

const KEY_STORAGE = 'anders-pipeline-admin-key'

function readCookie(): string {
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === KEY_STORAGE) return decodeURIComponent(rest.join('='))
  }
  return ''
}

function writeCookie(key: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${KEY_STORAGE}=${encodeURIComponent(key)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
}

function clearCookie() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${KEY_STORAGE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`
}

/** localStorage is the source of truth. A cookie restores it if a home-screen webview drops storage. */
export function storedAdminKey(): string {
  try {
    const saved = localStorage.getItem(KEY_STORAGE) ?? ''
    if (saved) return saved
    const fromCookie = readCookie()
    if (fromCookie) {
      localStorage.setItem(KEY_STORAGE, fromCookie)
      return fromCookie
    }
  } catch {
    return readCookie()
  }
  return ''
}

export function saveAdminKey(key: string) {
  try {
    localStorage.setItem(KEY_STORAGE, key)
  } catch {
    // The cookie below still keeps the passphrase for the next launch.
  }
  writeCookie(key)
  void navigator.storage?.persist?.()
}

export function clearAdminKey() {
  try {
    localStorage.removeItem(KEY_STORAGE)
  } catch {
    // Ignore a blocked storage API and still clear the cookie.
  }
  clearCookie()
}

export function plannerLink(token: string, fromPipeline = false): string {
  const url = new URL(window.location.href)
  url.hash = ''
  url.pathname = url.pathname.replace(/pipeline\/?(index\.html)?$/, 'planner/')
  const params = new URLSearchParams()
  params.set('c', token)
  if (fromPipeline) params.set('from', 'pipeline')
  url.search = `?${params.toString()}`
  return url.toString()
}

async function postAdmin(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(PLANNER_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  const text = (await response.text()).trim()
  if (!text.startsWith('{')) throw new Error('The planner service did not answer.')
  const data = JSON.parse(text) as Record<string, unknown>
  if (data.ok === false) {
    const error = typeof data.error === 'string' ? data.error : 'server_error'
    throw new Error(error)
  }
  return data
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function servicesOf(value: unknown): PipelineCouple['services'] {
  const record = asRecord(value)
  return {
    live: record?.live === true,
    dj: record?.dj === true,
    photobooth: record?.photobooth === true,
  }
}

function coupleOf(value: unknown): PipelineCouple | null {
  const record = asRecord(value)
  if (!record || typeof record.token !== 'string' || !record.token) return null
  return {
    token: record.token,
    names: text(record.names),
    date: text(record.date),
    venue: text(record.venue),
    venueAddress: text(record.venueAddress),
    eventType: text(record.eventType),
    startTime: text(record.startTime),
    length: text(record.length),
    guestCount: text(record.guestCount),
    services: servicesOf(record.services),
    team: text(record.team),
    bookingStatus: text(record.bookingStatus),
    genderNeutral: record.genderNeutral === true,
    knownVenue: record.knownVenue !== false,
    photo: text(record.photo),
    fields: fieldsOf(record.fields),
    lastUpdated: text(record.lastUpdated),
    updatedBy: record.updatedBy === 'Anders' || record.updatedBy === 'couple' ? record.updatedBy : '',
  }
}

function fieldsOf(value: unknown): Record<string, string> | undefined {
  if (value == null) return undefined
  const record = asRecord(value)
  if (!record) return undefined
  const fields: Record<string, string> = {}
  for (const [name, item] of Object.entries(record)) {
    if (typeof item === 'string') fields[name] = item
  }
  return fields
}

export async function adminList(key: string): Promise<PipelineCouple[]> {
  const data = await postAdmin({ action: 'adminList', key })
  const couples = Array.isArray(data.couples) ? data.couples : []
  const parsed = couples.flatMap((item) => {
    const couple = coupleOf(item)
    return couple ? [couple] : []
  })
  return Promise.all(
    parsed.map(async (couple) => ({ ...couple, photo: await thumbnailDataUrl(couple.photo) })),
  )
}

export async function adminCouple(key: string, token: string): Promise<PipelineDetail> {
  const data = await postAdmin({ action: 'adminCouple', key, token })
  const couple = coupleOf(data.couple)
  if (!couple) throw new Error('missing_couple')
  const fields: Record<string, string> = {}
  const raw = asRecord(data.fields) ?? {}
  for (const [name, value] of Object.entries(raw)) {
    if (typeof value === 'string') fields[name] = value
  }
  return { ...couple, fields }
}

export interface NewCoupleInput {
  names: string
  date: string
  venue: string
  venueAddress: string
  eventType: string
  startTime: string
  length: string
  guestCount: string
  team: string
  bookingStatus: BookingStage
  live: boolean
  dj: boolean
  photobooth: boolean
  knownVenue: boolean
  genderNeutral: boolean
}

export async function adminAddCouple(key: string, couple: NewCoupleInput): Promise<{ token: string; link: string }> {
  const data = await postAdmin({ action: 'adminAddCouple', key, couple })
  const token = text(data.token)
  const link = text(data.link) || (token ? plannerLink(token) : '')
  if (!token) throw new Error('missing_token')
  return { token, link }
}

export async function adminSetStatus(
  key: string,
  token: string,
  patch: {
    bookingStatus?: BookingStage
    team?: string
    services?: { live?: boolean; dj?: boolean; photobooth?: boolean }
    date?: string
    venue?: string
    venueAddress?: string
    guestCount?: string
  },
): Promise<void> {
  await postAdmin({ action: 'adminSetStatus', key, token, ...patch })
}

export async function adminDeleteCouple(key: string, token: string): Promise<void> {
  await postAdmin({ action: 'adminDeleteCouple', key, token })
}

export function sortCouples(couples: PipelineCouple[]): PipelineCouple[] {
  return couples.slice().sort((left, right) => {
    if (!left.date && !right.date) return left.names.localeCompare(right.names)
    if (!left.date) return 1
    if (!right.date) return -1
    return left.date.localeCompare(right.date) || left.names.localeCompare(right.names)
  })
}

export function matchesStages(couple: PipelineCouple, stages: ReadonlySet<BookingStage>): boolean {
  return stages.has(stageOf(couple.bookingStatus))
}
