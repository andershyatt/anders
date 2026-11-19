/**
 * GitHub Pages only serves real files. Copy the built marketing shell to each
 * route so a direct load returns HTTP 200, and stamp the canonical URL for
 * that directory. /planner and /pipeline are separate apps and are not touched.
 * /home is a static redirect page in public/ and is not a sitemap URL.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const shellPath = join(dist, 'index.html')
const ORIGIN = 'https://andershyattmusic.com'

const publicRoutes = [
  'live-music',
  'duo-angella',
  'duo-ben',
  'trio',
  'song-list',
  'dj',
  'photo-booth',
  'connect',
]

/** Old URLs that still get a shell, but are not listed in the sitemap. */
const aliasCanonical = {
  playlist: `${ORIGIN}/song-list/`,
  faq: `${ORIGIN}/live-music/`,
  'dj-faq': `${ORIGIN}/dj/`,
  events: `${ORIGIN}/live-music/`,
}

function withCanonical(html, href) {
  const tag = `    <link rel="canonical" href="${href}" />\n`
  if (html.includes('rel="canonical"')) {
    return html.replace(/[ \t]*<link rel="canonical" href="[^"]*" \/>\n/, tag)
  }
  return html.replace('</head>', `${tag}  </head>`)
}

const shell = await readFile(shellPath, 'utf8')
await writeFile(shellPath, withCanonical(shell, `${ORIGIN}/`))

async function emit(route, canonical) {
  const target = join(dist, route, 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, withCanonical(shell, canonical))
}

for (const route of publicRoutes) {
  await emit(route, `${ORIGIN}/${route}/`)
}
for (const [route, canonical] of Object.entries(aliasCanonical)) {
  await emit(route, canonical)
}

const lastmod = new Date().toISOString().slice(0, 10)
const locs = ['/', ...publicRoutes.map((route) => `/${route}/`)]
const urls = locs
  .map(
    (path) => `  <url>
    <loc>${ORIGIN}${path}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  )
  .join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
await writeFile(join(dist, 'sitemap.xml'), sitemap)
console.log(`Wrote sitemap.xml with ${locs.length} URLs`)
