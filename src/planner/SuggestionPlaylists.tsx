import { useState } from 'react'
import type { SuggestionPlaylist, SuggestedSong } from './suggestions'

/** Songs shown before the rest of a long playlist is revealed. */
const VISIBLE_SONGS = 100

interface SuggestionPlaylistsProps {
  playlists: SuggestionPlaylist[]
  isAdded: (song: SuggestedSong) => boolean
  onAdd: (song: SuggestedSong) => void
}

function PlaylistSongs({
  playlist,
  isAdded,
  onAdd,
}: {
  playlist: SuggestionPlaylist
  isAdded: (song: SuggestedSong) => boolean
  onAdd: (song: SuggestedSong) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? playlist.songs : playlist.songs.slice(0, VISIBLE_SONGS)
  const hidden = playlist.songs.length - visible.length
  return (
    <>
      <ul className="planner-suggest">
        {visible.map((song, index) => {
          const added = isAdded(song)
          return (
            <li key={`${playlist.id}-${index}`}>
              <span>
                {song.title}
                {song.artist ? ` – ${song.artist}` : ''}
              </span>
              <button type="button" className={added ? 'is-added' : undefined} disabled={added} onClick={() => onAdd(song)}>
                {added ? 'Added ✓' : 'Add'}
              </button>
            </li>
          )
        })}
      </ul>
      {hidden > 0 && (
        <button type="button" className="planner-show-more" onClick={() => setExpanded(true)}>
          Show more
        </button>
      )}
    </>
  )
}

/** Collapsed playlist titles. Add another list by passing another playlist. */
export default function SuggestionPlaylists({ playlists, isAdded, onAdd }: SuggestionPlaylistsProps) {
  if (playlists.length === 0) return null
  return (
    <div className="planner-suggest-block">
      <p className="planner-dance__label">Suggested songs</p>
      {playlists.map((playlist) => (
        <details key={playlist.id} className="planner-playlist">
          <summary>{playlist.title}</summary>
          <PlaylistSongs playlist={playlist} isAdded={isAdded} onAdd={onAdd} />
        </details>
      ))}
    </div>
  )
}
