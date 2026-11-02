import { PLANNER_API_URL } from './config'
import { ALL_SERVICES, type BookedServices, type PlannerBasics } from './fields'

export interface CoupleInfo {
  names?: string
  date?: string
  venue?: string
}

export interface PlannerLoadSuccess {
  ok: true
  couple: CoupleInfo
  fields: Record<string, unknown>
  /** Null when an older backend omits `basics`. */
  basics: PlannerBasics | null
  /** Uploaded timeline PDF, when the backend has one. */
  timelinePdf: { name: string; url: string } | null
  services: BookedServices
  /** Inline image for the planner. Null when the couple has not sent one. */
  photo: { dataUrl: string } | null
  /** Reception floor plan. Null when the couple has not sent one. */
  floorPlan: { name: string; url: string } | null
  /** Sheet-only setting. Never render the question itself. */
  genderNeutral: boolean
  lastUpdated?: string | number
}

export interface PlannerFailure {
  ok: false
  error: string
}

export type PlannerLoadResult = PlannerLoadSuccess | PlannerFailure

export interface PlannerSaveSuccess {
  ok: true
  lastUpdated?: string | number
}

export type PlannerSaveResult = PlannerSaveSuccess | PlannerFailure

const LINK_ERRORS = new Set(['invalid_token'])

export function isInvalidLink(error: string | undefined): boolean {
  return error !== undefined && LINK_ERRORS.has(error)
}

async function readJson(response: Response): Promise<unknown | null> {
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function parseServices(value: unknown): BookedServices {
  const record = asRecord(value)
  if (!record) return ALL_SERVICES
  return {
    live: record.live === true,
    dj: record.dj === true,
    photobooth: record.photobooth === true,
    venueQuestions: record.venueQuestions === true,
  }
}

function basicsText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function parseBasics(value: unknown): PlannerBasics | null {
  const record = asRecord(value)
  if (!record) return null
  return {
    names: basicsText(record.names),
    eventType: basicsText(record.eventType),
    date: basicsText(record.date),
    venue: basicsText(record.venue),
    venueAddress: basicsText(record.venueAddress),
    startTime: basicsText(record.startTime),
    length: basicsText(record.length),
    guestCount: basicsText(record.guestCount),
    booked: basicsText(record.booked),
  }
}

function parseNamedFile(value: unknown, fallbackName: string): { name: string; url: string } | null {
  if (value == null) return null
  const record = asRecord(value)
  if (!record) return null
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const url = typeof record.url === 'string' ? record.url.trim() : ''
  if (!name && !url) return null
  return { name: name || fallbackName, url }
}

function parseFloorPlan(value: unknown): { name: string; url: string } | null {
  return parseNamedFile(value, 'Floor plan.pdf')
}

function parsePlannerFile(value: unknown): { name: string; url: string } | null {
  return parseNamedFile(value, 'Timeline.pdf')
}

function parseLoadedPhoto(value: unknown): { dataUrl: string } | null {
  if (value == null) return null
  const record = asRecord(value)
  if (!record) return null
  const dataUrl = typeof record.dataUrl === 'string' ? record.dataUrl.trim() : ''
  return dataUrl ? { dataUrl } : null
}

function parseLoad(value: unknown): PlannerLoadResult | null {
  const record = asRecord(value)
  if (!record || typeof record.ok !== 'boolean') return null
  if (!record.ok) {
    return { ok: false, error: typeof record.error === 'string' ? record.error : 'server_error' }
  }
  const coupleRecord = asRecord(record.couple) ?? {}
  const couple: CoupleInfo = {
    names: typeof coupleRecord.names === 'string' ? coupleRecord.names : '',
    date: typeof coupleRecord.date === 'string' ? coupleRecord.date : '',
    venue: typeof coupleRecord.venue === 'string' ? coupleRecord.venue : '',
  }
  const fields = asRecord(record.fields) ?? {}
  const lastUpdated = record.lastUpdated
  return {
    ok: true,
    couple,
    fields,
    basics: parseBasics(record.basics),
    timelinePdf: parsePlannerFile(record.timelinePdf),
    services: parseServices(record.services),
    photo: parseLoadedPhoto(record.photo),
    floorPlan: parseFloorPlan(record.floorPlan),
    genderNeutral: record.genderNeutral === true,
    lastUpdated:
      typeof lastUpdated === 'string' || typeof lastUpdated === 'number' ? lastUpdated : undefined,
  }
}

function parseSave(value: unknown): PlannerSaveResult | null {
  const record = asRecord(value)
  if (!record || typeof record.ok !== 'boolean') return null
  if (!record.ok) {
    return { ok: false, error: typeof record.error === 'string' ? record.error : 'server_error' }
  }
  const lastUpdated = record.lastUpdated
  return {
    ok: true,
    lastUpdated:
      typeof lastUpdated === 'string' || typeof lastUpdated === 'number' ? lastUpdated : undefined,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Load a couple's planner.
 *
 * The page URL is /planner/?c=TOKEN. script.google.com itself rejects a query
 * parameter named `c` (HTTP 400, and no CORS header), so a GET
 * `?action=load&c=TOKEN` never reaches the script from a browser. The same
 * load is sent as a plain POST { action: 'load', c }, which the web app
 * accepts and which avoids a CORS preflight.
 */
export async function loadPlanner(token: string): Promise<PlannerLoadResult> {
  try {
    const response = await fetch(PLANNER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'load', c: token }),
    })
    const parsed = parseLoad(await readJson(response))
    if (parsed) return parsed
    return { ok: false, error: 'server_error' }
  } catch {
    return { ok: false, error: 'server_error' }
  }
}

