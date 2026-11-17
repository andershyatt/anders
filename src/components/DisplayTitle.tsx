import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { titleOption } from './titleOption'
import './DisplayTitle.css'

interface DisplayTitleProps {
  as?: 'h1' | 'h2' | 'h3'
  children: string
  /** Main page heading. Section titles stay on the current one-line fit. */
  page?: boolean
}

/** Two lines of similar length, so a long title can fill the width at a large size. */
function splitTitle(text: string): string[] {
  const words = text.trim().split(/\s+/)
  if (words.length < 2 || text.trim().length <= 16) return [text.trim()]
  let best = 1
  let bestScore = Infinity
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ')
    const right = words.slice(i).join(' ')
    const short = Math.min(left.length, right.length)
    const score = Math.abs(left.length - right.length) + (short < 6 ? 12 : 0)
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

/** Josefin title sized to the content width. */
export default function DisplayTitle({ as: Tag = 'h1', children, page = false }: DisplayTitleProps) {
  const [params] = useSearchParams()
  const option = page ? titleOption(params.get('title')) : 'a'
  const lines = option === 'b' ? splitTitle(children) : [children.trim()]
  const chars = Math.max(...lines.map((line) => line.length), 1)
  return (
    <div className={`display-title${page ? ` display-title--${option}` : ''}`}>
      <Tag className="display-title__box" style={{ '--chars': chars } as CSSProperties}>
        {option === 'b' ? (
          lines.map((line) => (
            <span className="display-title__line" key={line}>
              <span className="display-title__text">{line}</span>
            </span>
          ))
        ) : (
          <span className="display-title__text">{children}</span>
        )}
      </Tag>
    </div>
  )
}
