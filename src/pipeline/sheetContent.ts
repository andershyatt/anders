import { parseExtraParentDances } from '../planner/parentDances'
import {
  PROCESSIONALS,
  REMOVED_SECTIONS_FIELD,
  parseRemovedSections,
  processionalId,
  processionalTitle,
  usesDjOnlyTemplate,
  usesLiveOnlyTemplate,
} from '../planner/fields'
import { formatCoupleDate } from '../planner/format'
import type { PipelineDetail } from './types'
import { field, parseSongList, songLine } from './songs'

export type SheetNode =
  | { kind: 'title' | 'heading' | 'text' | 'bullet'; text: string }
  | { kind: 'table'; rows: string[][]; labelColumn: boolean; header?: boolean }

const TIME_PATTERN = /\b(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)\b/i

function text(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function songLines(value: string): string[] {
  const songs = parseSongList(value)
  if (songs.length) return songs.map(songLine)
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function removed(detail: PipelineDetail): Set<string> {
  return parseRemovedSections(detail.fields[REMOVED_SECTIONS_FIELD])
}

function processionalGone(detail: PipelineDetail, anchor: string): boolean {
  return removed(detail).has(processionalId(anchor))
}

function heading(textValue: string): SheetNode {
  return { kind: 'heading', text: textValue }
}

function bullet(textValue: string): SheetNode {
  return { kind: 'bullet', text: textValue }
}

function paragraph(textValue: string): SheetNode {
  return { kind: 'text', text: textValue }
}

function labeledTable(rows: Array<[string, string]>): SheetNode | null {
  const kept = rows.filter(([, value]) => text(value) !== '')
  if (kept.length === 0) return null
  return { kind: 'table', labelColumn: true, rows: kept }
}

function songTable(lines: string[]): SheetNode[] {
  if (lines.length === 0) return []
  if (lines.length < 8) return lines.map(bullet)
  const mid = Math.ceil(lines.length / 2)
  const rows: string[][] = []
  for (let index = 0; index < mid; index += 1) {
    rows.push([lines[index] ?? '', lines[index + mid] ?? ''])
  }
  return [{ kind: 'table', labelColumn: false, rows }]
}

function timeOn(line: string): string {
  const match = line.match(TIME_PATTERN)
  if (!match) return ''
  return match[1].replace(/\s+/g, '').replace(/\./g, '').toLowerCase()
}

const GLANCE: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'Ceremony', patterns: [/ceremon/i, /processional/i, /recessional/i] },
  { label: 'Cocktail hour', patterns: [/cocktail/i] },
  { label: 'Introductions', patterns: [/introduction/i] },
  { label: 'Dinner', patterns: [/dinner/i] },
  { label: 'Toasts', patterns: [/toast/i, /speech/i] },
  { label: 'First dance', patterns: [/first dance/i] },
  { label: 'Parent dances', patterns: [/parent dance/i, /father[- ]daughter/i, /mother[- ]son/i] },
  { label: 'Open dancing', patterns: [/open danc/i] },
  { label: 'Last songs', patterns: [/last song/i, /last dance/i, /private last/i] },
]

function timelineTimes(timeline: string): Map<string, string> {
  const found = new Map<string, string>()
  for (const line of timeline.split(/\n+/)) {
    const when = timeOn(line)
    if (!when) continue
    for (const section of GLANCE) {
      if (found.has(section.label)) continue
      if (section.patterns.some((pattern) => pattern.test(line))) found.set(section.label, when)
    }
  }
  return found
}

