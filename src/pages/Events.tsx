import { upcomingEvents } from '../data/events'
import './Events.css'

export default function Events() {
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
            {upcomingEvents.map((event) => (
              <tr key={event.date}>
                <td>
                  <span className="events-table__date-full">{event.date}</span>
                  <span className="events-table__date-short">{event.dateShort}</span>
                </td>
                <td>{event.title}</td>
                <td>{event.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
