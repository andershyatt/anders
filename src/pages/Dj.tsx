import { Link } from 'react-router-dom'
import PhotoGallery from '../components/PhotoGallery'
import Testimonial from '../components/Testimonial'
import YouTubeEmbed from '../components/YouTubeEmbed'
import { djGallery } from '../data/media'
import './Dj.css'

export default function Dj() {
  return (
    <div className="page-content">
      <h2>Wedding DJ Services</h2>
      <div className="divider" />

      <div className="lead">
        <p>
          Whether you are seeking a combination of live music and DJ services or a DJ-only
          experience, you can rest assured that Anders will take care of all your musical needs for
          the day. Anders provides a personalized DJ and emcee experience that will be sure to
          satisfy your guests and keep the party going.
        </p>
      </div>

      <div className="btn-row">
        <Link to="/dj-faq" className="btn btn-outline">
          DJ FAQ
        </Link>
        <Link to="/connect" className="btn">
          Get a Quote
        </Link>
      </div>

      <Testimonial
        quote="Growing up a music nerd in the 90's, Anders is the type of DJ I would have envisioned for a wedding back then, and it was truly a great experience from first email to the last song played. Anders live acoustic is fantastic and his song mixing skills are really great. Super friendly, responsive, and happy to talk music. He rolled with the overload of song suggestions I sent over and he really pulled off a great and memorable musical evening for our wedding. Thanks Anders!"
        author="Brandon M."
        source="Wedding Wire"
      />

      <YouTubeEmbed videoId="lyWz78KfERk" title="Anders Hyatt DJ Reel" />

      <PhotoGallery images={djGallery} altPrefix="DJ services" />
    </div>
  )
}
