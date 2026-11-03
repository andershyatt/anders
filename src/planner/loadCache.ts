import type { PlannerLoadSuccess } from './api'

const PREFIX = 'anders-planner-cache:'

function slim(result: PlannerLoadSuccess): PlannerLoadSuccess {
  const photo = result.photo
  if (!photo || photo.dataUrl.length <= 80_000) return result
  return { ...result, photo: null }
}

export function readPlannerCache(token: string): PlannerLoadSuccess | null {
  try {
    const raw = localStorage.getItem(PREFIX + token)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlannerLoadSuccess
    if (!parsed || parsed.ok !== true || !parsed.fields) return null
    return parsed
  } catch {
    return null
  }
}

export function writePlannerCache(token: string, result: PlannerLoadSuccess) {
  const payload = JSON.stringify(slim(result))
  try {
    localStorage.setItem(PREFIX + token, payload)
  } catch {
    try {
      localStorage.setItem(PREFIX + token, JSON.stringify({ ...slim(result), photo: null }))
    } catch {
      /* The browser refused the cache. The next visit just waits for the network. */
    }
  }
}

export function updatePlannerCacheFields(
  token: string,
  fields: Record<string, string>,
  lastUpdated?: string | number,
) {
  const current = readPlannerCache(token)
  if (!current) return
  writePlannerCache(token, {
    ...current,
    fields: { ...current.fields, ...fields },
    lastUpdated: lastUpdated ?? current.lastUpdated,
  })
}

export function clearPlannerCache(token: string) {
  localStorage.removeItem(PREFIX + token)
}
