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
