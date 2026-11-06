import { useEffect, useSyncExternalStore } from 'react'
import { fallbackEvents, type PublicEvent } from '../data/events'

const SHEET_ID = '1k0aKkSn3u1jkdLXKxCrp58_tOta4Gwybo_MD8kS8Wxg'

/** Same CSV endpoint style as the song list. The Events tab must be shared as "anyone with the link can view". */
const EVENTS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Events`

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface EventRow {
  key: string
  date: string
  dateShort: string
  title: string
  location: string
  details?: string
  link?: string
}

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

function localDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export function parseEventDate(raw: string): Date | null {
  const value = raw.trim()
  if (!value) return null
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value)
  if (iso) return localDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(value)
  if (us) return localDate(Number(us[3]), Number(us[1]), Number(us[2]))
  const gviz = /^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/.exec(value)
  if (gviz) return localDate(Number(gviz[1]), Number(gviz[2]) + 1, Number(gviz[3]))
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return localDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
}

function startOfDay(day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate())
}

/** Blank Show is public. YES/yes/true are public. Anything else is hidden. */
export function isPublicShow(show: string | undefined): boolean {
  const value = (show ?? '').trim().toLowerCase()
  return value === '' || value === 'yes' || value === 'true'
}

function formatClock(raw: string): string {
  const value = raw.trim().replace(/\s+/g, ' ')
  if (!value) return ''
  const ampm = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap]m)$/i.exec(value)
  if (ampm) {
    const hour = Number(ampm[1])
    const minute = ampm[2] ?? '00'
    if (hour < 1 || hour > 12 || Number(minute) > 59) return value
    return `${hour}:${minute}${ampm[3].toUpperCase()}`
  }
  const h24 = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value)
  if (h24) {
    let hour = Number(h24[1])
    const minute = h24[2]
    if (hour > 23 || Number(minute) > 59) return value
    const suffix = hour >= 12 ? 'PM' : 'AM'
    hour %= 12
    if (hour === 0) hour = 12
    return `${hour}:${minute}${suffix}`
  }
  return value
}

function formatTimeRange(startRaw: string, endRaw: string): string {
  const start = formatClock(startRaw)
  const end = formatClock(endRaw)
  if (start && end) return `${start} \u2014 ${end}`
  return start || end
}

function formatEventWhen(day: Date, startRaw: string, endRaw: string): { date: string; dateShort: string } {
  const full = `${WEEKDAYS[day.getDay()]}, ${MONTHS[day.getMonth()]} ${day.getDate()}`
  const short = `${WEEKDAYS_SHORT[day.getDay()]}, ${MONTHS_SHORT[day.getMonth()]} ${day.getDate()}`
  const range = formatTimeRange(startRaw, endRaw)
  if (!range) return { date: full, dateShort: short }
  return { date: `${full} @ ${range}`, dateShort: `${short} @ ${range}` }
}

function externalLink(value: string | undefined): string | undefined {
  const link = (value ?? '').trim()
  if (!link) return undefined
  if (/^https?:\/\//i.test(link)) return link
  if (/^[\w.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(link)) return `https://${link}`
  return undefined
}

export function eventsFromSheetCsv(text: string): PublicEvent[] {
  const trimmed = text.trim()
  if (!trimmed || trimmed.startsWith('<')) throw new Error('Events sheet was not CSV')
  const rows = parseCsv(text)
  if (!rows.length) throw new Error('Events sheet was empty')
  const headers = rows[0].map((header) => header.trim().toLowerCase())
  if (!headers.includes('date') || !headers.includes('event')) {
    throw new Error('Events sheet is missing Date or Event columns')
  }
  const index = new Map(headers.map((header, i) => [header, i]))
  const cell = (cols: string[], name: string) => {
    const at = index.get(name)
    if (at == null) return ''
    return (cols[at] ?? '').trim()
  }

  const events: PublicEvent[] = []
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i]
    const date = cell(cols, 'date')
    const title = cell(cols, 'event')
    if (!date && !title) continue
    events.push({
      date,
      start: cell(cols, 'start'),
      end: cell(cols, 'end'),
      title,
      location: cell(cols, 'location'),
      show: cell(cols, 'show'),
      details: cell(cols, 'details'),
      link: cell(cols, 'link'),
    })
  }
  return events
}

/** Public rows on or after today, earliest date first. */
export function visibleEventRows(events: PublicEvent[], today = new Date()): EventRow[] {
  const start = startOfDay(today)
  const rows: { row: EventRow; time: number; index: number }[] = []
  events.forEach((event, index) => {
    if (!isPublicShow(event.show)) return
    const day = parseEventDate(event.date)
    if (!day || day < start) return
    const title = event.title.trim()
    if (!title) return
    const when = formatEventWhen(day, event.start, event.end)
    const details = event.details?.trim()
    const link = externalLink(event.link)
    const location = event.location.trim()
    rows.push({
      time: day.getTime(),
      index,
      row: {
        key: `${event.date}|${title}|${location}|${index}`,
        date: when.date,
        dateShort: when.dateShort,
        title,
        location,
        ...(details ? { details } : {}),
        ...(link ? { link } : {}),
      },
    })
  })
  rows.sort((a, b) => a.time - b.time || a.index - b.index)
  return rows.map((item) => item.row)
}

export async function fetchSheetEvents(): Promise<PublicEvent[]> {
  const response = await fetch(EVENTS_CSV_URL)
  if (!response.ok) throw new Error(`Events sheet responded ${response.status}`)
  return eventsFromSheetCsv(await response.text())
}

let current = visibleEventRows(fallbackEvents)
const listeners = new Set<() => void>()
let pending: Promise<void> | null = null

function emit() {
  for (const listener of listeners) listener()
}

function getPublicEvents(): EventRow[] {
  return current
}

function subscribePublicEvents(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function ensurePublicEvents(): void {
  if (pending) return
  pending = fetchSheetEvents()
    .then((events) => {
      current = visibleEventRows(events)
    })
    .catch(() => {
      current = visibleEventRows(fallbackEvents)
    })
    .then(() => {
      emit()
    })
}

export function usePublicEvents(): EventRow[] {
  useEffect(() => {
    ensurePublicEvents()
  }, [])
  return useSyncExternalStore(subscribePublicEvents, getPublicEvents, getPublicEvents)
}
