import { GOOGLE_PLACES_API_KEY, googlePlacesConfigured } from './googlePlacesKey'

export type VenueProvider = 'google' | 'photon'

export interface VenueMatch {
  id: string
  name: string
  address: string
  source: VenueProvider
  placeId?: string
}

export interface VenueSearchResult {
  matches: VenueMatch[]
  provider: VenueProvider
}

interface PhotonProperties {
  osm_id?: number
  osm_type?: string
  name?: string
  housenumber?: string
  street?: string
  city?: string
  locality?: string
  district?: string
  county?: string
  state?: string
  postcode?: string
  country?: string
}

interface PhotonFeature {
  properties?: PhotonProperties
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

interface GoogleText {
  text?: string
}

interface GooglePlacePrediction {
  placeId?: string
  structuredFormat?: {
    mainText?: GoogleText
    secondaryText?: GoogleText
  }
}

interface GoogleAutocompleteResponse {
  suggestions?: Array<{ placePrediction?: GooglePlacePrediction }>
}

interface GooglePlaceDetails {
  displayName?: GoogleText
  formattedAddress?: string
}

/** Center of the Philadelphia / Bucks County area. Biases Photon ranking, does not filter. */
const BIAS_LAT = 40.35
const BIAS_LON = -75.1

/** Southeastern Pennsylvania / New Jersey. Biases Google ranking, does not exclude other US places. */
const GOOGLE_BIAS_LAT = 40.2
const GOOGLE_BIAS_LON = -75.2
const GOOGLE_BIAS_RADIUS_M = 50000

const PHOTON_URL = 'https://photon.komoot.io/api/'
const GOOGLE_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const GOOGLE_PLACE_URL = 'https://places.googleapis.com/v1/places/'

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function formatAddress(properties: PhotonProperties): string {
  const street = [properties.housenumber, properties.street].filter(Boolean).join(' ')
  const city = properties.city || properties.locality || properties.district || properties.county || ''
  const region = [properties.state, properties.postcode].filter(Boolean).join(' ')
  const locality = [city, region].filter(Boolean).join(', ')
  const country = properties.country && properties.country !== 'United States' ? properties.country : ''
  return [street, locality, country].filter(Boolean).join(', ')
}

function toPhotonMatch(feature: PhotonFeature): VenueMatch | null {
  const properties = feature.properties
  if (!properties?.name) return null
  const address = formatAddress(properties)
  const id = `${properties.osm_type ?? 'x'}-${properties.osm_id ?? properties.name}-${address}`
  return { id, name: properties.name, address, source: 'photon' }
}

async function searchPhoton(query: string, signal: AbortSignal): Promise<VenueMatch[]> {
  const url = new URL(PHOTON_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lat', String(BIAS_LAT))
  url.searchParams.set('lon', String(BIAS_LON))

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`venue search ${response.status}`)
  const data = (await response.json()) as PhotonResponse
  const matches = (data.features ?? [])
    .map(toPhotonMatch)
    .filter((match): match is VenueMatch => match !== null)

  const seen = new Set<string>()
  return matches.filter((match) => {
    const key = `${match.name}|${match.address}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function searchGoogle(query: string, sessionToken: string, signal: AbortSignal): Promise<VenueMatch[]> {
  const response = await fetch(GOOGLE_AUTOCOMPLETE_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
    },
    body: JSON.stringify({
      input: query,
      sessionToken,
      includedRegionCodes: ['us'],
      locationBias: {
        circle: {
          center: { latitude: GOOGLE_BIAS_LAT, longitude: GOOGLE_BIAS_LON },
          radius: GOOGLE_BIAS_RADIUS_M,
        },
      },
    }),
  })
  if (!response.ok) throw new Error(`places autocomplete ${response.status}`)
  const data = (await response.json()) as GoogleAutocompleteResponse
  const matches: VenueMatch[] = []
  for (const suggestion of data.suggestions ?? []) {
    const prediction = suggestion.placePrediction
    const placeId = prediction?.placeId
    const name = prediction?.structuredFormat?.mainText?.text?.trim()
    if (!placeId || !name) continue
    const address = prediction.structuredFormat?.secondaryText?.text?.trim() ?? ''
    matches.push({ id: placeId, placeId, name, address, source: 'google' })
  }
  return matches
}

export async function searchVenues(
  query: string,
  signal: AbortSignal,
  sessionToken: string,
): Promise<VenueSearchResult> {
  if (googlePlacesConfigured()) {
    try {
      const matches = await searchGoogle(query, sessionToken, signal)
      return { matches, provider: 'google' }
    } catch (error) {
      if (isAbort(error)) throw error
    }
  }
  const matches = await searchPhoton(query, signal)
  return { matches, provider: 'photon' }
}

/** Place Details for a picked autocomplete prediction. The venue address stays one string. */
export async function loadGooglePlace(
  place: VenueMatch,
  sessionToken: string,
  signal: AbortSignal,
): Promise<VenueMatch> {
  if (place.source !== 'google' || !place.placeId || !googlePlacesConfigured()) return place
  const url = new URL(`${GOOGLE_PLACE_URL}${encodeURIComponent(place.placeId)}`)
  url.searchParams.set('sessionToken', sessionToken)
  const response = await fetch(url, {
    signal,
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'displayName,formattedAddress',
    },
  })
  if (!response.ok) throw new Error(`places details ${response.status}`)
  const data = (await response.json()) as GooglePlaceDetails
  const name = data.displayName?.text?.trim() || place.name
  const address = data.formattedAddress?.trim() || place.address
  return { ...place, name, address }
}
