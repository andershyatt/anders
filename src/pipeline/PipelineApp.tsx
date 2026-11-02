import { useEffect, useMemo, useState } from 'react'
import { formatCoupleDate } from '../planner/format'
import { loadGooglePlace, searchVenues, type VenueMatch } from '../planner/venueSearch'
import {
  adminAddCouple,
  adminCouple,
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
import { downloadBlob, sheetFileName } from './files'
import { buildInfoSheet } from './infoSheet'
import { copyAndRunShortcut } from './shortcuts'
import { groupedText, liveChartText, playlistChoices, seratoText } from './songs'
import { beginSpotifyLogin, createSpotifyPlaylist, finishSpotifyLogin, pipelineRedirectUri, spotifyConnected, storedSpotifyClientId } from './spotify'
import { stageOf, type BookingStage, type PipelineCouple, type PipelineDetail } from './types'

const STAGES: BookingStage[] = ['Booked', 'Not yet booked', 'Completed']

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

function servicesText(couple: PipelineCouple): string {
  return [couple.services.live ? 'Live' : '', couple.services.dj ? 'DJ' : '', couple.services.photobooth ? 'Photo booth' : '']
    .filter(Boolean)
    .join(', ')
}

function messageFor(error: unknown): string {
  const text = error instanceof Error ? error.message : ''
  if (text === 'unauthorized' || text === 'forbidden') return 'That passphrase was not accepted.'
  if (text === 'missing_couple') return 'That couple could not be opened.'
  return text || 'Something went wrong. Please try again.'
}

export default function PipelineApp() {
  const [key, setKey] = useState(storedAdminKey)
  const [draftKey, setDraftKey] = useState('')
  const [couples, setCouples] = useState<PipelineCouple[]>([])
  const [stages, setStages] = useState<Set<BookingStage>>(() => new Set(['Booked', 'Not yet booked']))
  const [status, setStatus] = useState<'gate' | 'loading' | 'ready' | 'error'>(storedAdminKey() ? 'loading' : 'gate')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<NewCoupleInput>(EMPTY_COUPLE)
  const [venueQuery, setVenueQuery] = useState('')
  const [venues, setVenues] = useState<VenueMatch[]>([])
  const [created, setCreated] = useState('')
  const [spotifyId, setSpotifyId] = useState(storedSpotifyClientId)
  const [connected, setConnected] = useState(spotifyConnected)

  const visible = useMemo(() => sortCouples(couples).filter((couple) => matchesStages(couple, stages)), [couples, stages])

  async function load(nextKey: string) {
    setStatus('loading')
    setError('')
    try {
      const list = await adminList(nextKey)
      saveAdminKey(nextKey)
      setKey(nextKey)
      setCouples(list)
      setStatus('ready')
    } catch (reason) {
      if (reason instanceof Error && (reason.message === 'unauthorized' || reason.message === 'forbidden')) {
        clearAdminKey()
        setKey('')
        setStatus('gate')
      } else {
        setStatus(storedAdminKey() ? 'error' : 'gate')
      }
      setError(messageFor(reason))
    }
  }

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) return
    void finishSpotifyLogin(code)
      .then(() => {
        setConnected(true)
        setNotice('Spotify is connected on this browser.')
      })
      .catch((reason: unknown) => setError(messageFor(reason)))
  }, [])

  useEffect(() => {
    const saved = storedAdminKey()
    if (!saved) return
    let cancelled = false
    void adminList(saved)
      .then((list) => {
        if (cancelled) return
        setCouples(list)
        setStatus('ready')
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        if (reason instanceof Error && (reason.message === 'unauthorized' || reason.message === 'forbidden')) {
          clearAdminKey()
          setKey('')
          setStatus('gate')
        } else {
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
      <header className="pipeline-top">
        <div>
          <h1>Anders Hyatt Music</h1>
          <p>Pipeline</p>
        </div>
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
      </header>
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
            </div>
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
                <input id="team" value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })} />
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
                  spotifyId={spotifyId}
                  connected={connected}
                  onSpotifyId={setSpotifyId}
                  onChange={(next) => setCouples((current) => current.map((item) => (item.token === next.token ? next : item)))}
                  onNotice={setNotice}
                  onError={setError}
                  run={withDetail}
                />
              ))}
            </div>
            {visible.length === 0 && <p>No weddings in this view.</p>}
          </>
        )}
      </main>
    </div>
  )
}

