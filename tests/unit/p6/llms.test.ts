import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildLlmsTxt } = await import('@/lib/agent/llms')
const { getProjects, listPosts, projectTitle } = await import('@/lib/content')
const { getDictionary } = await import('@/lib/i18n/server')
const { mentionsEmployer, personalData, quantities } = await import('../../e2e/integration/support/scan')

const BASE = new URL('https://cherced-world.test')
const text = await buildLlmsTxt(BASE)
const lines = text.split('\n')

describe('/llms.txt (FR-489a, R-405, contenido.md §25)', () => {
  it('incluye la arquitectura en ambos idiomas y las 18 anclas del atlas con sus fuentes', () => {
    expect(text).toContain('https://cherced-world.test/es/synergos/arquitectura')
    expect(text).toContain('https://cherced-world.test/en/synergos/arquitectura')
    expect(lines.filter(line => line.includes('/en/synergos/arquitectura#patron-'))).toHaveLength(18)
    expect(text).toContain('https://github.com/CHERCED-DEV/Synergos.CMS/blob/')
  })
  it('sigue la estructura de §25, en orden', async () => {
    const common = await getDictionary('en', 'common')
    expect(lines.slice(0, 3)).toEqual(['# CHERCED-WORLD', '', `> ${common['meta.description']}`])
    const headings = lines.filter((line) => line.startsWith('## '))
    expect(headings).toEqual(['## About', '## CV', '## Services', '## Case studies', '## Blog', '## Contact'])
    expect(lines).toContain('- [About me](https://cherced-world.test/en/aboutMe) · [Sobre mí](https://cherced-world.test/es/aboutMe)')
    expect(lines).toContain('- [Services](https://cherced-world.test/en/services) · [Servicios](https://cherced-world.test/es/services)')
    expect(lines).toContain('- [Contact](https://cherced-world.test/en/contactMe) · [Contacto](https://cherced-world.test/es/contactMe)')
  })

  it('lista los 15 casos en el orden del portafolio y cada post, con URL absoluta y resumen en inglés', async () => {
    const cases = lines.filter((line) => line.includes('/en/portfolio/'))
    expect(cases).toEqual(
      getProjects().map((project) => `- [${projectTitle(project, 'en')}](https://cherced-world.test/en/portfolio/${project.id}): ${project.summary.en}`),
    )
    const posts = await listPosts('en')
    for (const post of posts) expect(text).toContain(`(https://cherced-world.test/en/blog/${post.id}): `)
    expect(lines.filter((line) => line.includes('/en/blog/'))).toHaveLength(posts.length)
  })

  it('solo trae información pública: sin correos, teléfonos ni credenciales', () => {
    expect(personalData(text)).toEqual([])
    const withoutCv = text
      .replace(`${BASE.origin}/cv/camilo-hernandez-cv-en.pdf`, '')
      .replace(`${BASE.origin}/cv/camilo-hernandez-cv-es.pdf`, '')
    expect(withoutCv).not.toMatch(/mailto:|MONGODB|VERCEL_URL_CORS|\.pdf\b/i)
  })

  it('la sección CV trae los dos PDF con URL absoluta y LinkedIn, y Contacto ya no los repite (T911 de la 007)', () => {
    const start = lines.indexOf('## CV')
    const end = lines.indexOf('', start)
    expect(lines.slice(start, end)).toEqual([
      '## CV',
      '- [Download CV in English (PDF)](https://cherced-world.test/cv/camilo-hernandez-cv-en.pdf)',
      '- [Download CV in Spanish (PDF)](https://cherced-world.test/cv/camilo-hernandez-cv-es.pdf)',
      '- [LinkedIn profile](https://www.linkedin.com/in/cherced/)',
    ])
    const contact = lines.indexOf('## Contact')
    expect(lines.slice(contact).filter((line) => /\.pdf\)|linkedin/i.test(line))).toEqual([])
  })

  it('sin cantidades junto al empleador ni en Event bridge (FR-444, FR-498)', () => {
    expect(lines.filter(mentionsEmployer).flatMap(quantities)).toEqual([])
    const eventBridge = lines.find((line) => line.includes('/portfolio/15)')) ?? ''
    expect(quantities(eventBridge.replace(/\]\([^)]*\)/g, ']'))).toEqual([])
  })

  it('cada línea es una sola línea de Markdown, sin corchetes sueltos en las etiquetas', () => {
    for (const line of lines.filter((item) => item.startsWith('- ['))) {
      expect(line).toMatch(/^- \[[^\]]+\]\((https:\/\/cherced-world\.test\/((en|es)\/[^)]*|cv\/camilo-hernandez-cv-(en|es)\.pdf)|https:\/\/www\.linkedin\.com\/in\/cherced\/)\)/)
    }
  })
})
