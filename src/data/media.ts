/** Resolve image paths under src/assets/images/ (populated by fetch-assets script). */
export const asset = (name: string): string =>
  new URL(`../assets/images/${name}`, import.meta.url).href

export const images = {
  logo: asset('logo.png'),
  heroHome: asset('hero-home.jpg'),
  heroGuitar: asset('hero-guitar.jpg'),
  liveMusicFeature: asset('live-music-feature.jpeg'),
  photoBoothBanner: asset('photo-booth-banner.jpg'),
  duoAngella: asset('duo-angella-01.jpg'),
  duoBen: asset('duo-ben-01.jpg'),
} as const

/** Locally cached YouTube poster frame (see scripts/fetch-assets.mjs). */
export const videoPoster = (videoId: string): string => asset(`yt-${videoId}.jpg`)

export const homeGallery: string[] = Array.from({ length: 15 }, (_, i) =>
  asset(`home-gallery-${String(i + 1).padStart(2, '0')}.jpg`),
)

export const djGallery: string[] = Array.from({ length: 14 }, (_, i) =>
  asset(`dj-gallery-${String(i + 1).padStart(2, '0')}.jpg`),
)

export const photoBoothGallery: string[] = [
  images.photoBoothBanner,
  asset('photo-booth-01.jpg'),
  asset('photo-booth-02.jpg'),
  asset('photo-booth-03.jpg'),
  asset('photo-booth-04.jpg'),
]
