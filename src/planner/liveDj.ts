import type { PlannerField, PlannerSection } from './fields'

const PLAYLIST_NOTE = 'You can also paste a link to a Spotify or Apple Music playlist in this box.'

const COCKTAIL_VIBE =
  "If you don't have specific song requests, what type of vibe/genres would you like to hear? Feel free to give any type of general guidance you would like. Musician's/DJ's choice is also an option! " +
  PLAYLIST_NOTE

const FADE_LABEL = "If you have a specific timestamp where you'd like us to fade out, please share below."
const START_CUE = 'Cue for when to start the song'
const STOP_CUE = 'Cue for when to stop the song'

/** New answers only a live-and-DJ couple is asked. Order is the order to append in Apps Script. */
export const LIVE_DJ_EXTRA: PlannerField[] = [
  {
    key: 'Pre-ceremony performance',
    label: 'What kind of performance would you like during this time?',
    kind: 'checks',
    heading: 'Pre-ceremony music / Guest arrival',
    note: 'Music to be played pre-ceremony while guests arrive. Music will begin 30 minutes prior to ceremony start time.',
    options: ['DJ playing music', 'Instrumental live music', 'Live music with vocals', 'Up to Anders'],
  },
  {
    key: 'Pre-ceremony music type',
    label: 'What type of music would you like during this time?',
    kind: 'checks',
    note: 'Light instrumental covers of popular songs is what we typically do at this time, but we are open to suggestions.',
    options: [
      'Light instrumental music sounds great!',
      "Live music with vocals - musician's choice",
      "We have some song requests/suggestions that we'll add to the 'Notes' portion of this section",
    ],
  },
  {
    key: 'Introductions happening',
    label: 'Are you having introductions?',
    kind: 'yesno',
    heading: 'Introductions',
  },
  {
    key: 'Who is being introduced',
    label: 'Who is being introduced?',
    kind: 'checks',
    options: ['Us (the couple)', 'The wedding party', 'Family members'],
  },
  {
    key: 'Couple introduction name',
    label:
      'How would you like to be named as a couple during introductions? (e.g. first names only, Mr. & Mrs. something, etc.)',
    kind: 'text',
  },
  {
    key: 'First dance choreographed',
    label: 'Is your first dance choreographed?',
    kind: 'yesno',
  },
  { key: 'First dance start cue', label: START_CUE, kind: 'text' },
  { key: 'First dance stop cue', label: STOP_CUE, kind: 'text' },
  { key: 'First dance fade out', label: FADE_LABEL, kind: 'textarea' },
  {
    key: 'Father of the bride name',
    label: "Father of the bride's name",
    kind: 'text',
    heading: 'Parent Dances',
  },
  {
    key: 'Father of the bride dance choreographed',
    label: 'Is the father of the bride dance choreographed?',
    kind: 'yesno',
  },
  { key: 'Father of the bride start cue', label: START_CUE, kind: 'text' },
  { key: 'Father of the bride stop cue', label: STOP_CUE, kind: 'text' },
  { key: 'Father of the bride fade out', label: FADE_LABEL, kind: 'textarea' },
  { key: 'Mother of the groom name', label: "Mother of the groom's name", kind: 'text' },
  {
    key: 'Mother of the groom dance choreographed',
    label: 'Is the mother of the groom dance choreographed?',
    kind: 'yesno',
  },
  { key: 'Mother of the groom start cue', label: START_CUE, kind: 'text' },
  { key: 'Mother of the groom stop cue', label: STOP_CUE, kind: 'text' },
  { key: 'Mother of the groom fade out', label: FADE_LABEL, kind: 'textarea' },
  {
    key: 'Other special dance',
    label:
      "Is there any other special dance you would like to have? If so, please describe how you'd like it performed.",
    kind: 'textarea',
  },
  {
    key: 'Other announcement notes',
    label: 'Notes',
    kind: 'textarea',
    heading: 'Other Announcements',
    note: "If you would like us to make any other announcements, please provide any specific instructions in the notes section below. We are comfortable going with the flow and making announcements as needed throughout the night.",
  },
  {
    key: 'Dinner music type',
    label: 'What type of performance would you like during dinner?',
    kind: 'yesno',
    heading: 'Dinner',
    options: ['Live', 'DJ', 'Mixture of both'],
  },
  {
    key: 'Dinner songs',
    label: 'Songs',
    kind: 'songlist',
    maxSongs: 50,
    maxMustPlays: 10,
  },
  {
    key: 'Dinner music notes',
    label: 'Notes',
    kind: 'textarea',
    help: PLAYLIST_NOTE,
  },
  {
    key: 'Clean music edits',
    label: 'Do you need clean edits of music played?',
    kind: 'yesno',
    stack: true,
    heading: 'Open Dancing',
    note: 'We aim to include as many of your requested tracks as possible. Since time is limited, please indicate your "must plays" so we can prioritize your favorite tracks in the setlist.',
    options: [
      'Yes, clean versions ONLY.',
      'No, we do not need clean versions played.',
      'Occasional curse words are OK but please avoid hardcore music/language.',
    ],
  },
  {
    key: 'Open dancing songs',
    label: 'Songs',
    kind: 'songlist',
    maxSongs: 100,
    maxMustPlays: 15,
  },
  {
    key: 'Slow songs preference',
    label: 'Do you want any slow songs played during the dancing portion?',
    kind: 'yesno',
    stack: true,
    heading: 'Slow Dance Songs',
    callout:
      'Playing a few slow songs throughout the event is a good idea! These dance breaks will allow the "non-dancers" to join in and also create great moments for photos of couples.',
    options: [
      'Yes, a few slow songs are fine.',
      'No more than 2 slow dances',
      'Only one slow dance',
      'No slow songs at all, keep the dance floor rocking.',
      'Only if requested.',
    ],
  },
  {
    key: 'Slow dance songs',
    label: 'Slow song choices',
    kind: 'songlist',
    maxSongs: 3,
    maxMustPlays: 0,
  },
  {
    key: 'Dance floor lighting',
    label: 'Would you like dance floor lighting to be used?',
    kind: 'yesno',
    stack: true,
    heading: 'Dance Floor Lighting',
    note: 'The setup includes 5–9 Chauvet DJ uplights placed around the dance floor, adding a nice ambiance once dancing begins and the house lights are dimmed.',
    image: 'chauvet',
    options: [
      'Yes, please use the dance floor lighting.',
      'No, we prefer not to use the dance floor lighting.',
      "We'll defer to the DJ's judgement on whether or not to use it.",
    ],
  },
  {
    key: 'Private last dance wanted',
    label: 'Would you like to end the night with a private last dance?',
    kind: 'yesno',
    heading: 'Private last dance',
    note: 'Some couples like to have a private dance after guests leave. Photographer usually stays. Your DJ may have to end the night a little early to make this accommodation if the venue has a strict ending time. This often works well in combination with a sparkler send off.',
  },
  {
    key: 'Do not play songs',
    label: 'Songs',
    kind: 'songlist',
    heading: 'Do Not Play',
    note: 'Often just as important as the play list. Please list any music or types of music that you do not want to hear at your wedding.',
    maxSongs: 50,
    maxMustPlays: 0,
  },
]

