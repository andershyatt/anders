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
  services: BookedServices
  /** Inline image for the planner. Null when the couple has not sent one. */
  photo: { dataUrl: string } | null
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
    services: parseServices(record.services),
    photo: parseLoadedPhoto(record.photo),
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

export function saveErrorMessage(error: string): string {
  if (isInvalidLink(error)) {
    return "This planner link doesn't look right, please check the link Anders sent you."
  }
  if (error === 'busy') {
    return "Anders's planner is busy for a moment. Please try saving again."
  }
  return "We couldn't save your changes. Please check your connection and try again."
}
