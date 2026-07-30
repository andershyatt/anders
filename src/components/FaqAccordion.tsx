import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { FaqItem } from '../data/faq'
import './FaqAccordion.css'

interface FaqAccordionProps {
  items: FaqItem[]
  showConnectLink?: boolean
}

export default function FaqAccordion({ items, showConnectLink = true }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const isOpen = openIndex === index

        return (
          <div
            key={item.question}
            className={`faq-accordion__item${isOpen ? ' faq-accordion__item--open' : ''}`}
          >
            <button
              type="button"
              className="faq-accordion__trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <span className="faq-accordion__icon" aria-hidden="true" />
            </button>
            {isOpen && (
              <div className="faq-accordion__panel">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        )
      })}

      {showConnectLink && (
        <p className="faq-accordion__cta">
          Don&apos;t see the answer to your question?{' '}
          <Link to="/connect">Ask Anders directly!</Link>
        </p>
      )}
    </div>
  )
}
