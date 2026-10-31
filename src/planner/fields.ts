export type FieldKind = 'text' | 'textarea' | 'style' | 'dance' | 'yesno' | 'date'

export interface PlannerField {
  key: string
  label: string
  kind: FieldKind
  placeholder?: string
}

export interface PlannerSection {
  id: string
  title: string
  blurb: string
  fields: PlannerField[]
}

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

export const STYLE_OPTIONS = ['Instrumental', 'Vocals'] as const
export const YES_NO_OPTIONS = ['Yes', 'No'] as const
export const DANCE_PERFORMANCE = ['Live', 'DJ'] as const
export const DANCE_LENGTH = ['Full', 'Shortened'] as const
