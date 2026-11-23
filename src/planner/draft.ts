import { fieldsEqual } from './format'

const PREFIX = 'anders-planner-draft:'

interface PlannerDraft {
  baseUpdated: string
  changes: Record<string, string>
}

function readDraft(token: string): PlannerDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + token)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlannerDraft
    if (!parsed || typeof parsed !== 'object' || !parsed.changes || typeof parsed.changes !== 'object') return null
    return { baseUpdated: String(parsed.baseUpdated ?? ''), changes: parsed.changes }
  } catch {
    return null
  }
}

export function clearPlannerDraft(token: string) {
  try {
    localStorage.removeItem(PREFIX + token)
  } catch {
    /* Storage can be blocked. The in-memory form still has the edits. */
  }
}

export function writePlannerDraft(token: string, baseUpdated: string, saved: Record<string, string>, current: Record<string, string>) {
  const changes: Record<string, string> = {}
  const keys = new Set([...Object.keys(saved), ...Object.keys(current)])
  for (const key of keys) {
    const next = current[key] ?? ''
    if (next !== (saved[key] ?? '')) changes[key] = next
  }
  if (Object.keys(changes).length === 0) {
    clearPlannerDraft(token)
    return
  }
  try {
    localStorage.setItem(PREFIX + token, JSON.stringify({ baseUpdated, changes }))
  } catch {
    /* A full storage quota should not block typing. */
  }
}

function stampTime(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Date.parse(trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T'))
  return Number.isNaN(parsed) ? null : parsed
}

/** The server copy moved on after this draft was started. */
function serverIsNewer(baseUpdated: string, serverUpdated: string): boolean {
  const base = stampTime(baseUpdated)
  const server = stampTime(serverUpdated)
  if (base !== null && server !== null) return server > base
  const serverText = serverUpdated.trim()
  if (!serverText) return false
  return serverText !== baseUpdated.trim()
}

export function restorePlannerDraft(
  token: string,
  serverFields: Record<string, string>,
  serverUpdated: string,
  locked: boolean,
): { fields: Record<string, string>; restored: boolean; discarded: boolean } {
  const draft = readDraft(token)
  if (!draft || locked) return { fields: serverFields, restored: false, discarded: false }
  if (serverIsNewer(draft.baseUpdated, serverUpdated)) {
    clearPlannerDraft(token)
    return { fields: serverFields, restored: false, discarded: true }
  }
  const next = { ...serverFields }
  for (const [key, value] of Object.entries(draft.changes)) next[key] = value
  if (fieldsEqual(next, serverFields)) {
    clearPlannerDraft(token)
    return { fields: serverFields, restored: false, discarded: false }
  }
  return { fields: next, restored: true, discarded: false }
}
