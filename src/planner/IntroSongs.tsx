import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
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
  const [pickedId, setPickedId] = useState('')
  const [justAdded, setJustAdded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const retainFocus = useRef(false)
  const requestSeq = useRef(0)
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
    if (browsing || !pickedId) return
    document.getElementById(`intro-row-${pickedId}`)?.scrollIntoView({ block: 'center' })
    const timer = window.setTimeout(() => setPickedId(''), 2400)
    return () => window.clearTimeout(timer)
  }, [browsing, pickedId])

  useEffect(() => {
    if (!open || query.trim().length < MIN_QUERY) return
    const controller = new AbortController()
    const seq = ++requestSeq.current
    const timer = window.setTimeout(() => {
      setLoading(true)
      searchSongs(query.trim(), controller.signal)
        .then((matches) => {
          if (seq !== requestSeq.current) return
          setResults(matches)
          setActiveIndex(0)
          setLoading(false)
          if (matches.length === 0) setOpen(false)
        })
        .catch((error: unknown) => {
          if (seq !== requestSeq.current || (error instanceof DOMException && error.name === 'AbortError')) return
          setResults([])
          setLoading(false)
          setOpen(false)
          setMessage('Song search is unavailable right now. You can still type the song name.')
        })
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, query])

  useLayoutEffect(() => {
    if (!retainFocus.current) return
    const element = searchRef.current
    if (element && document.activeElement !== element) element.focus({ preventScroll: true })
  })

  const commit = (next: IntroRow[]) => {
    const serialized = serializeIntroSongs(next)
    setSource(serialized)
    setRows(next)
    onChange(serialized)
  }

  const addSong = (song: IntroSong): string => {
    if (full) {
      setMessage(`You can add up to ${MAX_SONGS} songs.`)
      return ''
    }
    const existing = rows.find(
      (row) => row.title.toLowerCase() === song.title.toLowerCase() && row.artist.toLowerCase() === song.artist.toLowerCase(),
    )
    if (existing) {
      setMessage('That song is already on the list.')
      setQuery('')
      setOpen(false)
      setResults([])
      setJustAdded(true)
      return existing.id
    }
    const id = songId()
    commit([...rows, { ...song, id }])
    setQuery('')
    setResults([])
    setOpen(false)
    setMessage('')
    setJustAdded(true)
    return id
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
          const id = addSong({ title: song.title, artist: song.artist, artwork: '', who: '' })
          if (id) setPickedId(id)
          setBrowsing(false)
          if (window.history.state?.plannerBrowse === 'introduction-songs') window.history.back()
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
          ref={searchRef}
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
            retainFocus.current = true
            setQuery(event.target.value)
            setJustAdded(false)
            setOpen(true)
            setMessage('')
            if (event.target.value.trim().length < MIN_QUERY) setResults([])
          }}
          onFocus={() => {
            retainFocus.current = true
            if (query.trim().length >= MIN_QUERY) setOpen(true)
            window.setTimeout(() => searchRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' }), 300)
          }}
          onBlur={() => {
            retainFocus.current = false
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
                  onPointerDown={(event) => {
                    if (event.pointerType === 'mouse') return
                    event.preventDefault()
                    event.currentTarget.dataset.touched = '1'
                    addSong({ title: song.title, artist: song.artist, artwork: song.artwork, who: '' })
                  }}
                  onClick={(event) => {
                    if (event.currentTarget.dataset.touched === '1') {
                      delete event.currentTarget.dataset.touched
                      return
                    }
                    addSong({ title: song.title, artist: song.artist, artwork: song.artwork, who: '' })
                  }}
                >
                  {song.artwork ? <img className="planner-song__art" src={song.artwork} alt="" loading="lazy" decoding="async" /> : <span className="planner-song__art" />}
                  <span className="planner-song__text">
                    <span className="planner-venue__name">{song.title}</span>
                    {song.artist && <span className="planner-venue__address">{song.artist}</span>}
                  </span>
                  <span
                    className={
                      rows.some(
                        (row) =>
                          row.title.toLowerCase() === song.title.toLowerCase() &&
                          row.artist.toLowerCase() === song.artist.toLowerCase(),
                      )
                        ? 'planner-song__added'
                        : 'planner-song__add'
                    }
                  >
                    {rows.some(
                      (row) =>
                        row.title.toLowerCase() === song.title.toLowerCase() &&
                        row.artist.toLowerCase() === song.artist.toLowerCase(),
                    )
                      ? 'Added ✓'
                      : 'Add'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {justAdded ? (
        <button type="button" className="planner-songlist__add is-added" disabled>
          Added ✓
        </button>
      ) : (
        typed &&
        !full && (
          <button type="button" className="planner-songlist__add" onClick={() => addSong(typed)}>
            Add “{typed.title}
            {typed.artist ? ` – ${typed.artist}` : ''}” as typed
          </button>
        )
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
            <li key={song.id} id={`intro-row-${song.id}`} className={song.id === pickedId ? 'planner-songlist__row is-picked' : 'planner-songlist__row'}>
              {song.artwork ? <img className="planner-song__art" src={song.artwork} alt="" loading="lazy" decoding="async" /> : <span className="planner-song__art" />}
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