export async function savePlanner(
  token: string,
  fields: Record<string, string>,
): Promise<PlannerSaveResult> {
  let last: PlannerSaveResult = { ok: false, error: 'server_error' }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(PLANNER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ c: token, fields }),
      })
      const parsed = parseSave(await readJson(response))
      last = parsed ?? { ok: false, error: 'server_error' }
    } catch {
      last = { ok: false, error: 'server_error' }
    }

    if (last.ok || last.error !== 'busy' || attempt === 2) return last
    await delay(500 * (attempt + 1))
  }

  return last
}

export interface UploadedPhoto {
  url: string
  name: string
  dataUrl: string
}

export type PhotoUploadResult = { ok: true; photo: UploadedPhoto } | PlannerFailure

function parsePhotoUpload(value: unknown): PhotoUploadResult | null {
  const record = asRecord(value)
  if (!record || typeof record.ok !== 'boolean') return null
  if (!record.ok) {
    return { ok: false, error: typeof record.error === 'string' ? record.error : 'server_error' }
  }
  const photo = asRecord(record.photo) ?? {}
  return {
    ok: true,
    photo: {
      url: typeof photo.url === 'string' ? photo.url : '',
      name: typeof photo.name === 'string' ? photo.name : '',
      dataUrl: typeof photo.dataUrl === 'string' ? photo.dataUrl.trim() : '',
    },
  }
}

export async function uploadCouplePhoto(
  token: string,
  file: { filename: string; mimeType: string; data: string },
): Promise<PhotoUploadResult> {
  try {
    const response = await fetch(PLANNER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'uploadPhoto',
        c: token,
        filename: file.filename,
        mimeType: file.mimeType,
        data: file.data,
      }),
    })
    const parsed = parsePhotoUpload(await readJson(response))
    if (parsed) return parsed
    return { ok: false, error: 'server_error' }
  } catch {
    return { ok: false, error: 'server_error' }
  }
}

async function uploadNamedPdf(
  token: string,
  action: 'uploadFloorPlan' | 'uploadTimeline',
  file: { name: string; dataUrl: string },
): Promise<{ ok: true; name: string; url: string } | PlannerFailure> {
  try {
    const response = await fetch(PLANNER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        c: token,
        name: file.name,
        dataUrl: file.dataUrl,
      }),
    })
    const record = asRecord(await readJson(response))
    if (!record || typeof record.ok !== 'boolean') return { ok: false, error: 'server_error' }
    if (!record.ok) {
      return { ok: false, error: typeof record.error === 'string' ? record.error : 'server_error' }
    }
    return {
      ok: true,
      name: typeof record.name === 'string' && record.name.trim() ? record.name : file.name,
      url: typeof record.url === 'string' ? record.url : '',
    }
  } catch {
    return { ok: false, error: 'server_error' }
  }
}

export function uploadFloorPlan(
  token: string,
  file: { name: string; dataUrl: string },
): Promise<{ ok: true; name: string; url: string } | PlannerFailure> {
  return uploadNamedPdf(token, 'uploadFloorPlan', file)
}

export function uploadTimelinePdf(
  token: string,
  file: { name: string; dataUrl: string },
): Promise<{ ok: true; name: string; url: string } | PlannerFailure> {
  return uploadNamedPdf(token, 'uploadTimeline', file)
}

export interface ImportedTrack {
  title: string
  artist: string
}

export async function importPlaylist(
  token: string,
  url: string,
): Promise<{ ok: true; tracks: ImportedTrack[] } | PlannerFailure> {
  try {
    const response = await fetch(PLANNER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'importPlaylist', c: token, url }),
    })
    const record = asRecord(await readJson(response))
    if (!record || record.ok !== true) {
      return { ok: false, error: typeof record?.error === 'string' ? record.error : 'server_error' }
    }
    const tracks = Array.isArray(record.tracks) ? record.tracks : []
    const parsed: ImportedTrack[] = []
    for (const item of tracks) {
      const song = asRecord(item)
      const title = typeof song?.title === 'string' ? song.title.trim() : ''
      if (!title) continue
      parsed.push({ title, artist: typeof song?.artist === 'string' ? song.artist.trim() : '' })
    }
    if (parsed.length === 0) return { ok: false, error: 'no_tracks' }
    return { ok: true, tracks: parsed }
  } catch {
    return { ok: false, error: 'server_error' }
  }
}

export function saveErrorMessage(error: string): string {
  if (isInvalidLink(error)) {
    return "This planner link doesn't look right, please check the link Anders sent you."
  }
  if (error === 'busy') {
    return "Anders's planner is busy for a moment. Please try saving again."
  }
  return "We couldn't save your changes. Please check your connection and try again."
}
