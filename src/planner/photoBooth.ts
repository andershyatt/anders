export type BoothInput = 'text' | 'textarea' | 'date' | 'time' | 'choice' | 'checks'

export interface BoothField {
  kind: 'field'
  key: string
  label: string
  help?: string
  input: BoothInput
  options?: readonly string[]
  /** Only on the new-venue questionnaire. */
  newVenue?: boolean
}

export interface BoothNote {
  kind: 'note'
  text: string
  href?: string
  linkLabel?: string
  newVenue?: boolean
}

export type BoothItem = BoothField | BoothNote | { kind: 'heading'; text: string; newVenue?: boolean }

const BACKDROPS = [
  "We do not need a backdrop and/or don't have space for one",
  "We'd like to use a natural background at our venue",
  'Brilliant white',
  'Brushed black and white',
  'Dark barnwood',
  'Drops of gold',
  'Floral pattern',
  'Gold sparkle',
  'Hedge',
  'Romantic country lights',
] as const

const PRINTS = [
  '2"x6" strip size print',
  '4"x6" postcard size print',
  "We don't want prints",
  "Unsure - let's discuss on the phone",
] as const

const TEMPLATES = [
  '2x6 - three photo strip - square images - small space for text/logo',
  '2x6 - three photo strip - landscape images - large space for text/logo',
  '4x6 - three photos - landscape images - large space for text/logo',
  '4x6 - single photo - landscape - option for text/logo overlay',
  '4x6 - single photo - portrait - option for text/logo overlay',
  "Let's discuss more options",
] as const

const PROPS = [
  'Wedding Set #1',
  'Wedding Set #2',
  'Party Set #1',
  'Party Set #2',
  'Letterboard Set',
  'Hundred dollar bills',
  "We don't need any props",
] as const

const YES_NO_UNSURE = ['Yes', 'No', 'Not sure'] as const

/** Questions copied from Anders's photo booth forms. New-venue items are marked. */
export const PHOTO_BOOTH_ITEMS: BoothItem[] = [
  { kind: 'field', key: 'Photo Booth: Names', label: 'Please provide your name(s)', input: 'text' },
  { kind: 'field', key: 'Photo Booth: Event date', label: 'Event date', input: 'date' },
  { kind: 'heading', text: 'Arrival & Load-In Logistics', newVenue: true },
  { kind: 'field', key: 'Photo Booth: Event location', label: 'Event location', input: 'text' },
  {
    kind: 'field',
    key: 'Photo Booth: Load-in time',
    label: 'What is the earliest time the venue allows for vendor load-in and setup?',
    help: 'We typically require 45–60 minutes to be fully ready before your "Go-Live" time',
    input: 'time',
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Load-in instructions',
    label: 'Are there any specific load-in instructions (e.g., freight elevator, specific loading dock, stairs only)?',
    input: 'textarea',
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Day-of contact',
    label: 'Who is a contact person we can text/call the day of the event if needed?',
    help: 'Please provide a full name and phone number',
    input: 'text',
  },
  {
    kind: 'field',
    key: 'Photo Booth: Space',
    label: "Do you have at least a 10'x10' foot area for the photo booth?",
    input: 'choice',
    options: YES_NO_UNSURE,
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Ceiling height',
    label:
      'If indoors, does the photo booth area have ceilings that are at least 8 feet high? (The backdrop stand requires 8 feet of clearance)',
    input: 'choice',
    options: ['Yes', "No – we'll skip the backdrop and use the natural background instead"],
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Weather plan',
    label: 'If the photo booth is outdoors, is there a backup plan in the event of poor weather or extreme high wind?',
    input: 'choice',
    options: ['N/A - photo booth will be indoors', 'Yes', 'No'],
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Terrain',
    label:
      'If the photo booth is outdoors, what kind of terrain will the photo booth equipment be on? Photo booth MUST be on a level surface.',
    input: 'choice',
    options: ['N/A - photo booth will be indoors', 'Concrete/asphalt', 'Grass', 'Not sure'],
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Power',
    label:
      'Power requirements - Is there a dedicated 3-prong power outlet available within 15 feet of the photo booth setup area?',
    help: 'To ensure the best experience and prevent equipment shut-offs, the booth works best on its own dedicated circuit.',
    input: 'choice',
    options: ['Yes', 'No', 'Not sure - I will check with the venue coordinator'],
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Connectivity',
    label: 'Wi-Fi & Connectivity - Does the venue provide reliable Wi-Fi for vendors, or is there strong cellular service in the setup area?',
    input: 'choice',
    options: ['Yes, Wi-Fi is available', 'No Wi-Fi, but cell service is great', 'Unsure/Likely poor connectivity'],
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: WiFi details',
    label: 'If Wi-Fi is available, please provide the Network Name and Password here',
    input: 'text',
    newVenue: true,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Attendant food',
    label: 'Will food be provided to the photo booth attendant?',
    input: 'choice',
    options: YES_NO_UNSURE,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Other info',
    label: 'Please provide any other relevant info for your event',
    input: 'textarea',
  },
  {
    kind: 'field',
    key: 'Photo Booth: Backdrop',
    label: 'What kind of backdrop would you like?',
    help: 'Our backdrops are 8 feet wide by 8 feet tall',
    input: 'choice',
    options: BACKDROPS,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Print size',
    label: 'What size prints would you like?',
    input: 'choice',
    options: PRINTS,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Template',
    label: 'What kind of photo template would you prefer?',
    input: 'choice',
    options: TEMPLATES,
  },
  {
    kind: 'field',
    key: 'Photo Booth: Personalization',
    label:
      'Personalization Details\n\nShare the exact wording you’d like in the blank spaces of your chosen template (if applicable).\n\nPlease email any logo files or custom artwork to anders@andershyattmusic.com.\n\nPopular choices (for weddings) include first names, initials, and the wedding date, but you’re welcome to personalize it however you’d like. Need inspiration? We’re happy to send sample designs.',
    input: 'textarea',
  },
  {
    kind: 'field',
    key: 'Photo Booth: Props',
    label: 'Props - which, if any, of the following prop collections would you like?',
    input: 'checks',
    options: PROPS,
  },
  {
    kind: 'note',
    text: 'Want to chat through the details? Design elements like print layouts, text/logos, and booth screen graphics can be easier to finalize over a quick call. Totally optional, but welcomed!',
    href: 'https://andershyattmusic.hbportal.co/schedule/5f7224dbc62f230597f7c446',
    linkLabel: 'Click here to schedule a call',
  },
]

export const PHOTO_BOOTH_FIELDS = PHOTO_BOOTH_ITEMS.filter((item): item is BoothField => item.kind === 'field')

export const RETIRED_PHOTO_BOOTH_KEYS = [
  'Photo Booth start/end',
  'Photo Booth backdrop',
  'Photo Booth template',
  'Photo Booth logo/text',
  'Photo Booth props',
]
