import { useEffect, useId, useState } from 'react'
import { parseChecks, serializeChecks } from './checks'
import { boothImage } from './photoBoothImages'
import type { BoothField } from './photoBooth'

interface BoothGalleryProps {
  field: BoothField
  value: string
  locked: boolean
  onChange: (value: string) => void
}

export default function BoothGallery({ field, value, locked, onChange }: BoothGalleryProps) {
  const name = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const options = field.options ?? []
  const multiple = field.input === 'checks'
  const parsed = multiple ? parseChecks(value, options) : null
  const selected = parsed?.selected ?? []

  useEffect(() => {
    if (!preview) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  const chosen = (option: string) => (multiple ? selected.includes(option) : value === option)

  const toggle = (option: string) => {
    if (locked) return
    if (!multiple) {
      onChange(value === option ? '' : option)
      return
    }
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]
    onChange(serializeChecks(next, parsed?.other ?? ''))
  }

  const previewSrc = preview ? boothImage(preview) : undefined

  return (
    <fieldset className="planner-gallery">
      <legend>{field.label}</legend>
      {field.help && <p className="planner-field__help">{field.help}</p>}
      <div className="planner-gallery__grid">
        {options.map((option) => {
          const image = boothImage(option)
          const on = chosen(option)
          return (
            <div
              key={option}
              className={['planner-gallery__card', on ? 'is-selected' : '', image ? '' : 'is-text'].filter(Boolean).join(' ')}
            >
              {on && (
                <span className="planner-gallery__check" aria-hidden="true">
                  ✓
                </span>
              )}
              {image && (
                <button
                  type="button"
                  className="planner-gallery__zoom"
                  aria-label={`View larger image of ${option}`}
                  onClick={() => setPreview(option)}
                >
                  <img src={image} alt="" loading="lazy" decoding="async" />
                  <span>View</span>
                </button>
              )}
              <label
                onClick={(event) => {
                  event.preventDefault()
                  toggle(option)
                }}
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={name}
                  value={option}
                  checked={on}
                  disabled={locked}
                  onChange={() => undefined}
                  onKeyDown={(event) => {
                    if (event.key !== ' ' && event.key !== 'Enter') return
                    event.preventDefault()
                    toggle(option)
                  }}
                />
                <span className="planner-gallery__caption">{option}</span>
              </label>
            </div>
          )
        })}
      </div>
      {preview && previewSrc && (
        <div className="planner-lightbox" role="dialog" aria-modal="true" aria-label={preview} onClick={() => setPreview(null)}>
          <button type="button" className="planner-lightbox__close" onClick={() => setPreview(null)}>
            Close
          </button>
          <img src={previewSrc} alt={preview} onClick={(event) => event.stopPropagation()} />
          <p>{preview}</p>
          {!locked && (
            <button
              type="button"
              className="planner-lightbox__choose"
              onClick={(event) => {
                event.stopPropagation()
                const selecting = !chosen(preview)
                toggle(preview)
                if (selecting) setPreview(null)
              }}
            >
              {chosen(preview) ? 'Remove this choice' : 'Choose this'}
            </button>
          )}
        </div>
      )}
    </fieldset>
  )
}
