/**
 * Browser key for the Places API (New). Replace the placeholder with the real
 * key before deploy. Restrict that key to the Places API and to the site
 * referrers (https://andershyatt.github.io/* and andershyattmusic.com/*).
 */
export const GOOGLE_PLACES_API_KEY: string = '__GOOGLE_PLACES_API_KEY__'

const PLACEHOLDER = '__GOOGLE_PLACES_API_KEY__'

export function googlePlacesConfigured(): boolean {
  return GOOGLE_PLACES_API_KEY !== PLACEHOLDER && GOOGLE_PLACES_API_KEY.trim() !== ''
}
