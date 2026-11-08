import { useEffect } from 'react'
import DisplayTitle from '../components/DisplayTitle'
import SocialBar from '../layout/SocialBar'
import { honeyBookUrl } from '../data/social'
import './Connect.css'

/** Website placement HoneyBook's own widget page uses for this company. */
const PLACEMENT_ID = '5d76931a48662902d02a56c0'
/** Contact form cf_id 66edb49d0167ca002bb0149d, selector from that placement. */
const FORM_ID = '66edb49d0167ca002bb0149d'
const FORM_CLASS = 'hb-p-5d76931a48662902d02a56c0-3'
const SCRIPT_ID = 'honeybook-placement'
const SCRIPT_SRC =
  'https://widget.honeybook.com/assets_users_production/websiteplacements/placement-controller.min.js'

type HoneyBookApi = {
  pid?: string
  ctrlLoaded?: boolean
  userConfig?: object
  handleForms?: (config: object) => void
  iframeElements?: Record<string, HTMLIFrameElement | undefined>
}

declare global {
  interface Window {
    _HB_?: HoneyBookApi
  }
}

function mountHoneyBook() {
  const hb = (window._HB_ = window._HB_ || {})
  hb.pid = PLACEMENT_ID
  if (hb.ctrlLoaded && hb.userConfig && hb.handleForms) {
    if (hb.iframeElements) delete hb.iframeElements[FORM_ID]
    hb.handleForms(hb.userConfig)
    return
  }
  if (document.getElementById(SCRIPT_ID)) return
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = SCRIPT_SRC
  document.body.appendChild(script)
}

export default function Connect() {
  useEffect(() => {
    mountHoneyBook()
    return () => {
      const frames = window._HB_?.iframeElements
      if (frames) delete frames[FORM_ID]
    }
  }, [])

  return (
    <div className="page-content">
      <DisplayTitle>Ready to start planning?</DisplayTitle>
      <p className="connect-intro">Share a few details below and we’ll be in touch.</p>
      <div className="connect-form">
        <div className={`connect-form__embed ${FORM_CLASS}`} />
        <div className="cta-row connect-form__fallback">
          <a className="cta-btn" href={honeyBookUrl} target="_blank" rel="noopener noreferrer">
            Open the contact form
          </a>
        </div>
      </div>

      <div className="connect-social">
        <h3>Follow Anders</h3>
        <SocialBar variant="dark" />
      </div>
    </div>
  )
}
