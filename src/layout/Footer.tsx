import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <p className="site-footer__brand">Anders Hyatt Music</p>
      <p className="site-footer__copy">&copy; {year} Anders Hyatt Music. All rights reserved.</p>
    </footer>
  )
}
