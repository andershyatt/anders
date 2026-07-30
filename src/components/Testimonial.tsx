import './Testimonial.css'

interface TestimonialProps {
  quote: string
  author: string
  source?: string
}

export default function Testimonial({ quote, author, source }: TestimonialProps) {
  return (
    <blockquote className="testimonial">
      <p className="testimonial__quote">{quote}</p>
      <footer className="testimonial__author">
        &mdash; {author}
        {source && <span className="testimonial__source"> / {source}</span>}
      </footer>
    </blockquote>
  )
}