function basicsRows(detail: PipelineDetail): Array<[string, string]> {
  const photoLate = field(detail, 'How late is the photographer scheduled?')
  const videoLate = field(detail, 'How late is the videographer scheduled?')
  const photographer = [field(detail, 'Photographer'), photoLate ? `until ${photoLate}` : ''].filter(Boolean).join(' · ')
  const videographer = [field(detail, 'Videographer'), videoLate ? `until ${videoLate}` : ''].filter(Boolean).join(' · ')
  const services = [
    detail.services.live ? 'Live music' : '',
    detail.services.dj ? 'DJ' : '',
    detail.services.photobooth ? 'Photo booth' : '',
  ]
    .filter(Boolean)
    .join(', ')
  return [
    ['Couple', detail.names],
    ['Date', formatCoupleDate(detail.date) || detail.date],
    ['Venue', detail.venue],
    ['Address', detail.venueAddress],
    ['Start', detail.startTime],
    ['Length', detail.length],
    ['Guests', detail.guestCount],
    ['Event', detail.eventType],
    ['Services', services],
    ['Team', detail.team],
    ['Planner', field(detail, 'Planner (name/contact)')],
    ['Venue manager', field(detail, 'Venue manager')],
    ['Photographer', photographer],
    ['Videographer', videographer],
    ['Caterer', field(detail, 'Caterer info')],
    ['Website', field(detail, 'Wedding website')],
    ['Website password', field(detail, 'Wedding website password')],
    ['Instagram', field(detail, 'IG handle')],
    ['Dress code', field(detail, 'Dress code')],
    ['Colors', field(detail, 'Wedding colors')],
    ['Day-of contact', field(detail, 'Day-of contact') || field(detail, 'Photo Booth: Day-of contact')],
  ]
}

function styleFor(detail: PipelineDetail, label: string): string {
  if (label === 'Ceremony') return field(detail, 'Pre-ceremony performance')
  if (label === 'Cocktail hour') return field(detail, 'Cocktail hour music type')
  if (label === 'Dinner') return field(detail, 'Dinner music type')
  if (label === 'Introductions') {
    if (field(detail, 'Introduction no music').toLowerCase() === 'yes') return 'No music'
    return songLines(field(detail, 'Introduction songs')).length ? 'With songs' : ''
  }
  if (label === 'First dance') return field(detail, 'First dance format (live/DJ, full/shortened)')
  if (label === 'Parent dances') return field(detail, 'Having parent dances')
  if (label === 'Open dancing') return field(detail, 'Clean music edits')
  if (label === 'Last songs') return songLines(field(detail, 'Last song of the night with guests'))[0] ?? ''
  if (label === 'Toasts') return field(detail, 'Toasts/speeches') ? 'Speeches' : ''
  return ''
}

function sectionSkipped(detail: PipelineDetail, label: string): boolean {
  const liveOnly = usesLiveOnlyTemplate(detail.services)
  if (liveOnly && (label === 'Introductions' || label === 'Open dancing' || label === 'Last songs')) return true
  if (label === 'Introductions' && field(detail, 'Introductions happening').toLowerCase() === 'no') return true
  if (label === 'First dance' && field(detail, 'Having a first dance').toLowerCase() === 'no') return true
  if (label === 'Parent dances' && field(detail, 'Having parent dances') === 'No') return true
  if (label === 'Toasts' && !field(detail, 'Toasts/speeches') && !timelineTimes(field(detail, 'Timeline')).has('Toasts')) return true
  return false
}

function glanceTable(detail: PipelineDetail): SheetNode | null {
  const times = timelineTimes(field(detail, 'Timeline'))
  if (!times.has('Ceremony') && detail.startTime) times.set('Ceremony', detail.startTime)
  const rows = GLANCE.flatMap((section) => {
    if (sectionSkipped(detail, section.label)) return []
    const when = times.get(section.label) ?? ''
    const how = styleFor(detail, section.label)
    if (!when && !how && section.label !== 'Ceremony' && section.label !== 'Cocktail hour' && section.label !== 'Dinner') return []
    return [[section.label, when || '—', how || '—']]
  })
  if (rows.length === 0) return null
  return { kind: 'table', labelColumn: false, header: true, rows: [['Section', 'Time', 'How it is played'], ...rows] }
}

