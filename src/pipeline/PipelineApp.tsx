import { useEffect, useMemo, useRef, useState } from 'react'
import defaultCouplePhoto from '../assets/default-couple-photo.png'
import { formatCoupleDate } from '../planner/format'
import { loadGooglePlace, searchVenues, type VenueMatch } from '../planner/venueSearch'
import {
  adminAddCouple,
  adminCouple,
  adminDeleteCouple,
  adminList,
  adminSetStatus,
  clearAdminKey,
  matchesStages,
  plannerLink,
  saveAdminKey,
  sortCouples,
  storedAdminKey,
  type NewCoupleInput,
} from './api'
import { buildCheatSheet } from './cheatSheet'
import { sheetFileName } from './files'
import { buildInfoSheet } from './infoSheet'
import { coupleProgress } from './progress'
import { clientFolderName, saveClientDocument } from './shortcuts'
import { clearPipelineCache, coupleLocallyEdited, readPipelineCache, writePipelineCache } from './listCache'
import { couplePlaylistName, playlistChoices } from './songs'
import type { PendingPlaylist, SpotifyPlaylistResult } from './spotify'
import { stageOf, type BookingStage, type PipelineCouple, type PipelineDetail } from './types'
import PullToRefresh from '../PullToRefresh'
import { usePullToRefresh, useStandalone } from '../standalone'

const STAGES: BookingStage[] = ['Booked', 'Not yet booked', 'Completed']

function spotifyOauthMessage(code: string): string {
  if (code === 'access_denied') return 'Spotify sign-in was cancelled. The playlist was not created.'
  return 'Spotify could not sign in. Please try the playlist again.'
}

function spotifySessionReady(): boolean {
  try {
    const raw = localStorage.getItem('anders-pipeline-spotify-token')
    if (!raw) return false
    const parsed = JSON.parse(raw) as { access?: string; refresh?: string; expires?: number; scopes?: string }
    const scopes = parsed.scopes ?? ''
    if (!scopes.includes('playlist-modify-private') || !scopes.includes('playlist-modify-public')) return false
    return Boolean(parsed.access && ((parsed.expires ?? 0) > Date.now() + 30_000 || parsed.refresh))
  } catch {
    return false
  }
}

const EMPTY_COUPLE: NewCoupleInput = {
  names: '',
  date: '',
  venue: '',
  venueAddress: '',
  eventType: 'Wedding',
  startTime: '',
  length: '',
  guestCount: '',
  team: '',
  bookingStatus: 'Booked',
  live: false,
  dj: false,
  photobooth: false,
  knownVenue: false,
  genderNeutral: false,
}

function messageFor(error: unknown): string {
  const text = error instanceof Error ? error.message : ''
  if (text === 'unauthorized' || text === 'forbidden') return 'That passphrase was not accepted.'
  if (text === 'missing_couple') return 'That couple could not be opened.'
  return text || 'Something went wrong. Please try again.'
}

