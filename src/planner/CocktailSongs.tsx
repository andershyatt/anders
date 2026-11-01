import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  MAX_COCKTAIL_MUST_PLAYS,
  MAX_COCKTAIL_SONGS,
  parseCocktailSongs,
  serializeCocktailSongs,
  typedCocktailSong,
  type CocktailSong,
} from './cocktailSongs'
import { searchSongs, type SongMatch } from './songSearch'

const MIN_QUERY = 2
const DEBOUNCE_MS = 300

interface CocktailRow extends CocktailSong {
  id: string
}

interface CocktailSongsProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function songId(): string {
  return crypto.randomUUID()
}

function rowsFromValue(raw: string): CocktailRow[] {
  return parseCocktailSongs(raw).map((song) => ({ ...song, id: songId() }))
}

function sameSong(left: CocktailSong, right: CocktailSong): boolean {
  return left.title.toLowerCase() === right.title.toLowerCase() && left.artist.toLowerCase() === right.artist.toLowerCase()
}

export default function CocktailSongs({ label, value, onChange }: CocktailSongsProps) {
  const listId = useId()
  const [rows, setRows] = useState<CocktailRow[]>(() => rowsFromValue(value))
  const [source, setSource] = useState(value)
  if (value !== source) {
    setSource(value)
    setRows(rowsFromValue(value))
  }
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SongMatch[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const full = rows.length >= MAX_COCKTAIL_SONGS
  const mustPlays = rows.filter((song) => song.mustPlay).length

  useEffect(() => {
    if (!open || query.trim().length < MIN_QUERY) return
    const controller = new AbortController()
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      searchSongs(query.trim(), controller.signal)
        .then((matches) => {
          if (cancelled) return
          setResults(matches)
          setActiveIndex(0)
          setLoading(false)
        })
        .catch((error: unknown) => {
          if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return
          setResults([])
          setLoading(false)
          setOpen(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, query])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const commit = (next: CocktailRow[]) => {
    const serialized = serializeCocktailSongs(next)
    setSource(serialized)
    setRows(next)
    onChange(serialized)
  }

  const addSong = (song: CocktailSong) => {
    if (full) {
      setMessage('You can add up to 30 songs.')
      return
    }
    if (rows.some((row) => sameSong(row, song))) {
      setMessage('That song is already on the list.')
      setQuery('')
      setOpen(false)
      setResults([])
      return
    }
    const row = { ...song, id: songId() }
    commit([...rows, row])
    if (song.note) setOpenNotes((current) => ({ ...current, [row.id]: true }))
    setQuery('')
    setResults([])
    setOpen(false)
    setMessage('')
  }

  const showList = open && query.trim().length >= MIN_QUERY && !full && (loading || results.length > 0)
  const typed = typedCocktailSong(query)

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + 1) % results.length)
      return
    }
    if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current - 1 + results.length) % results.length)
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (showList && results[activeIndex]) {
        addSong({
          title: results[activeIndex].title,
          artist: results[activeIndex].artist,
          artwork: results[activeIndex].artwork,
          mustPlay: false,
          note: '',
        })
        return
      }
      if (typed) addSong(typed)
    }
  }

  return (
    <div className="planner-songlist" ref={rootRef}>
      <div className="planner-songlist__heading">
        <p className="planner-dance__label" id={`${listId}-label`}>
          {label}
        </p>
        <p className="planner-songlist__count">
          {rows.length}/{MAX_COCKTAIL_SONGS} songs · {mustPlays}/{MAX_COCKTAIL_MUST_PLAYS} must-plays
        </p>
      </div>
      <div className="planner-venue__control">
        <input
          type="text"
          aria-labelledby={`${listId}-label`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-results`}
          aria-autocomplete="list"
          placeholder={full ? 'Song list is full' : 'Search Apple Music or type a song'}
          value={query}
          disabled={full}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setMessage('')
            if (event.target.value.trim().length < MIN_QUERY) setResults([])
          }}
          onFocus={() => {
            if (query.trim().length >= MIN_QUERY) setOpen(true)
          }}
          onKeyDown={onSearchKeyDown}
        />
        {showList && (
          <ul className="planner-venue__list" id={`${listId}-results`} role="listbox">
            {loading && results.length === 0 && <li className="planner-venue__status">Searching songs…</li>}
            {results.map((song, index) => (
              <li key={song.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`planner-venue__option planner-song__option${index === activeIndex ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    addSong({
                      title: song.title,
                      artist: song.artist,
                      artwork: song.artwork,
                      mustPlay: false,
                      note: '',
                    })
                  }
                >
                  {song.artwork ? (
                    <img className="planner-song__art" src={song.artwork} alt="" />
                  ) : (
                    <span className="planner-song__art" />
                  )}
                  <span className="planner-song__text">
                    <span className="planner-venue__name">{song.title}</span>
                    {song.artist && <span className="planner-venue__address">{song.artist}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {typed && !full && (
        <button type="button" className="planner-songlist__add" onClick={() => addSong(typed)}>
          Add “{typed.title}
          {typed.artist ? ` – ${typed.artist}` : ''}” as typed
        </button>
      )}
      {full && <p className="planner-songlist__message">You can add up to 30 songs.</p>}
      {message && (
        <p className="planner-songlist__message" role="status">
          {message}
        </p>
      )}
      {rows.length > 0 && (
        <ol className="planner-songlist__rows">
          {rows.map((song, index) => {
            const noteOpen = openNotes[song.id] ?? song.note.trim() !== ''
            return (
              <li key={song.id} className="planner-songlist__row">
                {song.artwork ? (
                  <img className="planner-song__art" src={song.artwork} alt="" />
                ) : (
                  <span className="planner-song__art" />
                )}
                <span className="planner-song__text">
                  <span className="planner-venue__name">
                    {song.title}
                    {song.artist ? ` – ${song.artist}` : ''}
                  </span>
                </span>
                <div className="planner-songlist__actions">
                  <button
                    type="button"
                    className={song.mustPlay ? 'is-selected' : undefined}
                    aria-pressed={song.mustPlay}
                    onClick={() => {
                      if (!song.mustPlay && mustPlays >= MAX_COCKTAIL_MUST_PLAYS) {
                        setMessage('You can mark up to 10 must-plays.')
                        return
                      }
                      setMessage('')
                      commit(rows.map((row) => (row.id === song.id ? { ...row, mustPlay: !row.mustPlay } : row)))
                    }}
                  >
                    Must-play
                  </button>
                  <button
                    type="button"
                    aria-expanded={noteOpen}
                    onClick={() => setOpenNotes((current) => ({ ...current, [song.id]: !noteOpen }))}
                  >
                    {noteOpen ? 'Hide note' : 'Note'}
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${song.title} up`}
                    disabled={index === 0}
                    onClick={() => {
                      const next = rows.slice()
                      const [item] = next.splice(index, 1)
                      next.splice(index - 1, 0, item)
                      commit(next)
                    }}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${song.title} down`}
                    disabled={index === rows.length - 1}
                    onClick={() => {
                      const next = rows.slice()
                      const [item] = next.splice(index, 1)
                      next.splice(index + 1, 0, item)
                      commit(next)
                    }}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${song.title}`}
                    onClick={() => {
                      setMessage('')
                      commit(rows.filter((row) => row.id !== song.id))
                    }}
                  >
                    Remove
                  </button>
                </div>
                {noteOpen && (
                  <label className="planner-songlist__note">
                    <span className="sr-only">Note for {song.title}</span>
                    <input
                      type="text"
                      value={song.note}
                      placeholder="Optional note"
                      onChange={(event) =>
                        commit(rows.map((row) => (row.id === song.id ? { ...row, note: event.target.value } : row)))
                      }
                    />
                  </label>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
