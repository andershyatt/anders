import { useDeferredValue, useMemo, useState } from 'react'
import { usePlaylist } from '../hooks/usePlaylist'
import { useSongCatalog } from '../lib/songCatalog'
import { submitPlaylist, type SubmitMethod } from '../lib/submitPlaylist'
import type { PlaylistContact, Song } from '../types/song'
import { LINEUP_FILTERS, filterSongs, songFilterChoices } from '../planner/filterSongs'
import './Playlist.css'

function trayStartsCollapsed(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches
}

export default function Playlist() {
  const { songs, status: songSource } = useSongCatalog()
  const playlist = usePlaylist(songs)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [genre, setGenre] = useState('')
  const [decade, setDecade] = useState('')
  const [pace, setPace] = useState('')
  const [tag, setTag] = useState('')
  const [lineups, setLineups] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'artist' | 'title'>('artist')
  const [step, setStep] = useState<'browse' | 'submit'>('browse')
  const [trayCollapsed, setTrayCollapsed] = useState(trayStartsCollapsed)
  const [contact, setContact] = useState<PlaylistContact>({
    name: '',
    email: '',
    eventDate: '',
    notes: '',
  })
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const { genres, decades, paces, tags } = useMemo(() => songFilterChoices(songs), [songs])

  const filtered = useMemo(
    () => filterSongs(songs, { query: deferredQuery, genre, decade, pace, tag, lineups, sortBy }),
    [songs, deferredQuery, genre, decade, pace, tag, lineups, sortBy],
  )

  const clearFilters = () => {
    setQuery('')
    setGenre('')
    setDecade('')
    setPace('')
    setTag('')
    setLineups([])
  }

  const toggleLineup = (label: string) => {
    setLineups((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    )
  }

  const onSubmit = async (method: SubmitMethod) => {
    if (!playlist.count) {
      setStatus({ ok: false, message: 'Add at least one song before sending.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const result = await submitPlaylist(
        { songs: playlist.selectedSongs, contact },
        method,
      )
      setStatus(result)
    } catch (err) {
      setStatus({
        ok: false,
        message: err instanceof Error ? err.message : 'Something went wrong.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-content playlist-page left">
      <div className="playlist-intro">
        <h2>Live Song List</h2>
        <div className="divider" />
        <p>
          Search and filter Anders&apos;s song list, add the ones you love, then send the
          playlist for your event. Your selections are saved in this browser until you clear
          them.
        </p>
      </div>

      {step === 'browse' ? (
        <>
          <div className="playlist-toolbar">
            <label className="playlist-search">
              <span className="sr-only">Search songs</span>
              <input
                type="search"
                placeholder="Search by title or artist…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <div className="playlist-lineups" role="group" aria-label="Lineup filters">
              {LINEUP_FILTERS.map((label) => {
                const selected = lineups.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    className={`playlist-lineup${selected ? ' playlist-lineup--on' : ''}`}
                    aria-pressed={selected}
                    onClick={() => toggleLineup(label)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="playlist-filters">
              {genres.length > 0 && (
                <label>
                  Genre
                  <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                    <option value="">All</option>
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {decades.length > 0 && (
                <label>
                  Decade
                  <select value={decade} onChange={(e) => setDecade(e.target.value)}>
                    <option value="">All</option>
                    {decades.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {paces.length > 0 && (
                <label>
                  Pace
                  <select value={pace} onChange={(e) => setPace(e.target.value)}>
                    <option value="">All</option>
                    {paces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {tags.length > 0 && (
                <label>
                  Tag
                  <select value={tag} onChange={(e) => setTag(e.target.value)}>
                    <option value="">All</option>
                    {tags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Sort
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'artist' | 'title')}
                >
                  <option value="artist">Artist</option>
                  <option value="title">Title</option>
                </select>
              </label>
              <button type="button" className="btn btn-outline playlist-clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            </div>

            <p className="playlist-count">
              {songSource === 'loading'
                ? 'Loading songs…'
                : `Showing ${filtered.length} of ${songs.length} songs`}
              {songSource === 'saved' && ' (saved copy — the live sheet did not load)'}
            </p>
          </div>

          <div className="playlist-layout">
            <div className="playlist-results" role="list">
              {songSource === 'loading' ? (
                <p className="playlist-empty">Loading songs…</p>
              ) : (
                <ul>
                  {filtered.map((song) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      selected={playlist.isSelected(song.id)}
                      onToggle={() => playlist.toggle(song.id)}
                    />
                  ))}
                </ul>
              )}
              {songSource !== 'loading' && filtered.length === 0 && (
                <p className="playlist-empty">No songs match those filters.</p>
              )}
            </div>

            <aside className="playlist-tray" aria-live="polite">
              <div className="playlist-tray__header">
                <h3>Your playlist</h3>
                <div className="playlist-tray__header-side">
                  <span>{playlist.count}</span>
                  <button
                    type="button"
                    className="playlist-tray__toggle"
                    aria-expanded={!trayCollapsed}
                    aria-controls="your-playlist-body"
                    onClick={() => setTrayCollapsed((collapsed) => !collapsed)}
                  >
                    {trayCollapsed ? 'Expand ▾' : 'Collapse ▴'}
                  </button>
                </div>
              </div>
              <div id="your-playlist-body" className="playlist-tray__body" hidden={trayCollapsed}>
                {playlist.count === 0 ? (
                  <p className="playlist-tray__empty">Click songs to add them here.</p>
                ) : (
                  <ul className="playlist-tray__list">
                    {playlist.selectedSongs.map((song, index) => (
                      <li key={song.id}>
                        <span className="playlist-tray__line" title={`${song.artist} - ${song.title}`}>
                          {song.artist} - {song.title}
                        </span>
                        <div className="playlist-tray__actions">
                          <button
                            type="button"
                            aria-label="Move up"
                            disabled={index === 0}
                            onClick={() => playlist.move(song.id, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label="Move down"
                            disabled={index === playlist.count - 1}
                            onClick={() => playlist.move(song.id, 1)}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${song.title}`}
                            onClick={() => playlist.remove(song.id)}
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="playlist-tray__footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!playlist.count}
                    onClick={playlist.clear}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={!playlist.count}
                    onClick={() => setStep('submit')}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="playlist-submit">
          <button type="button" className="playlist-back" onClick={() => setStep('browse')}>
            ← Back to songs
          </button>
          <h3>Send your playlist ({playlist.count} songs)</h3>
          <p>
            Add your contact details, then send the playlist to Anders. You can also copy it or
            download a text or CSV file.
          </p>

          <div className="playlist-form">
            <label>
              Name
              <input
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                autoComplete="name"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                autoComplete="email"
              />
            </label>
            <label>
              Event date
              <input
                type="date"
                value={contact.eventDate}
                onChange={(e) => setContact({ ...contact, eventDate: e.target.value })}
              />
            </label>
            <label>
              Notes
              <textarea
                rows={4}
                value={contact.notes}
                onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                placeholder="Ceremony, cocktail hour, must-plays, do-not-plays…"
              />
            </label>
          </div>

          <div className="playlist-submit-actions">
            <button
              type="button"
              className="btn playlist-send"
              disabled={busy}
              onClick={() => onSubmit('send')}
            >
              Send to Anders
            </button>
            <div className="playlist-submit-actions__row">
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => onSubmit('copy')}
              >
                Copy playlist
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => onSubmit('download-txt')}
              >
                Download .txt
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => onSubmit('download-csv')}
              >
                Download .csv
              </button>
            </div>
          </div>

          {status && (
            <p
              className={`playlist-status${status.ok ? '' : ' playlist-status--error'}`}
              role={status.ok ? 'status' : 'alert'}
            >
              {status.message}
            </p>
          )}

          <ol className="playlist-preview">
            {playlist.selectedSongs.map((s, i) => (
              <li key={s.id}>
                {i + 1}. {s.title} — {s.artist}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function SongRow({
  song,
  selected,
  onToggle,
}: {
  song: Song
  selected: boolean
  onToggle: () => void
}) {
  return (
    <li role="listitem">
      <button
        type="button"
        className={`playlist-song${selected ? ' playlist-song--selected' : ''}`}
        onClick={onToggle}
        aria-pressed={selected}
      >
        <span className="playlist-song__check" aria-hidden="true">
          {selected ? '✓' : ''}
        </span>
        <span className="playlist-song__line">
          {song.artist} - {song.title}
        </span>
      </button>
    </li>
  )
}
