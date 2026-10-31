import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import './Slideshow.css'

interface SlideshowProps {
  images: string[]
  altPrefix?: string
  intervalMs?: number
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

export default function Slideshow({
  images,
  altPrefix = 'Photo',
  intervalMs = 5000,
}: SlideshowProps) {
  const [slide, setSlide] = useState({ current: 0, previous: 0 })
  const [paused, setPaused] = useState(false)
  const index = slide.current
  const previous = slide.previous
  const reducedMotion = usePrefersReducedMotion()
  const labelId = useId()
  const rootRef = useRef<HTMLElement>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const count = images.length

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return
      const normalized = (next + count) % count
      setSlide((current) =>
        current.current === normalized ? current : { current: normalized, previous: current.current },
      )
    },
    [count],
  )

  const step = useCallback(
    (direction: number) => {
      setSlide((current) => {
        const normalized = (current.current + direction + count) % count
        return { current: normalized, previous: current.current }
      })
    },
    [count],
  )

  useEffect(() => {
    if (paused || reducedMotion || count < 2) return
    const timer = window.setInterval(() => {
      setSlide((current) => ({
        current: (current.current + 1) % count,
        previous: current.current,
      }))
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [count, index, intervalMs, paused, reducedMotion])

  const pause = () => setPaused(true)
  const resumeIfIdle = () => {
    const root = rootRef.current
    const hovered = root?.matches(':hover') ?? false
    const focused = root?.contains(document.activeElement) ?? false
    if (!hovered && !focused) setPaused(false)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    pointerStart.current = { x: event.clientX, y: event.clientY }
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

  return (
    <section
      ref={rootRef}
      className={`slideshow${reducedMotion ? ' slideshow--reduced' : ''}`}
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      onMouseEnter={pause}
      onMouseLeave={resumeIfIdle}
      onFocus={pause}
      onBlur={resumeIfIdle}
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
        {images.map((src, imageIndex) => {
          const upcoming = (index + 1) % count
          const shown = imageIndex === 0 || imageIndex === previous || imageIndex === index || imageIndex === upcoming
          if (!shown) return null
          const active = imageIndex === index
          return (
            <img
              key={src}
              src={src}
              alt={`${altPrefix} ${imageIndex + 1} of ${count}`}
              className={`slideshow__slide${active ? ' slideshow__slide--active' : ''}`}
              loading={imageIndex === 0 ? 'eager' : 'lazy'}
              fetchPriority={imageIndex === 0 ? 'high' : 'low'}
              draggable={false}
              aria-hidden={!active}
            />
          )
        })}
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
            className={`slideshow__dot${imageIndex === index ? ' slideshow__dot--active' : ''}`}
            aria-label={`Show photo ${imageIndex + 1}`}
            aria-selected={imageIndex === index}
            onClick={() => goTo(imageIndex)}
          />
        ))}
      </div>
    </section>
  )
}
