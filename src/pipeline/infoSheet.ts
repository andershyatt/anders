import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { PipelineDetail } from './types'
import { field, parseSongList, songLine } from './songs'

const FONT = 'Calibri'
const SIZE = 20

function run(text: string, bold = false): TextRun {
  return new TextRun({ text, bold, font: FONT, size: SIZE })
}

function para(text: string, bold = false): Paragraph {
  return new Paragraph({ children: [run(text, bold)], spacing: { after: 40 } })
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: 24, color: '4E5C41' })],
    spacing: { before: 160, after: 60 },
  })
}

function cell(text: string, bold: boolean, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [new Paragraph({ children: [run(text, bold)] })],
  })
}

function pairTable(rows: Array<[string, string]>): Table {
  return new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [2880, 7200],
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [cell(label, true, 2880), cell(value, false, 7200)],
        }),
    ),
  })
}

function songColumns(lines: string[]): Table {
  const mid = Math.ceil(lines.length / 2)
  const column = (items: string[]) =>
    new TableCell({
      width: { size: 5040, type: WidthType.DXA },
      margins: { top: 20, bottom: 20, left: 60, right: 60 },
      children: items.map((item) => new Paragraph({ children: [run(item)], spacing: { after: 20 } })),
    })
  return new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [5040, 5040],
    rows: [new TableRow({ children: [column(lines.slice(0, mid)), column(lines.slice(mid))] })],
  })
}

const SONG_KEYS = new Set([
  'Cocktail hour songs',
  'Dinner songs',
  'Open dancing songs',
  'Slow dance songs',
  'Introduction songs',
  'Do not play songs',
  'Wedding party processional song',
  'Bridal processional song',
  'Recessional song',
  "Couple's first dance song",
  'Father/daughter dance song',
  'Mother/son dance song',
  'Last song of the night with guests',
  'Private last dance',
  'Pre-ceremony music',
  'Do-not-play list',
])

function readable(key: string, value: string): string {
  const songs = parseSongList(value)
  if (songs.length && (SONG_KEYS.has(key) || value.trim().startsWith('['))) return songs.map(songLine).join('\n')
  return value.trim()
}

const GROUPS: Array<{ title: string; keys: string[] }> = [
  {
    title: 'Basics',
    keys: [
      'Event type',
      'Event date',
      'Venue',
      'Venue address',
      'Start time',
      'Length of service',
      'Guest count',
      'Who did you book?',
      'Wedding website',
      'Wedding website password',
      'Social media permission',
      'IG handle',
      'Dress code',
      'Wedding colors',
      'Basic notes',
    ],
  },
  {
    title: 'Ceremony',
    keys: [
      'Pre-ceremony performance',
      'Pre-ceremony music type',
      'Pre-ceremony music',
      'Wedding party processional song',
      'Wedding party processional style (instrumental/vocals)',
      'Wedding party processional notes',
      'Bridal processional song',
      'Bridal processional style',
      'Bridal processional notes',
      'Recessional song',
      'Recessional style',
      'Recessional cue',
      'Recessional notes',
    ],
  },
  {
    title: 'Cocktail hour and dinner',
    keys: [
      'Cocktail hour music type',
      'Cocktail hour vibe',
      'Cocktail hour songs',
      'Dinner music type',
      'Dinner music notes',
      'Dinner songs',
    ],
  },
  {
    title: 'Reception',
    keys: [
      'Introduction songs',
      'Introductions',
      'Toasts/speeches',
      "Couple's first dance song",
      'First dance format (live/DJ, full/shortened)',
      'Father/daughter dance song',
      'Father/daughter format',
      'Mother/son dance song',
      'Mother/son format',
      'Open dancing songs',
      'DJ music requests',
      'Clean music edits',
      'Slow songs preference',
      'Slow dance songs',
      'Last song of the night with guests',
      'Private last dance',
      'Do not play songs',
      'Do-not-play list',
      'Notes',
      'Timeline',
    ],
  },
]

export async function buildInfoSheet(detail: PipelineDetail): Promise<Blob> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      children: [new TextRun({ text: `${detail.names || 'Couple'}'s info sheet`, bold: true, font: FONT, size: 32, color: '3C342C' })],
      spacing: { after: 80 },
    }),
    para([detail.date, detail.venue, detail.bookingStatus].filter(Boolean).join(' · ')),
  ]
  const used = new Set<string>()
  for (const group of GROUPS) {
    const rows = group.keys.flatMap((key) => {
      const value = key === 'Who did you book?' ? detail.team || field(detail, key) : field(detail, key)
      if (!value) return []
      used.add(key)
      const shown = readable(key, value)
      if (SONG_KEYS.has(key) && shown.includes('\n')) {
        return []
      }
      return [[key, shown] as [string, string]]
    })
    const songBlocks = group.keys.flatMap((key) => {
      const value = field(detail, key)
      if (!value || !SONG_KEYS.has(key)) return []
      const lines = readable(key, value).split('\n').filter(Boolean)
      if (lines.length < 2) return []
      used.add(key)
      return [{ key, lines }]
    })
    if (rows.length === 0 && songBlocks.length === 0) continue
    children.push(heading(group.title))
    if (rows.length) children.push(pairTable(rows))
    for (const block of songBlocks) {
      children.push(para(block.key, true))
      children.push(songColumns(block.lines))
    }
  }
  const leftovers = Object.entries(detail.fields).flatMap(([key, value]) => {
    if (used.has(key) || !value.trim()) return []
    if (key === 'Couple photo' || key.endsWith('section')) return []
    return [[key, readable(key, value)] as [string, string]]
  })
  if (leftovers.length) {
    children.push(heading('Everything else'))
    children.push(pairTable(leftovers))
  }
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children,
      },
    ],
  })
  return Packer.toBlob(doc)
}
