export type Pace = 'Slow' | 'Medium' | 'Upbeat'

export interface Song {
  id: string
  title: string
  artist: string
  /** Primary genre (first flagged genre in the CSV). */
  genre?: string
  /** All flagged genres. */
  genres?: string[]
  year?: number
  decade?: string
  pace?: Pace
  tags?: string[]
  link?: string
}

export interface PlaylistContact {
  name: string
  email: string
  eventDate: string
  notes: string
}

export interface PlaylistSubmission {
  songs: Song[]
  contact: PlaylistContact
}
