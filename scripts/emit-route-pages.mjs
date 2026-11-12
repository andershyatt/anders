/**
 * GitHub Pages only serves real files. Copy the built marketing shell to each
 * route so a direct load returns HTTP 200. /songlist stays the static redirect
 * in public/. /planner and /pipeline are separate apps and are not touched.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const shell = join(dist, 'index.html')

const routes = [
  'live-music',
  'duo-angella',
  'duo-ben',
  'trio',
  'song-list',
  'playlist',
  'faq',
  'dj',
  'dj-faq',
  'events',
  'photo-booth',
  'connect',
]

for (const route of routes) {
  const target = join(dist, route, 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await copyFile(shell, target)
}
