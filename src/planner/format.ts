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
