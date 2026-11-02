import { useState } from 'react'

export const PLANNING_CALL_URL = 'https://andershyattmusic.hbportal.co/schedule/5f7224dbc62f230597f7c446'
export const SONGLIST_URL = 'https://andershyatt.com/songlist'

const EMAIL = 'anders@andershyattmusic.com'
const PHONE = '215-407-8454'

interface WelcomeInfoProps {
  live: boolean
  dj: boolean
}

export default function WelcomeInfo({ live, dj }: WelcomeInfoProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className={`planner-welcome-info${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="planner-welcome-info__toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Helpful info before you start ▾' : 'Tap to read some helpful info before you start ▸'}
      </button>
      {open && (
        <div className="planner-welcome-info__body">
          <h2>Make it yours</h2>
          <p>
            This flow is based on what we most commonly see, and every wedding is unique. It's fully
            customizable. Reach out if you'd like to add, remove, change, or rearrange anything.
          </p>

          <h2>Song choices</h2>
          <p>Suggestions for live songs and DJ songs are right here in the app.</p>
          <p>
            You don't have to pick songs for every section, or fill a list all the way to its maximum. Part of why
            you hire us is so we can use our expertise to turn your preferences into a setlist that fits your taste
            and vision. Give us as much or as little input as you want.
          </p>
          {live && (
            <p>
              For live songs, you can also browse Anders's repertoire at{' '}
              <a href={SONGLIST_URL} target="_blank" rel="noopener noreferrer">
                andershyatt.com/songlist
              </a>
              .
            </p>
          )}
          {dj && (
            <p>For DJ music, the suggestions aren't a limit. You're welcome to share a playlist of your own.</p>
          )}
          {live && (
            <>
              <h2>Songs we'd learn</h2>
              <p>
                For a must-play song that isn't in the repertoire, we're typically willing to learn up to three
                new songs at no extra charge. Not every song is within our capabilities, but most are. Email
                those requests to <a href={`mailto:${EMAIL}`}>{EMAIL}</a> at least one month before the wedding
                so there's time to learn them.
              </p>
            </>
          )}

          <h2>Lockout date</h2>
          <p>
            Your planner locks seven days before the wedding, so Anders can start preparing without a last-minute
            change slipping through. You are always welcome to email last-minute changes to{' '}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>

          <h2>Planning calls</h2>
          <p>
            We're happy to have as many planning calls as you'd like before the wedding. The app makes it easy
            to collaborate, and it isn't meant to replace a real conversation. We recommend at least one call
            to walk through the day and answer questions. Get in touch any time.
          </p>
          {PLANNING_CALL_URL && (
            <p>
              <a className="btn planner-welcome-info__schedule" href={PLANNING_CALL_URL} target="_blank" rel="noopener noreferrer">
                Schedule a planning call
              </a>
            </p>
          )}
          <p>
            Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p>
            For a quick or time-sensitive question, you can text Anders at <a href={`sms:${PHONE}`}>{PHONE}</a>.
          </p>
        </div>
      )}
    </section>
  )
}
