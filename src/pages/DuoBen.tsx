import { Link } from 'react-router-dom'
import PhotoGallery from '../components/PhotoGallery'
import Testimonial from '../components/Testimonial'
import { homeGallery, images } from '../data/media'
import './Duo.css'

export default function DuoBen() {
  return (
    <div className="page-content">
      <div className="lead">
        <Testimonial
          quote="We hired Anders and Ben to perform at our small wedding in PA. They did such a fantastic job, and Anders was great at communicating with us. We changed a few things the day of, and he was flexible and willing to accommodate our changes. I also liked how they could provide a violin for our ceremony, live performances when we wanted that, and then turn full DJ by the end of the night. I recommend Anders+Ben for any wedding and am so happy we went with them!"
          author="Kelly C"
        />

        <Testimonial
          quote="My wife and I found Anders Hyatt music and we could not be more impressed with his professionalism, candor, responsiveness to all our questions. He, along with Ben, performed our wedding on September 9th at Stella and I must say that from the ceremony music, to the camaraderie, to the DJ services the team made our guests feel welcomed and they all stated that Anders and Ben were one of the best ceremony/DJ combo services they ever seen (and heard). I would definitely recommend Anders...you will not be disappointed."
          author="James C"
        />

        <p>
          Anders and Ben have been playing together for years. Ben Rogers is an extremely talented
          violinist and vocalist. As a duo, these two can provide both beautiful instrumental music
          as well as upbeat party music. No matter the occasion, Ben and Anders will be sure to leave
          you and your guests musically satisfied.
        </p>
      </div>

      <div className="btn-row">
        <Link to="/connect" className="btn">
          Get a Quote
        </Link>
      </div>

      <PhotoGallery images={[images.duoBen, ...homeGallery.slice(0, 6)]} altPrefix="Anders and Ben" />

      <div className="duo-links">
        <Link to="/duo-angella">Duo &mdash; Anders &amp; Angella</Link>
      </div>
    </div>
  )
}
