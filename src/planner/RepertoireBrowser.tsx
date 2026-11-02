import { useMemo, useState } from 'react'
import { EMPTY_SONG_FILTERS, filterSongs, songFilterChoices, type SongFilters } from './filterSongs'
import { repertoireCatalog } from './repertoire'

interface RepertoireBrowserProps {
  onAdd: (song: { title: string; artist: string }) => void
}

/** Live repertoire browser. Filters match the Build Playlist page. */
export default function RepertoireBrowser({ onAdd }: RepertoireBrowserProps) {
  const songs = useMemo(() => repertoireCatalog(), [])
  const choices = useMemo(() => songFilterChoices(songs), [songs])
  const [filters, setFilters] = useState<SongFilters>(EMPTY_SONG_FILTERS)
  const filtered = useMemo(() => filterSongs(songs, filters), [songs, filters])
  const set = (patch: Partial<SongFilters>) => setFilters((current) => ({ ...current, ...patch }))

  return (
    <div className="planner-repertoire">
      <p className="planner-dance__label">Search Anders&apos;s live repertoire</p>
      <input
        type="search"
        value={filters.query}
        placeholder="Search by title or artist…"
        onChange={(event) => set({ query: event.target.value })}
      />
      <div className="planner-repertoire__filters">
        <label>
          Genre
          <select value={filters.genre} onChange={(event) => set({ genre: event.target.value })}>
            <option value="">All</option>
            {choices.genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Decade
          <select value={filters.decade} onChange={(event) => set({ decade: event.target.value })}>
            <option value="">All</option>
            {choices.decades.map((decade) => (
              <option key={decade} value={decade}>
                {decade}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pace
          <select value={filters.pace} onChange={(event) => set({ pace: event.target.value })}>
            <option value="">All</option>
            {choices.paces.map((pace) => (
              <option key={pace} value={pace}>
                {pace}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tag
          <select value={filters.tag} onChange={(event) => set({ tag: event.target.value })}>
            <option value="">All</option>
            {choices.tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={filters.sortBy}
            onChange={(event) => set({ sortBy: event.target.value as SongFilters['sortBy'] })}
          >
            <option value="artist">Artist</option>
            <option value="title">Title</option>
          </select>
        </label>
        <button type="button" onClick={() => setFilters(EMPTY_SONG_FILTERS)}>
          Clear filters
        </button>
      </div>
      <p className="planner-songlist__count">
        Showing {filtered.length} of {songs.length} songs
      </p>
      <ul className="planner-suggest planner-repertoire__list">
        {filtered.map((song) => (
          <li key={song.id}>
            <span>
              {song.title}
              {song.artist ? ` – ${song.artist}` : ''}
            </span>
            <button type="button" onClick={() => onAdd({ title: song.title, artist: song.artist })}>
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
