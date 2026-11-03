import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { lightVariantSrc, themedPortrait } from '@/components/site/about/portrait'
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

  it('el cambio de tema se resuelve en CSS con data-theme y prefers-color-scheme, sin JS', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'components/site/about/About.module.scss'), 'utf8')
    const site = readFileSync(path.resolve(process.cwd(), 'components/site/_site.scss'), 'utf8')
    expect(site).toContain(":global(:root[data-theme='light']) &")
    expect(site).toMatch(/prefers-color-scheme: light\)\s*\{\s*:global\(:root:not\(\[data-theme\]\)\) &/)
    expect(css).toMatch(/\.portraitDark\s*\{\s*@include site\.light-theme\s*\{\s*display: none;/)
    expect(css).toMatch(/\.portraitLight\s*\{\s*@include site\.light-theme\s*\{\s*display: block;/)
  })
})
