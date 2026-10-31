/**
 * Browser key for the Places API (New). The deploy workflow injects
 * VITE_GOOGLE_PLACES_API_KEY from the Actions variable GOOGLE_PLACES_API_KEY.
 * An empty or missing value keeps the Photon search. Restrict the real key
 * to the Places API and to https://andershyatt.github.io/* and
 * andershyattmusic.com/*.
 */
function readPlacesKey(): string {
  const value = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
  return typeof value === 'string' ? value.trim() : ''
}

export const GOOGLE_PLACES_API_KEY = readPlacesKey()

export function googlePlacesConfigured(): boolean {
  return GOOGLE_PLACES_API_KEY !== ''
}
