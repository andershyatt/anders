export type FieldKind = 'text' | 'textarea' | 'style' | 'dance' | 'yesno' | 'date' | 'choice-other' | 'floorplan'

export interface PlannerField {
  key: string
  label: string
  kind: FieldKind
  placeholder?: string
  help?: string
  options?: readonly string[]
}

export interface PlannerSection {
  id: string
  title: string
  blurb: string
  fields: PlannerField[]
}

export const POWER_OPTIONS = [
  'Yes, there is power available.',
  'No, the musician/DJ will need a battery powered option.',
  'Please check with the venue.',
] as const

export const COCKTAIL_LOCATION_OPTIONS = [
  'Same area as the ceremony',
  'Same area as the reception',
] as const

export const plannerSections: PlannerSection[] = [
  {
    id: 'basics',
    title: 'Basics',
    blurb: 'The details Anders needs to find your day on the calendar.',
    fields: [
      { key: 'Names', label: 'Names', kind: 'text', placeholder: 'Alex and Jordan' },
      { key: 'Event type', label: 'Event type', kind: 'text', placeholder: 'Wedding' },
      { key: 'Event date', label: 'Event date', kind: 'date' },
      { key: 'Venue', label: 'Venue', kind: 'text', placeholder: 'Venue name' },
      { key: 'Venue address', label: 'Venue address', kind: 'textarea', placeholder: 'Street, city' },
      { key: 'Start time', label: 'Start time', kind: 'text', placeholder: '4:00 PM' },
      { key: 'Length of service', label: 'Length of service', kind: 'text', placeholder: '30 minutes' },
      { key: 'Guest count', label: 'Guest count', kind: 'text', placeholder: '120' },
      { key: 'Wedding website', label: 'Wedding website', kind: 'text', placeholder: 'https://' },
      {
        key: 'Social media permission',
        label:
          'Can we share tasteful photos or videos from your wedding on our social media accounts for promotional purposes?',
        kind: 'yesno',
      },
      { key: 'IG handle', label: 'IG handle', kind: 'text', placeholder: '@' },
    ],
  },
  {
    id: 'vendors',
    title: 'Vendors',
    blurb: 'Who else is on site, in case Anders needs to coordinate.',
    fields: [
      {
        key: 'Planner (name/contact)',
        label: 'Planner (name/contact)',
        kind: 'text',
        placeholder: 'Name, phone, or email',
      },
      { key: 'Venue manager', label: 'Venue manager', kind: 'text' },
      { key: 'Photographer', label: 'Photographer', kind: 'text' },
      { key: 'Videographer', label: 'Videographer', kind: 'text' },
    ],
  },
  {
    id: 'venue-questions',
    title: 'Venue related questions',
    blurb: '',
    fields: [
      { key: 'Venue contact info', label: 'Venue Contact info (Phone + Email)', kind: 'text' },
      { key: 'Caterer info', label: 'Caterer info', kind: 'text' },
      {
        key: 'Floor plan PDF',
        label:
          'Please provide the floor plan for the reception area as well as the venue layout, if available.',
        kind: 'floorplan',
      },
      {
        key: 'Internet access',
        label:
          'Internet Access - Is there a WiFi network available for use at the venue? If not, is there reliable cell reception?',
        kind: 'text',
      },
      {
        key: 'Ceremony location',
        label: 'Location of ceremony - Where will the wedding ceremony be taking place?',
        kind: 'text',
      },
      {
        key: 'Ceremony power',
        label: 'Is there power available where the ceremony is being held?',
        kind: 'choice-other',
        options: POWER_OPTIONS,
      },
      {
        key: 'Ceremony rain plan',
        label: 'If you are having your ceremony outside, what is your rain plan?',
        kind: 'text',
      },
      {
        key: 'Cocktail hour location',
        label: 'Where will cocktail hour be taking place?',
        kind: 'choice-other',
        options: COCKTAIL_LOCATION_OPTIONS,
      },
      {
        key: 'Cocktail hour power',
        label: 'Is there power available where cocktail hour is being held?',
        kind: 'choice-other',
        options: POWER_OPTIONS,
      },
      {
        key: 'Cocktail hour rain plan',
        label: 'If you are having your cocktail hour outside, what is your rain plan?',
        kind: 'text',
      },
      {
        key: 'Dinner location',
        label:
          'Is dinner happening in the same room where the dancing will take place? If not, please describe where dinner will be.',
        kind: 'text',
      },
    ],
  },
  {
    id: 'photo-booth',
    title: 'Photo Booth',
    blurb: 'Only fill this in if you are booking the photo booth.',
    fields: [
      { key: 'Photo Booth start/end', label: 'Photo Booth start/end', kind: 'text', placeholder: '7:00–10:00 PM' },
      { key: 'Photo Booth backdrop', label: 'Photo Booth backdrop', kind: 'text' },
      { key: 'Photo Booth template', label: 'Photo Booth template', kind: 'text' },
      { key: 'Photo Booth logo/text', label: 'Photo Booth logo/text', kind: 'text' },
      { key: 'Photo Booth props', label: 'Photo Booth props', kind: 'textarea' },
    ],
  },
  {
    id: 'ceremony',
    title: 'Ceremony',
    blurb: 'Songs and how you want them played.',
    fields: [
      { key: 'Pre-ceremony music', label: 'Pre-ceremony music', kind: 'textarea' },
      { key: 'Wedding party processional song', label: 'Wedding party processional song', kind: 'text' },
      {
        key: 'Wedding party processional style (instrumental/vocals)',
        label: 'Wedding party processional style',
        kind: 'style',
      },
      { key: 'Bridal processional song', label: 'Bridal processional song', kind: 'text' },
      { key: 'Bridal processional style', label: 'Bridal processional style', kind: 'style' },
      { key: 'Recessional song', label: 'Recessional song', kind: 'text' },
      { key: 'Recessional style', label: 'Recessional style', kind: 'style' },
      {
        key: 'Recessional cue',
        label: 'Cue to start the recessional music',
        kind: 'text',
        help: "What's the last thing the officiant will say before we start the recessional? Usually the first kiss, or the pronouncement right after it.",
      },
      { key: 'Live music requests', label: 'Live music requests', kind: 'textarea' },
    ],
  },
  {
    id: 'reception',
    title: 'Reception',
    blurb: 'The flow of the party, and anything Anders should keep in mind.',
    fields: [
      { key: 'Introductions', label: 'Introductions', kind: 'textarea' },
      { key: 'Toasts/speeches', label: 'Toasts/speeches', kind: 'textarea' },
      { key: 'Timeline', label: 'Timeline', kind: 'textarea' },
      { key: 'Things to remember', label: 'Things to remember', kind: 'textarea' },
      { key: 'Songs to learn', label: 'Songs to learn', kind: 'textarea' },
    ],
  },
  {
    id: 'dances',
    title: 'Dances',
    blurb: 'Song, who plays it, and whether you want the full track or a shortened version.',
    fields: [
      { key: "Couple's first dance song", label: "Couple's first dance song", kind: 'text' },
      {
        key: 'First dance format (live/DJ, full/shortened)',
        label: 'First dance format',
        kind: 'dance',
      },
      { key: 'Father/daughter dance song', label: 'Father/daughter dance song', kind: 'text' },
      { key: 'Father/daughter format', label: 'Father/daughter format', kind: 'dance' },
      { key: 'Mother/son dance song', label: 'Mother/son dance song', kind: 'text' },
      { key: 'Mother/son format', label: 'Mother/son format', kind: 'dance' },
    ],
  },
  {
    id: 'dj',
    title: 'DJ',
    blurb: 'Requests for the dancing portion of the night.',
    fields: [
      { key: 'DJ music requests', label: 'DJ music requests', kind: 'textarea' },
      { key: 'Last song of the night with guests', label: 'Last song of the night with guests', kind: 'text' },
      { key: 'Private last dance', label: 'Private last dance', kind: 'text' },
    ],
  },
  {
    id: 'do-not-play',
    title: 'Do-not-play',
    blurb: 'Songs or artists you do not want to hear.',
    fields: [{ key: 'Do-not-play list', label: 'Do-not-play list', kind: 'textarea' }],
  },
  {
    id: 'notes',
    title: 'Notes',
    blurb: 'Anything else Anders should know.',
    fields: [{ key: 'Notes', label: 'Notes', kind: 'textarea' }],
  },
]

