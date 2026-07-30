import { Link } from 'react-router-dom'
import PhotoGallery from '../components/PhotoGallery'
import Testimonial from '../components/Testimonial'
import { homeGallery } from '../data/media'
import './Home.css'

export default function Home() {
  return (
    <div className="page-content">
      <h2>Live Music &amp; DJ Services</h2>
      <div className="divider" />
      <p className="home-location">Philadelphia PA, worldwide</p>

      <div className="home-services">
        <div className="home-services__block">
          <h3>Live Music</h3>
          <ul>
            <li>
              <strong>Weddings:</strong> Ceremony, Cocktail Hour, Dinner, First Dance, Parent
              Dances
            </li>
            <li>
              Private parties, corporate events, wineries, breweries, restaurants and bars
            </li>
            <li>Solo, duo and trio options</li>
          </ul>
        </div>
        <div className="home-services__block">
          <h3>DJ Services</h3>
          <ul>
            <li>
              <strong>Weddings:</strong> Dinner, Reception, Dancing
            </li>
            <li>Private Parties, Corporate events</li>
            <li>Emcee services included</li>
          </ul>
        </div>
      </div>

      <div className="btn-row">
        <Link to="/live-music" className="btn">
          Learn more
        </Link>
        <Link to="/connect" className="btn btn-dark">
          Get a Quote
        </Link>
        <Link to="/songlist" className="btn btn-outline">
          Live Song List
        </Link>
      </div>

      <Testimonial
        quote="Would highly recommend. Anders and his co-musicians were so nice and wanted to make our wedding music fit whatever our vision was! We had Anders and two of his co-musicians (violin and singer) for the ceremony and cocktail hour and dinner and then Anders DJ'd for the rest of the night. We got so many compliments about how great they sounded! At one point they were playing a song and it sounded like the exact radio version, they also add a nice harmony to their music! Anders was always responsive to emails and willing to chat whenever."
        author="Erica B."
        source="Google"
      />

      <PhotoGallery images={homeGallery} altPrefix="Anders Hyatt Music" />
    </div>
  )
}
