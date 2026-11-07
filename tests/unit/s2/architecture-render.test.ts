import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { architecture } from '@/content/synergos-architecture'
import { ArchitectureView } from '@/components/site/synergos/arquitectura/ArchitectureView'
import { architectureJsonLd } from '@/lib/seo/synergos-architecture'

describe.each(['es', 'en'] as const)('arquitectura SSR %s', lang => {
  it('muestra el atlas aprobado, alternativas en texto y las limitaciones', () => {
    const html = renderToStaticMarkup(createElement(ArchitectureView, { lang }))
    expect(html.match(/data-cw-pattern="/g)).toHaveLength(18)
    expect(html.match(/data-cw-architecture-diagram="/g)).toHaveLength(3)
    expect(html.match(/<ol /g)).toHaveLength(3)
    expect(html.match(/<h1 /g)).toHaveLength(1)
    for (const pattern of architecture.patterns) {
      expect(html).toContain(`id="patron-${pattern.id}"`)
      if (pattern.limitation) expect(html).toContain(pattern.limitation[lang])
    }
    expect(html).toContain('data-cw-factory-status="hecho"')
    expect(html).toContain('data-cw-factory-status="vision"')
  })
  it('relaciona el artículo con Synergos y su autor', () => {
    const data = architectureJsonLd(lang, new URL('https://cherced-world.test'))
    expect(data['@type']).toBe('TechArticle')
    expect(data.about['@id']).toBe(`https://cherced-world.test/${lang}/synergos#synergos`)
    expect(data.author['@id']).toContain('#person')
    expect(data.inLanguage).toBe(lang)
  })
})

