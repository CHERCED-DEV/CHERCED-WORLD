export type Rgba = { r: number; g: number; b: number; a: number }

export const AA_NORMAL = 4.5
export const AA_LARGE = 3

const HEX = /^#([0-9a-f]{3,8})$/i
const FUNCTIONAL = /^rgba?\(\s*([^)]+)\)$/i

function channel(value: string): number {
  return value.endsWith('%') ? (Number.parseFloat(value) / 100) * 255 : Number.parseFloat(value)
}

function alpha(value: string | undefined): number {
  if (value === undefined) return 1
  return value.endsWith('%') ? Number.parseFloat(value) / 100 : Number.parseFloat(value)
}

export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase()
  if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  const hex = HEX.exec(value)
  if (hex) {
    let digits = hex[1]
    if (digits.length === 3 || digits.length === 4) digits = [...digits].map((d) => d + d).join('')
    if (digits.length !== 6 && digits.length !== 8) return null
    const n = (i: number) => Number.parseInt(digits.slice(i, i + 2), 16)
    return { r: n(0), g: n(2), b: n(4), a: digits.length === 8 ? n(6) / 255 : 1 }
  }
  const functional = FUNCTIONAL.exec(value)
  if (!functional) return null
  const [rgbPart, slashAlpha] = functional[1].split('/').map((part) => part.trim())
  const parts = rgbPart.split(/[\s,]+/).filter(Boolean)
  if (parts.length < 3) return null
  const a = slashAlpha ?? parts[3]
  const color = { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]), a: alpha(a) }
  return [color.r, color.g, color.b, color.a].every(Number.isFinite) ? color : null
}

export function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a)
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (t: number, b: number) => (t * top.a + b * bottom.a * (1 - top.a)) / a
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a }
}

export function withAlpha(color: Rgba, a: number): Rgba {
  return { ...color, a: color.a * a }
}

function linear(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function luminance(color: Rgba): number {
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b)
}

export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700)
}

export function requiredRatio(fontSizePx: number, fontWeight: number): number {
  return isLargeText(fontSizePx, fontWeight) ? AA_LARGE : AA_NORMAL
}
