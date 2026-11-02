import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { searchSongs, type SongMatch } from './songSearch'
import SuggestionBrowser from './SuggestionBrowser'
import type { SuggestedSong } from './suggestions'

const MIN_QUERY = 2
const DEBOUNCE_MS = 300
const MAX_SONGS = 7

interface IntroSong {
  title: string
  artist: string
  artwork: string
  who: string
}

interface IntroRow extends IntroSong {
  id: string
}

interface IntroSongsProps {
  label: string
  value: string
  onChange: (value: string) => void
  suggestions?: SuggestedSong[]
}

function songId(): string {
  return crypto.randomUUID()
}

function parseIntroSongs(raw: string): IntroSong[] {
  if (!raw.trim()) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const songs: IntroSong[] = []
    for (const item of data) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title.trim() : ''
      if (!title) continue
      songs.push({
        title,
        artist: typeof record.artist === 'string' ? record.artist.trim() : '',
        artwork: typeof record.artwork === 'string' ? record.artwork : '',
        who: typeof record.who === 'string' ? record.who : '',
      })
      if (songs.length === MAX_SONGS) break
    }
    return songs
  } catch {
    return []
  }
}

function serializeIntroSongs(songs: IntroSong[]): string {
  if (songs.length === 0) return ''
  return JSON.stringify(songs.map(({ title, artist, artwork, who }) => ({ title, artist, artwork, who })))
}

function typedSong(query: string): IntroSong | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  const parts = trimmed.split(' – ')
  const title = parts[0]?.trim() ?? ''
  if (!title) return null
  return { title, artist: parts.slice(1).join(' – ').trim(), artwork: '', who: '' }
}

export default function IntroSongs({ label, value, onChange, suggestions = [] }: IntroSongsProps) {
  const listId = useId()
  const [rows, setRows] = useState<IntroRow[]>(() => parseIntroSongs(value).map((song) => ({ ...song, id: songId() })))
  const [source, setSource] = useState(value)
  if (value !== source) {
    setSource(value)
    setRows(parseIntroSongs(value).map((song) => ({ ...song, id: songId() })))
  }
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SongMatch[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [browsing, setBrowsing] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const full = rows.length >= MAX_SONGS

  useEffect(() => {
    if (suggestions.length === 0) return
    const onPop = () => setBrowsing(window.history.state?.plannerBrowse === 'introduction-songs')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [suggestions.length])

  const openBrowse = () => {
    window.history.pushState({ ...(window.history.state ?? {}), plannerBrowse: 'introduction-songs' }, '')
    setBrowsing(true)
  }

  const closeBrowse = () => {
    if (window.history.state?.plannerBrowse === 'introduction-songs') window.history.back()
    else setBrowsing(false)
  }

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

  const commit = (next: IntroRow[]) => {
    const serialized = serializeIntroSongs(next)
    setSource(serialized)
    setRows(next)
    onChange(serialized)
  }

  const addSong = (song: IntroSong) => {
    if (full) {
      setMessage(`You can add up to ${MAX_SONGS} songs.`)
      return
    }
    if (rows.some((row) => row.title.toLowerCase() === song.title.toLowerCase() && row.artist.toLowerCase() === song.artist.toLowerCase())) {
      setMessage('That song is already on the list.')
      setQuery('')
      setOpen(false)
      setResults([])
      return
    }
    commit([...rows, { ...song, id: songId() }])
    setQuery('')
    setResults([])
    setOpen(false)
    setMessage('')
  }

  const showList = open && query.trim().length >= MIN_QUERY && !full && (loading || results.length > 0)
  const typed = typedSong(query)

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
        addSong({ title: results[activeIndex].title, artist: results[activeIndex].artist, artwork: results[activeIndex].artwork, who: '' })
        return
      }
      if (typed) addSong(typed)
    }
  }

  if (browsing) {
    return (
      <SuggestionBrowser
        title="Introduction Songs"
        songs={suggestions}
        onClose={closeBrowse}
        onPick={(song) => {
          addSong({ title: song.title, artist: song.artist, artwork: '', who: '' })
          closeBrowse()
        }}
      />
    )
  }

  return (
    <div className="planner-songlist" ref={rootRef}>
      <div className="planner-songlist__heading">
        <p className="planner-dance__label" id={`${listId}-label`}>
          {label}
        </p>
        <p className="planner-songlist__count">
          {rows.length} of {MAX_SONGS} songs
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
                  onClick={() => addSong({ title: song.title, artist: song.artist, artwork: song.artwork, who: '' })}
                >
                  {song.artwork ? <img className="planner-song__art" src={song.artwork} alt="" /> : <span className="planner-song__art" />}
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
      {suggestions.length > 0 && (
        <button type="button" className="planner-browse" onClick={openBrowse}>
          Browse suggestions
        </button>
      )}
      {message && (
        <p className="planner-songlist__message" role="status">
          {message}
        </p>
      )}
      {rows.length > 0 && (
        <ol className="planner-songlist__rows">
          {rows.map((song, index) => (
            <li key={song.id} className="planner-songlist__row">
              {song.artwork ? <img className="planner-song__art" src={song.artwork} alt="" /> : <span className="planner-song__art" />}
              <span className="planner-song__text">
                <span className="planner-venue__name">
                  {song.title}
                  {song.artist ? ` – ${song.artist}` : ''}
                </span>
              </span>
              <div className="planner-songlist__actions">
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
              <label className="planner-songlist__note">
                <span>Who will be walking out to this song?</span>
                <input
                  type="text"
                  value={song.who}
                  onChange={(event) => commit(rows.map((row) => (row.id === song.id ? { ...row, who: event.target.value } : row)))}
                />
              </label>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
