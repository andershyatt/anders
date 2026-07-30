import { useState } from 'react'
import { videoPoster } from '../data/media'
import './YouTubeEmbed.css'

interface YouTubeEmbedProps {
  videoId: string
  title?: string
}

export default function YouTubeEmbed({ videoId, title = 'YouTube video' }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false)
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`

  return (
    <figure className="youtube-embed-figure">
      <div className="youtube-embed">
        {playing ? (
          <iframe
            className="youtube-embed__iframe"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="youtube-embed__poster"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
          >
            <img src={videoPoster(videoId)} alt="" loading="lazy" />
            <span className="youtube-embed__play" aria-hidden="true" />
          </button>
        )}
      </div>
      <figcaption className="youtube-embed__caption">
        <a href={watchUrl} target="_blank" rel="noreferrer">
          Watch on YouTube
        </a>
      </figcaption>
    </figure>
  )
}
