import { reviewListingUrl } from '../data/reviews'
import './Testimonial.css'

/** First name plus last initial, as in “Catherine A”. */
function reviewerName(name: string): string {
  const parts = name.trim().replace(/\.$/, '').split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts[0] ?? name.trim()
  const last = parts[parts.length - 1]
  const initial = last.length === 1 ? last : last[0]
  return `${parts.slice(0, -1).join(' ')} ${initial}`
}

interface TestimonialProps {
  quote: string
  author: string
  source?: string
  /** Soft on-brand box. Omit to leave the quote unboxed. */
  tone?: 0 | 1 | 2
}

export default function Testimonial({ quote, author, source, tone }: TestimonialProps) {
  const className = [
    'testimonial',
    tone !== undefined ? `testimonial--box testimonial--tone-${tone}` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const listingUrl = source ? reviewListingUrl(source) : undefined
  const shownAuthor = reviewerName(author)
  const paragraphs = quote.split(/\n\n+/)

  return (
    <blockquote className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="testimonial__quote">
          {paragraph}
        </p>
      ))}
      <footer className="testimonial__author">
        &mdash; {shownAuthor}
        {source && (
          <span className="testimonial__source">
            {' / '}
            {listingUrl ? (
              <a href={listingUrl} target="_blank" rel="noopener noreferrer">
                {source}
              </a>
            ) : (
              source
            )}
          </span>
        )}
      </footer>
    </blockquote>
  )
}
