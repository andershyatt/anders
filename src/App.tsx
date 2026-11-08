import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="live-music" element={<LiveMusic />} />
          <Route path="duo-angella" element={<DuoAngella />} />
          <Route path="duo-ben" element={<DuoBen />} />
          <Route path="trio" element={<Trio />} />
          <Route path="faq" element={<Navigate to="/live-music#faq" replace />} />
          <Route path="song-list" element={<Playlist />} />
          <Route path="playlist" element={<Navigate to="/song-list" replace />} />
          <Route path="songlist" element={<Navigate to="/song-list" replace />} />
          <Route path="dj" element={<Dj />} />
          <Route path="dj-faq" element={<Navigate to="/dj#faq" replace />} />
          <Route path="events" element={<Navigate to="/live-music#events" replace />} />
          <Route path="photo-booth" element={<PhotoBooth />} />
          <Route path="connect" element={<Connect />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
