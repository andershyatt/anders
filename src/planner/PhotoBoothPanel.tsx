import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import CheckAll from './CheckAll'
import { PHOTO_BOOTH_ITEMS, type BoothField } from './photoBooth'

interface PhotoBoothPanelProps {
  knownVenue: boolean
  fields: Record<string, string>
  locked: boolean
  onChange: (key: string, value: string) => void
}

function itemsFor(knownVenue: boolean) {
  return PHOTO_BOOTH_ITEMS.filter((item) => (knownVenue ? !item.newVenue : true))
}

function summary(fields: Record<string, string>, knownVenue: boolean): Array<{ label: string; value: string }> {
  return itemsFor(knownVenue).flatMap((item) => {
    if (item.kind !== 'field') return []
    const value = (fields[item.key] ?? '').trim()
    if (!value) return []
    const label = item.label.split('\n')[0] ?? item.label
    if (item.input === 'checks') {
      try {
        const parsed = JSON.parse(value) as unknown
        if (Array.isArray(parsed)) return [{ label, value: parsed.filter((entry) => typeof entry === 'string').join(', ') }]
      } catch {
        return [{ label, value }]
      }
    }
    return [{ label, value }]
  })
}

function Field({
  field,
  value,
  locked,
  onChange,
}: {
  field: BoothField
  value: string
  locked: boolean
  onChange: (value: string) => void
}) {
  const id = `booth-${field.key.replace(/[^a-z0-9]+/gi, '-')}`
  if (field.input === 'choice') {
    return (
      <fieldset className="planner-choices planner-choices--stack" disabled={locked}>
        <legend>{field.label}</legend>
        {field.help && <p className="planner-field__help">{field.help}</p>}
        <div className="planner-choices__row">
          {(field.options ?? []).map((option) => (
            <label key={option} className={value === option ? 'is-selected' : undefined}>
              <input
                type="radio"
                name={id}
                checked={value === option}
                onChange={() => onChange(value === option ? '' : option)}
                onClick={() => {
                  if (value === option) onChange('')
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
  if (field.input === 'checks') {
    return (
      <CheckAll
        name={id}
        legend={field.label}
        options={field.options ?? []}
        value={value}
        help={field.help}
        allowOther={false}
        onChange={locked ? () => undefined : onChange}
      />
    )
  }
  const multiline = field.input === 'textarea'
  return (
    <label className="planner-field" htmlFor={id}>
      <span style={{ whiteSpace: 'pre-line' }}>{field.label}</span>
      {field.help && <p className="planner-field__help">{field.help}</p>}
      {multiline ? (
        <textarea id={id} rows={5} value={value} disabled={locked} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          id={id}
          type={field.input === 'date' ? 'date' : field.input === 'time' ? 'time' : 'text'}
          value={value}
          disabled={locked}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

export default function PhotoBoothPanel({ knownVenue, fields, locked, onChange }: PhotoBoothPanelProps) {
  const [open, setOpen] = useState(false)
  const backRef = useRef<HTMLButtonElement>(null)
  const answers = summary(fields, knownVenue)

  useEffect(() => {
    const onPop = () => setOpen(window.history.state?.plannerPhotoBooth === true)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    backRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const openForm = () => {
    window.history.pushState({ ...(window.history.state ?? {}), plannerPhotoBooth: true }, '')
    setOpen(true)
  }

  const closeForm = () => {
    if (window.history.state?.plannerPhotoBooth) window.history.back()
    else setOpen(false)
  }

  const questions = itemsFor(knownVenue).filter((item) => item.kind === 'field')
  const answered = questions.filter((item) => (fields[item.key] ?? '').trim() !== '').length
  const progress = questions.length === 0 ? 0 : Math.round((answered / questions.length) * 100)

  return (
    <div className="planner-booth">
      <div className="planner-booth__progress" aria-label={`${progress} percent of the photo booth questionnaire`}>
        <div className="planner-booth__fill" style={{ width: `${progress}%` }} />
        <span>
          {answered} of {questions.length} answered
        </span>
      </div>
      <button type="button" className="planner-songcompact__open" onClick={openForm}>
        {answers.length > 0 ? 'Edit questionnaire' : 'Fill questionnaire'}
      </button>
      {open &&
        createPortal(
        <div className="planner-picker" role="dialog" aria-modal="true" aria-label="Photo booth questionnaire">
          <div className="planner-picker__bar">
            <button ref={backRef} type="button" className="planner-picker__back" onClick={closeForm}>
              Back
            </button>
            <p>Photo Booth Experience questionnaire</p>
          </div>
          <div className="planner-picker__body">
            <p className="planner-note">
              Help us create the perfect photo booth experience for your event! Please take a few minutes to fill out
              this form so we can tailor everything to your preferences.
            </p>
            {itemsFor(knownVenue).map((item) => {
              if (item.kind === 'heading') return <h3 key={item.text} className="planner-subhead">{item.text}</h3>
              if (item.kind === 'note') {
                return (
                  <p key={item.text} className="planner-note">
                    {item.text}{' '}
                    {item.href && (
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        {item.linkLabel}
                      </a>
                    )}
                  </p>
                )
              }
              return (
                <Field
                  key={item.key}
                  field={item}
                  value={fields[item.key] ?? ''}
                  locked={locked}
                  onChange={(value) => onChange(item.key, value)}
                />
              )
            })}
          </div>
        </div>,
        document.body,
        )}
    </div>
  )
}
