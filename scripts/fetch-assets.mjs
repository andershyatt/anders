/**
 * Download original-resolution Bandzoogle images into src/assets/images/
 * Run: node scripts/fetch-assets.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'src', 'assets', 'images')

const ORIG = (hash, file) =>
  `https://images.zoogletools.com/s:bzglfiles/u/216357/${hash}/original/${file}`

/** Prefer /original/ CDN URLs (full res). */
const assets = [
  { file: 'logo.png', url: ORIG('cf5ba216ed54783e00346bd9a7147e1dcfe938d7', 'andershyattmusic-outlines3.png') },
  { file: 'hero-home.jpg', url: ORIG('7f777618651e1c3f6a3da09201ff33e1d43c0596', 'dsc-0249.jpg') },
  { file: 'hero-guitar.jpg', url: ORIG('1a66617976c30270b311a255ffd0888da766b5e8', 'andersguitar.jpg') },
  { file: 'live-music-feature.jpeg', url: ORIG('e0ef4e92e699ce031ab236760ec83d3119763dc6', 'unnamed.jpeg') },
  { file: 'duo-angella-01.jpg', url: ORIG('d7549fd31581bb16b37efdf3d85dfaed768c3f1e', 'terrain-at-styers-wedding-2131.jpeg') },
  { file: 'duo-ben-01.jpg', url: ORIG('1e55703f22539ff2231856b44505bfb470ee1539', 'dsc-0130.jpg') },
  { file: 'photo-booth-banner.jpg', url: ORIG('44cf020662b5be7411cfaff311b9cf6f663da172', 'photo-booth-banner-image.png') },
  { file: 'photo-booth-01.jpg', url: ORIG('760deb70e07764645320c6244faa6e5f7d16d3b9', 'img-8210.jpg') },
  { file: 'photo-booth-02.jpg', url: ORIG('9c44a4929a56b248e522c61af8dac6ea5de9fb66', 'img-8248.jpg') },
  { file: 'photo-booth-03.jpg', url: ORIG('ee62c44ad35940e0301e2b2ab12fcd87d15d7741', 'img-8220.jpg') },
  { file: 'photo-booth-04.jpg', url: ORIG('af8c5d10547322525ee5f9d3d4888bd51a9790a3', 'img-8243.jpg') },

  // Home gallery
  { file: 'home-gallery-01.jpg', url: ORIG('7c8ff0b89d93150680222df88102948df6734a10', 'a8ac66a2-758a-4a34-9eaf-0d6907dd7a70-1-105-c.jpeg') },
  { file: 'home-gallery-02.jpg', url: ORIG('f29a965347192e1bf122f9781ce6e3fd9bd3f979', '9565e269-fd49-42b1-8bcf-47f6c0c7a4f5-1-105-c.jpeg') },
  { file: 'home-gallery-03.jpg', url: ORIG('d0c930e32d6fd2bd171279c19331fb2cd22280fd', 'd17cf9c1-bfeb-4261-bdec-fbce025f6f60-1-105-c.jpeg') },
  { file: 'home-gallery-04.jpg', url: ORIG('bd4da0afdc0ee7267ff03f732006b8b8f34c1080', 'de9e357a-71c7-4fa4-aaa6-b31064cef503-1-105-c.jpeg') },
  { file: 'home-gallery-05.jpg', url: ORIG('2dda697ca8877f220dada3042aa924182b1300e1', '94e1c46b-419b-41ce-aa42-03d783767869-1-105-c.jpeg') },
  { file: 'home-gallery-06.jpg', url: ORIG('7f2d7b3e30eb6add4178cc31c687502f69632006', '64be3504-962e-4af5-a8a4-0c82d7795bd5-1-105-c.jpeg') },
  { file: 'home-gallery-07.jpg', url: ORIG('3a1de4723ac07e800e929e578966bd15fdd2c5a0', '9ed2c2b4-95ad-4f6d-9636-251c7be0ffef.jpeg') },
  { file: 'home-gallery-08.jpg', url: ORIG('02f2fcceee119c7ac9f6e490b8e9be0e320fac64', '8a4118a8-77b3-456b-90f3-046c8b152b2e-1-105-c.jpeg') },
  { file: 'home-gallery-09.jpg', url: ORIG('4213bf744caff15cdeb17cbefcf405a71033d0e1', '76673ce3-1efb-4ea6-b854-396cc2c67038-1-105-c.jpeg') },
  { file: 'home-gallery-10.jpg', url: ORIG('dcf5544caa16aa3ac47c65a2bf2e72e3b454ac5c', '44a1eb7f-9365-400b-9ce3-33ee6cf12beb-1-105-c.jpeg') },
  { file: 'home-gallery-11.jpg', url: ORIG('b777b6b75e9e0262e922dc383f5123237f85dce8', 'f822b511-35b5-4948-b047-be3ab76f44ac.jpeg') },
  { file: 'home-gallery-12.jpg', url: ORIG('8e99696c0e5adb41dbcf119d9be9638eff0967e4', '412aac0c-ec04-4cc3-b4f8-529e6a524c8e-1-105-c.jpeg') },
  { file: 'home-gallery-13.jpg', url: ORIG('1c6c9b1cb4e33a0ad75b7389e7055b691ffb0654', 'a0eb9965-900c-4b56-b221-0dda216321b7.jpeg') },
  { file: 'home-gallery-14.jpg', url: ORIG('8857af0081f070763d9e6b0b208cc863749144cd', '03b137b2-81bb-48aa-93ba-8d3e252e7650-1-105-c.jpeg') },
  { file: 'home-gallery-15.jpg', url: ORIG('07ab93dd115cd734b5aa7c89086dc87debe0e489', 'dac411ec-4d97-4447-a91c-a0ef647e9698.jpeg') },

  // DJ gallery
  { file: 'dj-gallery-01.jpg', url: ORIG('c809ab6c0c65b60ed6e4dd444622653df3b73c3b', '2990ecca-c538-49bf-9ce9-c805339e48b9.jpeg') },
  { file: 'dj-gallery-02.jpg', url: ORIG('c209cdbe3e00a854ecae53b9a198e12a1a0e30e3', '382a01ac-57ac-4441-bd7c-a90b77b47113-1-105-c.jpeg') },
  { file: 'dj-gallery-03.jpg', url: ORIG('8d217e1df5a580ec1e0c2d28242c394bf6b602d5', 'f906fa68-f24f-43cf-a7a9-d82b0932e4be-1-105-c.jpeg') },
  { file: 'dj-gallery-04.jpg', url: ORIG('6bf3fe6b6d2c2578a6840cb4b1a177e2f14da006', '68ac7f8f-3039-4b39-9f18-72303f50da6a.jpg') },
  { file: 'dj-gallery-05.jpg', url: ORIG('ab86b427f9d82e1a70cd07d8d0bfc50dfd2d720f', '97957720-1cb7-4e9a-a925-5846c0a1bb2a-1-105-c.jpeg') },
  { file: 'dj-gallery-06.jpg', url: ORIG('2850386bd074d811d21ce789381dd565a588de69', '9cc80a7d-6b71-408f-a748-f477f689f43d-1-105-c.jpeg') },
  { file: 'dj-gallery-07.jpg', url: ORIG('9f3b61a02be96b2d9c4f0af126f012717749b3e7', 'd4d399b7-f358-4c82-bfbf-45a47eef1c34.jpeg') },
  { file: 'dj-gallery-08.jpg', url: ORIG('73fca9e35c7f38c78d936825a336787e205f4790', 'c13c072d-1f35-46d5-94e5-bbcfe1489d9c-1-105-c.jpeg') },
  { file: 'dj-gallery-09.jpg', url: ORIG('3be1149e2585f02447a65689fde062727571acd9', 'fullsizeoutput-3f7c.jpeg') },
  { file: 'dj-gallery-10.jpg', url: ORIG('b5c908e1b45946c1d6217326a95a3d5cc53e5ffb', '7eb80b69-4907-4621-aa93-60be841ec1a4-1-105-c.jpeg') },
  { file: 'dj-gallery-11.jpg', url: ORIG('26b8b514ef8bd9c71b64c32dd79c1520c0f4f13f', 'chelsea-kris-859.jpg') },
  { file: 'dj-gallery-12.jpg', url: ORIG('35d53011336da3e0f622f5521ecda84620e59f8e', 'img-1294.jpg') },
  { file: 'dj-gallery-13.jpg', url: ORIG('bf369a61ebd0cfef3963f0ec6d8397467d583c2b', 'f204304c-9fd9-41ac-8a32-b2b79ae3384c-1-105-c.jpeg') },
  { file: 'dj-gallery-14.jpg', url: ORIG('37ea51cf9a50e620073aa0c80b39245e4ef203bb', 'd1274fdc-c7d9-4209-b9ae-692d628f36f6-1-105-c.jpeg') },
]

