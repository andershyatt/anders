import { useCallback, useEffect, useState } from 'react'
import type { Song } from '../types/song'

const STORAGE_KEY = 'anders-playlist-ids'

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function usePlaylist(allSongs: Song[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => readIds())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds))
  }, [selectedIds])

  const songMap = new Map(allSongs.map((s) => [s.id, s]))
  const selectedSongs = selectedIds
    .map((id) => songMap.get(id))
    .filter((s): s is Song => Boolean(s))

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds],
  )

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const remove = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const move = useCallback((id: string, direction: -1 | 1) => {
    setSelectedIds((prev) => {
      const i = prev.indexOf(id)
      if (i < 0) return prev
      const j = i + direction
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  const clear = useCallback(() => setSelectedIds([]), [])

  return {
    selectedIds,
    selectedSongs,
    isSelected,
    toggle,
    remove,
    move,
    clear,
    count: selectedIds.length,
  }
}
