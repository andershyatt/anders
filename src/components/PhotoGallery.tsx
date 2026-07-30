import { useCallback, useEffect, useState } from 'react'
import './PhotoGallery.css'

interface PhotoGalleryProps {
  images: string[]
  altPrefix?: string
}

export default function PhotoGallery({ images, altPrefix = 'Gallery photo' }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const close = useCallback(() => setActiveIndex(null), [])

  const showPrev = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current - 1 + images.length) % images.length,
    )
  }, [images.length])

  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % images.length,
    )
  }, [images.length])

  useEffect(() => {
    if (activeIndex === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') showPrev()
      if (event.key === 'ArrowRight') showNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, close, showNext, showPrev])

  if (images.length === 0) return null

  return (
    <div className="photo-gallery">
      <div className="photo-gallery__grid">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            className="photo-gallery__item"
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${altPrefix} ${index + 1}`}
          >
            <img
              src={src}
              alt={`${altPrefix} ${index + 1}`}
              className="photo-gallery__thumb"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="photo-gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          onClick={close}
        >
          <button
            type="button"
            className="photo-gallery__close"
            aria-label="Close lightbox"
            onClick={close}
          >
            &times;
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="photo-gallery__nav photo-gallery__nav--prev"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation()
                  showPrev()
                }}
              >
                &#8249;
              </button>
              <button
                type="button"
                className="photo-gallery__nav photo-gallery__nav--next"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation()
                  showNext()
                }}
              >
                &#8250;
              </button>
            </>
          )}
          <img
            src={images[activeIndex]}
            alt={`${altPrefix} ${activeIndex + 1}`}
            className="photo-gallery__lightbox-img"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