function ceremonyNodes(detail: PipelineDetail): SheetNode[] {
  const nodes: SheetNode[] = []
  const details: Array<[string, string]> = [
    ['Officiant microphone', field(detail, 'Officiant microphone')],
    ['Officiant note', field(detail, 'Officiant microphone notes')],
    ['Other speakers', field(detail, 'Other ceremony speakers')],
    ['Speaker note', field(detail, 'Other ceremony speakers notes')],
    ['Pre-ceremony', field(detail, 'Pre-ceremony performance')],
    ['Pre-ceremony style', field(detail, 'Pre-ceremony music type')],
  ]
  const table = labeledTable(details)
  if (table) nodes.push(table)
  const preNotes = songLines(field(detail, 'Pre-ceremony music'))
  if (preNotes.length) {
    nodes.push(paragraph('Pre-ceremony notes'))
    nodes.push(...preNotes.map(bullet))
  }
  const djOnly = usesDjOnlyTemplate(detail.services)
  for (const item of PROCESSIONALS) {
    if (processionalGone(detail, item.anchor)) continue
    if (item.anchor === 'Additional processional song' && !detail.genderNeutral && !field(detail, item.anchor)) continue
    const song = songLines(field(detail, item.anchor))
    const styleKey =
      item.anchor === 'Wedding party processional song'
        ? 'Wedding party processional style (instrumental/vocals)'
        : item.anchor === 'Bridal processional song'
          ? 'Bridal processional style'
          : 'Additional processional style'
    const notesKey = item.keys[2]
    const style = !djOnly ? field(detail, styleKey) : ''
    const notes = field(detail, notesKey)
    if (song.length === 0 && !style && !notes) continue
    const title = processionalTitle(item.anchor, detail.fields, detail.genderNeutral)
    nodes.push(paragraph(title))
    if (style) nodes.push(bullet(style))
    nodes.push(...song.map(bullet))
    if (notes) nodes.push(bullet(notes))
  }
  const recessional = songLines(field(detail, 'Recessional song'))
  const recessionalStyle = !djOnly ? field(detail, 'Recessional style') : ''
  const cue = field(detail, 'Recessional cue')
  const recessionalNotes = field(detail, 'Recessional notes')
  if (recessional.length || recessionalStyle || cue || recessionalNotes) {
    nodes.push(paragraph('Recessional'))
    if (recessionalStyle) nodes.push(bullet(recessionalStyle))
    if (cue) nodes.push(bullet(`Cue: ${cue}`))
    nodes.push(...recessional.map(bullet))
    if (recessionalNotes) nodes.push(bullet(recessionalNotes))
  }
  return nodes
}

