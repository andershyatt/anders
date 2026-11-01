export type FieldKind = 'text' | 'textarea' | 'style' | 'dance' | 'yesno' | 'date' | 'choice-other' | 'floorplan' | 'rating' | 'cocktail-songs'

export interface PlannerField {
  key: string
  label: string
  kind: FieldKind
  placeholder?: string
  help?: string
  options?: readonly string[]
  /** single replaces the field; list replaces only the current line or comma entry. */
  song?: 'single' | 'list'
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

export const CELL_RECEPTION_OPTIONS = ['Yes', 'No', 'Not sure'] as const

export const plannerSections: PlannerSection[] = [
  {
    id: 'basics',
    title: 'Basics',
    blurb: 'The details Anders needs to find your day on the calendar.',
    fields: [
      { key: 'Wedding website', label: 'Wedding website', kind: 'text', placeholder: 'https://' },
      {
        key: 'Wedding website password',
        label: 'Wedding website password (if needed)',
        kind: 'text',
      },
      {
        key: 'Social media permission',
        label:
          'Can we share tasteful photos or videos from your wedding on our social media accounts for promotional purposes?',
        kind: 'yesno',
      },
      { key: 'IG handle', label: 'IG handle', kind: 'text', placeholder: '@' },
      {
        key: 'High school graduation year(s)',
        label: 'What year(s) did the couple graduate high school?',
        kind: 'text',
      },
      { key: 'Wedding colors', label: 'Wedding colors?', kind: 'text' },
      {
        key: 'Dress code',
        label: 'Anything we should know about dress code?',
        kind: 'text',
      },
      {
        key: 'Crowd party rating',
        label: "Rate your crowd on a scale of 1–10 (1 doesn't like to party / 10 loves to party)",
        kind: 'rating',
      },
      {
        key: 'Basic notes',
        label: 'Notes',
        kind: 'textarea',
        placeholder: "Anything else you'd like us to know",
      },
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
      { key: 'Caterer info', label: 'Caterer', kind: 'text' },
    ],
  },
  {
    id: 'venue-questions',
    title: 'Venue related questions',
    blurb: '',
    fields: [
      { key: 'Venue contact info', label: 'Venue Contact info (Phone + Email)', kind: 'text' },
      {
        key: 'Floor plan PDF',
        label:
          'Please provide the floor plan for the reception area as well as the venue layout, if available.',
        kind: 'floorplan',
      },
      {
        key: 'Internet access',
        label: 'Is there a WiFi network available for use at the venue?',
        kind: 'yesno',
      },
      {
        key: 'Cell reception',
        label: 'Is there reliable cell reception?',
        kind: 'yesno',
        options: CELL_RECEPTION_OPTIONS,
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
    id: 'timeline',
    title: 'Timeline',
    blurb:
      "Please provide your timeline in as much detail as possible. You may upload a PDF or put it in the notes section. You can start by drafting a rough or estimated timeline of events in the notes below, which can be finalized closer to the wedding. We're also happy to provide suggestions for the order of events tailored to your specific needs and preferences.",
    fields: [{ key: 'Timeline', label: 'Timeline', kind: 'textarea' }],
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
      { key: 'Pre-ceremony music', label: 'Pre-ceremony music', kind: 'textarea', song: 'list' },
      { key: 'Wedding party processional song', label: 'Wedding party processional song', kind: 'text', song: 'single' },
      {
        key: 'Wedding party processional style (instrumental/vocals)',
        label: 'Wedding party processional style',
        kind: 'style',
      },
      { key: 'Bridal processional song', label: 'Bridal processional song', kind: 'text', song: 'single' },
      { key: 'Bridal processional style', label: 'Bridal processional style', kind: 'style' },
      { key: 'Recessional song', label: 'Recessional song', kind: 'text', song: 'single' },
      { key: 'Recessional style', label: 'Recessional style', kind: 'style' },
      {
        key: 'Recessional cue',
        label: 'Cue to start the recessional music',
        kind: 'text',
        help: "What's the last thing the officiant will say before we start the recessional? Usually the first kiss, or the pronouncement right after it.",
      },
    ],
  },
  {
    id: 'cocktail-hour',
    title: 'Cocktail Hour',
    blurb:
      'Cocktail hour usually begins immediately after the ceremony. Add a note if your timing is different from that. Add your favorite songs below. You can also paste a Spotify or Apple Music playlist link in the notes.',
    fields: [
      {
        key: 'Cocktail hour timing notes',
        label: 'Timing notes (if different from usual)',
        kind: 'textarea',
      },
      {
        key: 'Cocktail hour music type',
        label: 'What type of music would you like at your cocktail hour?',
        kind: 'text',
      },
      {
        key: 'Cocktail hour vibe',
        label:
          "If you don't have specific song requests, what type of vibe/genres would you like to hear? Feel free to give any type of general guidance you would like. Musician's/DJ's choice is also an option!",
        kind: 'textarea',
      },
      { key: 'Cocktail hour songs', label: 'Songs', kind: 'cocktail-songs' },
    ],
  },
  {
    id: 'reception',
    title: 'Reception',
    blurb: 'The flow of the party, and anything Anders should keep in mind.',
    fields: [
      { key: 'Introductions', label: 'Introductions', kind: 'textarea' },
      { key: 'Toasts/speeches', label: 'Toasts/speeches', kind: 'textarea' },
      { key: 'Things to remember', label: 'Things to remember', kind: 'textarea' },
      { key: 'Songs to learn', label: 'Songs to learn', kind: 'textarea', song: 'list' },
    ],
  },
  {
    id: 'dances',
    title: 'Dances',
    blurb: 'Song, who plays it, and whether you want the full track or a shortened version.',
    fields: [
      { key: "Couple's first dance song", label: "Couple's first dance song", kind: 'text', song: 'single' },
      {
        key: 'First dance format (live/DJ, full/shortened)',
        label: 'First dance format',
        kind: 'dance',
      },
      { key: 'Father/daughter dance song', label: 'Father/daughter dance song', kind: 'text', song: 'single' },
      { key: 'Father/daughter format', label: 'Father/daughter format', kind: 'dance' },
      { key: 'Mother/son dance song', label: 'Mother/son dance song', kind: 'text', song: 'single' },
      { key: 'Mother/son format', label: 'Mother/son format', kind: 'dance' },
    ],
  },
  {
    id: 'dj',
    title: 'DJ',
    blurb: 'Requests for the dancing portion of the night.',
    fields: [
      { key: 'DJ music requests', label: 'DJ music requests', kind: 'textarea', song: 'list' },
      { key: 'Last song of the night with guests', label: 'Last song of the night with guests', kind: 'text', song: 'single' },
      { key: 'Private last dance', label: 'Private last dance', kind: 'text', song: 'single' },
    ],
  },
  {
    id: 'do-not-play',
    title: 'Do-not-play',
    blurb: 'Songs or artists you do not want to hear.',
    fields: [{ key: 'Do-not-play list', label: 'Do-not-play list', kind: 'textarea', song: 'list' }],
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

/** Shown on the Basics card. Couples cannot edit these, and saves omit them. */
export interface PlannerBasics {
  names: string
  eventType: string
  date: string
  venue: string
  venueAddress: string
  startTime: string
  length: string
  guestCount: string
  booked: string
}

export const EMPTY_BASICS: PlannerBasics = {
  names: '',
  eventType: '',
  date: '',
  venue: '',
  venueAddress: '',
  startTime: '',
  length: '',
  guestCount: '',
  booked: '',
}

export const BOOKED_FIELD = 'Who did you book?'

export const TIMELINE_HEADER = 'Sample timeline - edit as much as you\'d like & DELETE this top line after you begin editing'

export const TIMELINE_PREFILL = `X:XX - Guest arrival
X:XX - Ceremony
X:XX - Cocktail hour
X:XX - Reception room opens, introductions, first dance
X:XX - First course, welcome toast
X:XX - Entrees, speeches
X:XX - Parent dances, group photo
X:XX - Open dance floor
X:XX - Cake cutting, dessert stations open
X:XX - End`

/** Drop the retired instruction line, and the blank line under it, without editing the rest. */
export function stripOldTimelineHeader(value: string): string {
  if (!value.startsWith(TIMELINE_HEADER)) return value
  let rest = value.slice(TIMELINE_HEADER.length)
  rest = rest.replace(/^(?:\r\n|\n)/, '')
  rest = rest.replace(/^(?:\r\n|\n)/, '')
  return rest
}

export const LOCKED_BASICS_KEYS = new Set([
  'Names',
  'Event type',
  'Event date',
  'Venue',
  'Venue address',
  'Start time',
  'Length of service',
  'Guest count',
  BOOKED_FIELD,
])

function fieldText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function preferField(fieldValue: string, fallback: string | undefined): string {
  return fieldValue.trim() ? fieldValue : (fallback ?? '')
}

/**
 * Use the load response's `basics` object when the backend sends one.
 * Older responses omit it, so those values come from the saved fields,
 * then from couple.names / couple.date / couple.venue.
 */
export function resolveBasics(
  basics: PlannerBasics | null,
  fields: Record<string, unknown>,
  couple: { names?: string; date?: string; venue?: string },
): PlannerBasics {
  if (basics) return basics
  return {
    names: preferField(fieldText(fields.Names), couple.names),
    eventType: fieldText(fields['Event type']),
    date: preferField(fieldText(fields['Event date']), couple.date),
    venue: preferField(fieldText(fields.Venue), couple.venue),
    venueAddress: fieldText(fields['Venue address']),
    startTime: fieldText(fields['Start time']),
    length: fieldText(fields['Length of service']),
    guestCount: fieldText(fields['Guest count']),
    booked: fieldText(fields[BOOKED_FIELD]),
  }
}

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
  'Floor plan PDF',
  'Internet access',
  'Cell reception',
  'Ceremony location',
  'Ceremony power',
  'Ceremony rain plan',
  'Cocktail hour location',
  'Cocktail hour power',
  'Cocktail hour rain plan',
  'Dinner location',
])

const COCKTAIL_FIELDS = new Set([
  'Cocktail hour timing notes',
  'Cocktail hour music type',
  'Cocktail hour vibe',
  'Cocktail hour songs',
])

export const COCKTAIL_MUSIC_LIVE = 'Live music'
export const COCKTAIL_MUSIC_DJ = "DJ'ed music"
export const COCKTAIL_MUSIC_MIX = "A mixture of Live & DJ'ed music"
export const COCKTAIL_MUSIC_OPTIONS = [COCKTAIL_MUSIC_LIVE, COCKTAIL_MUSIC_DJ, COCKTAIL_MUSIC_MIX] as const

/** Choices to show. A single option means the question stays hidden and that value is stored. */
export function cocktailMusicChoices(services: BookedServices): readonly string[] {
  if (services.live && services.dj) return COCKTAIL_MUSIC_OPTIONS
  if (services.live) return [COCKTAIL_MUSIC_LIVE]
  if (services.dj) return [COCKTAIL_MUSIC_DJ]
  return []
}

export function fieldVisible(key: string, services: BookedServices): boolean {
  if (LIVE_FIELDS.has(key)) return services.live
  if (DJ_FIELDS.has(key)) return services.dj
  if (key.startsWith('Photo Booth')) return services.photobooth
  if (LIVE_AND_DJ_FIELDS.has(key)) return services.live && services.dj
  if (VENUE_QUESTION_FIELDS.has(key)) return services.venueQuestions
  if (COCKTAIL_FIELDS.has(key)) return services.live || services.dj
  return true
}

export const CELL_RECEPTION_FIELD = 'Cell reception'

export function cellReceptionVisible(fields: Record<string, string>): boolean {
  return (fields['Internet access'] ?? '').trim().toLowerCase() === 'no'
}

/** Hidden follow-ups stay out of the section so they are not shown or counted. */
export function fieldAnswerVisible(
  key: string,
  services: BookedServices,
  fields: Record<string, string>,
): boolean {
  if (!fieldVisible(key, services)) return false
  if (key === CELL_RECEPTION_FIELD) return cellReceptionVisible(fields)
  return true
}

/** Sections with every field hidden are dropped, so their headings are not shown. */
export function visibleSections(
  services: BookedServices,
  answers: Record<string, string> = {},
): PlannerSection[] {
  return plannerSections.flatMap((section) => {
    const fields = section.fields.filter((field) => fieldAnswerVisible(field.key, services, answers))
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
      ([key]) =>
        key !== COUPLE_PHOTO_FIELD &&
        key !== FLOOR_PLAN_FIELD &&
        !LOCKED_BASICS_KEYS.has(key) &&
        fieldAnswerVisible(key, services, fields),
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