type FindField = (key: string) => PlannerField

function take(find: FindField, key: string, extras: Partial<PlannerField> = {}): PlannerField {
  return { ...find(key), ...extras }
}

export function liveDjCeremony(find: FindField): PlannerSection {
  return {
    id: 'ceremony',
    title: 'Ceremony',
    blurb: 'Songs and how you want them played.',
    fields: [
      take(find, 'Pre-ceremony performance'),
      take(find, 'Pre-ceremony music type'),
      take(find, 'Pre-ceremony music', { label: 'Notes' }),
      take(find, 'Wedding party processional song'),
      take(find, 'Wedding party processional style (instrumental/vocals)'),
      take(find, 'Bridal processional song'),
      take(find, 'Bridal processional style'),
      take(find, 'Recessional song'),
      take(find, 'Recessional style'),
      take(find, 'Recessional cue'),
    ],
  }
}

export function liveDjCocktail(find: FindField): PlannerSection {
  return {
    id: 'cocktail-hour',
    title: 'Cocktail Hour',
    blurb: '',
    fields: [
      take(find, 'Cocktail hour music type'),
      take(find, 'Cocktail hour vibe', { label: COCKTAIL_VIBE }),
      take(find, 'Cocktail hour songs'),
    ],
  }
}

export function liveDjReception(find: FindField): PlannerSection {
  return {
    id: 'reception',
    title: 'Reception',
    blurb: '',
    fields: [
      take(find, 'Introductions happening'),
      take(find, 'Who is being introduced'),
      take(find, 'Couple introduction name'),
      take(find, 'Introductions', {
        label: 'Notes',
        note: "If you'd like us to do your introductions, please provide a list of names in the order that they will be introduced, along with any special songs you'd like hear during your introductions. Please do this in the 'Notes' section below.",
      }),
      take(find, "Couple's first dance song", { heading: 'First Dance' }),
      take(find, 'First dance format (live/DJ, full/shortened)'),
      take(find, 'First dance choreographed'),
      take(find, 'First dance start cue'),
      take(find, 'First dance stop cue'),
      take(find, 'First dance fade out'),
      take(find, 'Father of the bride name'),
      take(find, 'Father/daughter dance song'),
      take(find, 'Father/daughter format'),
      take(find, 'Father of the bride dance choreographed'),
      take(find, 'Father of the bride start cue'),
      take(find, 'Father of the bride stop cue'),
      take(find, 'Father of the bride fade out'),
      take(find, 'Mother of the groom name'),
      take(find, 'Mother/son dance song'),
      take(find, 'Mother/son format'),
      take(find, 'Mother of the groom dance choreographed'),
      take(find, 'Mother of the groom start cue'),
      take(find, 'Mother of the groom stop cue'),
      take(find, 'Mother of the groom fade out'),
      take(find, 'Other special dance'),
      take(find, 'Toasts/speeches', {
        heading: 'Toasts/Speeches',
        label:
          'Please provide names/roles of anyone who will be giving a toast, welcome speech or blessing so they can be properly introduced.',
      }),
      take(find, 'Other announcement notes'),
      take(find, 'Things to remember'),
      take(find, 'Dinner music type'),
      take(find, 'Dinner songs'),
      take(find, 'Dinner music notes'),
      take(find, 'Clean music edits'),
      take(find, 'Open dancing songs'),
      take(find, 'DJ music requests'),
      take(find, 'Songs to learn'),
      take(find, 'Slow songs preference'),
      take(find, 'Slow dance songs'),
      take(find, 'Dance floor lighting'),
      take(find, 'Last song of the night with guests', {
        heading: 'Last song of the night (with guests)',
        note: 'This is your last dance song with your guests. End the night with a bang!',
        help: 'Please choose the last song you would like to hear on the dance floor with your guests. Upbeat dance songs help to end the night on a high note. Classic singalong songs always work well. A slow dance song can work too. Most importantly, it should be a song you love. This song will also signal the end of the evening.',
      }),
      take(find, 'Private last dance wanted'),
      take(find, 'Private last dance'),
      take(find, 'Do not play songs'),
      take(find, 'Do-not-play list', { label: 'Other music or styles to avoid' }),
    ],
  }
}
