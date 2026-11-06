/** One row from the public Events sheet, or the bundled fallback. */
export interface PublicEvent {
  /** Calendar date, preferably YYYY-MM-DD. */
  date: string
  start: string
  end: string
  title: string
  location: string
  /** Blank, YES, or true means the row is listed. */
  show?: string
  details?: string
  link?: string
}

/**
 * Used when the Events sheet cannot be reached.
 * Sheet: Anders Hyatt Music — Website Events
 * https://docs.google.com/spreadsheets/d/1k0aKkSn3u1jkdLXKxCrp58_tOta4Gwybo_MD8kS8Wxg
 */
export const fallbackEvents: PublicEvent[] = [
  {
    date: '2026-11-20',
    start: '7:00 PM',
    end: '10:00 PM',
    title: 'Live acoustic',
    location: 'Temperance House, Newtown, PA',
    show: 'YES',
  },
  {
    date: '2026-12-04',
    start: '7:00 PM',
    end: '10:00 PM',
    title: 'Live acoustic',
    location: 'Temperance House, Newtown, PA',
    show: 'YES',
  },
  {
    date: '2026-12-11',
    start: '7:00 PM',
    end: '10:00 PM',
    title: 'Live acoustic',
    location: 'Temperance House, Newtown, PA',
    show: 'YES',
  },
]