export const plannerFieldKeys: string[] = plannerSections.flatMap((section) =>
  section.fields.map((field) => field.key),
)

export interface BookedServices {
  live: boolean
  dj: boolean
  photobooth: boolean
  venueQuestions: boolean
}

/**
 * Used when the backend omits `services` (older responses).
 * Venue questions stay off until the backend sets `venueQuestions: true`.
 */
export const ALL_SERVICES: BookedServices = { live: true, dj: true, photobooth: true, venueQuestions: false }

const LIVE_FIELDS = new Set([
  'Songs to learn',
  'Pre-ceremony music',
  'Wedding party processional song',
  'Wedding party processional style (instrumental/vocals)',
  'Bridal processional song',
  'Bridal processional style',
  'Recessional song',
  'Recessional style',
  'Recessional cue',
  'Live music requests',
])

const DJ_FIELDS = new Set([
  'DJ music requests',
  'Last song of the night with guests',
  'Private last dance',
  'Do-not-play list',
])

const LIVE_AND_DJ_FIELDS = new Set([
  'First dance format (live/DJ, full/shortened)',
  'Father/daughter format',
  'Mother/son format',
])

const VENUE_QUESTION_FIELDS = new Set([
  'Venue contact info',
  'Caterer info',
  'Floor plan PDF',
  'Internet access',
  'Ceremony location',
  'Ceremony power',
  'Ceremony rain plan',
  'Cocktail hour location',
  'Cocktail hour power',
  'Cocktail hour rain plan',
  'Dinner location',
])

