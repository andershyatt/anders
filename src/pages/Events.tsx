import { usePublicEvents } from '../lib/publicEvents'
import './Events.css'

export default function Events() {
  const events = usePublicEvents()

  return (
    <div className="page-content left">
      <h2>Catch Anders Live!</h2>
      <div className="divider" />

      <p className="lead">
        Anders primarily performs at private events, however he does have the occasional public
        show. If you&apos;d like to catch his public live performances, check out the dates below.
      </p>

      <p>
        If you plan on attending one of these events, please let Anders know so he can make time to
        come say hi. Follow Anders on Instagram or Facebook, in case of any last minute changes to
        the event. And feel free to send him song requests as well. Not all requests can be
        accommodated but he will do his best.
      </p>

      <h3>Events</h3>

      {events.length === 0 ? (
        <p>No upcoming public shows are listed right now.</p>
      ) : (
        <div className="events-table-wrap">
          <table className="events-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Event</th>
                <th scope="col">Location</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.key}>
                  <td>
                    <span className="events-table__date-full">{event.date}</span>
                    <span className="events-table__date-short">{event.dateShort}</span>
                  </td>
                  <td>
                    {event.link ? (
                      <a href={event.link} target="_blank" rel="noopener noreferrer">
                        {event.title}
                      </a>
                    ) : (
                      event.title
                    )}
                    {event.details ? <div className="events-table__details">{event.details}</div> : null}
                  </td>
                  <td>{event.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