export default function PipelineApp() {
  const standalone = useStandalone()
  const pull = usePullToRefresh(standalone)
  const [key, setKey] = useState(storedAdminKey)
  const [draftKey, setDraftKey] = useState('')
  const cachedCouples = useMemo(() => readPipelineCache(), [])
  const serverList = useRef<PipelineCouple[]>(cachedCouples ?? [])
  const [couples, setCouples] = useState<PipelineCouple[]>(cachedCouples ?? [])
  const [stages, setStages] = useState<Set<BookingStage>>(() => new Set(['Booked', 'Not yet booked']))
  const [status, setStatus] = useState<'gate' | 'loading' | 'ready' | 'error'>(() => {
    if (!storedAdminKey()) return 'gate'
    return cachedCouples ? 'ready' : 'loading'
  })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(() => {
    const oauthError = new URLSearchParams(window.location.search).get('error')
    return oauthError ? spotifyOauthMessage(oauthError) : ''
  })
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<NewCoupleInput>(EMPTY_COUPLE)
  const [venueQuery, setVenueQuery] = useState('')
  const [venues, setVenues] = useState<VenueMatch[]>([])
  const [created, setCreated] = useState('')
  const [spotifyReady, setSpotifyReady] = useState(spotifySessionReady)
  const [createdPlaylist, setCreatedPlaylist] = useState<SpotifyPlaylistResult | null>(null)
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(() => new Set())

  const visible = useMemo(() => sortCouples(couples).filter((couple) => matchesStages(couple, stages)), [couples, stages])

  function applyFresh(list: PipelineCouple[]) {
    setCouples((current) =>
      list.map((item) => {
        const local = current.find((couple) => couple.token === item.token)
        const baseline = serverList.current.find((couple) => couple.token === item.token)
        if (!local || !baseline || !coupleLocallyEdited(local, baseline)) return item
        return { ...item, team: local.team, bookingStatus: local.bookingStatus, services: local.services }
      }),
    )
    serverList.current = list
    writePipelineCache(list)
  }

  async function load(nextKey: string) {
    if (couples.length === 0) setStatus('loading')
    setError('')
    try {
      const list = await adminList(nextKey)
      saveAdminKey(nextKey)
      setKey(nextKey)
      applyFresh(list)
      setStatus('ready')
    } catch (reason) {
      if (reason instanceof Error && (reason.message === 'unauthorized' || reason.message === 'forbidden')) {
        clearAdminKey()
        setKey('')
        setCouples([])
        clearPipelineCache()
        setStatus('gate')
      } else if (couples.length === 0) {
        setStatus(storedAdminKey() ? 'error' : 'gate')
      }
      setError(messageFor(reason))
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error')
    if (oauthError) {
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('state')
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
      return
    }
    const code = params.get('code')
    if (!code) return
    void (async () => {
      const spotify = await import('./spotify')
      let pending: PendingPlaylist | null = null
      try {
        pending = await spotify.finishSpotifyLogin(code, params.get('state') ?? '')
        setSpotifyReady(spotify.spotifyConnected())
        if (!pending) {
          setNotice('Spotify is connected on this browser.')
          return
        }
        const result = await spotify.createSpotifyPlaylist(pending.name, pending.songs)
        spotify.clearReauthorize()
        setCreatedPlaylist(result)
      } catch (reason) {
        if (pending && spotify.shouldReauthorize(reason)) {
          spotify.markReauthorize()
          spotify.rememberPlaylist(pending)
          await spotify.beginSpotifyLogin(true)
          return
        }
        setError(messageFor(reason))
      }
    })()
  }, [])

  useEffect(() => {
    const saved = storedAdminKey()
    if (!saved) return
    let cancelled = false
    void adminList(saved)
      .then((list) => {
        if (cancelled) return
        applyFresh(list)
        setStatus('ready')
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        if (reason instanceof Error && (reason.message === 'unauthorized' || reason.message === 'forbidden')) {
          clearAdminKey()
          setKey('')
          setCouples([])
          clearPipelineCache()
          setStatus('gate')
        } else if (serverList.current.length === 0) {
          setStatus('error')
        }
        setError(messageFor(reason))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const query = venueQuery.trim()
    if (query.length < 3) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void searchVenues(query, controller.signal, crypto.randomUUID())
        .then((result) => setVenues(result.matches))
        .catch(() => setVenues([]))
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [venueQuery])

  function toggleStage(stage: BookingStage) {
    setStages((current) => {
      const next = new Set(current)
      if (next.has(stage)) next.delete(stage)
      else next.add(stage)
      return next
    })
  }

  async function withDetail(couple: PipelineCouple, task: (detail: PipelineDetail) => Promise<void>) {
    setNotice('')
    setError('')
    try {
      const detail = await adminCouple(key, couple.token)
      await task(detail)
    } catch (reason) {
      setError(messageFor(reason))
    }
  }

  return (
    <div className="pipeline">
      <PullToRefresh pull={pull} />
      <div className="pipeline-pin">
      <header className="pipeline-top">
        <div className="pipeline-brand">
          <h1>PIPELINE</h1>
          <p>AH Music</p>
        </div>
        <div className="pipeline-top__actions">
          {standalone && (
            <button type="button" className="app-refresh" onClick={() => window.location.reload()}>
              Refresh
            </button>
          )}
          {status === 'ready' && (
            <button
              type="button"
              onClick={() => {
                clearAdminKey()
                setKey('')
                setCouples([])
                setStatus('gate')
              }}
            >
              Lock
            </button>
          )}
        </div>
      </header>
      {status === 'ready' && (
        <div className="pipeline-filters-bar">
          <div className="pipeline-filters" role="group" aria-label="Booking stage">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                className={`${stages.has(stage) ? 'is-on' : ''} ${stage === 'Booked' ? 'booked' : stage === 'Completed' ? 'done' : 'pending'}`}
                aria-pressed={stages.has(stage)}
                onClick={() => toggleStage(stage)}
              >
                {stage}
              </button>
            ))}
            <button type="button" className="gold" onClick={() => setAdding((current) => !current)}>
              {adding ? 'Close form' : 'Add couple'}
            </button>
            <button type="button" onClick={() => setCollapsedCards(new Set())}>
              Expand all
            </button>
            <button
              type="button"
              onClick={() => setCollapsedCards(new Set(couples.map((couple) => couple.token)))}
            >
              Collapse all
            </button>
          </div>
        </div>
      )}
      </div>
      <main className="pipeline-main">
        {status === 'gate' && (
          <form
            className="pipeline-gate"
            onSubmit={(event) => {
              event.preventDefault()
              void load(draftKey.trim())
            }}
          >
            <h2>Private pipeline</h2>
            <p>This page does not store wedding details. Enter the admin passphrase to load them.</p>
            <label htmlFor="admin-key">Passphrase</label>
            <input id="admin-key" type="password" value={draftKey} autoComplete="current-password" onChange={(event) => setDraftKey(event.target.value)} />
            {error && <p className="pipeline-error">{error}</p>}
            <p>
              <button className="gold" type="submit">
                Unlock
              </button>
            </p>
          </form>
        )}
        {status === 'loading' && <p>Loading weddings…</p>}
        {status === 'error' && (
          <p className="pipeline-error">
            {error}{' '}
            <button type="button" className="gold" onClick={() => void load(key)}>
              Try again
            </button>
          </p>
        )}
        {status === 'ready' && (
          <>
            {notice && <p className="pipeline-note">{notice}</p>}
            {error && <p className="pipeline-error">{error}</p>}
            {adding && (
              <form
                className="pipeline-panel"
                onSubmit={(event) => {
                  event.preventDefault()
                  setError('')
                  void adminAddCouple(key, form)
                    .then((result) => {
                      setCreated(result.link)
                      setForm(EMPTY_COUPLE)
                      setVenueQuery('')
                      return load(key)
                    })
                    .catch((reason: unknown) => setError(messageFor(reason)))
                }}
              >
                <h2>Add couple</h2>
                <label htmlFor="names">Couple names</label>
                <input id="names" value={form.names} onChange={(event) => setForm({ ...form, names: event.target.value })} required />
                <div className="pipeline-row">
                  <div>
                    <label htmlFor="event-type">Event type</label>
                    <input id="event-type" value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="event-date">Event date</label>
                    <input id="event-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
                  </div>
                </div>
                <div className="pipeline-suggest">
                  <label htmlFor="venue">Venue</label>
                  <input
                    id="venue"
                    value={form.venue}
                    autoComplete="off"
                    placeholder="Start typing a venue name"
                    onChange={(event) => {
                      setForm({ ...form, venue: event.target.value })
                      setVenueQuery(event.target.value)
                    }}
                  />
                  {venues.length > 0 && (
                    <ul>
                      {venues.map((place) => (
                        <li key={place.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setVenues([])
                              void loadGooglePlace(place, crypto.randomUUID(), new AbortController().signal)
                                .then((detailed) => setForm((current) => ({ ...current, venue: detailed.name, venueAddress: detailed.address })))
                                .catch(() => setForm((current) => ({ ...current, venue: place.name, venueAddress: place.address })))
                            }}
                          >
                            <strong>{place.name}</strong>
                            {place.address && <span> — {place.address}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <label htmlFor="address">Venue address</label>
                <input id="address" value={form.venueAddress} onChange={(event) => setForm({ ...form, venueAddress: event.target.value })} />
                <div className="pipeline-row">
                  <div>
                    <label htmlFor="start">Start time</label>
                    <input id="start" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="length">Length of service</label>
                    <input id="length" value={form.length} onChange={(event) => setForm({ ...form, length: event.target.value })} />
                  </div>
                </div>
                <label htmlFor="guests">Guest count</label>
                <input id="guests" value={form.guestCount} onChange={(event) => setForm({ ...form, guestCount: event.target.value })} />
                <label htmlFor="team">Your team</label>
                <textarea id="team" rows={5} value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })} />
                <label htmlFor="status">Booking status</label>
                <select
                  id="status"
                  value={form.bookingStatus}
                  onChange={(event) => setForm({ ...form, bookingStatus: event.target.value as BookingStage })}
                >
                  {STAGES.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
                <div className="pipeline-checks">
                  <label>
                    <input type="checkbox" checked={form.live} onChange={(event) => setForm({ ...form, live: event.target.checked })} /> Live music
                  </label>
                  <label>
                    <input type="checkbox" checked={form.dj} onChange={(event) => setForm({ ...form, dj: event.target.checked })} /> DJ
                  </label>
                  <label>
                    <input type="checkbox" checked={form.photobooth} onChange={(event) => setForm({ ...form, photobooth: event.target.checked })} /> Photo booth
                  </label>
                  <label>
                    <input type="checkbox" checked={form.knownVenue} onChange={(event) => setForm({ ...form, knownVenue: event.target.checked })} /> Known venue
                  </label>
                  <label>
                    <input type="checkbox" checked={form.genderNeutral} onChange={(event) => setForm({ ...form, genderNeutral: event.target.checked })} /> Gender neutral
                  </label>
                </div>
                <button className="gold" type="submit">
                  Create planner
                </button>
                {created && (
                  <p>
                    Planner link{' '}
                    <a href={created}>{created}</a>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(created)
                        setNotice('Planner link copied.')
                      }}
                    >
                      Copy
                    </button>
                  </p>
                )}
              </form>
            )}
            <div className="pipeline-cards">
              {visible.map((couple) => (
                <CoupleCard
                  key={couple.token}
                  couple={couple}
                  adminKey={key}
                  spotifyReady={spotifyReady}
                  onChange={(next) => setCouples((current) => current.map((item) => (item.token === next.token ? next : item)))}
                  onRemove={(token) => setCouples((current) => current.filter((item) => item.token !== token))}
                  onNotice={setNotice}
                  onError={setError}
                  onCreated={setCreatedPlaylist}
                  run={withDetail}
                  standalone={standalone}
                  collapsed={collapsedCards.has(couple.token)}
                  onToggle={() =>
                    setCollapsedCards((current) => {
                      const next = new Set(current)
                      if (next.has(couple.token)) next.delete(couple.token)
                      else next.add(couple.token)
                      return next
                    })
                  }
                />
              ))}
            </div>
            {visible.length === 0 && <p>No weddings in this view.</p>}
            {createdPlaylist && (
              <div className="pipeline-dialog-backdrop" onClick={() => setCreatedPlaylist(null)}>
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="playlist-created-title"
                  className="pipeline-dialog"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h2 id="playlist-created-title">Playlist created</h2>
                  <p>{createdPlaylist.name}</p>
                  <p>
                    <a href={createdPlaylist.url} target="_blank" rel="noopener noreferrer">
                      Open in Spotify
                    </a>
                  </p>
                  <p>
                    Found {createdPlaylist.total - createdPlaylist.missing.length} of {createdPlaylist.total} songs
                  </p>
                  {createdPlaylist.missing.length > 0 && (
                    <>
                      <p>Spotify could not find:</p>
                      <ul className="pipeline-missing">
                        {createdPlaylist.missing.map((song) => (
                          <li key={song}>{song}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <div>
                    <button type="button" className="gold" onClick={() => setCreatedPlaylist(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

const SERVICE_TOGGLES = [
  ['live', 'Live'],
  ['dj', 'DJ'],
  ['photobooth', 'Photo booth'],
] as const

function CoupleCard({
  couple,
  adminKey,
  spotifyReady,
  onChange,
  onRemove,
  onNotice,
  onError,
  onCreated,
  run,
  standalone,
  collapsed,
  onToggle,
}: {
  couple: PipelineCouple
  adminKey: string
  spotifyReady: boolean
  onChange: (couple: PipelineCouple) => void
  onRemove: (token: string) => void
  onNotice: (value: string) => void
  onError: (value: string) => void
  onCreated: (result: SpotifyPlaylistResult) => void
  run: (couple: PipelineCouple, task: (detail: PipelineDetail) => Promise<void>) => Promise<void>
  standalone: boolean
  collapsed: boolean
  onToggle: () => void
}) {
  const [menu, setMenu] = useState<'playlist' | ''>('')
  const [detail, setDetail] = useState<PipelineDetail | null>(null)
  const [busy, setBusy] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [docNote, setDocNote] = useState('')
  const [pendingDelete, setPendingDelete] = useState('')
  const tone = stageOf(couple.bookingStatus)
  const toneClass = tone === 'Booked' ? 'booked' : tone === 'Completed' ? 'done' : 'pending'
  const progress = coupleProgress(couple)
  const booked = SERVICE_TOGGLES.filter(([key]) => couple.services[key]).map(([, label]) => label)

  async function save(patch: { bookingStatus?: BookingStage; team?: string; date?: string; venue?: string; guestCount?: string }) {
    await adminSetStatus(adminKey, couple.token, patch)
    onChange({ ...couple, ...patch, updatedBy: 'Anders' })
  }

  async function storeDoc(kind: 'info sheet' | 'cheat sheet', folder: string) {
    await run(couple, async (full) => {
      const blob = kind === 'info sheet' ? await buildInfoSheet(full) : await buildCheatSheet(full)
      const filename = sheetFileName(full.names, kind)
      const note = await saveClientDocument(blob, filename, folder)
      setDocNote(note)
    })
  }

  function failSpotify(reason: unknown) {
    onError(messageFor(reason))
  }

  const updatedLine = couple.lastUpdated
    ? `Last updated ${couple.lastUpdated}${couple.updatedBy ? ` by ${couple.updatedBy}` : ''}`
    : ''

  return (
    <article className={`pipeline-card${collapsed ? ' is-collapsed' : ''}`}>
      <div className="pipeline-card__summary">
        <button type="button" className="pipeline-fold" aria-expanded={!collapsed} onClick={onToggle}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
        <div className="pipeline-name">
          <h2>{couple.names || 'Untitled couple'}</h2>
          <div className="pipeline-status">
            <button
              type="button"
              className={`pipeline-pill ${toneClass}`}
              aria-expanded={statusOpen}
              aria-haspopup="menu"
              onClick={() => setStatusOpen((current) => !current)}
            >
              {tone}
            </button>
            {statusOpen && (
              <div className="pipeline-pill-menu" role="menu">
                {STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setStatusOpen(false)
                      if (stage === tone) return
                      onChange({ ...couple, bookingStatus: stage })
                      void save({ bookingStatus: stage }).catch((reason: unknown) => onError(messageFor(reason)))
                    }}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="pipeline-meta">{formatCoupleDate(couple.date) || couple.date}</p>
      </div>
      {!collapsed && (
      <>
      {couple.photo ? (
        <img src={couple.photo} alt="" loading="lazy" decoding="async" />
      ) : (
        <img className="is-default" src={defaultCouplePhoto} alt="" loading="lazy" decoding="async" />
      )}
      <div>
        {updatedLine && <p className="pipeline-updated">{updatedLine}</p>}
        <label htmlFor={`date-${couple.token}`}>Wedding date</label>
        <input
          id={`date-${couple.token}`}
          type="date"
          value={/^\d{4}-\d{2}-\d{2}$/.test(couple.date) ? couple.date : ''}
          onChange={(event) => {
            const date = event.target.value
            onChange({ ...couple, date })
            if (date) void save({ date }).catch((reason: unknown) => onError(messageFor(reason)))
          }}
        />
        <label htmlFor={`venue-${couple.token}`}>Venue</label>
        <input
          id={`venue-${couple.token}`}
          value={couple.venue}
          onChange={(event) => onChange({ ...couple, venue: event.target.value })}
          onBlur={(event) => {
            void save({ venue: event.target.value }).catch((reason: unknown) => onError(messageFor(reason)))
          }}
        />
        <label htmlFor={`guests-${couple.token}`}>Guest count</label>
        <input
          id={`guests-${couple.token}`}
          value={couple.guestCount}
          onChange={(event) => onChange({ ...couple, guestCount: event.target.value })}
          onBlur={(event) => {
            void save({ guestCount: event.target.value }).catch((reason: unknown) => onError(messageFor(reason)))
          }}
        />
        {progress !== null && (
          <div className="pipeline-progress" aria-label={`Planner progress ${progress} percent`}>
            <div className="pipeline-progress__fill" style={{ width: `${progress}%` }} />
            <span>{progress}% answered</span>
          </div>
        )}
        <p>Services booked: {booked.join(' + ') || 'None'}</p>
        <div className="pipeline-service-toggles" role="group" aria-label="Services booked">
          {SERVICE_TOGGLES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={couple.services[key]}
              className={couple.services[key] ? 'is-on' : ''}
              onClick={() => {
                const services = { ...couple.services, [key]: !couple.services[key] }
                onChange({ ...couple, services })
                void adminSetStatus(adminKey, couple.token, { services }).catch((reason: unknown) => onError(messageFor(reason)))
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label htmlFor={`team-${couple.token}`}>Your team</label>
        <textarea
          id={`team-${couple.token}`}
          rows={5}
          value={couple.team}
          onChange={(event) => onChange({ ...couple, team: event.target.value })}
          onBlur={(event) => {
            const team = event.target.value
            void save({ team }).catch((reason: unknown) => onError(messageFor(reason)))
          }}
        />
        <div className="pipeline-actions">
          <a
            className="pipeline-open"
            href={plannerLink(couple.token, standalone)}
            {...(standalone ? {} : { target: '_blank', rel: 'noopener' })}
          >
            Open planner
          </a>
          <button
            type="button"
            disabled={busy === 'info'}
            onClick={() => {
              setBusy('info')
              void storeDoc('info sheet', clientFolderName(couple.date, couple.names)).finally(() => setBusy(''))
            }}
          >
            Make info sheet
          </button>
          <button
            type="button"
            disabled={busy === 'cheat'}
            onClick={() => {
              setBusy('cheat')
              void storeDoc('cheat sheet', clientFolderName(couple.date, couple.names)).finally(() => setBusy(''))
            }}
          >
            Make cheat sheet
          </button>
          <button
            type="button"
            onClick={() => {
              setMenu((current) => (current === 'playlist' ? '' : 'playlist'))
              if (!detail) {
                void adminCouple(adminKey, couple.token)
                  .then((full) => {
                    setDetail(full)
                    onChange({ ...couple, fields: full.fields })
                  })
                  .catch((reason: unknown) => onError(messageFor(reason)))
              }
            }}
          >
            Make playlist
          </button>
          <button
            type="button"
            className="pipeline-delete"
            disabled={busy === 'delete'}
            onClick={() => {
              setBusy('delete')
              void run(couple, async (full) => {
                const blob = await buildInfoSheet(full)
                const filename = sheetFileName(full.names, 'info sheet')
                const note = await saveClientDocument(blob, filename, 'DELETED PLANNERS')
                setPendingDelete(note)
                setConfirming(true)
              }).finally(() => setBusy(''))
            }}
          >
            Delete wedding
          </button>
        </div>
        {menu === 'playlist' && (
          <div className="pipeline-menu">
            {!spotifyReady && (
              <p className="pipeline-note">The first playlist signs this browser into Spotify. Later playlists are created directly.</p>
            )}
            {(detail ? playlistChoices(detail) : []).map((list) => (
              <p key={list.key}>
                {list.label}{' '}
                <button
                  type="button"
                  className="gold"
                  disabled={busy === list.key}
                  onClick={() => {
                    const name = couplePlaylistName(couple.names, list.label)
                    const pending = { name, songs: list.songs }
                    void import('./spotify')
                      .then(async (spotify) => {
                        if (!spotifyReady) {
                          spotify.rememberPlaylist(pending)
                          await spotify.beginSpotifyLogin()
                          return
                        }
                        setBusy(list.key)
                        try {
                          const result = await spotify.createSpotifyPlaylist(name, list.songs)
                          spotify.clearReauthorize()
                          onCreated(result)
                        } catch (reason) {
                          if (spotify.shouldReauthorize(reason)) {
                            spotify.markReauthorize()
                            spotify.rememberPlaylist(pending)
                            await spotify.beginSpotifyLogin(true)
                            return
                          }
                          failSpotify(reason)
                        } finally {
                          setBusy('')
                        }
                      })
                      .catch(failSpotify)
                  }}
                >
                  {busy === list.key ? 'Creating…' : 'Spotify'}
                </button>
              </p>
            ))}
            {detail && playlistChoices(detail).length === 0 && <p>This couple has no song lists yet.</p>}
            {!detail && <p>Loading song lists…</p>}
          </div>
        )}
        {confirming && (
          <div className="pipeline-dialog-backdrop" onClick={() => setConfirming(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`delete-${couple.token}`}
              className="pipeline-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <p id={`delete-${couple.token}`}>
                {pendingDelete} Delete {couple.names || 'this wedding'}? This removes the couple and their planner answers.
              </p>
              <div>
                <button type="button" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="pipeline-danger"
                  onClick={() => {
                    setConfirming(false)
                    void adminDeleteCouple(adminKey, couple.token)
                      .then(() => {
                        onRemove(couple.token)
                        onNotice(`Deleted ${couple.names || 'the wedding'}.`)
                      })
                      .catch((reason: unknown) => onError(messageFor(reason)))
                  }}
                >
                  Delete wedding
                </button>
              </div>
            </div>
          </div>
        )}
        {docNote && (
          <div className="pipeline-dialog-backdrop" onClick={() => setDocNote('')}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`doc-${couple.token}`}
              className="pipeline-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <p id={`doc-${couple.token}`}>{docNote}</p>
              <div>
                <button type="button" className="gold" onClick={() => setDocNote('')}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </article>
  )
}
