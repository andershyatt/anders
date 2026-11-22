import { DANCE_LENGTH, DANCE_PERFORMANCE, STYLE_OPTIONS } from './fields'

export function emptyFields(keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, '']))
}

export function coerceFields(
  keys: string[],
  incoming: Record<string, unknown> | undefined,
): Record<string, string> {
  const fields = emptyFields(keys)
  if (!incoming) return fields
  for (const key of keys) {
    const value = incoming[key]
    if (value === undefined || value === null) continue
    fields[key] = String(value)
  }
  return fields
}

export function canonicalStyle(value: string): string {
  const match = STYLE_OPTIONS.find((option) => option.toLowerCase() === value.trim().toLowerCase())
  return match ?? ''
}

export function parseDanceFormat(value: string): { performance: string; length: string } {
  const parts = value.split(',').map((part) => part.trim().toLowerCase())
  const performance =
    DANCE_PERFORMANCE.find((option) => parts.includes(option.toLowerCase())) ?? ''
  const length =
    DANCE_LENGTH.find((option) =>
      parts.some((part) => part === option.toLowerCase() || (option === 'Shortened' && part === 'short')),
    ) ?? ''
  return { performance, length }
}

export function formatDance(performance: string, length: string): string {
  return [performance, length].filter(Boolean).join(', ')
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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

function ordinalDay(day: number): string {
  const teen = day % 100
  if (teen >= 11 && teen <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

function isoFromParts(year: number, monthIndex: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) return null
  const date = new Date(year, monthIndex, day)
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) return null
  const month = String(monthIndex + 1).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  return `${year}-${month}-${dayText}`
}

/**
 * Read a stored Event date into YYYY-MM-DD for the calendar control.
 * ISO dates are built in local time. Other recognizable dates are parsed.
 * Unrecognized text returns null so the caller can keep showing the raw value.
 */
export function toIsoDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (iso) return isoFromParts(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))

  const withoutWeekday = trimmed.replace(
    /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday),\s+/i,
    '',
  )
  const withoutOrdinal = withoutWeekday.replace(/(\d{1,2})(?:st|nd|rd|th)\b/gi, '$1')
  const monthName =
    /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})$/i.exec(
      withoutOrdinal.trim(),
    )
  if (monthName) {
    const monthIndex = MONTHS.findIndex((month) => month.toLowerCase() === monthName[1].toLowerCase())
    return isoFromParts(Number(monthName[3]), monthIndex, Number(monthName[2]))
  }

  const numeric = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed)
  if (numeric) return isoFromParts(Number(numeric[3]), Number(numeric[1]) - 1, Number(numeric[2]))

  return null
}

export function isIsoDate(value: string): boolean {
  const trimmed = value.trim()
  return toIsoDate(trimmed) === trimmed
}

/** Format a YYYY-MM-DD calendar date for the welcome header. Other strings stay as sent. */
export function formatCoupleDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return value
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  // Construct in local time so UTC parsing cannot move the calendar day.
  const date = new Date(year, monthIndex, day)
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return value
  }
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[monthIndex]} ${ordinalDay(day)}, ${year}`
}

/** Calendar date seven days before a YYYY-MM-DD event date. */
export function lockoutDate(eventDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate.trim())
  if (!match) return ''
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) - 7))
  const year = utc.getUTCFullYear()
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const day = String(utc.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today's calendar date in America/New_York. */
export function todayInNewYork(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** A Couples-sheet "Lock override" of Unlocked keeps the planner open inside the 7-day window. */
/**
 * A label longer than this cannot sit two-across on a narrow phone without the
 * text wrapping inside the button. "Live - instrumental" still fits; a sentence does not.
 */
const SHORT_CHOICE_LABEL = 20

export function choiceGroupIsLong(options: readonly string[]): boolean {
  return options.some((option) => option.trim().length > SHORT_CHOICE_LABEL)
}

/** A Sheets time-only cell, or a 24-hour clock, as the planner's 12-hour option, e.g. "12:30 AM". */
export function normalizePlannerTime(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const twelve = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])$/.exec(trimmed)
  if (twelve) {
    let hour = Number(twelve[1])
    const suffix = twelve[3].toUpperCase()
    if (suffix === 'AM') hour = hour === 12 ? 0 : hour
    else hour = hour === 12 ? 12 : hour + 12
    if (hour > 23) return trimmed
    return clockLabel(hour, twelve[2])
  }
  const sheets = /^1899-\d{2}-\d{2}[ T](\d{1,2}):(\d{2})(?::\d{2})?/.exec(trimmed)
  const clock = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed)
  const match = sheets ?? clock
  if (!match) return trimmed
  const hour = Number(match[1])
  if (hour > 23) return trimmed
  return clockLabel(hour, match[2])
}

function clockLabel(hour: number, minutes: string): string {
  const suffix = hour < 12 ? 'AM' : 'PM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minutes} ${suffix}`
}

/** Start time, load-in time, and any other clock field. Timeline text is not a time. */
export function isPlannerTimeField(key: string): boolean {
  if (/timeline/i.test(key)) return false
  return /time$/i.test(key.trim())
}

export function normalizePlannerTimes(fields: Record<string, string>): Record<string, string> {
  let changed = false
  const next = { ...fields }
  for (const key of Object.keys(next)) {
    if (!isPlannerTimeField(key)) continue
    const normalized = normalizePlannerTime(next[key] ?? '')
    if (normalized !== next[key]) {
      next[key] = normalized
      changed = true
    }
  }
  return changed ? next : fields
}

export function plannerLocked(eventDate: string, now = new Date(), override = ''): boolean {
  if (override.trim().toLowerCase() === 'unlocked') return false
  const lock = lockoutDate(eventDate)
  if (!lock) return false
  return todayInNewYork(now) >= lock
}

export function formatSavedAt(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fieldsEqual(left: Record<string, string>, right: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if ((left[key] ?? '') !== (right[key] ?? '')) return false
  }
  return true
}
