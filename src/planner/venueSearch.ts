export interface VenueMatch {
  id: string
  name: string
  address: string
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

/** Center of the Philadelphia / Bucks County area. Biases ranking, does not filter. */
const BIAS_LAT = 40.35
const BIAS_LON = -75.1

const PHOTON_URL = 'https://photon.komoot.io/api/'

function formatAddress(properties: PhotonProperties): string {
  const street = [properties.housenumber, properties.street].filter(Boolean).join(' ')
  const city = properties.city || properties.locality || properties.district || properties.county || ''
  const region = [properties.state, properties.postcode].filter(Boolean).join(' ')
  const locality = [city, region].filter(Boolean).join(', ')
  const country = properties.country && properties.country !== 'United States' ? properties.country : ''
  return [street, locality, country].filter(Boolean).join(', ')
}

function toMatch(feature: PhotonFeature): VenueMatch | null {
  const properties = feature.properties
  if (!properties?.name) return null
  const address = formatAddress(properties)
  const id = `${properties.osm_type ?? 'x'}-${properties.osm_id ?? properties.name}-${address}`
  return { id, name: properties.name, address }
}

export async function searchVenues(query: string, signal: AbortSignal): Promise<VenueMatch[]> {
  const url = new URL(PHOTON_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lat', String(BIAS_LAT))
  url.searchParams.set('lon', String(BIAS_LON))

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`venue search ${response.status}`)
  const data = (await response.json()) as PhotonResponse
  const matches = (data.features ?? [])
    .map(toMatch)
    .filter((match): match is VenueMatch => match !== null)

  const seen = new Set<string>()
  return matches.filter((match) => {
    const key = `${match.name}|${match.address}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
