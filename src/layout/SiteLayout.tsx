import { Outlet, useLocation } from 'react-router-dom'
import Nav from './Nav'
import HeroBanner, { type HeroVariant } from './HeroBanner'
import Footer from './Footer'
import './layout.css'

interface RouteMeta {
  hero: HeroVariant
  title?: string
  subtitle?: string
}

const routeMeta: Record<string, RouteMeta> = {
  '/': { hero: 'home' },
  '/live-music': { hero: 'guitar', title: 'Live Music' },
  '/duo-angella': { hero: 'guitar', title: 'Anders & Angella' },
  '/duo-ben': { hero: 'guitar', title: 'Anders & Ben' },
  '/video': { hero: 'guitar', title: 'Video' },
  '/faq': { hero: 'guitar', title: 'FAQ' },
  '/songlist': { hero: 'songlist', title: 'Song List' },
  '/playlist': { hero: 'songlist', title: 'Build Playlist' },
  '/dj': { hero: 'guitar', title: 'Wedding DJ Services' },
  '/dj-faq': { hero: 'guitar', title: 'DJ FAQ' },
  '/events': { hero: 'guitar', title: 'Events' },
  '/photo-booth': { hero: 'guitar', title: 'The Glamour Booth' },
  '/connect': { hero: 'guitar', title: 'Connect' },
}

const defaultMeta: RouteMeta = { hero: 'guitar' }

export default function SiteLayout() {
  const { pathname } = useLocation()
  const meta = routeMeta[pathname] ?? defaultMeta

  return (
    <div className="site-layout">
      <Nav />
      <HeroBanner variant={meta.hero} title={meta.title} subtitle={meta.subtitle} />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