/**
 * YouTube poster frames, saved locally so the video thumbnails render from our
 * own origin even when the YouTube iframe itself is blocked or slow to load.
 */
const videoIds = [
  'lyWz78KfERk',
  '-SXiczxgHu8',
  '4W-pS9-lwLo',
  'mZf3fr_B4VA',
  'uX67obJEumI',
  'V_uB8UdLLS8',
]

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function download(item) {
  const dest = join(outDir, item.file)
  if (await exists(dest)) {
    console.log(`skip ${item.file}`)
    return
  }
  const res = await fetch(item.url)
  if (!res.ok) throw new Error(`${item.file}: ${res.status} ${item.url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  console.log(`ok   ${item.file} (${buf.length} bytes)`)
}

/** maxres is not generated for every upload, so fall back through the sizes. */
async function downloadPoster(id) {
  const dest = join(outDir, `yt-${id}.jpg`)
  if (await exists(dest)) {
    console.log(`skip yt-${id}.jpg`)
    return
  }
  for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`)
    if (!res.ok) continue
    const buf = Buffer.from(await res.arrayBuffer())
    // YouTube answers with a 120x90 grey placeholder instead of a 404.
    if (buf.length < 3000) continue
    await writeFile(dest, buf)
    console.log(`ok   yt-${id}.jpg (${name}, ${buf.length} bytes)`)
    return
  }
  throw new Error('no poster available')
}

await mkdir(outDir, { recursive: true })
let failed = 0
for (const item of assets) {
  try {
    await download(item)
  } catch (err) {
    failed += 1
    console.error(`FAIL ${item.file}:`, err.message)
  }
}
for (const id of videoIds) {
  try {
    await downloadPoster(id)
  } catch (err) {
    failed += 1
    console.error(`FAIL yt-${id}.jpg:`, err.message)
  }
}
const total = assets.length + videoIds.length
console.log(`Done. ${total - failed}/${total} available.`)
if (failed) process.exitCode = 1
