import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { formatNowDate, NOW_BLOCKS, nowBlocks, nowMottos, splitLead } from '@/components/site/now/model'
import { NowView, type NowLabels } from '@/components/site/now/NowView'
import { now } from '@/content/now'
import type { Locale, NowContent } from '@/content/types'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const LANGS = ['es', 'en'] as const satisfies readonly Locale[]

const HEADINGS = {
  es: ['Construyendo', 'Aprendiendo', 'Entrenando para', 'Fuera del teclado', 'Mis lemas'],
  en: ['Building', 'Learning', 'Training for', 'Off the keyboard', 'My mottos'],
} as const

async function labels(lang: Locale): Promise<NowLabels> {
  const dict = await getDictionary(lang, 'site')
  return {
    title: t(dict, 'nowPage.title'),
    lead: t(dict, 'meta.now.description'),
    updated: t(dict, 'nowPage.updated'),
    building: t(dict, 'nowPage.building'),
    learning: t(dict, 'nowPage.learning'),
    preparing: t(dict, 'nowPage.preparing'),
    offKeyboard: t(dict, 'nowPage.offKeyboard'),
    mottos: t(dict, 'nowPage.mottos'),
  }
}

async function render(lang: Locale, content: NowContent = now): Promise<string> {
  return renderToStaticMarkup(createElement(NowView, { lang, now: content, labels: await labels(lang) }))
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&#x27;', "'")
    .replace(/\s+/g, ' ')
}

describe('splitLead', () => {
  it.each([
    ['Synergos, rumbo a producción: un solo núcleo para muchos negocios.', 'Synergos, rumbo a producción:', 'un solo núcleo para muchos negocios.'],
    ['HYROX São Paulo. Entreno CrossFit.', 'HYROX São Paulo.', 'Entreno CrossFit.'],
    ['Azure AI Foundry, Semantic Kernel y RAG.', null, 'Azure AI Foundry, Semantic Kernel y RAG.'],
    ['microservicios .NET y RAG', null, 'microservicios .NET y RAG'],
  ])('%s', (input, lead, rest) => {
    expect(splitLead(input)).toEqual({ lead, rest })
  })
})

describe('modelo de /now (FR-490)', () => {
  for (const lang of LANGS) {
    it(`${lang}: cuatro bloques en orden con el copy de content/now.ts palabra por palabra`, () => {
      const blocks = nowBlocks(now, lang)
      expect(blocks.map((block) => block.id)).toEqual([...NOW_BLOCKS])
      for (const block of blocks) {
        const joined = block.lines.map((line) => (line.lead ? `${line.lead} ${line.rest}` : line.rest))
        expect(joined).toEqual(now[block.id].map((entry) => entry[lang]))
      }
      expect(nowMottos(now, lang).map((motto) => motto.text)).toEqual(now.mottos.map((motto) => motto[lang]))
    })
  }

  it('solo "Veni, vidi, vici." va en latín', () => {
    for (const lang of LANGS) {
      const latin = nowMottos(now, lang).filter((motto) => motto.lang === 'la')
      expect(latin.map((motto) => motto.text)).toEqual(['Veni, vidi, vici.'])
    }
  })

  it('un bloque vacío no se muestra', () => {
    expect(nowBlocks({ ...now, learning: [] }, 'es').map((block) => block.id)).not.toContain('learning')
  })

  it('formatea la fecha según el idioma y deja intacta una fecha inválida', () => {
    expect(formatNowDate('2026-11-04', 'es')).toBe('4 de noviembre de 2026')
    expect(formatNowDate('2026-11-04', 'en')).toBe('November 4, 2026')
    expect(formatNowDate('pronto', 'es')).toBe('pronto')
  })
})

describe('NowView (US10)', () => {
  for (const lang of LANGS) {
    it(`${lang}: h1, cinco bloques en orden, fecha con <time> y lemas`, async () => {
      const html = await render(lang)
      const dict = await getDictionary(lang, 'site')
      expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1)
      expect(html).toMatch(new RegExp(`<h1 id="now-title"[^>]*>${t(dict, 'nowPage.title')}</h1>`))
      const headings = [...html.matchAll(/<h2 [^>]*>([^<]+)<\/h2>/g)].map((match) => match[1])
      expect(headings).toEqual([...HEADINGS[lang]])
      expect(html).toContain(`<time dateTime="${now.updatedAt}">${formatNowDate(now.updatedAt, lang)}</time>`)
      const visible = text(html)
      for (const id of NOW_BLOCKS) for (const entry of now[id]) expect(visible).toContain(entry[lang])
      for (const motto of now.mottos) expect(visible).toContain(motto[lang])
    })

    it(`${lang}: el lema en latín lleva lang="la" y nada más lo lleva`, async () => {
      const html = await render(lang)
      expect([...html.matchAll(/lang="la"/g)]).toHaveLength(1)
      expect(html).toMatch(/<li [^>]*lang="la"[^>]*>Veni, vidi, vici\.<\/li>/)
    })

    it(`${lang}: no publica la fecha de HYROX ni otra fecha que la de actualización`, async () => {
      const visible = text(await render(lang)).replace(formatNowDate(now.updatedAt, lang), '')
      expect(visible).toContain('HYROX São Paulo')
      expect(visible).not.toMatch(/\b(19|20)\d{2}\b/)
      expect(visible).not.toMatch(/\b\d{1,2}\s*(de\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|apr|aug|dec)/i)
      expect(visible).not.toMatch(/\b(january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i)
    })
  }
})
