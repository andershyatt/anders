import FaqAccordion from '../components/FaqAccordion'
import { djFaq } from '../data/faq'

export default function DjFaq() {
  return (
    <div className="page-content">
      <h2>Frequently Asked Questions</h2>
      <div className="divider" />
      <FaqAccordion items={djFaq} />
    </div>
  )
}
