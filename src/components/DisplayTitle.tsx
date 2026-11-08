import type { CSSProperties } from 'react'
import './DisplayTitle.css'

interface DisplayTitleProps {
  as?: 'h1' | 'h2' | 'h3'
  children: string
}

/** Josefin title sized to the content width, with a border that hugs the letters. */
export default function DisplayTitle({ as: Tag = 'h1', children }: DisplayTitleProps) {
  const chars = children.trim().length
  return (
    <div className="display-title">
      <Tag
        className="display-title__box"
        style={{ '--chars': chars } as CSSProperties}
      >
        <span className="display-title__text">{children}</span>
      </Tag>
    </div>
  )
}
