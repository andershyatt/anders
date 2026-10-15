import { Link } from 'react-router-dom'
import PhotoGallery from '../components/PhotoGallery'
import YouTubeEmbed from '../components/YouTubeEmbed'
import { homeGallery, images } from '../data/media'
import './Home.css'

const ericaQuote =
  "Would highly recommend. Anders and his co-musicians were so nice and wanted to make our wedding music fit whatever our vision was! We had Anders and two of his co-musicians (violin and singer) for the ceremony and cocktail hour and dinner and then Anders DJ'd for the rest of the night. We got so many compliments about how great they sounded! At one point they were playing a song and it sounded like the exact radio version, they also add a nice harmony to their music! Anders was always responsive to emails and willing to chat whenever."

export default function Home() {
  return (
    <div className="home">
      <h1 className="sr-only">Anders Hyatt Music</h1>
      <div className="home-wrap">
        <header className="home-intro">
          <h2>Live Music &amp; DJ Services</h2>
          <p>Philadelphia PA, worldwide</p>
        </header>

        <div className="home-video">
          <YouTubeEmbed
            videoId="9IO4wOveS2U"
            title="Anders Hyatt Music promo video"
            showCaption={false}
          />
        </div>

        <section className="home-split" aria-labelledby="live-music-heading">
          <div className="home-split__media">
            <img
              src={images.homeLiveMusic}
              alt="Anders Hyatt singing and playing acoustic guitar"
            />
          </div>
          <div className="home-split__copy">
            <div className="home-split__card">
              <p id="live-music-heading">
                <strong>LIVE MUSIC</strong>
              </p>
              <p>
                <em>Weddings: Ceremony, Cocktail Hour, Dinner, First Dance, Parent Dances</em>
              </p>
              <p>
                <em>
                  Private parties, corporate events, wineries, breweries, restaurants and bars
                </em>
              </p>
              <p>
                <em>Solo, duo and trio options</em>
              </p>
              <Link to="/live-music" className="home-btn">
                Learn more
              </Link>
            </div>
          </div>
        </section>

        <section className="home-split home-split--image-right" aria-labelledby="dj-heading">
          <div className="home-split__media">
            <img src={images.homeDj} alt="Anders Hyatt performing as a DJ in a cowboy hat" />
          </div>
          <div className="home-split__copy">
            <div className="home-split__card">
              <p id="dj-heading">
                <strong>DJ SERVICES</strong>
              </p>
              <p>
                <em>Weddings: Dinner, Reception, Dancing</em>
              </p>
              <p>
                <em>Private Parties, Corporate events</em>
              </p>
              <p>
                <em>Emcee services included</em>
              </p>
              <Link to="/dj" className="home-btn">
                learn more
              </Link>
            </div>
          </div>
        </section>

        <div className="home-ctas">
          <Link to="/connect" className="home-btn home-btn--block">
            GET A QUOTE
          </Link>
          <Link to="/songlist" className="home-btn home-btn--block">
            LIVE SONG LIST
          </Link>
        </div>

        <img
          className="home-banner"
          src={images.homeBanner}
          alt="A couple celebrating at a wedding reception"
        />

        <figure className="home-quote">
          <blockquote>
            <p>
              “{ericaQuote}” - Erica B.
            </p>
          </blockquote>
          <figcaption>
            —{' '}
            <a
              href="https://g.page/r/CT8HZra3a_GKEB0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google
            </a>
          </figcaption>
        </figure>

        <PhotoGallery images={homeGallery} altPrefix="Anders Hyatt Music" layout="masonry" />

        <ul className="home-badges">
          <li>
            <img src={images.badgeZola} alt="As seen on Zola" />
          </li>
          <li>
            <img src={images.badgeTk} alt="The Knot Hall of Fame 2026" />
          </li>
          <li>
            <img src={images.badgeBow} alt="WeddingWire Couples' Choice Award 2026" />
          </li>
        </ul>
      </div>
    </div>
  )
}
