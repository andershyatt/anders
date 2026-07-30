import { Link } from 'react-router-dom'
import songsData from '../data/songs.json'
import type { Song } from '../types/song'
import './SongList.css'

const songs = songsData as Song[]

export default function SongList() {
  return (
    <div className="page-content songlist-page">
      <h2>Song List</h2>
      <div className="divider" />
      <p className="lead">
        Browse Anders&apos;s repertoire of {songs.length} songs. Want to pick favorites for
        your event? Use the playlist builder to search, filter, and send a list.
      </p>
      <div className="btn-row">
        <Link to="/playlist" className="btn">
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
            {songs.map((song) => (
              <tr key={song.id}>
                <td>{song.title}</td>
                <td>{song.artist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
