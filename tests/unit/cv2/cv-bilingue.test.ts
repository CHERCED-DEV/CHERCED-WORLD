import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { CvActions, cvPdfFormat } = await import('@/components/ui/CvLink')
const { RecruitersBlock } = await import('@/components/site/home/RecruitersBlock')
const { uiLabels } = await import('@/components/experience/labels')
const model = await import('@/components/experience/palette-model')
const { cvPdfs, getSite } = await import('@/lib/content')
const { getDictionary } = await import('@/lib/i18n/server')
const { buildSearchIndex } = await import('@/lib/search/build-index')

const ROOT = process.cwd()

const FILES = {
  es: {
    href: '/cv/camilo-hernandez-cv-es.pdf',
    filename: 'Camilo_Hernandez_CV_ES.pdf',
    bytes: 174_507,
    sha256: 'd3c75d85ca9ec5e56e823742e236315c139d2e1a9c585b0808321571d071472d',
  },
  en: {
    href: '/cv/camilo-hernandez-cv-en.pdf',
    filename: 'Camilo_Hernandez_CV_EN.pdf',
    bytes: 172_753,
    sha256: 'e6433b6ab6a75df8c896a81172d015a8e64e28ea76d7046b9753bde02722e3ab',
  },
} as const

function anchor(html: string, marker: string): string {
  const match = new RegExp(`<a [^>]*${marker}=""[^>]*>[\\s\\S]*?</a>`).exec(html)
  expect(match, marker).not.toBeNull()
  return match![0]
}

function attr(tag: string, name: string): string | null {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? null
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(tsx?|json|mdx?|scss)$/.test(entry.name) ? [path] : []
  })
}

describe('T911: los dos PDF del CV, sin cambios', () => {
  it.each(Object.entries(FILES))('%s: el archivo publicado es la copia exacta del PDF del autor', (lang, file) => {
    const path = join(ROOT, 'public', file.href)
    const bytes = readFileSync(path)
    expect(statSync(path).size).toBe(file.bytes)
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256)
    expect(getSite().profile?.cv.pdfs?.find((pdf) => pdf.lang === lang)).toEqual({ lang, href: file.href, filename: file.filename, bytes: file.bytes })
  })

  it('el CV viejo se retiró y nadie lo nombra', () => {
    expect(existsSync(join(ROOT, 'public', 'cv', 'Camilo_Hernandez_CV.pdf'))).toBe(false)
    expect(readdirSync(join(ROOT, 'public', 'cv')).sort()).toEqual(['camilo-hernandez-cv-en.pdf', 'camilo-hernandez-cv-es.pdf'])
    const offenders = ['app', 'components', 'content', 'lib']
      .flatMap((dir) => sourceFiles(join(ROOT, dir)))
      .filter((path) => readFileSync(path, 'utf8').includes('Camilo_Hernandez_CV.pdf'))
    expect(offenders).toEqual([])
  })

  it('cvPdfs pone primero el PDF del idioma de la página', () => {
    expect(cvPdfs('es').map((pdf) => pdf.lang)).toEqual(['es', 'en'])
    expect(cvPdfs('en').map((pdf) => pdf.lang)).toEqual(['en', 'es'])
  })
})