function parentDanceNodes(detail: PipelineDetail): SheetNode[] {
  const mode = field(detail, 'Having parent dances')
  if (mode === 'No') return field(detail, 'Parent dances notes') ? [bullet(field(detail, 'Parent dances notes'))] : []
  const nodes: SheetNode[] = []
  const showFather = mode !== 'Yes, mother-son only'
  const showMother = mode !== 'Yes, father-daughter only'
  if (showFather) {
    const bits = [
      songLines(field(detail, 'Father/daughter dance song')).join('; '),
      field(detail, 'Father of the bride name'),
      field(detail, 'Father/daughter format'),
      field(detail, 'Father of the bride dance choreographed') ? `Choreographed: ${field(detail, 'Father of the bride dance choreographed')}` : '',
      field(detail, 'Father of the bride start cue') ? `Start: ${field(detail, 'Father of the bride start cue')}` : '',
      field(detail, 'Father of the bride stop cue') ? `Stop: ${field(detail, 'Father of the bride stop cue')}` : '',
      field(detail, 'Father of the bride fade out'),
    ].filter(Boolean)
    if (bits.length) {
      nodes.push(paragraph(detail.genderNeutral ? 'Parent dance' : 'Father-daughter'))
      nodes.push(...bits.map(bullet))
    }
  }
  if (showMother) {
    const bits = [
      songLines(field(detail, 'Mother/son dance song')).join('; '),
      field(detail, 'Mother of the groom name'),
      field(detail, 'Mother/son format'),
      field(detail, 'Mother of the groom dance choreographed') ? `Choreographed: ${field(detail, 'Mother of the groom dance choreographed')}` : '',
      field(detail, 'Mother of the groom start cue') ? `Start: ${field(detail, 'Mother of the groom start cue')}` : '',
      field(detail, 'Mother of the groom stop cue') ? `Stop: ${field(detail, 'Mother of the groom stop cue')}` : '',
      field(detail, 'Mother of the groom fade out'),
    ].filter(Boolean)
    if (bits.length) {
      nodes.push(paragraph(detail.genderNeutral ? 'Parent dance' : 'Mother-son'))
      nodes.push(...bits.map(bullet))
    }
  }
  if (mode === 'Yes') {
    for (const dance of parseExtraParentDances(field(detail, 'Extra parent dances'))) {
      const bits = [
        dance.title || 'Parent dance',
        songLines(dance.song).join('; '),
        dance.format,
        dance.choreographed ? `Choreographed: ${dance.choreographed}` : '',
        dance.startCue ? `Start: ${dance.startCue}` : '',
        dance.stopCue ? `Stop: ${dance.stopCue}` : '',
        dance.fade,
      ].filter(Boolean)
      if (bits.length <= 1 && !dance.song && !dance.title) continue
      nodes.push(paragraph(dance.title || 'Parent dance'))
      nodes.push(...bits.slice(dance.title ? 1 : 0).map(bullet))
    }
  }
  const notes = field(detail, 'Parent dances notes')
  if (notes) nodes.push(bullet(notes))
  const other = field(detail, 'Other special dance')
  if (other) nodes.push(bullet(other))
  return nodes
}

function addSection(nodes: SheetNode[], title: string, body: SheetNode[]) {
  if (body.length === 0) return
  nodes.push(heading(title), ...body)
}

