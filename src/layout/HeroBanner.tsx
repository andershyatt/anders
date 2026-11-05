import { images } from '../data/media'
import SocialBar from './SocialBar'

import './HeroBanner.css'

export type HeroVariant = 'home' | 'guitar' | 'songlist'

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
  const backgroundImage = isHomeStyle ? images.heroHome : images.heroGuitar
  const imageAlt = isHomeStyle
    ? 'Anders Hyatt playing guitar with a band on stage'
    : 'Anders Hyatt playing acoustic guitar'

  return (
    <header
      className={`hero-banner${isHomeStyle ? ' hero-banner--home' : ' hero-banner--guitar'}`}
    >
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
