import { PLANNER_API_URL } from '../planner/config'
import type { PlaylistContact, PlaylistSubmission, Song } from '../types/song'

/** Practical "looks like an email" check. Not a full RFC parser. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PlaylistSendErrors {
  name?: string
  email?: string
  eventDate?: string
}

export function playlistSendErrors(contact: PlaylistContact): PlaylistSendErrors {
  const errors: PlaylistSendErrors = {}
  if (!contact.name.trim()) errors.name = 'Name is required.'
  const email = contact.email.trim()
  if (!email) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter an email address like name@example.com.'
  }
  if (!contact.eventDate.trim()) errors.eventDate = 'Event date is required.'
  return errors
}

export function playlistSendErrorMessage(errors: PlaylistSendErrors): string | null {
  const messages = [errors.name, errors.email, errors.eventDate].filter(
    (message): message is string => Boolean(message),
  )
  return messages.length ? messages.join(' ') : null
}

/** The Apps Script web app emails this address. The page does not open a mail app. */
export const EMAIL_TO = 'anders@andershyattmusic.com'

export function formatPlaylistText(submission: PlaylistSubmission): string {
  const { contact, songs } = submission
  const lines = [
    'Anders Hyatt Music — Client Playlist',
    '',
    `Name: ${contact.name || '(not provided)'}`,
    `Email: ${contact.email || '(not provided)'}`,
    `Event date: ${contact.eventDate || '(not provided)'}`,
    `Notes: ${contact.notes || '(none)'}`,
    '',
    `Songs (${songs.length}):`,
    ...songs.map((s, i) => `${i + 1}. ${s.title} — ${s.artist}`),
  ]
  return lines.join('\n')
}

export function formatPlaylistCsv(songs: Song[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const rows = [
    'Title,Artist,Pace,Decade,Genres',
    ...songs.map((s) =>
      [
        escape(s.title),
        escape(s.artist),
        escape(s.pace ?? ''),
        escape(s.decade ?? ''),
        escape((s.genres ?? []).join('; ')),
      ].join(','),
    ),
  ]
  return rows.join('\n')
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type SubmitMethod = 'copy' | 'download-txt' | 'download-csv' | 'send'

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  const text = (await response.text()).trim()
  if (!text.startsWith('{')) return null
  try {
    const value = JSON.parse(text) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
  } catch {
    return null
  }
}

const SEND_ERROR =
  'Could not send the playlist. Please try again, or copy or download it instead.'

/**
 * Copy, download, or send the playlist.
 * Send posts { action: 'publicPlaylist' } to the planner Apps Script.
 * That action does not use a couple token. It emails EMAIL_TO from the script.
 */
export async function submitPlaylist(
  submission: PlaylistSubmission,
  method: SubmitMethod,
): Promise<{ ok: boolean; message: string }> {
  const text = formatPlaylistText(submission)

  switch (method) {
    case 'copy': {
      await navigator.clipboard.writeText(text)
      return { ok: true, message: 'Playlist copied to clipboard.' }
    }
    case 'download-txt': {
      downloadBlob('anders-playlist.txt', text, 'text/plain;charset=utf-8')
      return { ok: true, message: 'Downloaded anders-playlist.txt' }
    }
    case 'download-csv': {
      downloadBlob(
        'anders-playlist.csv',
        formatPlaylistCsv(submission.songs),
        'text/csv;charset=utf-8',
      )
      return { ok: true, message: 'Downloaded anders-playlist.csv' }
    }
    case 'send': {
      const name = submission.contact.name.trim()
      const email = submission.contact.email.trim()
      const eventDate = submission.contact.eventDate.trim()
      const blocked = playlistSendErrorMessage(playlistSendErrors(submission.contact))
      if (blocked) return { ok: false, message: blocked }
      try {
        const response = await fetch(PLANNER_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'publicPlaylist',
            name,
            email,
            eventDate,
            notes: submission.contact.notes.trim(),
            songs: submission.songs.map((song) => ({
              title: song.title,
              artist: song.artist,
            })),
          }),
        })
        const payload = await readJson(response)
        if (!payload || payload.ok !== true) return { ok: false, message: SEND_ERROR }
        return { ok: true, message: 'Sent to Anders. He has your songs and contact details.' }
      } catch {
        return { ok: false, message: SEND_ERROR }
      }
    }
    default:
      return { ok: false, message: 'Unknown submit method.' }
  }
}
