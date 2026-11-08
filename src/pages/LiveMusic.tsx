import { Link } from 'react-router-dom'
import FaqAccordion from '../components/FaqAccordion'
import Slideshow from '../components/Slideshow'
import Testimonial from '../components/Testimonial'
import { liveMusicFaq } from '../data/faq'
import { homeGallery } from '../data/media'
import DisplayTitle from '../components/DisplayTitle'
import EventsSection from './Events'

export default function LiveMusic() {
  return (
    <div className="page-content">
      <DisplayTitle>Live Music</DisplayTitle>
      <div className="lead copy-lg">
        <p>
          Whether setting the mood for an elegant ceremony, providing background music for a
          gathering, or bringing a crowd together for a sing-along, Anders knows how to make live
          music fit the moment. Available as a solo performer, duo, or trio, each lineup offers its
          own unique sound and musical character. With a wide-ranging repertoire and personalized
          song selections, every performance is tailored to the event.
        </p>
      </div>

      <div className="cta-row cta-row--wide">
        <Link to="/live-music#events" className="cta-btn">
          See Anders Live
        </Link>
        <Link to="/duo-angella" className="cta-btn">
          Duo - Angella
        </Link>
        <Link to="/duo-ben" className="cta-btn">
          Duo - Ben
        </Link>
        <Link to="/trio" className="cta-btn">
          The Trio
        </Link>
        <Link to="/song-list" className="cta-btn">
          Song List
        </Link>
        <Link to="/connect" className="cta-btn">
          Book Anders
        </Link>
      </div>

      <div className="testimonial-list">
        <Testimonial
          tone={0}
          quote="Anders is awesome to work with! Incredibly talented, easy-going and such an amazing performer! He kept our guest entertained before the ceremony through to our cocktail hour. He really helped set the tone for the rest of the night. Thank you, Anders, for being such an amazing part of our big day!"
          author="Ashley F."
          source="The Knot"
        />

        <Testimonial
          tone={1}
          quote="Anders was so professional and easy to work with from the beginning of our party planning right through the last song at our event. Anders always responded to questions that I asked within a very timely basis and was willing to provide entertainment according to my specifics. His performance at our party far exceeded my expectations, which were set high. Our guests could not stop complimenting us on his talent through our party and afterwards as well. Even the staff at the our venue enjoyed his songs so much that they too advised that they would recommend Anders to future clients."
          author="Sophia W."
          source="Bash"
        />
      </div>

      <Slideshow images={homeGallery} altPrefix="Live music" />

      <EventsSection />

      <section id="faq" className="page-faq" aria-labelledby="live-music-faq-heading">
        <h2 id="live-music-faq-heading">Frequently Asked Questions</h2>
        <div className="divider" />
        <FaqAccordion items={liveMusicFaq} connectAsButton />
      </section>
    </div>
  )
}