export function fieldVisible(key: string, services: BookedServices): boolean {
  if (LIVE_FIELDS.has(key)) return services.live
  if (DJ_FIELDS.has(key)) return services.dj
  if (key.startsWith('Photo Booth')) return services.photobooth
  if (LIVE_AND_DJ_FIELDS.has(key)) return services.live && services.dj
  if (VENUE_QUESTION_FIELDS.has(key)) return services.venueQuestions
  return true
}

/** Sections with every field hidden are dropped, so their headings are not shown. */
export function visibleSections(services: BookedServices): PlannerSection[] {
  return plannerSections.flatMap((section) => {
    const fields = section.fields.filter((field) => fieldVisible(field.key, services))
    if (fields.length === 0) return []
    return [{ ...section, fields }]
  })
}

/** Not a form field. Uploaded separately and never included in a normal save. */
export const COUPLE_PHOTO_FIELD = 'Couple photo'

/** Not a form answer. Uploaded separately and never included in a normal save. */
export const FLOOR_PLAN_FIELD = 'Floor plan PDF'

/** Hidden answers are omitted so a save does not wipe them with empty strings. */
export function fieldsForSave(
  fields: Record<string, string>,
  services: BookedServices,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields).filter(
      ([key]) => key !== COUPLE_PHOTO_FIELD && key !== FLOOR_PLAN_FIELD && fieldVisible(key, services),
    ),
  )
}

/**
 * Dev preview. `?preview=live,dj` overrides booked services only when the
 * query param is present. Tokens are `live`, `dj`, `photobooth`, and `venue`.
 */
export function servicesFromPreview(search: string): BookedServices | null {
  const params = new URLSearchParams(search)
  if (!params.has('preview')) return null
  const parts = new Set(
    (params.get('preview') ?? '')
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  )
  return {
    live: parts.has('live'),
    dj: parts.has('dj'),
    photobooth: parts.has('photobooth'),
    venueQuestions: parts.has('venue'),
  }
}

export const STYLE_OPTIONS = ['Instrumental', 'Vocals'] as const

/** Ceremony style choices when the couple booked both live music and a DJ. */
export const CEREMONY_STYLE_WITH_DJ = [
  'Live - instrumental',
  'Live - vocals',
  'DJ - instrumental',
  'DJ - vocals',
] as const

const CEREMONY_STYLE_KEYS = new Set([
  'Wedding party processional style (instrumental/vocals)',
  'Bridal processional style',
  'Recessional style',
])

export function ceremonyStyleOptions(key: string, services: BookedServices): readonly string[] {
  if (CEREMONY_STYLE_KEYS.has(key) && services.live && services.dj) return CEREMONY_STYLE_WITH_DJ
  return STYLE_OPTIONS
}

export const YES_NO_OPTIONS = ['Yes', 'No'] as const
export const DANCE_PERFORMANCE = ['Live', 'DJ'] as const
export const DANCE_LENGTH = ['Full', 'Shortened'] as const
