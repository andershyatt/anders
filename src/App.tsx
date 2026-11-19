import { useEffect, useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { PLANNER_API_URL, SHORT_PLANNER_LINK } from './planner/config'
import SiteLayout from './layout/SiteLayout'
import Home from './pages/Home'
import LiveMusic from './pages/LiveMusic'
import DuoAngella from './pages/DuoAngella'
import DuoBen from './pages/DuoBen'
import Trio from './pages/Trio'
import Dj from './pages/Dj'
import PhotoBooth from './pages/PhotoBooth'
import Connect from './pages/Connect'
import Playlist from './pages/Playlist'

const LEGACY_HASH: Record<string, string> = {
  '/songlist': '/song-list/',
  '/playlist': '/song-list/',
  '/faq': '/live-music/#faq',
  '/dj-faq': '/dj/#faq',
  '/events': '/live-music/#events',
}

/** Old /#/route links, and paths missing the directory trailing slash. */
function CleanUrls() {
  const location = useLocation()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const raw = window.location.hash
    if (raw.startsWith('#/')) {
      const rest = raw.slice(1)
      const cut = rest.indexOf('#', 1)
      const path = cut === -1 ? rest : rest.slice(0, cut)
      const anchor = cut === -1 ? '' : rest.slice(cut)
      navigate(LEGACY_HASH[path] ?? `${path}${anchor}`, { replace: true })
      return
    }
    if (location.pathname.length > 1 && !location.pathname.endsWith('/')) {
      navigate(`${location.pathname}/${location.search}${location.hash}`, { replace: true })
    }
  }, [location, navigate])

  return null
}

/** andershyattmusic.com/060127MikeSarahPlanner -> /planner/?c=TOKEN */
function ShortPlannerLink() {
  const location = useLocation()
  const slug = location.pathname.replace(/^\/+|\/+$/g, '')

  useEffect(() => {
    if (!SHORT_PLANNER_LINK.test(slug)) return
    const controller = new AbortController()
    void fetch(PLANNER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'resolveSlug', slug }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: { ok?: boolean; token?: string }) => {
        if (data.ok && data.token) {
          window.location.replace(`/planner/?c=${encodeURIComponent(data.token)}`)
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [slug])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <CleanUrls />
      <ShortPlannerLink />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="live-music" element={<LiveMusic />} />
          <Route path="duo-angella" element={<DuoAngella />} />
          <Route path="duo-ben" element={<DuoBen />} />
          <Route path="trio" element={<Trio />} />
          <Route path="faq" element={<Navigate to="/live-music/#faq" replace />} />
          <Route path="song-list" element={<Playlist />} />
          <Route path="playlist" element={<Navigate to="/song-list/" replace />} />
          <Route path="songlist" element={<Navigate to="/song-list/" replace />} />
          <Route path="dj" element={<Dj />} />
          <Route path="dj-faq" element={<Navigate to="/dj/#faq" replace />} />
          <Route path="events" element={<Navigate to="/live-music/#events" replace />} />
          <Route path="photo-booth" element={<PhotoBooth />} />
          <Route path="connect" element={<Connect />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
