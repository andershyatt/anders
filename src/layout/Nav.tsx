import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Nav.css'

interface NavLink {
  label: string
  to: string
}

interface NavDropdown {
  label: string
  to?: string
  items: NavLink[]
}

const liveMusicDropdown: NavLink[] = [
  { label: 'Duo - Angella', to: '/duo-angella' },
  { label: 'Duo - Ben', to: '/duo-ben' },
  { label: 'Video', to: '/video' },
  { label: 'FAQ', to: '/faq' },
  { label: 'SongList', to: '/songlist' },
  { label: 'Build Playlist', to: '/playlist' },
]

const djDropdown: NavLink[] = [{ label: 'DJ FAQ', to: '/dj-faq' }]

const topLinks: (NavLink | NavDropdown)[] = [
  { label: 'Home', to: '/' },
  { label: 'Live Music', to: '/live-music', items: liveMusicDropdown },
  { label: 'DJ', to: '/dj', items: djDropdown },
  { label: 'Events', to: '/events' },
  { label: 'Photo Booth', to: '/photo-booth' },
  { label: 'Connect', to: '/connect' },
]

function isDropdown(item: NavLink | NavDropdown): item is NavDropdown {
  return 'items' in item
}

function isActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function isDropdownActive(pathname: string, to: string | undefined, items: NavLink[]): boolean {
  if (to && isActive(pathname, to)) return true
  return items.some((item) => isActive(pathname, item.to))
}

export default function Nav() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const toggleDropdown = (label: string) => {
    setOpenDropdown((current) => (current === label ? null : label))
  }

  const closeMobile = () => {
    setMobileOpen(false)
    setOpenDropdown(null)
  }

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="site-nav__inner">
        <button
          type="button"
          className={`site-nav__toggle${mobileOpen ? ' site-nav__toggle--open' : ''}`}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="site-nav__toggle-bar" />
          <span className="site-nav__toggle-bar" />
          <span className="site-nav__toggle-bar" />
        </button>

        <ul className={`site-nav__list${mobileOpen ? ' site-nav__list--open' : ''}`}>
          {topLinks.map((item) => {
            if (isDropdown(item)) {
              const active = isDropdownActive(pathname, item.to, item.items)
              const isOpen = openDropdown === item.label

              return (
                <li
                  key={item.label}
                  className={`site-nav__item${isOpen ? ' site-nav__item--open' : ''}`}
                >
                  <button
                    type="button"
                    className={`site-nav__trigger${active ? ' site-nav__link--active' : ''}`}
                    aria-expanded={isOpen}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    {item.label}
                  </button>
                  <ul className="site-nav__dropdown">
                    {item.to && (
                      <li>
                        <Link
                          to={item.to}
                          className={`site-nav__dropdown-link${isActive(pathname, item.to) ? ' site-nav__dropdown-link--active' : ''}`}
                          onClick={closeMobile}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )}
                    {item.items.map((sub) => (
                      <li key={sub.to}>
                        <Link
                          to={sub.to}
                          className={`site-nav__dropdown-link${isActive(pathname, sub.to) ? ' site-nav__dropdown-link--active' : ''}`}
                          onClick={closeMobile}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            }

            return (
              <li key={item.to} className="site-nav__item">
                <Link
                  to={item.to}
                  className={`site-nav__link${isActive(pathname, item.to) ? ' site-nav__link--active' : ''}`}
                  onClick={closeMobile}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
