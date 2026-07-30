import YouTubeEmbed from '../components/YouTubeEmbed'
import './Video.css'

const videos = [
  { id: '4W-pS9-lwLo', title: 'Anders Hyatt Music Video 1' },
  { id: 'mZf3fr_B4VA', title: 'Anders Hyatt Music Video 2' },
  { id: 'uX67obJEumI', title: 'Anders Hyatt Music Video 3' },
  { id: 'V_uB8UdLLS8', title: 'Anders Hyatt Music Video 4' },
]

export default function Video() {
  return (
    <div className="page-content">
      <div className="youtube-embed-grid youtube-embed-grid--two">
        {videos.map((video) => (
          <YouTubeEmbed key={video.id} videoId={video.id} title={video.title} />
        ))}
      </div>
    </div>
  )
}
