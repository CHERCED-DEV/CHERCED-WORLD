import { readFileSync } from 'node:fs'

export type ImageSize = { width: number; height: number; format: 'png' | 'jpeg' | 'webp' | 'svg' }

function svgSize(text: string): ImageSize | null {
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0]
  if (!tag) return null
  const width = /\swidth="(\d+(?:\.\d+)?)"/.exec(tag)?.[1]
  const height = /\sheight="(\d+(?:\.\d+)?)"/.exec(tag)?.[1]
  if (!width || !height) return null
  return { width: Number(width), height: Number(height), format: 'svg' }
}

export function imageSize(file: string): ImageSize | null {
  const b = readFileSync(file)
  if (file.toLowerCase().endsWith('.svg')) return svgSize(b.toString('utf8'))
  if (b.length > 24 && b.toString('latin1', 1, 4) === 'PNG') {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), format: 'png' }
  }
  if (b.length > 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const chunk = b.toString('latin1', 12, 16)
    if (chunk === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3), format: 'webp' }
    if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff, format: 'webp' }
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, format: 'webp' }
    }
    return null
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++
        continue
      }
      const marker = b[i + 1]
      const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isFrame) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5), format: 'jpeg' }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  return null
}
