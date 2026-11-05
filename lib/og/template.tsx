import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'

export const OG_SIZE = { width: 1200, height: 630 } as const

export const OG_CONTENT_TYPE = 'image/png'

export const OG_DOMAIN = 'cherced-world.vercel.app'

export const OG_ACCENT = '#25ED9E'

export const OG_FONT_DIR = join('public', 'fonts', 'Montserrat', 'static')

export type OgInput = { lang: Locale; title: string; line: string }

export type OgFont = { name: 'Montserrat'; data: Buffer; weight: 400 | 700; style: 'normal' }

const ALT = { es: commonEs['og.alt'], en: commonEn['og.alt'] } as const

const BRAND = commonEs['brand.name']

const CELL = 56

export function ogAlt(lang: Locale, title: string, line: string): string {
  return t({ 'og.alt': ALT[lang] }, 'og.alt', { title, line })
}

export function ogImageMetadata(id: string, { lang, title, line }: OgInput) {
  return { id, alt: ogAlt(lang, title, line), size: OG_SIZE, contentType: OG_CONTENT_TYPE }
}

let cachedFonts: OgFont[] | null = null

export function ogFonts(root: string = process.cwd()): OgFont[] {
  if (cachedFonts && root === process.cwd()) return cachedFonts
  const files: Array<[string, 400 | 700]> = [
    ['Montserrat-Regular.ttf', 400],
    ['Montserrat-Bold.ttf', 700],
  ]
  const fonts = files.flatMap(([file, weight]) => {
    const path = join(root, OG_FONT_DIR, file)
    return existsSync(path) ? [{ name: 'Montserrat' as const, data: readFileSync(path), weight, style: 'normal' as const }] : []
  })
  if (root === process.cwd()) cachedFonts = fonts
  return fonts
}

function Grid() {
  const vertical = Array.from({ length: Math.floor(OG_SIZE.width / CELL) }, (_, index) => (index + 1) * CELL)
  const horizontal = Array.from({ length: Math.floor(OG_SIZE.height / CELL) }, (_, index) => (index + 1) * CELL)
  return (
    <svg
      width={OG_SIZE.width}
      height={OG_SIZE.height}
      viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        <radialGradient id="cw-og-glow" cx={1020} cy={110} r={560} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={OG_ACCENT} stopOpacity={0.26} />
          <stop offset="0.55" stopColor={OG_ACCENT} stopOpacity={0.07} />
          <stop offset="1" stopColor={OG_ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={OG_SIZE.width} height={OG_SIZE.height} fill="url(#cw-og-glow)" />
      {vertical.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={OG_SIZE.height} stroke="#ffffff" strokeOpacity={0.07} strokeWidth={1} />
      ))}
      {horizontal.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={OG_SIZE.width} y2={y} stroke="#ffffff" strokeOpacity={0.07} strokeWidth={1} />
      ))}
    </svg>
  )
}

export function OgCard({ title, line }: Pick<OgInput, 'title' | 'line'>) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '72px 80px',
        background: '#000000',
        color: '#ffffff',
        fontFamily: 'Montserrat',
      }}
    >
      <Grid />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 56, height: 6, borderRadius: 3, background: OG_ACCENT }} />
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 8 }}>{BRAND}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1040 }}>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>{title}</div>
        <div style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.3, color: OG_ACCENT }}>{line}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, color: '#cfcfcf' }}>
        <div>{OG_DOMAIN}</div>
        <div style={{ width: 120, height: 2, background: OG_ACCENT }} />
      </div>
    </div>
  )
}

export function renderOgImage({ title, line }: OgInput): ImageResponse {
  return new ImageResponse(<OgCard title={title} line={line} />, { ...OG_SIZE, fonts: ogFonts() })
}
