import { useLocation } from 'react-router-dom'
import SocialBar from './SocialBar'
import './Footer.css'

export default function Footer() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const year = new Date().getFullYear()

  return (
    <footer className={`site-footer${isHome ? ' site-footer--home' : ''}`}>
      {isHome ? (
        <SocialBar variant="brand" order={['instagram', 'facebook', 'youtube']} />
      ) : (
        <p className="site-footer__brand">Anders Hyatt Music</p>
      )}
      <p className="site-footer__copy">&copy; {year} Anders Hyatt Music. All rights reserved.</p>
    </footer>
  )
}
