import type { CSSProperties } from 'react'
import './DisplayTitle.css'

interface DisplayTitleProps {
  as?: 'h1' | 'h2' | 'h3'
  children: string
  /** Page heading. Section titles keep the original one-line size. */
  page?: boolean
}

const BULLET_HOME_TITLE = 'Live Music • DJ'

/** Two lines of similar length, so a long title fills the width at a large size. */
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
  const text = children.trim()
  const bullet = text === BULLET_HOME_TITLE
  const lines = page && !bullet ? splitTitle(text) : [text]
  const chars = Math.max(...lines.map((line) => line.length), 1)
  const look = bullet ? 'bullet' : page ? 'b' : ''
  return (
    <div className={`display-title${look ? ` display-title--${look}` : ''}`}>
      <Tag className="display-title__box" style={{ '--chars': chars } as CSSProperties}>
        {bullet ? (
          <span className="display-title__text">
            Live Music <span className="display-title__mark">•</span> DJ
          </span>
        ) : page ? (
          lines.map((line) => (
            <span className="display-title__line" key={line}>
              <span className="display-title__text">{line}</span>
            </span>
          ))
        ) : (
          <span className="display-title__text">{text}</span>
        )}
      </Tag>
    </div>
  )
}
