import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  avifSrcSet,
  avifVariant,
  LIGHT_SCHEME_QUERY,
  lightVariantSrc,
  PORTRAIT_WIDTHS,
  themedPortrait,
} from '@/components/site/about/portrait'
import { getSite } from '@/lib/content'
import { imageSize } from '../lc/image-size'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const publicFile = (src: string) => path.join(PUBLIC_DIR, ...src.split('/').filter(Boolean))

describe('retrato de "Sobre mí" por tema', () => {
  const { image } = getSite().about

  it('usa el retrato 2026 del tema oscuro como entrada de contenido', () => {
    expect(image.src).toBe('/assets/imgs/about/retrato-oscuro.webp')
    expect(image.alt.es).toMatch(/Camilo Hernandez/)
    expect(image.alt.en).toMatch(/Camilo Hernandez/)
    expect(image.alt.es).not.toBe(image.alt.en)
  })

  it('deriva la variante clara del mismo nombre y la encuentra en public/', () => {
    const { dark, light } = themedPortrait(image)
    expect(dark).toBe(image)
    expect(light?.src).toBe('/assets/imgs/about/retrato-claro.webp')
    expect(light?.alt).toEqual(image.alt)
    for (const variant of [dark, light!]) {
      const file = publicFile(variant.src)
      expect(existsSync(file), variant.src).toBe(true)
      const size = imageSize(file)
      expect(size?.format, variant.src).toBe('webp')
      expect([size?.width, size?.height], variant.src).toEqual([image.width, image.height])
    }
  })

  it('una imagen sin sufijo de tema se queda sola', () => {
    expect(lightVariantSrc('/assets/imgs/meParallax.webp')).toBeNull()
    expect(themedPortrait({ ...image, src: '/assets/imgs/meParallax.webp' }).light).toBeNull()
  })

  it('el cambio de tema se resuelve con <picture> y CSS sobre data-theme, sin JS', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'components/site/about/About.module.scss'), 'utf8')
    const tsx = readFileSync(path.resolve(process.cwd(), 'components/site/about/AboutPortrait.tsx'), 'utf8')
    expect(LIGHT_SCHEME_QUERY).toBe('(prefers-color-scheme: light)')
    expect(tsx).toMatch(/<source media=\{LIGHT_SCHEME_QUERY\}/)
    expect(tsx).toMatch(/loading="eager"\s+fetchPriority="high"/)
    expect(css).toMatch(/@media \(prefers-color-scheme: light\) \{\s*:global\(:root\[data-theme='dark'\]\) \.portraitAuto \{\s*display: none;/)
    expect(css).toMatch(/@media not all and \(prefers-color-scheme: light\) \{\s*:global\(:root\[data-theme='light'\]\) \.portraitAuto \{\s*display: none;/)
    expect(css).toMatch(/\.portraitForcedDark,\s*\.portraitForcedLight \{\s*display: none;/)
  })
})

function avifSize(file: string): { width: number; height: number } | null {
  const bytes = readFileSync(file)
  if (bytes.toString('latin1', 4, 12) !== 'ftypavif') return null
  const at = bytes.indexOf('ispe', 0, 'latin1')
  if (at < 0) return null
  return { width: bytes.readUInt32BE(at + 8), height: bytes.readUInt32BE(at + 12) }
}

describe('variantes AVIF estáticas del retrato', () => {
  const { image } = getSite().about
  const { dark, light } = themedPortrait(image)

  it('arma el srcset con las tres anchuras', () => {
    expect(PORTRAIT_WIDTHS).toEqual([480, 720, 1080])
    expect(avifVariant('/assets/imgs/about/retrato-oscuro.webp', 720)).toBe('/assets/imgs/about/retrato-oscuro-720.avif')
    expect(avifSrcSet(dark.src)).toBe(
      '/assets/imgs/about/retrato-oscuro-480.avif 480w, /assets/imgs/about/retrato-oscuro-720.avif 720w, /assets/imgs/about/retrato-oscuro-1080.avif 1080w',
    )
  })

  it('cada variante existe, es AVIF, conserva la proporción y pesa menos de 60 KB', () => {
    for (const variant of [dark, light!]) {
      for (const width of PORTRAIT_WIDTHS) {
        const file = publicFile(avifVariant(variant.src, width))
        expect(existsSync(file), file).toBe(true)
        const size = avifSize(file)
        expect(size?.width, file).toBe(width)
        expect(size!.height / size!.width).toBeCloseTo(image.height / image.width, 2)
        expect(readFileSync(file).length, file).toBeLessThan(60 * 1024)
      }
    }
  })
})
