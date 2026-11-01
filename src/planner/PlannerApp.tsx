import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { isInvalidLink, loadPlanner, saveErrorMessage, savePlanner, uploadFloorPlan, uploadTimelinePdf } from './api'
import {
  DANCE_LENGTH,
  DANCE_PERFORMANCE,
  YES_NO_OPTIONS,
  ceremonyStyleOptions,
  ALL_SERVICES,
  COUPLE_PHOTO_FIELD,
  EMPTY_BASICS,
  fieldsForSave,
  plannerFieldKeys,
  resolveBasics,
  servicesFromPreview,
  TIMELINE_PREFILL,
  visibleSections,
  type BookedServices,
  type PlannerBasics,
  type PlannerField,
} from './fields'
import {
  coerceFields,
  emptyFields,
  fieldsEqual,
  formatDance,
  formatCoupleDate,
  formatSavedAt,
  isIsoDate,
  parseDanceFormat,
  toIsoDate,
} from './format'
import CouplePhoto from './CouplePhoto'
import SongField from './SongField'
import WelcomeInfo from './WelcomeInfo'
import './planner.css'

const LINK_MESSAGE = "This planner link doesn't look right, please check the link Anders sent you."

type Status =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }
  | { kind: 'ready' }

function BasicsCard({ basics }: { basics: PlannerBasics }) {
  const rows = [
    { label: 'Names', value: basics.names },
    { label: 'Event type', value: basics.eventType },
    { label: 'Event date', value: basics.date.trim() ? formatCoupleDate(basics.date) : '' },
    { label: 'Venue', value: basics.venue },
    { label: 'Venue address', value: basics.venueAddress },
    { label: 'Start time', value: basics.startTime },
    { label: 'Length of service', value: basics.length },
    { label: 'Guest count', value: basics.guestCount },
    { label: 'Who did you book?', value: basics.booked },
  ].filter((row) => row.value.trim() !== '')

  return (
    <div className="planner-basics">
      {rows.length > 0 && (
        <dl>
          {rows.map((row) => (
            <div className="planner-basics__row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value.trim()}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="planner-basics__note">Need to change something here? Just let Anders know.</p>
    </div>
  )
}

function tokenFromLocation(): string {
  return new URLSearchParams(window.location.search).get('c')?.trim() ?? ''
}

function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string
  legend: string
  options: readonly string[]
  value: string
  onChange: (next: string) => void
}) {
  return (
    <fieldset className="planner-choices">
      <legend>{legend}</legend>
      <div className="planner-choices__row">
        {options.map((option) => (
          <label key={option} className={value === option ? 'is-selected' : undefined}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function choicesWithSaved(options: readonly string[], value: string): string[] {
  const saved = value.trim()
  if (!saved) return [...options]
  const known = options.some((option) => option.toLowerCase() === saved.toLowerCase())
  return known ? [...options] : [saved, ...options]
}

function matchesOption(options: readonly string[], value: string): string | undefined {
  const trimmed = value.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === trimmed)
}

function ChoiceWithOther({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string
  legend: string
  options: readonly string[]
  value: string
  onChange: (next: string) => void
}) {
  const match = matchesOption(options, value)
  const [otherOn, setOtherOn] = useState(() => value.trim() !== '' && !match)

  return (
    <fieldset className="planner-choices planner-choices--stack">
      <legend>{legend}</legend>
      <div className="planner-choices__row">
        {options.map((option) => (
          <label key={option} className={!otherOn && match === option ? 'is-selected' : undefined}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={!otherOn && match === option}
              onChange={() => {
                setOtherOn(false)
                onChange(option)
              }}
            />
            <span>{option}</span>
          </label>
        ))}
        <label className={otherOn ? 'is-selected' : undefined}>
          <input
            type="radio"
            name={name}
            value="Other"
            checked={otherOn}
            onChange={() => {
              setOtherOn(true)
              if (match) onChange('')
            }}
          />
          <span>Other</span>
        </label>
      </div>
      {otherOn && (
        <input
          className="planner-other"
          type="text"
          aria-label={`${legend} (other)`}
          value={otherOn ? value : ''}
          placeholder="Add your own answer"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </fieldset>
  )
}

function FieldControl({
  field,
  value,
  services,
  onChange,
}: {
  field: PlannerField
  value: string
  services: BookedServices
  onChange: (next: string) => void
}) {
  const id = `field-${field.key.replace(/[^a-z0-9]+/gi, '-')}`

  if (field.kind === 'style' || field.kind === 'yesno') {
    const base = field.kind === 'yesno' ? YES_NO_OPTIONS : ceremonyStyleOptions(field.key, services)
    const options = choicesWithSaved(base, value)
    const selected = options.find((option) => option.toLowerCase() === value.trim().toLowerCase()) ?? ''
    return (
      <ChoiceGroup
        name={id}
        legend={field.label}
        options={options}
        value={selected}
        onChange={onChange}
      />
    )
  }

  if (field.kind === 'choice-other') {
    return (
      <ChoiceWithOther
        name={id}
        legend={field.label}
        options={field.options ?? []}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (field.kind === 'floorplan') return null

  if (field.kind === 'dance') {
    const parsed = parseDanceFormat(value)
    return (
      <div className="planner-dance">
        <p className="planner-dance__label" id={`${id}-label`}>
          {field.label}
        </p>
        <ChoiceGroup
          name={`${id}-performance`}
          legend="Played by"
          options={DANCE_PERFORMANCE}
          value={parsed.performance}
          onChange={(performance) => onChange(formatDance(performance, parsed.length))}
        />
        <ChoiceGroup
          name={`${id}-length`}
          legend="Length"
          options={DANCE_LENGTH}
          value={parsed.length}
          onChange={(length) => onChange(formatDance(parsed.performance, length))}
        />
      </div>
    )
  }

  if (field.kind === 'rating') {
    const scores = Array.from({ length: 10 }, (_, index) => String(index + 1))
    return (
      <div className="planner-rating">
        <p className="planner-dance__label" id={`${id}-label`}>
          {field.label}
        </p>
        <div className="planner-rating__row" role="radiogroup" aria-labelledby={`${id}-label`}>
          {scores.map((score) => (
            <button
              key={score}
              type="button"
              className={value === score ? 'is-selected' : undefined}
              aria-pressed={value === score}
              onClick={() => onChange(score)}
            >
              {score}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (field.kind === 'date') {
    const iso = toIsoDate(value)
    const showRaw = value.trim() !== '' && !isIsoDate(value)
    return (
      <label className="planner-field" htmlFor={id}>
        <span>{field.label}</span>
        <input
          id={id}
          type="date"
          value={iso ?? ''}
          onChange={(event) => {
            const next = event.target.value
            if (!next && !isIsoDate(value)) return
            onChange(next)
          }}
        />
        {showRaw && (
          <p className="planner-date-raw">
            Saved value: {value}. It stays as written until you pick a date.
          </p>
        )}
      </label>
    )
  }

  if (field.song) {
    return (
      <SongField
        id={id}
        label={field.label}
        help={field.help}
        value={value}
        multiline={field.song === 'list'}
        placeholder={field.placeholder}
        rows={field.key === 'Notes' || field.key === 'Timeline' ? 6 : 4}
        onChange={onChange}
      />
    )
  }

  if (field.kind === 'textarea') {
    return (
      <label className="planner-field" htmlFor={id}>
        <span>{field.label}</span>
        <textarea
          id={id}
          rows={field.key === 'Timeline' ? 12 : field.key === 'Notes' || field.key === 'Basic notes' ? 6 : 4}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    )
  }

  return (
    <label className="planner-field" htmlFor={id}>
      <span>{field.label}</span>
      {field.help && <p className="planner-field__help">{field.help}</p>}
      <input
        id={id}
        type="text"
        value={value}
        placeholder={field.placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export default function PlannerApp() {
  const token = useMemo(() => tokenFromLocation(), [])
  const previewServices = useMemo(() => servicesFromPreview(window.location.search), [])
  const [status, setStatus] = useState<Status>({ kind: token ? 'loading' : 'invalid' })
  const [services, setServices] = useState<BookedServices>(previewServices ?? ALL_SERVICES)
  const [basics, setBasics] = useState<PlannerBasics>(EMPTY_BASICS)
  const [fields, setFields] = useState<Record<string, string>>(() => emptyFields(plannerFieldKeys))
  const [savedFields, setSavedFields] = useState<Record<string, string>>(() => emptyFields(plannerFieldKeys))
  const [couplePhoto, setCouplePhoto] = useState('')
  const [couplePhotoUrl, setCouplePhotoUrl] = useState<string | null>(null)
  const [floorPlan, setFloorPlan] = useState<{ name: string; url: string } | null>(null)
  const [floorPlanMessage, setFloorPlanMessage] = useState('')
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false)
  const [timelinePdf, setTimelinePdf] = useState<{ name: string; url: string } | null>(null)
  const [timelineMessage, setTimelineMessage] = useState('')
  const [uploadingTimeline, setUploadingTimeline] = useState(false)
  const timelineWasEmpty = useRef(false)
  const [lastUpdated, setLastUpdated] = useState<string | number | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveFailed, setSaveFailed] = useState(false)

  const dirty = status.kind === 'ready' && !fieldsEqual(fields, savedFields)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    loadPlanner(token).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setStatus(isInvalidLink(result.error) ? { kind: 'invalid' } : { kind: 'unavailable' })
        return
      }
      const next = coerceFields(plannerFieldKeys, result.fields)
      const timelineEmpty = next.Timeline.trim() === ''
      if (timelineEmpty) next.Timeline = TIMELINE_PREFILL
      timelineWasEmpty.current = timelineEmpty
      const loadedBasics = resolveBasics(result.basics, result.fields, result.couple)
      const photo = result.fields[COUPLE_PHOTO_FIELD]
      setCouplePhoto(typeof photo === 'string' ? photo.trim() : '')
      setCouplePhotoUrl(result.photo?.dataUrl ?? null)
      setFloorPlan(result.floorPlan)
      setTimelinePdf(result.timelinePdf)
      setBasics(loadedBasics)
      setFields(next)
      setSavedFields(next)
      setServices(previewServices ?? result.services)
      setLastUpdated(result.lastUpdated)
      setStatus({ kind: 'ready' })
    })

    return () => {
      cancelled = true
    }
  }, [previewServices, token])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const updateField = useCallback((key: string, value: string) => {
    setFields((current) => ({ ...current, [key]: value }))
    setSaveFailed(false)
    setSaveMessage('')
  }, [])

  const onFloorPlan = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || !token) return
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        setFloorPlanMessage('Please choose a PDF.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setFloorPlanMessage('Please choose a PDF under 10 MB.')
        return
      }
      setUploadingFloorPlan(true)
      setFloorPlanMessage('')
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : ''
        void uploadFloorPlan(token, { name: file.name, dataUrl }).then((result) => {
          setUploadingFloorPlan(false)
          if (!result.ok) {
            setFloorPlanMessage("We couldn't upload that PDF. Please try again.")
            return
          }
          setFloorPlan({ name: result.name, url: result.url })
          setFloorPlanMessage('')
        })
      }
      reader.onerror = () => {
        setUploadingFloorPlan(false)
        setFloorPlanMessage("We couldn't read that PDF. Please try again.")
      }
      reader.readAsDataURL(file)
    },
    [token],
  )

  const onTimelineFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || !token) return
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        setTimelineMessage('Please choose a PDF.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setTimelineMessage('Please choose a PDF under 10 MB.')
        return
      }
      setUploadingTimeline(true)
      setTimelineMessage('')
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : ''
        void uploadTimelinePdf(token, { name: file.name, dataUrl }).then((result) => {
          setUploadingTimeline(false)
          if (!result.ok) {
            setTimelineMessage("We couldn't upload that PDF. Please try again.")
            return
          }
          setTimelinePdf({ name: result.name, url: result.url })
          setTimelineMessage('')
        })
      }
      reader.onerror = () => {
        setUploadingTimeline(false)
        setTimelineMessage("We couldn't read that PDF. Please try again.")
      }
      reader.readAsDataURL(file)
    },
    [token],
  )

  const onSave = useCallback(async () => {
    if (!token || saving) return
    setSaving(true)
    setSaveFailed(false)
    setSaveMessage('')
    const payload = fieldsForSave(fields, services)
    if (timelineWasEmpty.current && fields.Timeline === TIMELINE_PREFILL) delete payload.Timeline
    const result = await savePlanner(token, payload)
    setSaving(false)
    if (!result.ok) {
      setSaveFailed(true)
      setSaveMessage(saveErrorMessage(result.error))
      if (isInvalidLink(result.error)) setStatus({ kind: 'invalid' })
      return
    }
    setSavedFields(fields)
    setLastUpdated(result.lastUpdated ?? new Date().toISOString())
    setSaveMessage('Saved')
  }, [fields, saving, services, token])

  const sections = useMemo(() => visibleSections(services), [services])
  const savedLabel = formatSavedAt(lastUpdated)
  const welcomeDate = basics.date.trim() ? formatCoupleDate(basics.date) : ''
  const welcomeBits = [welcomeDate, basics.venue.trim()].filter(Boolean)

  return (
    <div className="planner">
      <header className="planner-top">
        <a href="../">Anders Hyatt Music</a>
        <p>Wedding planner</p>
      </header>

      <main className="planner-main">
        {status.kind === 'loading' && <p className="planner-status">Loading your wedding details…</p>}

        {status.kind === 'invalid' && (
          <section className="planner-panel">
            <h1>We couldn't open this planner</h1>
            <p>{LINK_MESSAGE}</p>
          </section>
        )}

        {status.kind === 'unavailable' && (
          <section className="planner-panel">
            <h1>The planner didn't load</h1>
            <p>Something went wrong opening your page. Please try again in a moment.</p>
          </section>
        )}

        {status.kind === 'ready' && (
          <>
            <CouplePhoto
              token={token}
              savedValue={couplePhoto}
              savedDataUrl={couplePhotoUrl}
              title={basics.names.trim() || 'Wedding details'}
              meta={welcomeBits.join(' · ')}
            />

            <WelcomeInfo live={services.live} dj={services.dj} />

            <nav className="planner-jump" aria-label="Planner sections">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>

            <form
              className="planner-form"
              onSubmit={(event) => {
                event.preventDefault()
                void onSave()
              }}
            >
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="planner-section">
                  <h2>{section.title}</h2>
                  {section.blurb && <p className="planner-section__blurb">{section.blurb}</p>}
                  {section.id === 'basics' && <BasicsCard basics={basics} />}
                  {section.id === 'venue-questions' && (
                    <p className="planner-callout">
                      <span className="planner-callout__mark" aria-hidden="true">
                        !
                      </span>
                      <span>
                        These are some good questions to ask during your next visit to your venue or during your
                        next conversation with the venue.
                      </span>
                    </p>
                  )}
                  {section.id === 'timeline' && (
                    <div className="planner-pdf">
                      {timelinePdf && (
                        <p>
                          {timelinePdf.url ? (
                            <a href={timelinePdf.url} target="_blank" rel="noopener noreferrer">
                              {timelinePdf.name}
                            </a>
                          ) : (
                            timelinePdf.name
                          )}
                        </p>
                      )}
                      <label className={`planner-pdf__pick${uploadingTimeline ? ' is-disabled' : ''}`}>
                        {timelinePdf ? 'Replace PDF' : 'Add PDF'}
                        <input
                          type="file"
                          accept="application/pdf"
                          disabled={uploadingTimeline}
                          onChange={onTimelineFile}
                        />
                      </label>
                      {timelineMessage && <p className="planner-pdf__error">{timelineMessage}</p>}
                    </div>
                  )}
                  {section.fields.map((field) =>
                    field.kind === 'floorplan' ? (
                      <div className="planner-pdf" key={field.key}>
                        <p className="planner-dance__label">{field.label}</p>
                        {floorPlan && (
                          <p>
                            {floorPlan.url ? (
                              <a href={floorPlan.url} target="_blank" rel="noopener noreferrer">
                                {floorPlan.name}
                              </a>
                            ) : (
                              floorPlan.name
                            )}
                          </p>
                        )}
                        <label className={`planner-pdf__pick${uploadingFloorPlan ? ' is-disabled' : ''}`}>
                          {floorPlan ? 'Replace PDF' : 'Add PDF'}
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={uploadingFloorPlan}
                            onChange={onFloorPlan}
                          />
                        </label>
                        {floorPlanMessage && <p className="planner-pdf__error">{floorPlanMessage}</p>}
                      </div>
                    ) : (
                      <Fragment key={field.key}>
                        <FieldControl
                          field={field}
                          value={fields[field.key] ?? ''}
                          services={services}
                          onChange={(value) => updateField(field.key, value)}
                        />
                        {field.key === 'IG handle' && (
                          <p className="planner-ig-link">
                            <a href="https://instagram.com/andershyattmusic" target="_blank" rel="noopener noreferrer">
                              Connect with Anders on Instagram!
                            </a>
                          </p>
                        )}
                      </Fragment>
                    ),
                  )}
                </section>
              ))}

              <div className="planner-savebar">
                <div className="planner-savebar__status" aria-live="polite">
                  {saveFailed && <p className="planner-savebar__error">{saveMessage}</p>}
                  {!saveFailed && saveMessage && <p>{saveMessage}</p>}
                  {!saveMessage && dirty && <p>You have unsaved changes</p>}
                  {savedLabel && <p className="planner-savebar__time">Last saved {savedLabel}</p>}
                </div>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
