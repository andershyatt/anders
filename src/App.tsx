import { HashRouter, Route, Routes } from 'react-router-dom'
import SiteLayout from './layout/SiteLayout'
import Home from './pages/Home'
import LiveMusic from './pages/LiveMusic'
import DuoAngella from './pages/DuoAngella'
import DuoBen from './pages/DuoBen'
import Video from './pages/Video'
import Faq from './pages/Faq'
import Dj from './pages/Dj'
import DjFaq from './pages/DjFaq'
import Events from './pages/Events'
import PhotoBooth from './pages/PhotoBooth'
import Connect from './pages/Connect'
import SongList from './pages/SongList'
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
          <Route path="video" element={<Video />} />
          <Route path="faq" element={<Faq />} />
          <Route path="songlist" element={<SongList />} />
          <Route path="playlist" element={<Playlist />} />
          <Route path="dj" element={<Dj />} />
          <Route path="dj-faq" element={<DjFaq />} />
          <Route path="events" element={<Events />} />
          <Route path="photo-booth" element={<PhotoBooth />} />
          <Route path="connect" element={<Connect />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
