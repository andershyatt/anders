import { useEffect, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { titleOption } from '../components/titleOption'
import Nav from './Nav'
import HeroBanner, { type HeroVariant } from './HeroBanner'
import Footer from './Footer'
import SocialBar from './SocialBar'
import { images } from '../data/media'
import './layout.css'
import './HomeHero.css'

interface RouteMeta {
  hero: HeroVariant
  title?: string
  subtitle?: string
}

const routeMeta: Record<string, RouteMeta> = {
  '/': { hero: 'home' },
  '/live-music': { hero: 'guitar' },
  '/duo-angella': { hero: 'guitar' },
  '/duo-ben': { hero: 'guitar' },
  '/trio': { hero: 'guitar' },
  '/faq': { hero: 'guitar', title: 'FAQ' },
  '/song-list': { hero: 'songlist', title: 'Live Song List' },
  '/songlist': { hero: 'songlist', title: 'Live Song List' },
  '/playlist': { hero: 'songlist', title: 'Live Song List' },
  '/dj': { hero: 'dj', title: 'Wedding DJ Services' },
  '/dj-faq': { hero: 'guitar', title: 'DJ FAQ' },
  '/photo-booth': { hero: 'guitar', title: 'The Glamour Booth' },
  '/connect': { hero: 'guitar', title: 'Connect' },
}

const defaultMeta: RouteMeta = { hero: 'guitar' }

const songListPaths = new Set(['/song-list', '/songlist', '/playlist'])

const titleChoices = [
  ['a', 'A · Like General & Song List'],
  ['b', 'B · Bigger, full width'],
  ['c', 'C · Fluid and bolder'],
  ['services', 'One line · Live Music & DJ Services'],
  ['short', 'One line · Live Music & DJ'],
] as const

function TitlePreviewBar() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  if (!params.has('title')) return null
  const current = titleOption(params.get('title'))
  return (
    <div className="title-preview" role="navigation" aria-label="Title style preview">
      {titleChoices.map(([id, label]) => (
        <Link
          key={id}
          to={{ pathname, search: `?title=${id}` }}
          className={current === id ? 'is-on' : undefined}
          aria-current={current === id ? 'true' : undefined}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

export default function SiteLayout() {
  const { pathname, hash } = useLocation()
  const meta = routeMeta[pathname] ?? defaultMeta

  useEffect(() => {
    if (!songListPaths.has(pathname) || !meta.title) return
    const previous = document.title
    document.title = `${meta.title} · Anders Hyatt Music`
    return () => {
      document.title = previous
    }
  }, [pathname, meta.title])

  useLayoutEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ''))
    const scrollToAnchor = () => {
      if (!id) return false
      const target = document.getElementById(id)
      if (!target) return false
      target.scrollIntoView({ block: 'start' })
      return true
    }
    if (scrollToAnchor()) return

    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = previous

    if (!id) return
    const frame = window.requestAnimationFrame(() => {
      if (!scrollToAnchor()) window.scrollTo(0, 0)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash])

  const isHome = pathname === '/'

  return (
    <div className={`site-layout${isHome ? ' site-layout--home' : ''}`}>
      <Nav />
      <TitlePreviewBar />
      {isHome ? (
        <header className="home-hero">
          <img
            className="home-hero__image"
            src={images.heroHome}
            alt="Anders Hyatt playing guitar with a band on stage"
          />
          <div className="home-hero__social">
            <SocialBar variant="hero" />
          </div>
        </header>
      ) : pathname === '/photo-booth' ? null : (
        <HeroBanner variant={meta.hero} title={meta.title} subtitle={meta.subtitle} />
      )}
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
