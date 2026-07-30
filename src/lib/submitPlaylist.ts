import type { PlaylistSubmission, Song } from '../types/song'

const EMAIL_TO = 'anders@andershyattmusic.com'

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

export type SubmitMethod = 'copy' | 'download-txt' | 'download-csv' | 'mailto'

/**
 * Delivery adapter for client playlists.
 * Today: copy / download / mailto.
 * Later: replace the body of this function (or add a 'formspree' branch)
 * without changing the playlist UI.
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
    case 'mailto': {
      const subject = encodeURIComponent(
        `Playlist request${submission.contact.name ? ` from ${submission.contact.name}` : ''}`,
      )
      const body = encodeURIComponent(text)
      window.location.href = `mailto:${EMAIL_TO}?subject=${subject}&body=${body}`
      return {
        ok: true,
        message: 'Opening your email app with the playlist drafted.',
      }
    }
    default:
      return { ok: false, message: 'Unknown submit method.' }
  }
}
