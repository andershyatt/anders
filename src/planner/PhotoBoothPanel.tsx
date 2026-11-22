import BoothGallery from './BoothGallery'
import CheckAll from './CheckAll'
import HalfHourTime from './HalfHourTime'
import { PHOTO_BOOTH_ITEMS, type BoothField } from './photoBooth'
import { boothImage } from './photoBoothImages'

interface PhotoBoothPanelProps {
  knownVenue: boolean
  fields: Record<string, string>
  locked: boolean
  onChange: (key: string, value: string) => void
}

function itemsFor(knownVenue: boolean) {
  return PHOTO_BOOTH_ITEMS.filter((item) => (knownVenue ? !item.newVenue : true))
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
  const visual = (field.options ?? []).some((option) => boothImage(option))
  if (visual && (field.input === 'choice' || field.input === 'checks')) {
    return <BoothGallery field={field} value={value} locked={locked} onChange={onChange} />
  }
  if (field.input === 'choice') {
    const inline = (field.options ?? []).every((option) => option.trim().length <= 12)
    return (
      <fieldset className={inline ? 'planner-choices planner-choices--inline' : 'planner-choices planner-choices--stack'} disabled={locked}>
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
      ) : field.input === 'time' ? (
        <HalfHourTime id={id} value={value} disabled={locked} onChange={onChange} />
      ) : (
        <input
          id={id}
          type={field.input === 'date' ? 'date' : 'text'}
          value={value}
          disabled={locked}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

export default function PhotoBoothPanel({ knownVenue, fields, locked, onChange }: PhotoBoothPanelProps) {
  return (
    <div className="planner-booth">
      <p className="planner-note">
        Help us create the perfect photo booth experience for your event! Please take a few minutes to fill out this
        form so we can tailor everything to your preferences.
      </p>
      {itemsFor(knownVenue).map((item) => {
        if (item.kind === 'heading') return <h3 key={item.text} className="planner-subhead">{item.text}</h3>
        if (item.kind === 'note') {
          return (
            <div key={item.text}>
              <p className="planner-note">{item.text}</p>
              {item.href && (
                <p>
                  <a className="btn" href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.linkLabel ?? 'Schedule a call'}
                  </a>
                </p>
              )}
            </div>
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
  )
}
