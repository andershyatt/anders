import { coerceFields } from '../planner/format'
import {
  TIMELINE_PREFILL,
  answeredProgress,
  applyDjCeremonyStyleLabels,
  cocktailMusicChoices,
  plannerFieldKeys,
  stripOldTimelineHeader,
  applyRemovedSections,
  visibleSections,
  type BookedServices,
} from '../planner/fields'
import { applyPreCeremonyMusicTypeLabel } from '../planner/liveDj'
import type { PipelineCouple } from './types'

/** Same percentage the couple sees on their planner. */
export function coupleProgress(couple: PipelineCouple): number | null {
  if (!couple.fields) return null
  const services: BookedServices = {
    live: couple.services.live,
    dj: couple.services.dj,
    photobooth: couple.services.photobooth,
    knownVenue: couple.knownVenue,
    venueQuestions: !couple.knownVenue,
  }
  let fields = coerceFields(plannerFieldKeys, couple.fields)
  const locked: Array<[string, string]> = [
    ['Names', couple.names],
    ['Event type', couple.eventType],
    ['Event date', couple.date],
    ['Venue', couple.venue],
    ['Venue address', couple.venueAddress],
    ['Start time', couple.startTime],
    ['Length of service', couple.length],
    ['Guest count', couple.guestCount],
    ['Who did you book?', couple.team],
  ]
  for (const [key, value] of locked) {
    if (value.trim()) fields[key] = value
  }
  const timeline = fields.Timeline ?? ''
  fields.Timeline = timeline.trim() === '' ? TIMELINE_PREFILL : stripOldTimelineHeader(timeline)
  const choices = cocktailMusicChoices(services)
  if (choices.length === 1) fields['Cocktail hour music type'] = choices[0]
  fields = applyPreCeremonyMusicTypeLabel(applyDjCeremonyStyleLabels(fields, services), services)
  return answeredProgress(applyRemovedSections(visibleSections(services, fields), fields), fields)
}
