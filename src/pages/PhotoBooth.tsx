import PhotoGallery from '../components/PhotoGallery'
import { photoBoothGallery } from '../data/media'
import './PhotoBooth.css'

const packageItems = [
  'High quality DSLR camera',
  '13-inch iPad Pro front screen',
  '15.9-inch touch back screen sharing station',
  'Photo booth attendant',
  'Prints for each guest per session 2x6" strips or 4x6"',
  'A handcrafted wooden printer box/stand to elevate the appearance',
  'Professional lighting',
  'Your choice of backdrop',
  'Multiple convenient sharing options',
  'Set up and break down',
]

export default function PhotoBooth() {
  return (
    <div className="page-content">
      <h2>The Glamour Booth</h2>
      <div className="divider" />
      <h3>An open-air photo booth experience</h3>

      <h4>Capture the Fun, Create Memories</h4>
      <h4>Elevate Your Event with Our elegant, Handcrafted photo Booth</h4>

      <div className="lead">
        <p>
          Our state-of-the-art Glamour Booth offers your guests a fun and stylish way to capture
          memories that last a lifetime. Whether it&apos;s a wedding, corporate event, or special
          celebration, our photo booth adds an interactive element that keeps the energy high and
          the smiles bright. With customizable backdrops, high-quality prints, and instant sharing,
          you&apos;re guaranteed to make your event unforgettable.
        </p>
      </div>

      <p>
        <strong>Our photo booth package includes:</strong>
      </p>
      <ul className="photo-booth-packages">
        {packageItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p className="photo-booth-backdrops">
        <strong>BACKDROPS:</strong>{' '}
        <a
          href="https://www.andershyattmusic.com/photo-booth-backdrops"
          target="_blank"
          rel="noopener noreferrer"
        >
          Click HERE
        </a>{' '}
        to view our back drop options
      </p>

      <PhotoGallery images={photoBoothGallery} altPrefix="Photo booth" />
    </div>
  )
}
