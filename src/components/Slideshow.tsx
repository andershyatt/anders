import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type TransitionEvent } from 'react'
import './Slideshow.css'

interface SlideshowProps {
  images: string[]
  altPrefix?: string
  intervalMs?: number
}

/** How long the horizontal slide takes. The snap back to center is not animated. */
const SLIDE_MS = 700
/** Reduced motion still advances, just more slowly and without the slide. */
const REDUCED_INTERVAL_FACTOR = 2

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

type TrackPosition = 'center' | 'forward' | 'back'

export default function Slideshow({
  images,
  altPrefix = 'Photo',
  intervalMs = 5000,
}: SlideshowProps) {
  const [index, setIndex] = useState(0)
  const [dotIndex, setDotIndex] = useState(0)
  const [track, setTrack] = useState<TrackPosition>('center')
  const [animateTrack, setAnimateTrack] = useState(true)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const labelId = useId()
  const rootRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const incomingRef = useRef(0)
  const lock = useRef(false)
  const [incoming, setIncoming] = useState(0)
  const count = images.length

  const releaseLock = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimateTrack(true)
        lock.current = false
      })
    })
  }, [])

  const settle = useCallback(() => {
    if (!lock.current) return
    setAnimateTrack(false)
    setIndex(incomingRef.current)
    setTrack('center')
    releaseLock()
  }, [releaseLock])

  const go = useCallback(
    (target: number, direction: 1 | -1) => {
      if (count < 2 || lock.current) return
      const normalized = (target + count) % count
      if (normalized === index) return
      incomingRef.current = normalized
      setIncoming(normalized)
      setDotIndex(normalized)
      if (reducedMotion) {
        setIndex(normalized)
        setTrack('center')
        return
      }
      lock.current = true
      setTrack(direction === 1 ? 'forward' : 'back')
    },
    [count, index, reducedMotion],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      go(index + direction, direction)
    },
    [go, index],
  )

  const goTo = useCallback(
    (target: number) => {
      if (count < 2) return
      const normalized = (target + count) % count
      if (normalized === index) return
      const forward = (normalized - index + count) % count
      const backward = (index - normalized + count) % count
      go(normalized, forward <= backward ? 1 : -1)
    },
    [count, go, index],
  )

  useEffect(() => {
    if (paused || count < 2 || track !== 'center') return
    const delay = reducedMotion ? intervalMs * REDUCED_INTERVAL_FACTOR : intervalMs
    const timer = window.setTimeout(() => {
      go(index + 1, 1)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [count, go, index, intervalMs, paused, reducedMotion, track])

  useEffect(() => {
    if (track === 'center') return
    const fallback = window.setTimeout(() => settle(), SLIDE_MS + 250)
    return () => window.clearTimeout(fallback)
  }, [settle, track])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const keyboardFocusInside = (node: EventTarget | null) =>
      node instanceof HTMLElement && root.contains(node) && node.matches(':focus-visible')

    const onFocusIn = (event: FocusEvent) => {
      if (keyboardFocusInside(event.target)) setPaused(true)
    }

    const onFocusOut = (event: FocusEvent) => {
      if (keyboardFocusInside(event.relatedTarget)) {
        setPaused(true)
        return
      }
      setPaused(false)
    }

    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)
    return () => {
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const onTrackTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== trackRef.current || event.propertyName !== 'transform') return
    if (track === 'center') return
    settle()
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    pointerStart.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
    step(dx < 0 ? 1 : -1)
  }

  if (count === 0) return null

  const leftIndex = track === 'back' ? incoming : (index - 1 + count) % count
  const rightIndex = track === 'forward' ? incoming : (index + 1) % count
  const slots = [
    { slot: 'left', imageIndex: leftIndex },
    { slot: 'center', imageIndex: index },
    { slot: 'right', imageIndex: rightIndex },
  ]
  const slotKeys = new Set(slots.map((slot) => slot.imageIndex))
  const slotsShareAPhoto = slotKeys.size !== slots.length

  const trackClass = [
    'slideshow__track',
    track === 'forward' ? 'slideshow__track--forward' : '',
    track === 'back' ? 'slideshow__track--back' : '',
    !animateTrack || reducedMotion ? 'slideshow__track--instant' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      ref={rootRef}
      className={`slideshow${reducedMotion ? ' slideshow--reduced' : ''}`}
      aria-roledescription="carousel"
      aria-labelledby={labelId}
    >
      <h2 id={labelId} className="sr-only">
        Photo slideshow
      </h2>
      <div
        className="slideshow__frame"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStart.current = null
        }}
      >
        <div ref={trackRef} className={trackClass} onTransitionEnd={onTrackTransitionEnd}>
          {slots.map(({ slot, imageIndex }) => (
            <img
              key={slotsShareAPhoto ? slot : imageIndex}
              src={images[imageIndex]}
              alt={slot === 'center' ? `${altPrefix} ${imageIndex + 1} of ${count}` : ''}
              className="slideshow__slide"
              loading={imageIndex === 0 || slot === 'center' ? 'eager' : 'lazy'}
              fetchPriority={slot === 'center' ? 'high' : 'low'}
              draggable={false}
              aria-hidden={slot !== 'center'}
            />
          ))}
        </div>
        <button
          type="button"
          className="slideshow__arrow slideshow__arrow--prev"
          aria-label="Previous photo"
          onClick={() => step(-1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          className="slideshow__arrow slideshow__arrow--next"
          aria-label="Next photo"
          onClick={() => step(1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className="slideshow__dots" role="tablist" aria-label="Choose a photo">
        {images.map((src, imageIndex) => (
          <button
            key={src}
            type="button"
            role="tab"
            className={`slideshow__dot${imageIndex === dotIndex ? ' slideshow__dot--active' : ''}`}
            aria-label={`Show photo ${imageIndex + 1}`}
            aria-selected={imageIndex === dotIndex}
            onClick={() => goTo(imageIndex)}
          />
        ))}
      </div>
    </section>
  )
}
