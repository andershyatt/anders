import SocialBar from '../layout/SocialBar'
import { honeyBookUrl } from '../data/social'
import './Connect.css'

export default function Connect() {
  return (
    <div className="page-content">
      <div className="connect-form">
        <iframe
          className="connect-form__iframe"
          src={honeyBookUrl}
          title="Contact Anders Hyatt Music"
        />
      </div>

      <div className="connect-social">
        <h3>Follow Anders</h3>
        <SocialBar variant="dark" />
      </div>
    </div>
  )
}
