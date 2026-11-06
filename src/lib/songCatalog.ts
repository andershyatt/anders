import { useEffect, useSyncExternalStore } from 'react'
import songsData from '../data/songs.json'
import type { Song } from '../types/song'
import { fetchSheetSongs } from './sheetSongs'

const bundledSongs = songsData as Song[]

export type SongCatalogStatus = 'loading' | 'sheet' | 'saved'

type Catalog = {
  songs: Song[]
  status: SongCatalogStatus
}

let catalog: Catalog = { songs: [], status: 'loading' }
const listeners = new Set<() => void>()
let pending: Promise<void> | null = null

function pairKey(song: { title: string; artist: string }): string {
  return `${song.title.trim().toLowerCase()}|${song.artist.trim().toLowerCase()}`
}

/**
 * Saved playlist rows and older builds use the slug ids in songs.json.
 * The sheet's own ids are different, so a title-and-artist match keeps the old id.
 */
export function withStableIds(sheet: Song[], known: Song[] = bundledSongs): Song[] {
  const idsByPair = new Map<string, string[]>()
  for (const song of known) {
    const key = pairKey(song)
    const list = idsByPair.get(key)
    if (list) list.push(song.id)
    else idsByPair.set(key, [song.id])
  }
  const used = new Set<string>()
  return sheet.map((song) => {
    const legacy = (idsByPair.get(pairKey(song)) ?? []).find((id) => !used.has(id))
    if (!legacy) return song
    used.add(legacy)
    return { ...song, id: legacy }
  })
}

function emit() {
  for (const listener of listeners) listener()
}

export function getSongCatalog(): Catalog {
  return catalog
}

export function subscribeSongCatalog(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function ensureSheetSongs(): void {
  if (pending) return
  pending = fetchSheetSongs()
    .then((sheet) => {
      catalog = { songs: withStableIds(sheet), status: 'sheet' }
    })
    .catch(() => {
      catalog = { songs: bundledSongs, status: 'saved' }
    })
    .then(() => {
      emit()
    })
}

export function useSongCatalog(): Catalog {
  useEffect(() => {
    ensureSheetSongs()
  }, [])
  return useSyncExternalStore(subscribeSongCatalog, getSongCatalog, getSongCatalog)
}
