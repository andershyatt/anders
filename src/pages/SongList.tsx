import { Link } from 'react-router-dom'
import { useSongCatalog } from '../lib/songCatalog'
import './SongList.css'

export default function SongList() {
  const { songs, status } = useSongCatalog()
  const countLabel =
    status === 'loading' ? 'Loading songs…' : `Browse Anders's repertoire of ${songs.length} songs.`

  return (
    <div className="page-content songlist-page">
      <h2>Song List</h2>
      <div className="divider" />
      <p className="lead">
        {countLabel} Want to pick favorites for your event? Use the playlist builder to search,
        filter, and send a list.
        {status === 'saved' && ' Showing the saved copy — the live sheet did not load.'}
      </p>
      <div className="cta-row">
        <Link to="/playlist" className="cta-btn">
          Build a Playlist
        </Link>
      </div>

      <div className="songlist-table-wrap">
        <table className="songlist-table">
          <thead>
            <tr>
              <th>Song Title</th>
              <th>Artist</th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' ? (
              <tr>
                <td colSpan={2}>Loading songs…</td>
              </tr>
            ) : (
              songs.map((song) => (
                <tr key={song.id}>
                  <td>{song.title}</td>
                  <td>{song.artist}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