export function infoSheetNodes(detail: PipelineDetail): SheetNode[] {
  const liveOnly = usesLiveOnlyTemplate(detail.services)
  const nodes: SheetNode[] = [{ kind: 'title', text: `${detail.names.trim() || 'Couple'} info sheet` }]
  const basics = labeledTable(basicsRows(detail))
  if (basics) {
    nodes.push(heading('Couple, venue, and vendors'))
    nodes.push(basics)
  }
  const notes = field(detail, 'Basic notes')
  if (notes) nodes.push(paragraph(notes))
  const glance = glanceTable(detail)
  if (glance) {
    nodes.push(heading('Day at a glance'))
    nodes.push(glance)
  }
  const timeline = field(detail, 'Timeline')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (timeline.length) addSection(nodes, 'Timeline', timeline.map(bullet))

  addSection(nodes, 'Ceremony', ceremonyNodes(detail))

  const cocktail = [
    ...[field(detail, 'Cocktail hour music type'), field(detail, 'Cocktail hour vibe'), field(detail, 'Cocktail hour timing notes')]
      .filter(Boolean)
      .map(bullet),
    ...songTable(songLines(field(detail, 'Cocktail hour songs'))),
  ]
  addSection(nodes, 'Cocktail hour', cocktail)

  if (!liveOnly && field(detail, 'Introductions happening').toLowerCase() !== 'no') {
    const intro: SheetNode[] = []
    const who = [field(detail, 'Who is being introduced'), field(detail, 'Couple introduction name')].filter(Boolean)
    intro.push(...who.map(bullet))
    if (field(detail, 'Introduction no music').toLowerCase() === 'yes') intro.push(bullet('No song for this introduction'))
    else intro.push(...songTable(songLines(field(detail, 'Introduction songs'))))
    const extra = field(detail, 'Introductions')
    if (extra) intro.push(bullet(extra))
    addSection(nodes, 'Introductions', intro)
  }

  const dinner = [
    ...[field(detail, 'Dinner music type'), field(detail, 'Dinner music notes')].filter(Boolean).map(bullet),
    ...songTable(songLines(field(detail, 'Dinner songs'))),
  ]
  addSection(nodes, 'Dinner', dinner)

  const toasts = field(detail, 'Toasts/speeches')
  if (toasts) addSection(nodes, 'Toasts', toasts.split(/\n+/).map((line) => line.trim()).filter(Boolean).map(bullet))

  if (field(detail, 'Having a first dance').toLowerCase() !== 'no') {
    const first = [
      field(detail, 'First dance format (live/DJ, full/shortened)'),
      field(detail, 'First dance choreographed') ? `Choreographed: ${field(detail, 'First dance choreographed')}` : '',
      field(detail, 'First dance start cue') ? `Start: ${field(detail, 'First dance start cue')}` : '',
      field(detail, 'First dance stop cue') ? `Stop: ${field(detail, 'First dance stop cue')}` : '',
      field(detail, 'First dance fade out'),
      ...songLines(field(detail, "Couple's first dance song")),
    ]
      .filter(Boolean)
      .map(bullet)
    addSection(nodes, 'First dance', first)
  }

  addSection(nodes, 'Parent dances', parentDanceNodes(detail))

  if (!liveOnly) {
    const open = [
      ...[field(detail, 'Clean music edits'), field(detail, 'DJ music requests')].filter(Boolean).map(bullet),
      ...songTable(songLines(field(detail, 'Open dancing songs'))),
    ]
    addSection(nodes, 'Open dancing', open)
    const slow = [field(detail, 'Slow songs preference'), ...songLines(field(detail, 'Slow dance songs'))].filter(Boolean).map(bullet)
    addSection(nodes, 'Slow songs', slow)
    const last = [
      ...songLines(field(detail, 'Last song of the night with guests')).map((line) => `With guests: ${line}`),
      field(detail, 'Last song of the night notes'),
    ]
      .filter(Boolean)
      .map(bullet)
    addSection(nodes, 'Last song of the night', last)
    if (field(detail, 'Private last dance wanted').toLowerCase() === 'yes' || field(detail, 'Private last dance')) {
      const privateDance = [...songLines(field(detail, 'Private last dance')), field(detail, 'Private last dance notes')]
        .filter(Boolean)
        .map(bullet)
      addSection(nodes, 'Private last dance', privateDance)
    }
    const avoid = [...songLines(field(detail, 'Do not play songs')), ...songLines(field(detail, 'Do-not-play list'))]
    addSection(nodes, 'Do not play', songTable(avoid))
  }

  const receptionNotes = [field(detail, 'Reception music notes'), field(detail, 'Notes')].filter(Boolean)
  if (receptionNotes.length) addSection(nodes, 'Other notes', receptionNotes.map(bullet))
  return nodes
}

function cheatLines(value: string, limit?: number): string[] {
  const lines = songLines(value)
  return typeof limit === 'number' ? lines.slice(0, limit) : lines
}

