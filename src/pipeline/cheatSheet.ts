import JSZip from 'jszip'
import templateUrl from './cheat-sheet-template.docx?url'
import { formatCoupleDate } from '../planner/format'
import type { PipelineDetail } from './types'
import { field, parseSongList, songLine } from './songs'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraph(text: string, kind: 'title' | 'body' | 'bullet'): string {
  const size = kind === 'title' ? '36' : '32'
  const bold = kind === 'title' ? '<w:b/>' : ''
  const style =
    kind === 'bullet'
      ? '<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="28"/></w:numPr>'
      : ''
  const run = `<w:rFonts w:ascii="Helvetica Neue" w:hAnsi="Helvetica Neue" w:cs="Helvetica Neue"/>${bold}<w:kern w:val="0"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`
  return `<w:p><w:pPr>${style}<w:rPr>${run}</w:rPr></w:pPr><w:r><w:rPr>${run}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
}

function blank(): string {
  return '<w:p/>'
}

function shortDate(iso: string): string {
  const friendly = formatCoupleDate(iso)
  return friendly || iso
}

function linesOf(value: string): string[] {
  const songs = parseSongList(value)
  if (songs.length) return songs.map(songLine)
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Day-of cheat sheet, written into Anders's template so styles and margins stay his. */
export function cheatSheetParagraphs(detail: PipelineDetail): string[] {
  const names = detail.names || 'Couple'
  const guests = detail.guestCount ? `${detail.guestCount} guests` : ''
  const title = [names, shortDate(detail.date), detail.venue, guests].filter(Boolean).join(' – ')
  const blocks: string[] = [paragraph(title, 'title'), blank()]

  const ig = field(detail, 'IG handle')
  if (ig) blocks.push(paragraph(ig, 'bullet'))
  if (detail.team) blocks.push(paragraph(`Your team: ${detail.team}`, 'bullet'))
  const photo = [field(detail, 'Photographer'), field(detail, 'Videographer')].filter(Boolean).join(' · ')
  if (photo) blocks.push(paragraph(`Photo: ${photo}`, 'bullet'))
  const contact = field(detail, 'Day-of contact') || field(detail, 'Photo Booth: Day-of contact')
  if (contact) blocks.push(paragraph(`Day-of contact: ${contact}`, 'bullet'))

  const timeline = field(detail, 'Timeline')
  if (timeline) {
    blocks.push(blank())
    for (const line of timeline.split(/\n+/).map((item) => item.trim()).filter(Boolean).slice(0, 16)) {
      blocks.push(paragraph(line, 'body'))
    }
  }

  const ceremony: Array<[string, string, string]> = [
    ['Pre-ceremony', 'Pre-ceremony music', ''],
    ['Wedding party processional', 'Wedding party processional song', 'Wedding party processional style (instrumental/vocals)'],
    ['Bridal processional', 'Bridal processional song', 'Bridal processional style'],
    ['Recessional', 'Recessional song', 'Recessional style'],
  ]
  const ceremonyLines = ceremony.flatMap(([label, songKey, styleKey]) => {
    const song = field(detail, songKey)
    if (!song) return []
    const style = styleKey ? field(detail, styleKey) : ''
    const cue = songKey === 'Recessional song' ? field(detail, 'Recessional cue') : ''
    return [[label, [song, style, cue].filter(Boolean).join(' — ')].join(' - ')]
  })
  if (ceremonyLines.length) {
    blocks.push(blank())
    for (const line of ceremonyLines) blocks.push(paragraph(line, 'body'))
  }

  const sections: Array<{ label: string; lines: string[] }> = [
    { label: 'INTRODUCTIONS', lines: linesOf(field(detail, 'Introduction songs')) },
    {
      label: "COUPLE'S FIRST DANCE",
      lines: linesOf(field(detail, "Couple's first dance song")).map((line) => {
        const format = field(detail, 'First dance format (live/DJ, full/shortened)')
        return format ? `${line} [${format}]` : line
      }),
    },
    { label: 'TOASTS / SPEECHES', lines: linesOf(field(detail, 'Toasts/speeches')) },
    {
      label: 'PARENT DANCES',
      lines: [
        ...linesOf(field(detail, 'Father/daughter dance song')).map((line) => `Father-daughter - ${line}`),
        ...linesOf(field(detail, 'Mother/son dance song')).map((line) => `Mother-son - ${line}`),
      ],
    },
    { label: 'DJ NOTES', lines: [field(detail, 'DJ music requests'), field(detail, 'Clean music edits')].filter(Boolean) },
    {
      label: 'MUST PLAYS',
      lines: parseSongList(field(detail, 'Open dancing songs'))
        .filter((song) => song.mustPlay)
        .map(songLine),
    },
    { label: 'OPEN DANCING', lines: linesOf(field(detail, 'Open dancing songs')).slice(0, 24) },
    {
      label: 'SLOW SONGS',
      lines: [field(detail, 'Slow songs preference'), ...linesOf(field(detail, 'Slow dance songs'))].filter(Boolean),
    },
    { label: 'LAST SONG OF THE NIGHT', lines: linesOf(field(detail, 'Last song of the night with guests')) },
    { label: 'DO NOT PLAY', lines: linesOf(field(detail, 'Do not play songs')).concat(linesOf(field(detail, 'Do-not-play list'))).slice(0, 20) },
  ]
  for (const section of sections) {
    if (section.lines.length === 0) continue
    blocks.push(blank(), paragraph(section.label, 'body'))
    for (const line of section.lines) blocks.push(paragraph(line, 'bullet'))
  }
  return blocks
}

export async function buildCheatSheet(detail: PipelineDetail): Promise<Blob> {
  const response = await fetch(templateUrl)
  if (!response.ok) throw new Error('The cheat sheet template did not load.')
  const zip = await JSZip.loadAsync(await response.arrayBuffer())
  const file = zip.file('word/document.xml')
  if (!file) throw new Error('The cheat sheet template is missing its document.')
  const original = await file.async('string')
  const bodyStart = original.indexOf('<w:body>')
  const sectStart = original.lastIndexOf('<w:sectPr')
  if (bodyStart < 0 || sectStart < 0) throw new Error('The cheat sheet template could not be read.')
  const next = `${original.slice(0, bodyStart)}<w:body>${cheatSheetParagraphs(detail).join('')}${original.slice(sectStart)}`
  zip.file('word/document.xml', next)
  const title = `${detail.names || 'Couple'}'s cheat sheet`
  const core = zip.file('docProps/core.xml')
  if (core) {
    const coreXml = await core.async('string')
    zip.file(
      'docProps/core.xml',
      coreXml.replace(/<dc:title>[\s\S]*?<\/dc:title>/, `<dc:title>${escapeXml(title)}</dc:title>`),
    )
  }
  const app = zip.file('docProps/app.xml')
  if (app) {
    const appXml = await app.async('string')
    zip.file('docProps/app.xml', appXml.replace(/<Template>[\s\S]*?<\/Template>/, '<Template></Template>'))
  }
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
