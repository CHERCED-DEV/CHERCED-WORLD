import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LIGHT_SCHEME_QUERY, lightVariantSrc, themedPortrait } from '@/components/site/about/portrait'
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
    expect(tsx).toMatch(/loading: 'eager', fetchPriority: 'high'/)
    expect(css).toMatch(/@media \(prefers-color-scheme: light\) \{\s*:global\(:root\[data-theme='dark'\]\) \.portraitAuto \{\s*display: none;/)
    expect(css).toMatch(/@media not all and \(prefers-color-scheme: light\) \{\s*:global\(:root\[data-theme='light'\]\) \.portraitAuto \{\s*display: none;/)
    expect(css).toMatch(/\.portraitForcedDark,\s*\.portraitForcedLight \{\s*display: none;/)
  })
})
