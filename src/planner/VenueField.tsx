import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { searchVenues, type VenueMatch } from './venueSearch'

const MIN_QUERY = 3
const DEBOUNCE_MS = 400

interface VenueFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  onPick: (place: VenueMatch) => void
}

export default function VenueField({ id, value, onChange, onPick }: VenueFieldProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<VenueMatch[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const query = value.trim()
    if (query.length < MIN_QUERY) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setStatus('loading')
      searchVenues(query, controller.signal)
        .then((matches) => {
          setResults(matches)
          setActiveIndex(0)
          setStatus('done')
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setResults([])
          setStatus('error')
        })
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, value])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const choose = (place: VenueMatch) => {
    setOpen(false)
    setResults([])
    setStatus('idle')
    onPick(place)
  }

  const showList = open && value.trim().length >= MIN_QUERY && status !== 'idle'

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (results.length === 0 ? 0 : (current + 1) % results.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) =>
        results.length === 0 ? 0 : (current - 1 + results.length) % results.length,
      )
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'Enter' && showList && results[activeIndex]) {
      event.preventDefault()
      choose(results[activeIndex])
    }
  }

  return (
    <div className="planner-field planner-venue" ref={rootRef}>
      <label htmlFor={id}>Venue</label>
      <div className="planner-venue__control">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        value={value}
        placeholder="Start typing a venue name"
        autoComplete="off"
        onChange={(event) => {
          const next = event.target.value
          onChange(next)
          setOpen(true)
          if (next.trim().length < MIN_QUERY) {
            setResults([])
            setStatus('idle')
          }
        }}
        onFocus={() => {
          if (value.trim().length >= MIN_QUERY) setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="planner-venue__list" id={listId} role="listbox">
          {status === 'loading' && <li className="planner-venue__status">Searching places…</li>}
          {status === 'error' && (
            <li className="planner-venue__status">Place search is unavailable. You can still type the venue.</li>
          )}
          {status === 'done' && results.length === 0 && (
            <li className="planner-venue__status">No matching places. Keep typing, or enter the venue yourself.</li>
          )}
          {results.map((place, index) => (
            <li key={place.id} role="presentation">
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`planner-venue__option${index === activeIndex ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(place)}
              >
                <span className="planner-venue__name">{place.name}</span>
                {place.address && <span className="planner-venue__address">{place.address}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
      <p className="planner-venue__credit">
        Place search by{' '}
        <a href="https://photon.komoot.io/" target="_blank" rel="noopener noreferrer">
          Photon
        </a>{' '}
        and{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>
        .
      </p>
    </div>
  )
}
