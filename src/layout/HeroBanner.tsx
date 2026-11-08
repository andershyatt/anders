import { images } from '../data/media'
import SocialBar from './SocialBar'

import './HeroBanner.css'

export type HeroVariant = 'home' | 'guitar' | 'songlist' | 'dj'

interface HeroBannerProps {
  variant?: HeroVariant
  title?: string
  subtitle?: string
}

export default function HeroBanner({
  variant = 'guitar',
  title,
  subtitle,
}: HeroBannerProps) {
  const isHomeStyle = variant === 'home' || variant === 'songlist'
  const backgroundImage =
    variant === 'dj' ? images.heroDj : isHomeStyle ? images.heroHome : images.heroGuitar
  const imageAlt =
    variant === 'dj'
      ? 'Overhead view of the Anders Hyatt Music DJ booth'
      : isHomeStyle
        ? 'Anders Hyatt playing guitar with a band on stage'
        : 'Anders Hyatt playing acoustic guitar'
  const variantClass =
    variant === 'dj' ? 'hero-banner--dj' : isHomeStyle ? 'hero-banner--home' : 'hero-banner--guitar'

  return (
    <header className={`hero-banner ${variantClass}`}>
      <img className="hero-banner__image" src={backgroundImage} alt={imageAlt} />
      {title && <h1 className="sr-only">{title}</h1>}
      <div className="hero-banner__inner">
        {subtitle && (
          <div className="hero-banner__content">
            <p className="hero-banner__subtitle">{subtitle}</p>
          </div>
        )}
        <div className="hero-banner__bottom">
          <SocialBar variant="hero" />
        </div>
      </div>
    </header>
  )
}
