import { useEffect, useMemo, useRef, useState } from 'react'
import type { SuggestedSong } from './suggestions'

interface SuggestionBrowserProps {
  title: string
  songs: SuggestedSong[]
  onPick: (song: SuggestedSong) => void
  onClose: () => void
}

/** Full-screen suggestion list. The parent owns the history entry. */
export default function SuggestionBrowser({ title, songs, onPick, onClose }: SuggestionBrowserProps) {
  const backRef = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [revealedFor, setRevealedFor] = useState<string | null>(null)
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return songs
    return songs.filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(needle))
  }, [query, songs])
  const expanded = revealedFor === query
  const shown = expanded ? filtered : filtered.slice(0, 100)
  const hidden = filtered.length - shown.length

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    backRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="planner-picker" role="dialog" aria-modal="true" aria-label={title}>
      <div className="planner-picker__bar">
        <button ref={backRef} type="button" className="planner-picker__back" onClick={onClose}>
          Back
        </button>
        <p>{title}</p>
      </div>
      <div className="planner-picker__body">
        {songs.length > 40 && (
          <input
            className="planner-repertoire input"
            type="text"
            value={query}
            placeholder="Search these songs"
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        {shown.length === 0 ? (
          <p className="planner-note">No suggestions are available right now.</p>
        ) : (
          <ul className="planner-suggest">
            {shown.map((song, index) => (
              <li key={`${index}-${song.title}-${song.artist}`}>
                <span>
                  {song.title}
                  {song.artist ? ` – ${song.artist}` : ''}
                </span>
                <button type="button" onClick={() => onPick(song)}>
                  Choose
                </button>
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 && (
          <button type="button" className="planner-show-more" onClick={() => setRevealedFor(query)}>
            Show more
          </button>
        )}
      </div>
    </div>
  )
}