describe.each([
  {
    lang: 'es',
    other: 'en',
    label: 'Descargar CV',
    aria: 'Descargar CV en español (PDF, 175 kB)',
    alternate: 'English version',
    formats: ['PDF · 175 kB', 'PDF · 173 kB'],
  },
  {
    lang: 'en',
    other: 'es',
    label: 'Download CV',
    aria: 'Download CV in English (PDF, 173 kB)',
    alternate: 'Versión en español',
    formats: ['PDF · 173 kB', 'PDF · 175 kB'],
  },
] as const)('T1001: "Descargar CV" con el enlace al otro idioma en /$lang', ({ lang, other, label, aria, alternate, formats }) => {
  const html = renderToStaticMarkup(createElement(CvActions, { lang, downloadVariant: 'solid' }))

  it('el botón principal baja el PDF del idioma de la página, con su nombre, formato y peso', () => {
    const primary = anchor(html, 'data-cw-cv-download')
    expect(attr(primary, 'href')).toBe(FILES[lang].href)
    expect(attr(primary, 'download')).toBe(FILES[lang].filename)
    expect(attr(primary, 'type')).toBe('application/pdf')
    expect(attr(primary, 'hrefLang')).toBe(lang)
    expect(attr(primary, 'aria-label')).toBe(aria)
    expect(attr(primary, 'data-cw-cv-lang')).toBe(lang)
    expect(text(primary)).toBe(`${label} ${formats[0]}`)
    expect(aria.startsWith(label)).toBe(true)
  })

  it('al lado va un enlace pequeño al PDF del otro idioma, con hreflang, lang, formato y peso', () => {
    const secondary = anchor(html, 'data-cw-cv-alternate')
    expect(attr(secondary, 'href')).toBe(FILES[other].href)
    expect(attr(secondary, 'download')).toBe(FILES[other].filename)
    expect(attr(secondary, 'hrefLang')).toBe(other)
    expect(secondary).toMatch(new RegExp(`<span lang="${other}"[^>]*>${alternate}</span>`))
    expect(text(secondary)).toBe(`${alternate} ${formats[1]}`)
    expect(html.match(/data-cw-cv-download=""/g)).toHaveLength(1)
  })

  it('sin botón de LinkedIn: LinkedIn no es un CV (A1 a A3)', () => {
    expect(html).not.toContain('data-cw-cv-link')
    expect(text(html)).not.toMatch(/LinkedIn/)
  })

  it('el pop-up de reclutadores lleva los dos PDF, "Perfil de LinkedIn" y "Escríbeme" (A4)', () => {
    const site = getSite()
    const block = renderToStaticMarkup(createElement(RecruitersBlock, { lang, content: site.recruiters!, writeHref: `/${lang}/contactMe` }))
    expect(attr(anchor(block, 'data-cw-cv-download'), 'href')).toBe(FILES[lang].href)
    expect(attr(anchor(block, 'data-cw-cv-alternate'), 'href')).toBe(FILES[other].href)
    expect(text(anchor(block, 'data-cw-cv-link'))).toBe(lang === 'es' ? 'Perfil de LinkedIn' : 'LinkedIn profile')
    const order = ['data-cw-cv-download', 'data-cw-cv-alternate', 'data-cw-cv-link', 'data-cw-recruiters-write'].map((marker) => block.indexOf(marker))
    expect(order.every((position) => position > -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
})

describe.each(['es', 'en'] as const)('T911: la paleta ofrece los dos PDF · %s', (lang) => {
  async function setup() {
    const [index, experience, common] = await Promise.all([buildSearchIndex(lang), getDictionary(lang, 'experience'), getDictionary(lang, 'common')])
    const context = {
      theme: 'dark' as const,
      email: 'a@b.co',
      cv: getSite().profile!.cv.href,
      cvPdfs: cvPdfs(lang).map((pdf) => ({ lang: pdf.lang, href: pdf.href, filename: pdf.filename, hint: cvPdfFormat(pdf, lang) })),
      now: `/${lang}/now`,
      capsuleFound: false,
    }
    const docs = model.toPaletteDocs(index.docs, model.buildCommands(uiLabels(experience, common), context))
    const searcher = model.createPaletteSearcher(docs)
    return (query: string) => model.paletteResults(query, docs, searcher, 's')
  }

  const TITLES = {
    es: { es: 'Descargar CV en español', en: 'Descargar CV en inglés' },
    en: { en: 'Download CV in English', es: 'Download CV in Spanish' },
  } as const

  it('"Descargar CV en español" y "Download CV in English", con sus equivalentes en el idioma de la página', async () => {
    const results = await setup()
    const commands = results('>').filter((item) => item.id.startsWith('action:cv-pdf-'))
    const other = lang === 'es' ? 'en' : 'es'
    expect(commands.map((item) => [item.id, item.title])).toEqual([
      [`action:cv-pdf-${lang}`, TITLES[lang][lang]],
      [`action:cv-pdf-${other}`, TITLES[lang][other]],
    ])
    for (const item of commands) {
      const pdfLang = item.id.endsWith('-es') ? 'es' : 'en'
      expect(item.command).toEqual({ type: 'download', href: FILES[pdfLang].href, filename: FILES[pdfLang].filename })
      expect(item.hint).toBe(pdfLang === 'es' ? 'PDF · 175 kB' : 'PDF · 173 kB')
    }
  })

  it('">cv" sigue llevando al PDF del idioma de la página', async () => {
    const results = await setup()
    for (const query of ['>cv', '> cv', '>CV', '>descargar cv', '>download cv']) {
      expect(results(query)[0]?.id, query).toBe(`action:cv-pdf-${lang}`)
    }
  })

  it('el otro idioma se encuentra por su nombre en español o en inglés', async () => {
    const results = await setup()
    const other = lang === 'es' ? 'en' : 'es'
    for (const query of other === 'en' ? ['>cv ingles', '>cv english', '>cv inglés'] : ['>cv espanol', '>cv spanish', '>cv español']) {
      expect(results(query)[0]?.id, query).toBe(`action:cv-pdf-${other}`)
    }
  })

  it('escribir solo el otro idioma cambia el idioma del sitio, no baja el CV', async () => {
    const results = await setup()
    const queries = lang === 'es' ? ['inglés', 'ingles', 'english', '>inglés', '> ingles'] : ['spanish', 'español', 'espanol', '>spanish', '> español']
    for (const query of queries) {
      expect(results(query)[0]?.id, query).toBe('action:lang')
    }
    const other = lang === 'es' ? 'en' : 'es'
    for (const query of lang === 'es' ? ['cv inglés', 'descargar cv inglés'] : ['cv spanish', 'download cv spanish']) {
      expect(results(query)[0]?.id, query).toBe(`action:cv-pdf-${other}`)
    }
  })
})
