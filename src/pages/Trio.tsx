import { Link } from 'react-router-dom'
import Slideshow from '../components/Slideshow'
import YouTubeEmbed from '../components/YouTubeEmbed'
import { homeGallery, images } from '../data/media'

const placeholderPhotos = [images.duoAngella, images.duoBen, ...homeGallery.slice(0, 4)]

export default function Trio() {
  return (
    <div className="page-content">
      <h1 className="page-title">The Trio &mdash; Anders, Angella &amp; Ben</h1>
      <div className="lead">
        <YouTubeEmbed videoId="qZhppNcsXlc" title="The Trio — Anders, Angella & Ben" />
        <div className="copy-lg">
          <p>
            Anders, Angella, and Ben are available together as an acoustic trio. Anders offers solo,
            duo, and trio options for live music.
          </p>
          <p>
            Anders sings and plays guitar. Angella sings and plays percussion. Ben sings and plays
            violin. Anders&apos;s repertoire spans songs old and new, across many genres. Angella and
            Anders harmonize through decades of popular music. Ben has been playing with Anders for
            years.
          </p>
          <p>Custom set lists and special song requests are also available.</p>
        </div>
      </div>

      <div className="cta-row cta-row--wide">
        <Link to="/connect" className="cta-btn">
          Get a Quote
        </Link>
        <Link to="/duo-angella" className="cta-btn">
          Duo &mdash; Anders &amp; Angella
        </Link>
        <Link to="/duo-ben" className="cta-btn">
          Duo &mdash; Anders &amp; Ben
        </Link>
      </div>

      <p className="placeholder-note">
        Trio photos are not on the site yet. The pictures below are existing duo and performance
        photos, used as placeholders until Anders adds trio photos.
      </p>
      <Slideshow images={placeholderPhotos} altPrefix="Placeholder trio photo" />
    </div>
  )
}
