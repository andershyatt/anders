export interface BookedServices {
  live: boolean
  dj: boolean
  photobooth: boolean
}

export interface PipelineCouple {
  token: string
  names: string
  date: string
  venue: string
  venueAddress: string
  eventType: string
  startTime: string
  length: string
  guestCount: string
  services: BookedServices
  team: string
  bookingStatus: string
  genderNeutral: boolean
  knownVenue: boolean
  photo: string
  /** Planner answers, when the admin list includes them. Omitted on an older backend. */
  fields?: Record<string, string>
  /** Couples-sheet stamp. Empty until Apps Script records it. */
  lastUpdated?: string
  updatedBy?: '' | 'Anders' | 'couple'
  /** Short planner slug, such as 060127MikeSarahPlanner. */
  slug?: string
  /** Sections changed on the last save, such as "Ceremony › Processional". */
  lastSections?: string
  /** Blank follows the 7-day lock. Unlocked keeps the planner open. */
  lockOverride?: '' | 'Unlocked'
}

export interface PipelineDetail extends PipelineCouple {
  fields: Record<string, string>
}

export type BookingStage = 'Booked' | 'Not booked' | 'Completed'

/** Sheet rows saved before the rename still say "Not yet booked". */
export function stageOf(status: string): BookingStage {
  if (status === 'Booked' || status === 'Completed') return status
  return 'Not booked'
}
