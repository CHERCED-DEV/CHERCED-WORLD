import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomeBanner } from '@/components/site/HomeBanner'
import {
  decideWink,
  finishWink,
  WINK_ATTRIBUTE,
  WINK_MAX_MS,
  WINK_SEEN_KEY,
  WINK_TIMING,
  winkEnd,
  winkScript,
  winkWords,
  type WinkState,
} from '@/components/site/home/wink'
import { ToastProvider } from '@/components/ui/Toast'
import type { Locale, SiteContent } from '@/content/types'
import { getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const site = getSite()
const LANGS = ['es', 'en'] as const satisfies readonly Locale[]

const Provider = ToastProvider as (props: { closeLabel: string; children?: ReactNode }) => ReactElement

async function renderBanner(lang: Locale, home: SiteContent['home'] = site.home): Promise<string> {
  const dict = await getDictionary(lang, 'site')
  return renderToStaticMarkup(
    createElement(
      Provider,
      { closeLabel: 'Cerrar' },
      createElement(HomeBanner, {
        lang,
        home,
        socials: site.socials,
        socialsLabel: t(dict, 'home.socials'),
        previousTitleLabel: t(dict, 'home.previousTitleLabel'),
      }),
    ),
  )
}

function decode(html: string): string {
  return html.replace(/<[^>]+>/g, '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&')
}

function element(html: string, pattern: RegExp): string {
  const match = pattern.exec(html)
  expect(match, String(pattern)).not.toBeNull()
  return match?.[0] ?? ''
}

type Fake = { attrs: Map<string, string>; store: Map<string, string> }

function fake(initial: { attr?: string; seen?: boolean } = {}): Fake {
  const attrs = new Map<string, string>()
  const store = new Map<string, string>()
  if (initial.attr) attrs.set(WINK_ATTRIBUTE, initial.attr)
  if (initial.seen) store.set(WINK_SEEN_KEY, '1')
  return { attrs, store }
}

function root(state: Fake) {
  return {
    getAttribute: (name: string) => state.attrs.get(name) ?? null,
    setAttribute: (name: string, value: string) => void state.attrs.set(name, value),
  }
}

function storage(state: Fake, broken: boolean) {
  return {
    getItem: (key: string) => {
      if (broken) throw new Error('bloqueado')
      return state.store.get(key) ?? null
    },
    setItem: (key: string, value: string) => {
      if (broken) throw new Error('bloqueado')
      state.store.set(key, value)
    },
  }
}

function runScript(state: Fake, reduced: boolean, broken: boolean): string | null {
  const document = { documentElement: root(state) }
  const window = { matchMedia: () => ({ matches: reduced }) }
  new Function('document', 'window', 'sessionStorage', winkScript)(document, window, storage(state, broken))
  return state.attrs.get(WINK_ATTRIBUTE) ?? null
}

const SCENARIOS = [
  { name: 'primera visita', initial: {}, reduced: false, broken: false, expected: 'play' },
  { name: 'segunda visita en la sesión', initial: { seen: true }, reduced: false, broken: false, expected: 'done' },
  { name: 'movimiento reducido', initial: {}, reduced: true, broken: false, expected: null },
  { name: 'sin sessionStorage', initial: {}, reduced: false, broken: true, expected: 'done' },
  { name: 'ya decidido en esta carga', initial: { attr: 'play', seen: true }, reduced: false, broken: false, expected: 'play' },
  { name: 'ya terminado', initial: { attr: 'done' }, reduced: false, broken: false, expected: 'done' },
] as const

describe('tiempos del guiño (FR-460)', () => {
  it('dura 2 s o menos y tacha antes de escribir', () => {
    expect(winkEnd()).toBeLessThanOrEqual(WINK_MAX_MS)
    expect(WINK_TIMING.strikeAt + WINK_TIMING.strikeMs).toBeLessThanOrEqual(WINK_TIMING.writeAt)
  })

  for (const lang of LANGS) {
    it(`${lang}: escribe las palabras del título en orden y termina con el guiño`, () => {
      const words = winkWords(site.home.title[lang])
      expect(words.map((word) => word.text).join(' ')).toBe(site.home.title[lang])
      expect(words[0]?.delay).toBe(WINK_TIMING.writeAt)
      for (let index = 1; index < words.length; index += 1) {
        const previous = words[index - 1]!
        expect(words[index]!.delay).toBeGreaterThan(previous.delay + previous.duration - 1)
      }
      const last = words.at(-1)!
      expect(Math.abs(last.delay + last.duration - winkEnd())).toBeLessThanOrEqual(1)
    })
  }

  it('un título vacío no tiene palabras', () => {
    expect(winkWords('   ')).toEqual([])
  })
})

describe('una vez por sesión (cw-wink-seen)', () => {
  for (const scenario of SCENARIOS) {
    it(`${scenario.name}: la función y el script en línea deciden lo mismo`, () => {
      const viaFunction = fake(scenario.initial)
      const state = decideWink({
        root: root(viaFunction),
        storage: () => storage(viaFunction, scenario.broken),
        reducedMotion: () => scenario.reduced,
      })
      expect(state).toBe(scenario.expected)
      expect(viaFunction.attrs.get(WINK_ATTRIBUTE) ?? null).toBe(scenario.expected)

      const viaScript = fake(scenario.initial)
      expect(runScript(viaScript, scenario.reduced, scenario.broken)).toBe(scenario.expected)
      expect([...viaScript.store]).toEqual([...viaFunction.store])
    })
  }

  it('la primera visita marca la sesión; con movimiento reducido no se marca', () => {
    const first = fake()
    runScript(first, false, false)
    expect(first.store.get(WINK_SEEN_KEY)).toBe('1')
    const reduced = fake()
    runScript(reduced, true, false)
    expect(reduced.store.size).toBe(0)
  })

  it('al terminar pasa de play a done y no inventa un estado', () => {
    const playing = fake({ attr: 'play' })
    finishWink(root(playing))
    expect(playing.attrs.get(WINK_ATTRIBUTE)).toBe<WinkState>('done')
    const none = fake()
    finishWink(root(none))
    expect(none.attrs.has(WINK_ATTRIBUTE)).toBe(false)
  })
})

describe('banner del home (FR-401, FR-402, FR-463, FR-464, T420, T421)', () => {
  for (const lang of LANGS) {
    it(`${lang}: el h1 es solo el título nuevo y el anterior queda tachado fuera de él`, async () => {
      const html = await renderBanner(lang)
      const dict = await getDictionary(lang, 'site')
      const h1 = element(html, /<h1 id="home-title"[^>]*>[\s\S]*?<\/h1>/)
      expect(decode(h1)).toBe(site.home.title[lang])
      expect(decode(h1)).not.toContain(site.home.previousTitle![lang])
      expect([...h1.matchAll(/data-cw-wink-word=""/g)]).toHaveLength(site.home.title[lang].split(' ').length)
      expect([...h1.matchAll(/data-cw-wink-last=""/g)]).toHaveLength(1)

      const previous = element(html, /<p [^>]*data-cw-home-previous=""[^>]*>[\s\S]*?<\/p>/)
      expect(html.indexOf('data-cw-home-previous')).toBeLessThan(html.indexOf('<h1'))
      expect(previous).toContain(`<span class="cw-visually-hidden">${t(dict, 'home.previousTitleLabel')} </span>`)
      expect(decode(element(previous, /<s [^>]*>[\s\S]*<\/s>/))).toBe(site.home.previousTitle![lang])
      expect(previous).toMatch(/<span [^>]*aria-hidden="true"[^>]*data-cw-wink-strike=""/)
    })

    it(`${lang}: subtítulo, CV, chip y menú de correo dentro del banner`, async () => {
      const html = await renderBanner(lang)
      const subtitle = element(html, /<p [^>]*data-cw-home-subtitle=""[^>]*>[\s\S]*?<\/p>/)
      expect(decode(subtitle).replaceAll(' ', ' ')).toBe(site.home.subtitle![lang])
      expect(html.indexOf('data-cw-home-subtitle')).toBeGreaterThan(html.indexOf('</h1>'))

      const nav = element(html, /<nav [^>]*>[\s\S]*?<\/nav>/)
      expect([...nav.matchAll(/<a /g)]).toHaveLength(3)
      expect(nav).toMatch(/<a [^>]*href="mailto:[^"]+"[^>]*data-cw-email-fallback=""/)
      expect(nav).toMatch(/<button [^>]*aria-haspopup="menu"[^>]*data-cw-email-trigger=""/)
      expect(nav).not.toContain('data-cw-cv-link')

      expect(html).toMatch(/<a [^>]*href="https:\/\/www\.linkedin\.com\/in\/cherced\/"[^>]*data-cw-cv-link=""/)
      expect(html).toContain('data-cw-availability=""')
      expect(html.indexOf('data-cw-availability')).toBeGreaterThan(html.indexOf('</nav>'))
    })
  }

  it('el estado final va en el HTML: el script decide antes de pintar y las palabras traen sus tiempos', async () => {
    const html = await renderBanner('es')
    const script = html.indexOf('<script>')
    expect(script).toBeGreaterThan(-1)
    expect(script).toBeLessThan(html.indexOf('<h1'))
    expect(html).toContain(`<script>${winkScript}</script>`)
    expect(html).not.toMatch(/data-cw-wink="play"/)
    expect(html).toContain(
      `style="--cw-wink-strike-at:${WINK_TIMING.strikeAt}ms;--cw-wink-strike-ms:${WINK_TIMING.strikeMs}ms;--cw-banner-sweep-at:${winkEnd()}ms"`,
    )
    for (const word of winkWords(site.home.title.es)) {
      expect(html).toContain(`--cw-wink-delay:${word.delay}ms;--cw-wink-duration:${word.duration}ms`)
    }
  })

  it('sin título anterior no hay guiño', async () => {
    const { previousTitle: _previous, ...home } = site.home
    const html = await renderBanner('es', home)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<s ')
    expect(html).not.toContain('--cw-wink-strike-at')
    expect(decode(element(html, /<h1 [^>]*>[\s\S]*?<\/h1>/))).toBe(site.home.title.es)
  })
})
