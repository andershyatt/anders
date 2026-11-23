export const HAVING_PARENT_DANCES = 'Having parent dances'
export const PARENT_DANCES_NOTES = 'Parent dances notes'
export const EXTRA_PARENT_DANCES = 'Extra parent dances'

export const PARENT_DANCE_YES = 'Yes'
export const PARENT_DANCE_MOTHER = 'Yes, mother-son only'
export const PARENT_DANCE_FATHER = 'Yes, father-daughter only'
export const PARENT_DANCE_NO = 'No'
export const PARENT_DANCE_OTHER = 'Other'

export const PARENT_DANCE_OPTIONS = [
  PARENT_DANCE_YES,
  PARENT_DANCE_MOTHER,
  PARENT_DANCE_FATHER,
  PARENT_DANCE_NO,
  PARENT_DANCE_OTHER,
] as const

export const PARENT_DANCE_NEUTRAL_OPTIONS = [PARENT_DANCE_YES, PARENT_DANCE_NO, PARENT_DANCE_OTHER] as const

export interface ExtraParentDance {
  id: string
  title: string
  song: string
  format: string
  choreographed: string
  startCue: string
  stopCue: string
  fade: string
}

export function blankParentDance(): ExtraParentDance {
  return {
    id: crypto.randomUUID(),
    title: '',
    song: '',
    format: '',
    choreographed: '',
    startCue: '',
    stopCue: '',
    fade: '',
  }
}

export function parseExtraParentDances(raw: string): ExtraParentDance[] {
  if (!raw.trim()) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const record = item as Partial<ExtraParentDance>
      const id = typeof record.id === 'string' && record.id.trim() ? record.id : crypto.randomUUID()
      return [
        {
          id,
          title: text(record.title),
          song: text(record.song),
          format: text(record.format),
          choreographed: text(record.choreographed),
          startCue: text(record.startCue),
          stopCue: text(record.stopCue),
          fade: text(record.fade),
        },
      ]
    })
  } catch {
    return []
  }
}

export function serializeExtraParentDances(dances: readonly ExtraParentDance[]): string {
  return dances.length ? JSON.stringify(dances) : ''
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function extraParentDanceProgress(raw: string): { answered: number; total: number } {
  const dances = parseExtraParentDances(raw)
  let answered = 0
  let total = 0
  for (const dance of dances) {
    const required: Array<[string, string]> = [
      ['title', dance.title],
      ['song', dance.song],
      ['format', dance.format],
      ['choreographed', dance.choreographed],
    ]
    if (dance.choreographed.trim().toLowerCase() === 'yes') {
      required.push(['start', dance.startCue], ['stop', dance.stopCue])
    }
    for (const [, value] of required) {
      total += 1
      if (value.trim()) answered += 1
    }
  }
  return { answered, total }
}

