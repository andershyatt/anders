import { Link } from 'react-router-dom'
import DisplayTitle from '../components/DisplayTitle'
import { asset, images } from '../data/media'
import { boothBackdrops } from '../planner/photoBoothImages'
import glamourVideo from '../assets/media/photobooth-glamour-terra.mp4'
import glamourPoster from '../assets/media/photobooth-glamour-terra-poster.jpg'
import greenVideo from '../assets/media/photobooth-green-blue.mp4'
import greenPoster from '../assets/media/photobooth-green-blue-poster.jpg'
import './PhotoBooth.css'

const boothVideos = [
  {
    src: glamourVideo,
    poster: glamourPoster,
    label: 'Glamour booth with terra lighting',
  },
  {
    src: greenVideo,
    poster: greenPoster,
    label: 'Photo booth with green and blue lighting',
  },
]

const packageItems = [
  'Handcrafted wooden photo booth enclosure & matching printer stand',
  'Professional DSLR camera with studio-grade lighting',
  '13-inch iPad Pro front display & 15.9-inch touch rear sharing station',
  'Selection of fun props & choice of custom backdrop',
  'On-site prints for each guest per session (2x6 strips or 4x6)',
  'Multiple convenient digital sharing options',
  'Full setup, on-site technician, and teardown included',
]

const boothPhotos = [
  {
    src: asset('photo-booth-01.jpg'),
    alt: 'Close-up of the wooden photo booth camera and studio light',
  },
  {
    src: asset('photo-booth-02.jpg'),
    alt: 'The wooden photo booth on a tripod with its studio light',
  },
  {
    src: asset('photo-booth-03.jpg'),
    alt: 'Front of the photo booth, with the camera above the guest screen',
  },
  {
    src: asset('photo-booth-04.jpg'),
    alt: 'Oak corner and wood grain of the photo booth enclosure',
  },
]

const boothBody =
  'Our state-of-the-art photo booth offers your guests a fun and stylish way to capture memories that last a lifetime. Whether it’s a wedding, corporate event, or special celebration, our photo booth adds an interactive element that keeps the energy high and the smiles bright. With customizable backdrops, high-quality prints, and instant sharing, it’s guaranteed to make your event unforgettable.'

export default function PhotoBooth() {
  return (
    <div className="booth-page">
      <img
        className="booth-hero"
        src={images.photoBoothBanner}
        alt="The Glamour Booth, a handcrafted wooden photo booth on a tripod"
      />
      <div className="page-content">
        <DisplayTitle page single>
          The Glamour Booth
        </DisplayTitle>
        <p className="booth-subtitle">An open-air photo booth experience</p>
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

        <div className="booth-photos">
          {boothPhotos.map((photo) => (
            <img key={photo.src} src={photo.src} alt={photo.alt} loading="lazy" />
          ))}
        </div>

        <section className="booth-videos" aria-label="Photo booth videos">
          {boothVideos.map((video) => (
            <video
              key={video.src}
              controls
              playsInline
              preload="metadata"
              poster={video.poster}
              aria-label={video.label}
            >
              <source src={video.src} type="video/mp4" />
            </video>
          ))}
        </section>

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
