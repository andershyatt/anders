import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { isInvalidLink, loadPlanner, saveErrorMessage, savePlanner, uploadFloorPlan, uploadTimelinePdf } from './api'
import {
  DANCE_LENGTH,
  DANCE_PERFORMANCE,
  YES_NO_OPTIONS,
  ceremonyStyleOptions,
  ceremonyStyleValue,
  applyDjCeremonyStyleLabels,
  ALL_SERVICES,
  COUPLE_PHOTO_FIELD,
  EMPTY_BASICS,
  cocktailMusicChoices,
  fieldsForSave,
  plannerFieldKeys,
  resolveBasics,
  servicesFromPreview,
  TIMELINE_PREFILL,
  stripOldTimelineHeader,
  visibleSections,
  answeredProgress,
  neutralizeField,
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
import CheckAll from './CheckAll'
import IntroSongs from './IntroSongs'
import { PERFORMANCE_OPTIONS, applyPreCeremonyMusicTypeLabel } from './liveDj'
import { suggestedSongs } from './suggestions'
import ChoiceWithOther from './ChoiceWithOther'
import CocktailSongs from './CocktailSongs'
import CouplePhoto from './CouplePhoto'
import SongField from './SongField'
import WelcomeInfo from './WelcomeInfo'

const SECTION_FOLD: Record<string, string> = {
  'Having a first dance': 'First dance section',
  'Having a father-daughter dance': 'Father-daughter section',
  'Having a mother-son dance': 'Mother-son section',
  'Private last dance wanted': 'Private last dance section',
  'Introductions happening': 'Introductions section',
}
import './planner.css'

const LINK_MESSAGE = "This planner link doesn't look right, please check the link Anders sent you."

type Status =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }
  | { kind: 'ready' }

function SectionMenu({ sections }: { sections: Array<{ id: string; title: string }> }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="planner-menu">
      <button
        type="button"
        className="planner-menu__button"
        aria-expanded={open}
        aria-label="Jump to a section"
        disabled={sections.length === 0}
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
      {open && sections.length > 0 && (
        <div className="planner-menu__list">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} onClick={() => setOpen(false)}>
              {section.title}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function servicesBooked(services: BookedServices): string {
  return [services.live ? 'Live music' : '', services.dj ? 'DJ' : '', services.photobooth ? 'Photo booth' : '']
    .filter(Boolean)
    .join(', ')
}

function BasicsCard({ basics, services }: { basics: PlannerBasics; services: BookedServices }) {
  const rows = [
    { label: 'Names', value: basics.names },
    { label: 'Event type', value: basics.eventType },
    { label: 'Event date', value: basics.date.trim() ? formatCoupleDate(basics.date) : '' },
    { label: 'Venue', value: basics.venue },
    { label: 'Venue address', value: basics.venueAddress },
    { label: 'Start time', value: basics.startTime },
    { label: 'Length of service', value: basics.length },
    { label: 'Guest count', value: basics.guestCount },
    { label: 'Services booked', value: servicesBooked(services) },
    { label: 'Your team', value: basics.booked },
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

function choiceAlreadyOn(event: KeyboardEvent<HTMLInputElement>, selected: boolean): boolean {
  if (!selected || (event.key !== ' ' && event.key !== 'Enter')) return false
  event.preventDefault()
  return true
}

function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
  stack = false,
}: {
  name: string
  legend: string
  options: readonly string[]
  value: string
  onChange: (next: string) => void
  stack?: boolean
}) {
  return (
    <fieldset className={stack ? 'planner-choices planner-choices--stack' : 'planner-choices'}>
      <legend>{legend}</legend>
      <div className="planner-choices__row" role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = value === option
          return (
            <label key={option} className={selected ? 'is-selected' : undefined}>
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => {
                  if (!selected) onChange(option)
                }}
                onClick={() => {
                  if (selected) onChange('')
                }}
                onKeyDown={(event) => {
                  if (choiceAlreadyOn(event, selected)) onChange('')
                }}
              />
              <span>{option}</span>
            </label>
          )
        })}
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

