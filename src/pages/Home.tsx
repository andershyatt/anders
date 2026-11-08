import { useState } from 'react'
import { Link } from 'react-router-dom'
import Slideshow from '../components/Slideshow'
import YouTubeEmbed from '../components/YouTubeEmbed'
import { homeGallery, images } from '../data/media'
import { reviewListings } from '../data/reviews'
import './Home.css'

const homeAbout =
  'Great live music makes a gathering feel special. Anders Hyatt Music brings acoustic performances to weddings and events in the Philadelphia area and worldwide, with songs you love and personal requests that make the day your own. When it’s time to dance, we switch seamlessly to DJ services, giving you one familiar team throughout the celebration. Add a photo booth for a little extra fun.'

const catherineLead =
  "Anders was the perfect choice for our wedding musician. We had a 70 guest wedding at an indoor-outdoor venue. Our venue had recommended Anders when we explained what we were looking for. Throughout the process, Anders was communicative and helpful. He saw and fully understood our vision for the pre-ceremony, ceremony, cocktail hour and dancing flow. Having instrumental acoustic guitar and violin during the pre-ceremony and ceremony, then acoustic with vocals during the cocktail hour was toward the top of our priority list. Nearly all of our guests were amazed and commented on Anders' performance--they were a huge hit!"

const catherineRest =
  "We had a semi-complicated song sequence for our ceremony and Anders executed it perfectly. And the fact that Anders switches over to DJ-ing for the reception within the same price point is big. He incorporated our requests and read the room to adjust the songs to play to the crowd. Anders was also incredibly helpful in organizing the flow of our reception, speeches, etc. If you want a professional, talented musician who can do it all, Anders is your guy! We can't thank him enough for being such an integral part to our special day!"

export default function Home() {
  const [quoteOpen, setQuoteOpen] = useState(false)
  const catherineQuote = quoteOpen ? `${catherineLead} ${catherineRest}` : catherineLead

  return (
    <div className="home">
      <h1 className="sr-only">Anders Hyatt Music</h1>
      <div className="home-wrap">
        <header className="home-intro">
          <h2>Live Music &amp; DJ Services</h2>
          <p className="home-intro__welcome">
            A music experience that feels like yours: customized to the occasion and built to
            elevate the atmosphere
          </p>
          <p className="home-intro__about">{homeAbout}</p>
        </header>

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
              <div className="home-split__actions">
                <Link to="/live-music" className="home-btn">
                  Learn more
                </Link>
                <Link to="/song-list" className="home-btn">
                  Live song list
                </Link>
              </div>
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
                Learn more
              </Link>
            </div>
          </div>
        </section>

        <div className="home-ctas">
          <Link to="/connect" className="home-btn home-btn--block">
            GET A QUOTE
          </Link>
          <Link to="/song-list" className="home-btn home-btn--block">
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
            <p>“{catherineQuote}”</p>
          </blockquote>
          <button
            type="button"
            className="home-quote__more"
            aria-expanded={quoteOpen}
            onClick={() => setQuoteOpen((open) => !open)}
          >
            {quoteOpen ? 'Read less' : 'Read more'}
          </button>
          <figcaption>
            — Catherine Appel
            {' / '}
            <a href={reviewListings.google} target="_blank" rel="noopener noreferrer">
              Google
            </a>
          </figcaption>
        </figure>

        <Slideshow images={homeGallery} altPrefix="Anders Hyatt Music" />

        <div className="home-video">
          <YouTubeEmbed
            videoId="9IO4wOveS2U"
            title="Anders Hyatt Music promo video"
            showCaption={false}
          />
        </div>

        <h2 className="home-reviews-heading">From the people who’ve hired us</h2>
        <div className="home-ratings">
          <p>
            5.0 from{' '}
            <a
              href={reviewListings.google}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="79 Google reviews"
            >
              79
            </a>{' '}
            Google reviews
          </p>
          <p>
            <a
              href={reviewListings.theKnot}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="121 reviews on The Knot"
            >
              121
            </a>{' '}
            on The Knot
          </p>
          <p>
            <a
              href={reviewListings.weddingWire}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="62 reviews on WeddingWire"
            >
              62
            </a>{' '}
            on WeddingWire
          </p>
          <p>
            <a
              href={reviewListings.zola}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="43 reviews on Zola"
            >
              43
            </a>{' '}
            on Zola
          </p>
        </div>
        <ul className="home-badges">
          <li>
            <a
              href={reviewListings.zola}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Anders Hyatt Music reviews on Zola"
            >
              <img src={images.badgeZola} alt="As seen on Zola" />
            </a>
          </li>
          <li>
            <a
              href={reviewListings.theKnot}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Anders Hyatt Music reviews on The Knot"
            >
              <img src={images.badgeTk} alt="The Knot Hall of Fame 2026" />
            </a>
          </li>
          <li>
            <a
              href={reviewListings.weddingWire}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Anders Hyatt Music reviews on WeddingWire"
            >
              <img src={images.badgeBow} alt="WeddingWire Couples' Choice Award 2026" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
