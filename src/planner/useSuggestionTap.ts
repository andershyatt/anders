import { useRef, type MouseEvent, type PointerEvent } from 'react'

/** A finger has to move farther than this before a touch counts as a scroll. */
const TAP_THRESHOLD_PX = 10

/**
 * Suggestion rows are selected on a tap that doesn't move. A touch-drag scrolls
 * the list instead. Mouse clicks still select, and mousedown is cancelled so
 * the field doesn't blur before the click.
 */
export function useSuggestionTap(onPickIndex: (index: number) => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const moved = useRef(false)
  const suppressClick = useRef(false)

  const pickFrom = (target: EventTarget | null) => {
    const option = target instanceof Element ? target.closest<HTMLElement>('[data-option-index]') : null
    if (!option) return
    const index = Number(option.dataset.optionIndex)
    if (!Number.isInteger(index)) return
    onPickIndex(index)
  }

  return {
    onPointerDown(event: PointerEvent<HTMLUListElement>) {
      if (event.pointerType === 'mouse') return
      start.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
      moved.current = false
    },
    onPointerMove(event: PointerEvent<HTMLUListElement>) {
      const origin = start.current
      if (!origin || event.pointerId !== origin.id) return
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > TAP_THRESHOLD_PX) {
        moved.current = true
      }
    },
    onPointerUp(event: PointerEvent<HTMLUListElement>) {
      if (event.pointerType === 'mouse') return
      const origin = start.current
      const didMove = moved.current
      start.current = null
      moved.current = false
      if (!origin || event.pointerId !== origin.id || didMove) {
        if (didMove) suppressClick.current = true
        return
      }
      suppressClick.current = true
      pickFrom(event.target)
    },
    onPointerCancel() {
      start.current = null
      moved.current = true
      suppressClick.current = true
    },
    onMouseDown(event: MouseEvent<HTMLUListElement>) {
      if (event.button !== 0) return
      event.preventDefault()
    },
    onClick(event: MouseEvent<HTMLUListElement>) {
      if (suppressClick.current) {
        suppressClick.current = false
        event.preventDefault()
        return
      }
      pickFrom(event.target)
    },
  }
}
