/**
 * Generates the PWA icon set for Movimento — no image libraries, no network.
 *
 * Outputs (checked into the repo; re-run when the art changes):
 *   app/favicon.ico               32x32   (PNG payload inside an ICO container)
 *   app/apple-icon.png            180x180 (iOS home screen)
 *   public/icons/icon-192.png     192x192 (manifest)
 *   public/icons/icon-512.png     512x512 (manifest)
 *   public/icons/maskable-512.png 512x512 (manifest, padded for Android masks)
 *
 * Usage: node scripts/generate-pwa-icons.cjs
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const ROOT = path.join(__dirname, '..')
const CARBON_BLUE_60 = [0x0f, 0x62, 0xfe]
const WHITE = [0xff, 0xff, 0xff]

// Shape math. Every pixel is supersampled 4x4 so edges are anti-aliased.
function coverage(x, y, test) {
  const SS = 4
  let hits = 0
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      if (test(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)) hits++
    }
  }
  return hits / (SS * SS)
}

function roundedSquareTest(size, radius) {
  return (px, py) => {
    const dx = Math.max(radius - px, px - (size - radius), 0)
    const dy = Math.max(radius - py, py - (size - radius), 0)
    return Math.hypot(dx, dy) <= radius
  }
}

function drawIcon(size, opts) {
  const { radiusRatio = 0.1875, arcRatio = 0.234, strokeRatio = 0.109, dotRatio = 0.06, pad = false } =
    opts || {}
  const cx = size / 2
  const cy = size / 2
  const R = size * arcRatio
  const stroke = size * strokeRatio
  const dotR = size * dotRatio
  const bg = roundedSquareTest(size, size * radiusRatio)

  // Arc from 200deg to 340deg (screen coords, y down) bulging downwards,
  // plus a dot on its rising tip: a "motion" swoosh.
  const a0 = (200 * Math.PI) / 180
  const a1 = (340 * Math.PI) / 180
  const dotX = cx + R * Math.cos(a1)
  const dotY = cy + R * Math.sin(a1)

  const pixels = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const coverageBg = pad ? 1 : coverage(x, y, bg)

      const cov = coverage(x, y, (px, py) => {
        const dx = px - cx
        const dy = py - cy
        const r = Math.hypot(dx, dy)
        let a = Math.atan2(dy, dx)
        if (a < 0) a += 2 * Math.PI
        const inArc =
          r >= R - stroke / 2 && r <= R + stroke / 2 && a >= a0 - 0.05 && a <= a1 + 0.05
        const inDot = Math.hypot(px - dotX, py - dotY) <= dotR
        return inArc || inDot
      })

      const i = (y * size + x) * 4
      pixels[i] = Math.round(CARBON_BLUE_60[0] * (1 - cov) + WHITE[0] * cov)
      pixels[i + 1] = Math.round(CARBON_BLUE_60[1] * (1 - cov) + WHITE[1] * cov)
      pixels[i + 2] = Math.round(CARBON_BLUE_60[2] * (1 - cov) + WHITE[2] * cov)
      pixels[i + 3] = Math.round(255 * coverageBg)
    }
  }
  return pixels
}


// PNG encoder (8-bit RGBA, non-interlaced)
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression: deflate
  ihdr[11] = 0 // filter method: adaptive
  ihdr[12] = 0 // interlace: none

  const stride = size * 4 + 1
  const raw = Buffer.alloc(size * stride)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0 // filter type 0 (None)
    pixels.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ICO container wrapping the PNG (supported by every browser and Windows Vista+)
function encodeIco(pngBuffer, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count

  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size // width
  entry[1] = size >= 256 ? 0 : size // height
  entry[2] = 0 // palette colours
  entry[3] = 0 // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8) // payload size
  entry.writeUInt32LE(6 + 16, 12) // payload offset

  return Buffer.concat([header, entry, pngBuffer])
}

const targets = [
  { file: 'app/favicon.ico', size: 32, ico: true },
  { file: 'app/apple-icon.png', size: 180 },
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/maskable-512.png', size: 512, opts: { radiusRatio: 0, pad: true } },
]

for (const target of targets) {
  const png = encodePng(drawIcon(target.size, target.opts), target.size)
  const out = path.join(ROOT, target.file)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, target.ico ? encodeIco(png, target.size) : png)
  console.log(`${target.ico ? 'ico' : 'png'} ${target.size}x${target.size}  ${target.file}`)
}
