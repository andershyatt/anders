import { Link } from 'react-router-dom'
import PhotoGallery from '../components/PhotoGallery'
import Testimonial from '../components/Testimonial'
import { homeGallery } from '../data/media'
import './LiveMusic.css'

export default function LiveMusic() {
  return (
    <div className="page-content">
      <div className="lead">
        <p>
          As an experienced performer, Anders brings a friendly and inviting energy to every event,
          and is capable of captivating his audience while making them feel immediately at home.
          Whether it be a a special ceremony, a corporate event, a rousing sing-along, or the
          background ambiance for a party, Anders knows how to adapt to the situation. His strong
          guitar playing offers the perfect backdrop for rich, warm vocals that always tell an
          intriguing story. His musical repertoire is delightfully vast and varied, offering a
          wonderful balance of songs old and new, fast and slow, and spanning many genres.
        </p>
        <p>
          Custom set lists, special song requests, and additional musicians are also available.
        </p>
      </div>

      <div className="live-music-links">
        <Link to="/duo-angella">Duo &mdash; Anders &amp; Angella</Link>
        <Link to="/duo-ben">Duo &mdash; Anders &amp; Ben</Link>
        <Link to="/songlist">Song List</Link>
        <Link to="/connect">Book Anders</Link>
      </div>

      <Testimonial
        quote="Anders is awesome to work with! Incredibly talented, easy-going and such an amazing performer! He kept our guest entertained before the ceremony through to our cocktail hour. He really helped set the tone for the rest of the night. Thank you, Anders, for being such an amazing part of our big day!"
        author="Ashley F."
        source="The Knot"
      />

      <Testimonial
        quote="Anders was so professional and easy to work with from the beginning of our party planning right through the last song at our event. Anders always responded to questions that I asked within a very timely basis and was willing to provide entertainment according to my specifics. His performance at our party far exceeded my expectations, which were set high. Our guests could not stop complimenting us on his talent through our party and afterwards as well. Even the staff at the our venue enjoyed his songs so much that they too advised that they would recommend Anders to future clients."
        author="Sophia W."
        source="Bash"
      />

      <PhotoGallery images={homeGallery} altPrefix="Live music" />
    </div>
  )
}
