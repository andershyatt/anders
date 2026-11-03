import type { PipelineCouple } from './types'

const KEY = 'anders-pipeline-list'

export function readPipelineCache(): PipelineCouple[] | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter((item): item is PipelineCouple => {
      return Boolean(item && typeof item === 'object' && typeof (item as PipelineCouple).token === 'string')
    })
  } catch {
    return null
  }
}

export function writePipelineCache(couples: PipelineCouple[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(couples))
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(couples.map((couple) => ({ ...couple, photo: '' }))))
    } catch {
      /* Ignore a full cache. The list still renders from the network. */
    }
  }
}

export function clearPipelineCache() {
  localStorage.removeItem(KEY)
}

export function coupleLocallyEdited(local: PipelineCouple, baseline: PipelineCouple): boolean {
  return (
    local.team !== baseline.team ||
    local.bookingStatus !== baseline.bookingStatus ||
    local.services.live !== baseline.services.live ||
    local.services.dj !== baseline.services.dj ||
    local.services.photobooth !== baseline.services.photobooth
  )
}