/** Day-of sheet. Same limits as the old cheat sheet: pertinent lines, aimed at two pages and three at most. */
export function cheatSheetNodes(detail: PipelineDetail): SheetNode[] {
  const names = detail.names.trim() || 'Couple'
  const guests = detail.guestCount ? `${detail.guestCount} guests` : ''
  const title = [names, formatCoupleDate(detail.date) || detail.date, detail.venue, guests].filter(Boolean).join(' – ')
  const nodes: SheetNode[] = [{ kind: 'title', text: `${names} cheat sheet` }, paragraph(title)]
  const ig = field(detail, 'IG handle')
  if (ig) nodes.push(bullet(ig))
  if (detail.team) {
    detail.team.split('\n').forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return
      nodes.push(index === 0 ? bullet(`Your team: ${trimmed}`) : paragraph(trimmed))
    })
  }
  const photo = [field(detail, 'Photographer'), field(detail, 'Videographer')].filter(Boolean).join(' · ')
  if (photo) nodes.push(bullet(`Photo: ${photo}`))
  const contact = field(detail, 'Day-of contact') || field(detail, 'Photo Booth: Day-of contact')
  if (contact) nodes.push(bullet(`Day-of contact: ${contact}`))

  const timeline = field(detail, 'Timeline')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 16)
  if (timeline.length) nodes.push(...timeline.map(paragraph))

  const djOnly = usesDjOnlyTemplate(detail.services)
  const liveOnly = usesLiveOnlyTemplate(detail.services)
  const ceremonyNotes = [
    ['Officiant microphone', field(detail, 'Officiant microphone')],
    ['Other ceremony speakers', field(detail, 'Other ceremony speakers')],
  ].flatMap(([label, value]) => (value ? [`${label} - ${value}`] : []))
  const ceremonySongs = PROCESSIONALS.flatMap((item) => {
    if (processionalGone(detail, item.anchor)) return []
    if (item.anchor === 'Additional processional song' && !field(detail, item.anchor)) return []
    const song = songLines(field(detail, item.anchor)).join('; ')
    if (!song) return []
    const styleKey = item.keys[1]
    const style = !djOnly ? field(detail, styleKey) : ''
    const label = processionalTitle(item.anchor, detail.fields, detail.genderNeutral)
    return [[label, [song, style].filter(Boolean).join(' — ')].join(' - ')]
  })
  const recessional = songLines(field(detail, 'Recessional song')).join('; ')
  if (recessional) {
    const style = !djOnly ? field(detail, 'Recessional style') : ''
    const cue = field(detail, 'Recessional cue')
    ceremonySongs.push(['Recessional', [recessional, style, cue].filter(Boolean).join(' — ')].join(' - '))
  }
  const ceremony = ceremonyNotes.concat(ceremonySongs)
  if (ceremony.length) nodes.push(...ceremony.map(paragraph))

  const parentLines = [
    ...(field(detail, 'Having parent dances') === 'Yes, mother-son only'
      ? []
      : songLines(field(detail, 'Father/daughter dance song')).map((line) => {
          const format = field(detail, 'Father/daughter format')
          return format ? `Father-daughter - ${line} [${format}]` : `Father-daughter - ${line}`
        })),
    ...(field(detail, 'Having parent dances') === 'Yes, father-daughter only'
      ? []
      : songLines(field(detail, 'Mother/son dance song')).map((line) => {
          const format = field(detail, 'Mother/son format')
          return format ? `Mother-son - ${line} [${format}]` : `Mother-son - ${line}`
        })),
    ...(field(detail, 'Having parent dances') === 'Yes'
      ? parseExtraParentDances(field(detail, 'Extra parent dances')).flatMap((dance) => {
          const song = songLines(dance.song).join('; ')
          if (!song && !dance.title) return []
          const label = dance.title || 'Parent dance'
          return [dance.format ? `${label} - ${song} [${dance.format}]` : `${label} - ${song}`]
        })
      : []),
  ]
  const introLines =
    field(detail, 'Introduction no music').toLowerCase() === 'yes' && songLines(field(detail, 'Introduction songs')).length === 0
      ? ['No song for this introduction']
      : cheatLines(field(detail, 'Introduction songs'))
  const sections: Array<{ label: string; lines: string[] }> = [
    { label: 'INTRODUCTIONS', lines: introLines },
    {
      label: "COUPLE'S FIRST DANCE",
      lines: cheatLines(field(detail, "Couple's first dance song")).map((line) => {
        const format = field(detail, 'First dance format (live/DJ, full/shortened)')
        return format ? `${line} [${format}]` : line
      }),
    },
    { label: 'TOASTS / SPEECHES', lines: cheatLines(field(detail, 'Toasts/speeches')) },
    { label: 'PARENT DANCES', lines: parentLines },
    {
      label: 'RECEPTION MUSIC (POST DINNER)',
      lines: [field(detail, 'Reception music notes'), ...cheatLines(field(detail, 'Reception music songs'))].filter(Boolean),
    },
    { label: 'DJ NOTES', lines: [field(detail, 'DJ music requests'), field(detail, 'Clean music edits')].filter(Boolean) },
    {
      label: 'MUST PLAYS',
      lines: parseSongList(field(detail, 'Open dancing songs'))
        .filter((song) => song.mustPlay)
        .map(songLine),
    },
    { label: 'OPEN DANCING', lines: cheatLines(field(detail, 'Open dancing songs'), 24) },
    {
      label: 'SLOW SONGS',
      lines: [field(detail, 'Slow songs preference'), ...cheatLines(field(detail, 'Slow dance songs'))].filter(Boolean),
    },
    { label: 'LAST SONG OF THE NIGHT', lines: cheatLines(field(detail, 'Last song of the night with guests')) },
    {
      label: 'DO NOT PLAY',
      lines: cheatLines(field(detail, 'Do not play songs')).concat(cheatLines(field(detail, 'Do-not-play list'))).slice(0, 20),
    },
  ]
  const liveOnlySkip = new Set([
    'INTRODUCTIONS',
    'DJ NOTES',
    'MUST PLAYS',
    'OPEN DANCING',
    'SLOW SONGS',
    'LAST SONG OF THE NIGHT',
    'DO NOT PLAY',
  ])
  for (const section of sections) {
    if (liveOnly && liveOnlySkip.has(section.label)) continue
    if (section.label === 'PARENT DANCES' && field(detail, 'Having parent dances') === 'No') continue
    if (section.lines.length === 0) continue
    nodes.push(heading(section.label))
    for (const line of section.lines) nodes.push(bullet(line))
  }
  return nodes
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function sheetDocumentHtml(nodes: SheetNode[], compact: boolean): string {
  const body = nodes
    .map((node) => {
      if (node.kind === 'table') {
        const rows = node.rows
          .map((row, index) => {
            const tag = node.header && index === 0 ? 'th' : 'td'
            return `<tr>${row.map((cell) => `<${tag}>${escapeHtml(cell).replaceAll('\n', '<br>')}</${tag}>`).join('')}</tr>`
          })
          .join('')
        return `<table class="${node.labelColumn ? 'labels' : 'songs'}">${rows}</table>`
      }
      if (node.kind === 'title') return `<h1>${escapeHtml(node.text)}</h1>`
      if (node.kind === 'heading') return `<h2>${escapeHtml(node.text)}</h2>`
      if (node.kind === 'bullet') return `<p class="bullet">${escapeHtml(node.text)}</p>`
      return `<p>${escapeHtml(node.text)}</p>`
    })
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(nodes.find((node) => node.kind === 'title')?.kind === 'title' ? (nodes[0] as { text: string }).text : 'Sheet')}</title>
<style>
  @page { size: letter; margin: 0; }
  body { margin: 0 auto; max-width: 8.5in; padding: ${compact ? '0.4in' : '0.45in'}; color: #222; font-family: Arial, Helvetica, sans-serif; font-size: ${compact ? '10.5pt' : '11pt'}; line-height: 1.28; background: #fff; }
  h1 { margin: 0 0 6px; font-size: ${compact ? '14pt' : '16pt'}; }
  h2 { margin: ${compact ? '8px' : '12px'} 0 3px; color: #4e5c41; font-size: ${compact ? '11.5pt' : '13pt'}; border-bottom: 1px solid #d9d3c8; }
  p { margin: 0 0 2px; }
  p.bullet { padding-left: 12px; }
  p.bullet::before { content: "• "; }
  table { width: 100%; border-collapse: collapse; margin: 3px 0 8px; }
  td, th { border: 1px solid #ddd; padding: 2px 6px; vertical-align: top; font-size: ${compact ? '10pt' : '10.5pt'}; text-align: left; }
  th { background: #f4f1ea; }
  table.labels td:first-child { width: 28%; font-weight: 700; }
</style>
</head>
<body>${body}</body>
</html>`
}
