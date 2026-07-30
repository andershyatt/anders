import FaqAccordion from '../components/FaqAccordion'
import { liveMusicFaq } from '../data/faq'

export default function Faq() {
  return (
    <div className="page-content">
      <h2>Frequently Asked Questions</h2>
      <div className="divider" />
      <FaqAccordion items={liveMusicFaq} />
    </div>
  )
}
