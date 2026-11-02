import backdropBarnwood from '../assets/photo-booth/backdrop-barnwood.webp'
import backdropBrushed from '../assets/photo-booth/backdrop-brushed.webp'
import backdropDrops from '../assets/photo-booth/backdrop-drops.webp'
import backdropFloral from '../assets/photo-booth/backdrop-floral.webp'
import backdropHedge from '../assets/photo-booth/backdrop-hedge.webp'
import backdropLights from '../assets/photo-booth/backdrop-lights.webp'
import backdropNone from '../assets/photo-booth/backdrop-none.webp'
import backdropSparkle from '../assets/photo-booth/backdrop-sparkle.webp'
import backdropWhite from '../assets/photo-booth/backdrop-brilliant-white.webp'
import propsBills from '../assets/photo-booth/props-bills.webp'
import propsLetterboard from '../assets/photo-booth/props-letterboard.webp'
import propsParty1 from '../assets/photo-booth/props-party-1.webp'
import propsParty2 from '../assets/photo-booth/props-party-2.webp'
import propsWedding1 from '../assets/photo-booth/props-wedding-1.webp'
import propsWedding2 from '../assets/photo-booth/props-wedding-2.webp'
import template2x6Large from '../assets/photo-booth/template-2x6-large.webp'
import template2x6Small from '../assets/photo-booth/template-2x6-small.webp'
import template4x6Landscape from '../assets/photo-booth/template-4x6-landscape.webp'
import template4x6Portrait from '../assets/photo-booth/template-4x6-portrait.webp'
import template4x6Three from '../assets/photo-booth/template-4x6-three.webp'

/** Option label → thumbnail. Unmatched form options are absent on purpose. */
const PHOTO_BOOTH_IMAGES: Readonly<Record<string, string>> = {
  "We do not need a backdrop and/or don't have space for one": backdropNone,
  'Brilliant white': backdropWhite,
  'Brushed black and white': backdropBrushed,
  'Dark barnwood': backdropBarnwood,
  'Drops of gold': backdropDrops,
  'Floral pattern': backdropFloral,
  'Gold sparkle': backdropSparkle,
  Hedge: backdropHedge,
  'Romantic country lights': backdropLights,
  '2x6 - three photo strip - square images - small space for text/logo': template2x6Small,
  '2x6 - three photo strip - landscape images - large space for text/logo': template2x6Large,
  '4x6 - three photos - landscape images - large space for text/logo': template4x6Three,
  '4x6 - single photo - landscape - option for text/logo overlay': template4x6Landscape,
  '4x6 - single photo - portrait - option for text/logo overlay': template4x6Portrait,
  'Wedding Set #1': propsWedding1,
  'Wedding Set #2': propsWedding2,
  'Party Set #1': propsParty1,
  'Party Set #2': propsParty2,
  'Letterboard Set': propsLetterboard,
  'Hundred dollar bills': propsBills,
}

export function boothImage(option: string): string | undefined {
  return PHOTO_BOOTH_IMAGES[option]
}
