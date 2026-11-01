/** Check-all-that-apply answers. Known options stay as written; anything else is the Other text. */

export function parseChecks(
  raw: string,
  options: readonly string[],
): { selected: string[]; other: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { selected: [], other: '' }
  let items: string[] = []
  try {
    const data = JSON.parse(trimmed) as unknown
    if (Array.isArray(data)) {
      items = data.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    } else {
      items = [trimmed]
    }
  } catch {
    items = [trimmed]
  }
  const selected: string[] = []
  const extras: string[] = []
  for (const item of items) {
    const match = options.find((option) => option.toLowerCase() === item.toLowerCase())
    if (match) {
      if (!selected.includes(match)) selected.push(match)
    } else {
      extras.push(item)
    }
  }
  return { selected, other: extras.join(', ') }
}

export function serializeChecks(selected: readonly string[], other: string): string {
  const items = [...selected]
  const extra = other.trim()
  if (extra) items.push(extra)
  if (items.length === 0) return ''
  return JSON.stringify(items)
}