function CoupleCard({
  couple,
  adminKey,
  spotifyId,
  connected,
  onSpotifyId,
  onChange,
  onNotice,
  onError,
  run,
}: {
  couple: PipelineCouple
  adminKey: string
  spotifyId: string
  connected: boolean
  onSpotifyId: (value: string) => void
  onChange: (couple: PipelineCouple) => void
  onNotice: (value: string) => void
  onError: (value: string) => void
  run: (couple: PipelineCouple, task: (detail: PipelineDetail) => Promise<void>) => Promise<void>
}) {
  const [menu, setMenu] = useState<'playlist' | ''>('')
  const [detail, setDetail] = useState<PipelineDetail | null>(null)
  const [busy, setBusy] = useState('')
  const tone = stageOf(couple.bookingStatus)
  const toneClass = tone === 'Booked' ? 'booked' : tone === 'Completed' ? 'done' : 'pending'

  async function save(patch: { bookingStatus?: BookingStage; team?: string }) {
    await adminSetStatus(adminKey, couple.token, patch)
    onChange({ ...couple, ...patch })
  }

  return (
    <article className="pipeline-card">
      {couple.photo ? <img src={couple.photo} alt="" /> : <div className="pipeline-photo">{couple.names.slice(0, 1) || '?'}</div>}
      <div>
        <h2>{couple.names || 'Untitled couple'}</h2>
        <p className="pipeline-meta">
          {[formatCoupleDate(couple.date) || couple.date, couple.venue].filter(Boolean).join(' · ')}
        </p>
        <p>{servicesText(couple) || 'No services marked'}</p>
        <label htmlFor={`team-${couple.token}`}>Your team</label>
        <input
          id={`team-${couple.token}`}
          value={couple.team}
          onChange={(event) => onChange({ ...couple, team: event.target.value })}
          onBlur={() => {
            void save({ team: couple.team }).catch((reason: unknown) => onError(messageFor(reason)))
          }}
        />
        <div className="pipeline-status">
          <label htmlFor={`status-${couple.token}`}>Status</label>
          <select
            id={`status-${couple.token}`}
            className={toneClass}
            value={tone}
            onChange={(event) => {
              const bookingStatus = event.target.value as BookingStage
              onChange({ ...couple, bookingStatus })
              void save({ bookingStatus }).catch((reason: unknown) => onError(messageFor(reason)))
            }}
          >
            {STAGES.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
          <a href={plannerLink(couple.token)}>Open planner</a>
        </div>
        <div className="pipeline-actions">
          <button
            type="button"
            disabled={busy === 'info'}
            onClick={() => {
              setBusy('info')
              void run(couple, async (full) => {
                downloadBlob(await buildInfoSheet(full), sheetFileName(full.names, 'info sheet'))
                onNotice(`Downloaded ${full.names || 'the'} info sheet.`)
              }).finally(() => setBusy(''))
            }}
          >
            Make info sheet
          </button>
          <button
            type="button"
            disabled={busy === 'cheat'}
            onClick={() => {
              setBusy('cheat')
              void run(couple, async (full) => {
                downloadBlob(await buildCheatSheet(full), sheetFileName(full.names, 'cheat sheet'))
                onNotice(`Downloaded ${full.names || 'the'} cheat sheet.`)
              }).finally(() => setBusy(''))
            }}
          >
            Make cheat sheet
          </button>
          <button
            type="button"
            onClick={() => {
              void run(couple, async (full) => {
                const text = seratoText(full)
                onNotice(await copyAndRunShortcut('Make Serato Crate', text || 'No DJ songs yet.'))
              })
            }}
          >
            Export Serato crate
          </button>
          <button
            type="button"
            onClick={() => {
              void run(couple, async (full) => {
                const text = liveChartText(full)
                onNotice(await copyAndRunShortcut('Tag Song Charts', text || 'No live songs yet.'))
              })
            }}
          >
            Tag live songs
          </button>
          <button
            type="button"
            onClick={() => {
              setMenu((current) => (current === 'playlist' ? '' : 'playlist'))
              if (!detail) {
                void adminCouple(adminKey, couple.token)
                  .then(setDetail)
                  .catch((reason: unknown) => onError(messageFor(reason)))
              }
            }}
          >
            Make playlist
          </button>
        </div>
        {menu === 'playlist' && (
          <div className="pipeline-menu">
            <p>Spotify uses a free developer app. Redirect URI: {pipelineRedirectUri()}</p>
            <label htmlFor={`spotify-${couple.token}`}>Spotify client ID</label>
            <input id={`spotify-${couple.token}`} value={spotifyId} onChange={(event) => onSpotifyId(event.target.value)} />
            <p>
              <button type="button" className="gold" onClick={() => beginSpotifyLogin(spotifyId.trim())} disabled={!spotifyId.trim()}>
                {connected ? 'Reconnect Spotify' : 'Connect Spotify'}
              </button>
            </p>
            {(detail ? playlistChoices(detail) : []).map((list) => (
              <p key={list.key}>
                {list.label}{' '}
                <button
                  type="button"
                  disabled={!connected}
                  onClick={() => {
                    void createSpotifyPlaylist(`${couple.names} – ${list.label}`, list.songs)
                      .then((result) => onNotice(result.missing.length ? `Playlist created. Not found: ${result.missing.join('; ')}` : `Playlist created: ${result.url}`))
                      .catch((reason: unknown) => onError(messageFor(reason)))
                  }}
                >
                  Spotify
                </button>{' '}
                <button
                  type="button"
                  onClick={() => {
                    const text = groupedText([{ title: list.label, lines: list.songs.map((song) => (song.artist ? `${song.title} - ${song.artist}` : song.title)) }])
                    void copyAndRunShortcut('Make Apple Music Playlist', text).then(onNotice)
                  }}
                >
                  Apple Music
                </button>
              </p>
            ))}
            {detail && playlistChoices(detail).length === 0 && <p>This couple has no song lists yet.</p>}
            <p className="pipeline-note">
              Apple shortcut “Make Apple Music Playlist” should take Shortcut Input as text. Split on blank lines for sections and on “Title - Artist” for songs, search the Apple Music catalog, and add the matches to a new playlist.
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
