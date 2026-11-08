import { Link } from 'react-router-dom'
import Slideshow from '../components/Slideshow'
import { images, photoBoothGallery } from '../data/media'
import { boothBackdrops } from '../planner/photoBoothImages'
import './PhotoBooth.css'

const packageItems = [
  'Handcrafted wooden photo booth enclosure & matching printer stand',
  'Professional DSLR camera with studio-grade lighting',
  '13-inch iPad Pro front display & 15.9-inch touch rear sharing station',
  'Selection of fun props & choice of custom backdrop',
  'On-site prints for each guest per session (2x6 strips or 4x6)',
  'Multiple convenient digital sharing options',
  'Full setup, on-site technician, and teardown included',
]

const boothBody =
  'Our state-of-the-art photo booth offers your guests a fun and stylish way to capture memories that last a lifetime. Whether it’s a wedding, corporate event, or special celebration, our photo booth adds an interactive element that keeps the energy high and the smiles bright. With customizable backdrops, high-quality prints, and instant sharing, you’re guaranteed to make your event unforgettable.'

export default function PhotoBooth() {
  return (
    <div className="booth-page">
      <img
        className="booth-hero"
        src={images.photoBoothBanner}
        alt="The Glamour Booth, a handcrafted wooden photo booth on a tripod"
      />
      <div className="page-content">
        <h1 className="page-title">The Glamour Booth</h1>
        <p className="booth-subtitle">An open-air photo booth experience</p>
        <div className="divider" />
        <h2>Capture the Fun, Create Memories</h2>
        <p className="booth-subhead">Elevate your event with our elegant, handcrafted photo booth</p>
        <div className="lead">
          <p>{boothBody}</p>
        </div>

        <p>
          <strong>Our photo booth package includes:</strong>
        </p>
        <ul className="photo-booth-packages">
          {packageItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="cta-row">
          <Link to="/connect" className="cta-btn">
            Get a Quote
          </Link>
        </div>

        <p className="photo-booth-backdrops">
          <Link to="/photo-booth#backdrops">View our backdrop options</Link>
        </p>

        <Slideshow images={photoBoothGallery} altPrefix="Photo booth" />

        <section id="backdrops" className="booth-backdrop-section" aria-labelledby="backdrops-heading">
          <h2 id="backdrops-heading">Backdrop Options</h2>
          <ul className="booth-backdrop-grid">
            {boothBackdrops.map((backdrop) => (
              <li key={backdrop.name}>
                <figure>
                  <img src={backdrop.src} alt="" />
                  <figcaption>{backdrop.name}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
