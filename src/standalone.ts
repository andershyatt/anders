import { useEffect, useRef, useState } from 'react'

type StandaloneNavigator = Navigator & { standalone?: boolean }

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as StandaloneNavigator
  return (
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  )
}

export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(isStandalone)
  useEffect(() => {
    const queries = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: fullscreen)'),
    ]
    const update = () => setStandalone(isStandalone())
    update()
    for (const query of queries) query.addEventListener('change', update)
    return () => {
      for (const query of queries) query.removeEventListener('change', update)
    }
  }, [])
  return standalone
}

export function registerInstalledApp(): void {
  if (!('serviceWorker' in navigator)) return
  const worker = new URL('../sw.js', window.location.href)
  void navigator.serviceWorker.register(worker).catch(() => {})
  void navigator.storage?.persist?.()
}

function atScrollTop(): boolean {
  const scrolling = document.scrollingElement
  return (scrolling?.scrollTop ?? window.scrollY) <= 0
}

/** iOS standalone has no browser refresh. A downward pull from the top reloads the page, or runs onRefresh. */
export function usePullToRefresh(enabled: boolean, onRefresh?: () => void): number {
  const [pull, setPull] = useState(0)
  const refreshRef = useRef(onRefresh)
  useEffect(() => {
    refreshRef.current = onRefresh
  }, [onRefresh])
  useEffect(() => {
    if (!enabled) return
    let startX = 0
    let startY = 0
    let armed = false
    let distance = 0

    const onStart = (event: TouchEvent) => {
      if (!atScrollTop() || event.touches.length !== 1) return
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, .planner-picker')) return
      startX = event.touches[0].clientX
      startY = event.touches[0].clientY
      armed = true
      distance = 0
    }
    const onMove = (event: TouchEvent) => {
      if (!armed) return
      const dx = event.touches[0].clientX - startX
      const dy = event.touches[0].clientY - startY
      if (dy < 8 || Math.abs(dx) > dy || !atScrollTop()) {
        if (distance === 0 && (dy < 0 || Math.abs(dx) > 12)) armed = false
        return
      }
      distance = Math.min(dy, 120)
      setPull(distance)
      if (event.cancelable) event.preventDefault()
    }
    const onEnd = () => {
      if (!armed) return
      armed = false
      if (distance > 72 && atScrollTop()) {
        distance = 0
        setPull(0)
        const refresh = refreshRef.current
        if (refresh) refresh()
        else window.location.reload()
        return
      }
      distance = 0
      setPull(0)
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onEnd)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }
  }, [enabled])
  return enabled ? pull : 0
}
