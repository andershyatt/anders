import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent, type SyntheticEvent } from 'react'
import { replaceSongSegment, searchSongs, songSegment, type SongMatch } from './songSearch'
import { repertoireChoices, repertoireMatch } from './repertoire'
import SuggestionBrowser from './SuggestionBrowser'
import type { SuggestedSong } from './suggestions'

const MIN_QUERY = 2
const DEBOUNCE_MS = 300

interface SongFieldProps {
  id: string
  label: string
  help?: string
  hideLabel?: boolean
  suggestions?: SuggestedSong[]
  repertoireOnly?: boolean
  value: string
  multiline: boolean
  placeholder?: string
  rows?: number
  onChange: (value: string) => void
}

export default function SongField({
  id,
  label,
  help,
  hideLabel = false,
  suggestions = [],
  repertoireOnly = false,
  value,
  multiline,
  placeholder,
  rows = 4,
  onChange,
}: SongFieldProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SongMatch[]>([])
  const [resultsQuery, setResultsQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const setFieldRef = useCallback((node: HTMLInputElement | HTMLTextAreaElement | null) => {
    fieldRef.current = node
  }, [])
  const segmentRef = useRef({ start: 0, end: 0 })
  const valueRef = useRef(value)
  const caretAfterPick = useRef<number | null>(null)
  const ignoreSelect = useRef(false)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (suggestions.length === 0) return
    const onPop = () => setBrowsing(window.history.state?.plannerBrowse === id)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [id, suggestions.length])

  const openBrowse = () => {
    window.history.pushState({ ...(window.history.state ?? {}), plannerBrowse: id }, '')
    setBrowsing(true)
  }

  const closeBrowse = () => {
    if (window.history.state?.plannerBrowse === id) window.history.back()
    else setBrowsing(false)
  }

  const readQuery = (element: HTMLInputElement | HTMLTextAreaElement) => {
    if (!multiline) {
      segmentRef.current = { start: 0, end: element.value.length }
      const next = element.value.trim()
      setQuery(next)
      return next
    }
    const segment = songSegment(element.value, element.selectionStart ?? element.value.length)
    segmentRef.current = { start: segment.start, end: segment.end }
    setQuery(segment.query)
    return segment.query
  }

  const armSearch = (nextQuery: string) => {
    if (nextQuery.length < MIN_QUERY) {
      setOpen(false)
      setResults([])
      setLoading(false)
      return
    }
    setOpen(true)
    if (resultsQuery === nextQuery && results.length > 0) return
    setResults([])
    setLoading(true)
  }

  useEffect(() => {
    if (!open || query.length < MIN_QUERY) return
    if (resultsQuery === query && results.length > 0) return

    const controller = new AbortController()
    let cancelled = false
    const timer = window.setTimeout(() => {
      const search = repertoireOnly
        ? Promise.resolve(repertoireMatch(query))
        : searchSongs(query, controller.signal)
      search
        .then((matches) => {
          if (cancelled) return
          setLoading(false)
          if (matches.length === 0) {
            setResults([])
            setOpen(false)
            return
          }
          setResults(matches)
          setResultsQuery(query)
          setActiveIndex(0)
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
  }, [open, query, repertoireOnly, results.length, resultsQuery])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    const caret = caretAfterPick.current
    const element = fieldRef.current
    if (caret == null || !element) return
    caretAfterPick.current = null
    ignoreSelect.current = true
    element.focus()
    element.setSelectionRange(caret, caret)
  }, [value])

  const freshResults = resultsQuery === query ? results : []
  const showList = open && query.length >= MIN_QUERY && (loading || freshResults.length > 0)

  useEffect(() => {
    if (!showList || freshResults.length === 0) return
    const list = document.getElementById(listId)
    const option = document.getElementById(`${listId}-${activeIndex}`)
    if (!list || !option) return
    const top = option.offsetTop
    const bottom = top + option.offsetHeight
    if (top < list.scrollTop) list.scrollTop = top
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
  }, [showList, freshResults.length, activeIndex, listId])

  const choose = (song: SongMatch) => {
    if (multiline) {
      const { start, end } = segmentRef.current
      const next = replaceSongSegment(valueRef.current, start, end, song.label)
      caretAfterPick.current = next.caret
      valueRef.current = next.value
      onChange(next.value)
    } else {
      caretAfterPick.current = song.label.length
      valueRef.current = song.label
      onChange(song.label)
    }
    setOpen(false)
    setResults([])
    setResultsQuery('')
    setLoading(false)
    setQuery('')
  }

  const onSelect = (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (ignoreSelect.current) {
      ignoreSelect.current = false
      return
    }
    const nextQuery = readQuery(event.currentTarget)
    if (multiline) armSearch(nextQuery)
  }

  const onInput = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    valueRef.current = event.target.value
    onChange(event.target.value)
    armSearch(readQuery(event.target))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && freshResults.length > 0) {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(event.key === 'ArrowUp' ? freshResults.length - 1 : 0)
        return
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => (current + delta + freshResults.length) % freshResults.length)
      return
    }
    if (event.key === 'Escape') {
      if (!open) return
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'Enter' && showList) {
      if (!multiline || (!loading && freshResults[activeIndex])) event.preventDefault()
      if (!loading && freshResults[activeIndex]) choose(freshResults[activeIndex])
    }
  }

  const fieldProps = {
    id,
    value,
    placeholder: placeholder ?? (multiline ? 'One song per line, or separated by commas' : 'Start typing a song'),
    autoComplete: 'off' as const,
    role: 'combobox' as const,
    'aria-expanded': showList,
    'aria-controls': listId,
    'aria-autocomplete': 'list' as const,
    'aria-activedescendant': showList && freshResults[activeIndex] ? `${listId}-${activeIndex}` : undefined,
    onFocus: () => {
      if (query.length >= MIN_QUERY) armSearch(query)
    },
    onKeyDown,
    onSelect,
    onChange: onInput,
  }

  if (browsing) {
    return (
      <SuggestionBrowser
        title={`Suggestions for ${label}`}
        songs={repertoireOnly ? repertoireChoices() : suggestions}
        onClose={closeBrowse}
        onPick={(song) => {
          onChange(song.artist ? `${song.title} – ${song.artist}` : song.title)
          closeBrowse()
        }}
      />
    )
  }

  return (
    <div className="planner-field planner-venue" ref={rootRef}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </label>
      {help && <p className="planner-field__help">{help}</p>}
      <div className="planner-venue__control">
        {multiline ? (
          <textarea {...fieldProps} ref={setFieldRef} rows={rows} />
        ) : (
          <input {...fieldProps} ref={setFieldRef} type="text" />
        )}
        {showList && (
          <ul className="planner-venue__list" id={listId} role="listbox">
            {loading && freshResults.length === 0 && <li className="planner-venue__status">Searching songs…</li>}
            {freshResults.map((song, index) => (
              <li key={song.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`planner-venue__option planner-song__option${index === activeIndex ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(song)}
                >
                  {song.artwork ? (
                    <img
                      className="planner-song__art"
                      src={song.artwork}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden'
                      }}
                    />
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
      {(repertoireOnly || suggestions.length > 0) && !multiline && (
        <button type="button" className="planner-browse" onClick={openBrowse}>
          Browse suggestions
        </button>
      )}
    </div>
  )
}
