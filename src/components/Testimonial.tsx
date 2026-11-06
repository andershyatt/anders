import { reviewListingUrl } from '../data/reviews'
import './Testimonial.css'

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

  return (
    <blockquote className={className}>
      <p className="testimonial__quote">{quote}</p>
      <footer className="testimonial__author">
        &mdash; {author}
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
