import { Link } from 'react-router-dom'
import Slideshow from '../components/Slideshow'
import Testimonial from '../components/Testimonial'
import YouTubeEmbed from '../components/YouTubeEmbed'
import { homeGallery, images } from '../data/media'

export default function DuoAngella() {
  return (
    <div className="page-content">
      <h1 className="page-title">Anders &amp; Angella Acoustic Duo</h1>
      <div className="lead">
        <YouTubeEmbed videoId="-SXiczxgHu8" title="Anders & Angella Cover Reel" />
        <div className="copy-lg">
          <p>
            Listen to the sample above, and you&apos;ll hear Anders and Angella harmonizing through
            decades of popular music. The mixture of their voices, complemented by solid acoustic
            instrumental backing and simple percussion accompaniment can bring a special energy to all
            types of gatherings, in all types of venues. They are an extremely versatile duo, always
            broadening their already vast repertoire, and up for learning new material by request.
            Anders and Angella love what they do, and you can hear it in the way they play.
          </p>
        </div>
      </div>

      <div className="testimonial-list">
        <Testimonial
          tone={0}
          quote="Angella has the voice of an angel and she and Anders collaborate effortlessly together!! As a bride and groom there is so much going on that it's hard to take it all in, but when I think of my wedding, I hear Anders and Angella singing as the soundtrack of our day!"
          author="April C."
        />

        <Testimonial
          tone={1}
          quote="Anders and Angella played live for our ceremony and cocktail hour and got nothing but rave reviews. I have quite a few musicians among my family and our friends and everyone was extremely impressed. Can't say enough, they are a must hire."
          author="Patrick D."
        />
      </div>

      <div className="cta-row cta-row--wide">
        <Link to="/connect" className="cta-btn">
          Get a Quote
        </Link>
        <Link to="/duo-ben" className="cta-btn">
          Duo &mdash; Anders &amp; Ben
        </Link>
        <Link to="/trio" className="cta-btn">
          Trio &mdash; Anders, Angella &amp; Ben
        </Link>
      </div>

      <Slideshow
        images={[images.duoAngella, ...homeGallery.slice(0, 6)]}
        altPrefix="Anders and Angella"
      />
    </div>
  )
}
