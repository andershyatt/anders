import { Link } from 'react-router-dom'
import Slideshow from '../components/Slideshow'
import Testimonial from '../components/Testimonial'
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
            Anders, Angella, and Ben bring a fuller sound when they play as a trio. Three voices
            meet in harmony, and the songs are carried by guitar, violin, and percussion together,
            so the music feels warm, layered, and still acoustic.
          </p>
          <p>
            It has a place in every part of the gathering: gentle for a ceremony, bright for a
            cocktail hour, and full enough for a reception.
          </p>
        </div>
      </div>

      <div className="testimonial-list">
        <Testimonial
          tone={0}
          quote="We hired Anders, Angella, and Ben for our wedding on 9/25/22. They were, without a doubt, one of the highlights of our wedding and helped set a musical tone for the day that truly felt like “us”. From the start, Anders was warm, responsive, and openly accommodating of all our specific requests (e.g. playing the Greek kalamatiano during the reception, incorporating our own hand-picked playlist during cocktail hour, and learning several new songs for our ceremony and first dance). He and his team are all exceptional musicians and they transitioned seamlessly between live and DJ’d music throughout different portions of the evening. Anders was superb at reading the vibe of the party and playing a variety of music that kept both younger and older guests dancing till midnight - we had multiple people tell us they’d never been to a wedding where the dance floor stayed so consistently full!"
          author="Veronica F"
          source="The Knot"
        />

        <Testimonial
          tone={1}
          quote="We couldn't have asked for a better experience with Anders! We booked the trio for the live music portion, and then Anders DJ'd the reception. We also added on the photo booth that our guests absolutely loved! The live music created the perfect atmosphere for our ceremony and cocktail hour, and the transition to the DJ for the reception was seamless. Anders was professional, organized, and easy to work with throughout the entire planning process. Anders's list of live music songs is long and vast, which gave us the ability to find a song for everyone! The photo booth was another huge hit and gave everyone a fun way to capture memories from the night."
          author="Liz Bennett"
          source="Google"
        />
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

      <Slideshow images={placeholderPhotos} altPrefix="Anders, Angella, and Ben" />
    </div>
  )
}