function FieldControl({
  field,
  value,
  services,
  token,
  onChange,
}: {
  field: PlannerField
  value: string
  services: BookedServices
  token: string
  onChange: (next: string) => void
}) {
  const id = `field-${field.key.replace(/[^a-z0-9]+/gi, '-')}`

  if (field.kind === 'style' || field.kind === 'yesno') {
    const answer = field.kind === 'style' ? ceremonyStyleValue(field.key, value, services) : value
    const base = field.options ?? (field.kind === 'yesno' ? YES_NO_OPTIONS : ceremonyStyleOptions(field.key, services))
    const known =
      field.key === 'Internet access'
        ? (base.find((option) => option.toLowerCase() === answer.trim().toLowerCase()) ?? '')
        : (base.find((option) => option.toLowerCase() === answer.trim().toLowerCase()) ?? '')
    const options = field.key === 'Internet access' ? [...base] : choicesWithSaved(base, answer)
    const selected = field.key === 'Internet access' ? known : (options.find((option) => option.toLowerCase() === answer.trim().toLowerCase()) ?? '')
    const legacy = field.key === 'Internet access' && value.trim() && !known ? value.trim() : ''
    return (
      <div>
        <ChoiceGroup
          name={id}
          legend={field.label}
          options={options}
          value={selected}
          stack={field.stack}
          onChange={onChange}
        />
        {legacy && <p className="planner-legacy">Saved answer: {legacy}</p>}
      </div>
    )
  }

  if (field.kind === 'checks') {
    return (
      <CheckAll
        name={id}
        legend={field.label}
        options={field.options ?? []}
        value={value}
        help={field.help}
        allowOther={field.allowOther !== false}
        onChange={onChange}
      />
    )
  }

  if (field.kind === 'songlist' || field.kind === 'cocktail-songs') {
    return (
      <CocktailSongs
        label={field.label}
        value={value}
        onChange={onChange}
        maxSongs={field.maxSongs}
        maxMustPlays={field.maxMustPlays}
        picker={field.picker}
        pickerKey={field.key}
        screenTitle={field.screenTitle}
        suggestions={suggestedSongs(field.suggestions)}
        allowImport={field.suggestions === 'cocktail-dinner' || field.suggestions === 'open-dancing'}
        token={token}
      />
    )
  }

  if (field.kind === 'intro-songs') {
    return <IntroSongs label={field.label} value={value} onChange={onChange} suggestions={suggestedSongs(field.suggestions)} />
  }

  if (field.kind === 'fold') {
    if (value.trim().toLowerCase() !== 'removed') return null
    return (
      <p className="planner-folded">
        {field.foldLabel ?? field.label} - not having one.{' '}
        <button type="button" onClick={() => onChange('')}>
          Undo
        </button>
      </p>
    )
  }

  if (field.kind === 'check') {
    const checked = value.trim().toLowerCase() === 'yes'
    return (
      <label className="planner-check">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked ? 'Yes' : '')} />
        <span>{field.label}</span>
      </label>
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
          {scores.map((score) => {
            const selected = value === score
            return (
              <button
                key={score}
                type="button"
                className={selected ? 'is-selected' : undefined}
                aria-pressed={selected}
                onClick={() => onChange(selected ? '' : score)}
              >
                {score}
              </button>
            )
          })}
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
        hideLabel={field.hideLabel}
        suggestions={suggestedSongs(field.suggestions)}
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
        <span className={field.hideLabel ? 'sr-only' : undefined}>
          {field.key === 'Timeline' ? (
            <>
              Timeline
              <span className="planner-field__aside"> — sample timeline below, edit as needed</span>
            </>
          ) : (
            field.label
          )}
        </span>
        {field.help && <p className="planner-field__help">{field.help}</p>}
        <textarea
          id={id}
          rows={
            field.key === 'Timeline'
              ? 12
              : field.key === 'Cocktail hour timing notes'
                ? 3
                : field.key === 'Notes' || field.key === 'Basic notes' || field.key === 'Cocktail hour vibe'
                  ? 6
                  : 4
          }
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
  const [genderNeutral, setGenderNeutral] = useState(false)
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
      const strippedTimeline = stripOldTimelineHeader(next.Timeline)
      const timelineEmpty = next.Timeline.trim() === ''
      next.Timeline = timelineEmpty ? TIMELINE_PREFILL : strippedTimeline
      timelineWasEmpty.current = timelineEmpty
      const bookedServices = previewServices ?? result.services
      const musicChoices = cocktailMusicChoices(bookedServices)
      if (musicChoices.length === 1) next['Cocktail hour music type'] = musicChoices[0]
      const ready = applyPreCeremonyMusicTypeLabel(applyDjCeremonyStyleLabels(next, bookedServices), bookedServices)
      const loadedBasics = resolveBasics(result.basics, result.fields, result.couple)
      const photo = result.fields[COUPLE_PHOTO_FIELD]
      setCouplePhoto(typeof photo === 'string' ? photo.trim() : '')
      setCouplePhotoUrl(result.photo?.dataUrl ?? null)
      setFloorPlan(result.floorPlan)
      setTimelinePdf(result.timelinePdf)
      setBasics(loadedBasics)
      setFields(ready)
      setSavedFields(ready)
      setServices(bookedServices)
      setGenderNeutral(result.genderNeutral)
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
    setFields((current) => {
      const next = { ...current, [key]: value }
      const fold = SECTION_FOLD[key]
      if (fold && value.trim().toLowerCase() !== 'no') next[fold] = ''
      return next
    })
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

  const sections = useMemo(() => {
    const visible = visibleSections(services, fields)
    if (!genderNeutral) return visible
    return visible.map((section) => ({ ...section, fields: section.fields.map(neutralizeField) }))
  }, [services, fields, genderNeutral])
  const progress = answeredProgress(sections, fields)
  const savedLabel = formatSavedAt(lastUpdated)
  const welcomeDate = basics.date.trim() ? formatCoupleDate(basics.date) : ''
  const welcomeBits = [welcomeDate, basics.venue.trim()].filter(Boolean)

  return (
    <div className="planner">
      <header className="planner-top">
        <SectionMenu sections={status.kind === 'ready' ? sections : []} />
        <div className="planner-top__title">
          <a href="../">Anders Hyatt Music</a>
          <p>Wedding planner</p>
        </div>
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
                  {section.id === 'basics' && <BasicsCard basics={basics} services={services} />}
                  {section.id === 'venue-questions' && (
                      <p className="planner-callout">
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
                  {section.fields.map((field) => (
                    <Fragment key={field.key}>
                      {field.heading && <h3 className="planner-subhead">{field.heading}</h3>}
                      {field.callout && (
                        <p className="planner-callout">
                          <span>{field.callout}</span>
                        </p>
                      )}
                      {field.note && <p className="planner-note">{field.note}</p>}
                      {field.kind === 'floorplan' ? (
                      <div className="planner-pdf">
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
                    ) : field.key === 'Cocktail hour music type' ? (
                      <>
                        {!(services.live && services.dj) && (
                          <p className="planner-callout">
                            <span>
                              Cocktail hour music is typically more upbeat, but not quite dance party energy. This is a
                              great time to fit in songs you love that aren&apos;t dancefloor-friendly.
                            </span>
                          </p>
                        )}
                        {cocktailMusicChoices(services).length > 1 && (
                          <ChoiceGroup
                            name={`field-${field.key.replace(/[^a-z0-9]+/gi, '-')}`}
                            legend={field.label}
                            options={
                              services.live && services.dj
                                ? choicesWithSaved(PERFORMANCE_OPTIONS, fields[field.key] ?? '')
                                : cocktailMusicChoices(services)
                            }
                            value={
                              services.live && services.dj
                                ? (choicesWithSaved(PERFORMANCE_OPTIONS, fields[field.key] ?? '').find(
                                    (option) => option.toLowerCase() === (fields[field.key] ?? '').trim().toLowerCase(),
                                  ) ?? '')
                                : (fields[field.key] ?? '')
                            }
                            onChange={(value) => updateField(field.key, value)}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <FieldControl
                          field={field}
                          value={fields[field.key] ?? ''}
                          services={services}
                          token={token}
                          onChange={(value) => updateField(field.key, value)}
                        />
                        {field.key === 'IG handle' && (
                          <p className="planner-ig-link">
                            <a
                              className="planner-ig-btn"
                              href="https://instagram.com/andershyattmusic"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                              </svg>
                              Connect with Anders on Instagram
                            </a>
                          </p>
                        )}
                      </>
                    )}
                      {SECTION_FOLD[field.key] &&
                        (fields[field.key] ?? '').trim().toLowerCase() === 'no' &&
                        (fields[SECTION_FOLD[field.key]] ?? '').trim().toLowerCase() !== 'removed' &&
                        (fields[SECTION_FOLD[field.key]] ?? '').trim().toLowerCase() !== 'kept' && (
                          <p className="planner-fold-prompt">
                            Remove this section from your planner?{' '}
                            <button type="button" onClick={() => updateField(SECTION_FOLD[field.key], 'removed')}>
                              Remove
                            </button>
                            <button type="button" onClick={() => updateField(SECTION_FOLD[field.key], 'kept')}>
                              Keep
                            </button>
                          </p>
                        )}
                      {field.image === 'chauvet' && (
                        <img
                          className="planner-lighting"
                          src={`${import.meta.env.BASE_URL}../chauvet-freedom-par.jpg`}
                          alt="Chauvet DJ uplights placed around a dance floor"
                        />
                      )}
                    </Fragment>
                  ))}
                </section>
              ))}

              <div className="planner-progress" aria-label={`Planner progress ${progress} percent`}>
                <div className="planner-progress__fill" style={{ width: `${progress}%` }} />
                <span>{progress}% answered</span>
              </div>
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
