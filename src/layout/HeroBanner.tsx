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

  return (
    <header
      className={`hero-banner${isHomeStyle ? ' hero-banner--home' : ' hero-banner--guitar'}`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="hero-banner__inner">
        {(title || subtitle) && (
          <div className="hero-banner__content">
            {title && <h1 className="hero-banner__title">{title}</h1>}
            {subtitle && <p className="hero-banner__subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="hero-banner__bottom">
          <SocialBar variant="hero" />
        </div>
      </div>
    </header>
  )
}
