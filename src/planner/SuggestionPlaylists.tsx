import type { SuggestionPlaylist, SuggestedSong } from './suggestions'

interface SuggestionPlaylistsProps {
  playlists: SuggestionPlaylist[]
  isAdded: (song: SuggestedSong) => boolean
  onAdd: (song: SuggestedSong) => void
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
          <ul className="planner-suggest">
            {playlist.songs.map((song) => {
              const added = isAdded(song)
              return (
                <li key={`${playlist.id}-${song.title}-${song.artist}`}>
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
        </details>
      ))}
    </div>
  )
}
