/** Public review listings. Shared by Home badges and testimonial sources. */
export const reviewListings = {
  google: 'https://g.page/r/CT8HZra3a_GKEB0',
  theKnot: 'https://www.theknot.com/marketplace/anders-hyatt-music-philadelphia-pa-2031275',
  weddingWire:
    'https://www.weddingwire.com/biz/anders-hyatt-music-philadelphia/1eefe5380447c833.html',
  zola: 'https://www.zola.com/wedding-vendors/wedding-bands-djs/anders-hyatt-music',
} as const

const listingBySource: Record<string, string> = {
  google: reviewListings.google,
  theknot: reviewListings.theKnot,
  weddingwire: reviewListings.weddingWire,
  zola: reviewListings.zola,
}

/** Listing URL for a testimonial source, when that platform is linked on the site. */
export function reviewListingUrl(source: string): string | undefined {
  const key = source.trim().toLowerCase().replace(/[^a-z]/g, '')
  return listingBySource[key]
}
