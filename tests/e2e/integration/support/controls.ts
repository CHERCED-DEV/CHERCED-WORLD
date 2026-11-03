import { expect, type APIRequestContext, type BrowserContext, type Locator, type Page } from '@playwright/test'
import type { Lang } from './pages'

export type EffectName =
  | 'delegated'
  | 'skipLink'
  | 'langSwitch'
  | 'theme'
  | 'dialog'
  | 'popover'
  | 'closePopover'
  | 'carouselStep'
  | 'filter'
  | 'copy'
  | 'keyboardRegion'
  | 'textInput'
  | 'checkbox'
  | 'radio'
  | 'submitEmpty'
  | 'pressedToggle'
  | 'expandedToggle'
  | 'hash'
  | 'mailto'
  | 'newTabInternal'
  | 'navigate'
  | 'external'

export type ControlRule = {
  kind: string
  match: string
  effect: EffectName
  expect: string
  nested?: boolean
}

export const CONTROL_RULES: readonly ControlRule[] = [
  { kind: 'volver arriba', match: '[data-cw-back-to-top]', effect: 'delegated', expect: 'lo verifica "volver arriba" en cada página' },
  { kind: 'saltar al contenido', match: 'a.cw-skip-link', effect: 'skipLink', expect: 'el foco pasa a main' },
  { kind: 'cambio de idioma', match: '[data-cw-lang-switch]', effect: 'langSwitch', expect: 'la misma ruta en el otro idioma' },
  { kind: 'tema', match: '[data-cw-theme-toggle]', effect: 'theme', expect: 'data-theme, aria-pressed y la preferencia cambian' },
  { kind: 'palette de comandos', match: '[data-cw-palette-trigger]', effect: 'dialog', expect: 'abre un diálogo con el foco dentro; Esc lo cierra' },
  { kind: 'asistente', match: '[data-cw-assistant-button]', effect: 'dialog', expect: 'abre un diálogo con el foco dentro; Esc lo cierra' },
  { kind: 'comentar', match: '[data-cw-comment-open]', effect: 'dialog', expect: 'abre un diálogo con el foco dentro; Esc lo cierra' },
  { kind: 'menú', match: '[data-cw-menu-button]', effect: 'popover', expect: 'abre el menú con el foco dentro; Esc lo cierra', nested: true },
  { kind: 'cerrar menú', match: 'button[popovertargetaction="hide"]', effect: 'closePopover', expect: 'cierra el menú' },
  { kind: 'carrusel', match: '[data-cw-prev], [data-cw-next]', effect: 'carouselStep', expect: 'cambia la diapositiva actual' },
  { kind: 'filtro de proyectos', match: '[data-cw-projects] [data-cw-filter]', effect: 'filter', expect: 'queda presionado y filtra' },
  { kind: 'copiar', match: '[data-cw-copy]', effect: 'copy', expect: 'escribe en el portapapeles' },
  { kind: 'región desplazable', match: '[tabindex="0"]:not(a, button, input, select, textarea)', effect: 'keyboardRegion', expect: 'recibe foco y se desplaza con flechas' },
  {
    kind: 'campo de texto',
    match: 'input:is([type=text], [type=email], [type=tel], [type=password], [type=search], [type=url], :not([type])), textarea',
    effect: 'textInput',
    expect: 'acepta lo que se escribe',
  },
  { kind: 'casilla', match: 'input[type=checkbox]', effect: 'checkbox', expect: 'se marca y se desmarca' },
  { kind: 'opción', match: 'input[type=radio]', effect: 'radio', expect: 'queda elegida' },
  { kind: 'enviar formulario', match: 'form :is(button[type=submit], button:not([type]))', effect: 'submitEmpty', expect: 'vacío, señala el primer campo inválido sin salir' },
  { kind: 'botón con estado', match: 'button[aria-pressed]', effect: 'pressedToggle', expect: 'aria-pressed cambia' },
  { kind: 'botón desplegable', match: 'button[aria-expanded]', effect: 'expandedToggle', expect: 'aria-expanded cambia' },
  { kind: 'botón de diálogo', match: 'button[aria-haspopup="dialog"]', effect: 'dialog', expect: 'abre un diálogo con el foco dentro; Esc lo cierra' },
  { kind: 'botón de popover', match: 'button[popovertarget]', effect: 'popover', expect: 'abre el popover; Esc lo cierra', nested: true },
  { kind: 'ancla', match: 'a[href^="#"]', effect: 'hash', expect: 'el destino queda a la vista, no tapado por el header' },
  { kind: 'correo', match: 'a[href^="mailto:"]', effect: 'mailto', expect: 'el clic llega al enlace mailto sin bloquearse' },
  { kind: 'enlace interno en pestaña nueva', match: 'a[href^="/"][target="_blank"]', effect: 'newTabInternal', expect: 'abre la ruta en otra pestaña, sin 404' },
  { kind: 'enlace interno', match: 'a[href^="/"]', effect: 'navigate', expect: 'cambia la URL a su destino, sin 404' },
  { kind: 'enlace externo', match: 'a[href^="http"]', effect: 'external', expect: 'abre su URL en otra pestaña con rel="noopener noreferrer"' },
]

const INTERACTIVE = [
  'a[href]',
  'button',
  'input:not([type=hidden])',
  'select',
  'textarea',
  'summary',
  'iframe',
  '[role=button]',
  '[role=link]',
  '[role=tab]',
  '[role=switch]',
  '[role=checkbox]',
  '[role=radio]',
  '[role=menuitem]',
  '[role=option]',
  '[contenteditable=""]',
  '[contenteditable=true]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const TOP_ATTR = 'data-cw-audit'

const NESTED_ATTR = 'data-cw-audit-nested'

export type Control = {
  id: number
  signature: string
  kind: string | null
  effect: EffectName | null
  nested: boolean
  label: string
  tag: string
  href: string | null
  target: string | null
  rel: string | null
  popoverTarget: string | null
  region: string
}

export type ControlResult = Pick<Control, 'signature' | 'kind' | 'label' | 'href' | 'region'> & {
  scope: string
  ok: boolean
  detail: string
  ms: number
}

export type PageAudit = { url: string; controls: ControlResult[] }

class AuditError extends Error {}

function fail(message: string): never {
  throw new AuditError(message)
}

function describeError(error: unknown): string {
  if (error instanceof AuditError) return error.message
  const message = error instanceof Error ? error.message : String(error)
  const intercept = message.match(/<([^>]+)>[^\n]*intercepts pointer events/)
  if (intercept) return `no se puede activar: otro elemento lo tapa (<${intercept[1]}>)`
  if (/not visible|not stable|outside of the viewport/.test(message)) return 'no se puede activar: no queda visible o estable'
  return message.split('\n').find((line) => line.trim() !== '')?.trim() ?? 'error sin mensaje'
}

const NAVIGATION_MS = 20_000

async function settle<T>(read: () => Promise<T>, ok: (value: T) => boolean, timeout = 8000): Promise<{ value: T; ok: boolean }> {
  const deadline = Date.now() + timeout
  let value = await read()
  while (!ok(value) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    value = await read()
  }
  return { value, ok: ok(value) }
}

export async function waitReady(page: Page): Promise<void> {
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

function samePage(a: string, b: string): boolean {
  const left = new URL(a)
  const right = new URL(b)
  return left.pathname === right.pathname && left.search === right.search
}

export async function openPage(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await waitReady(page)
}

export async function returnTo(page: Page, url: string): Promise<void> {
  const target = new URL(url, page.url()).href
  if (samePage(page.url(), target)) return
  await page.goBack({ timeout: 10_000 }).catch(() => null)
  if (!samePage(page.url(), target)) await page.goto(target)
  await waitReady(page)
}

async function closeOverlays(page: Page): Promise<void> {
  for (let i = 0; i < 3; i++) {
    const open = await page.evaluate(() => document.querySelectorAll('dialog[open], :popover-open').length)
    if (open === 0) return
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }
}

export async function scrollToEnd(page: Page): Promise<number> {
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await page.waitForTimeout(150)
    const atEnd = await page.evaluate(() => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)
    if (atEnd) break
  }
  return page.evaluate(() => window.scrollY)
}

export async function inventory(page: Page, scope: string | null, nested = false): Promise<Control[]> {
  const rules = CONTROL_RULES.map(({ kind, match, effect, nested: opens }) => ({ kind, match, effect, nested: opens ?? false }))
  return page.evaluate(
    ({ selector, rules, scope, attr }) => {
      for (const element of document.querySelectorAll(`[${attr}]`)) element.removeAttribute(attr)
      const root = scope ? document.querySelector(scope) : document
      if (!root) return []
      const blockers = '[hidden], dialog:not([open]), [popover]:not(:popover-open), [inert], [aria-hidden="true"]'
      const visible = (element: Element) => {
        if (element.matches('.cw-skip-link')) return true
        const rect = element.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0 || getComputedStyle(element).visibility === 'hidden') return false
        return !element.closest(blockers)
      }
      const labelOf = (element: Element) => {
        const html = element as HTMLElement & { labels?: NodeListOf<HTMLLabelElement> }
        const text =
          element.getAttribute('aria-label') ||
          html.labels?.[0]?.innerText ||
          html.innerText ||
          element.getAttribute('title') ||
          element.getAttribute('name') ||
          element.tagName.toLowerCase()
        return text.trim().split('\n')[0]!.trim().slice(0, 48)
      }
      const regionOf = (element: Element) =>
        element.closest('[popover]')
          ? 'menú'
          : element.closest('header#header')
            ? 'header'
            : element.closest('footer#footer')
              ? 'footer'
              : element.closest('main')
                ? 'main'
                : 'capa'
      const seen = new Map<string, number>()
      const candidates = [...root.querySelectorAll(selector)].filter((element) => {
        if (!visible(element)) return false
        if (!scope && element.closest('[popover], dialog')) return false
        return true
      })
      return candidates.map((element, id) => {
        element.setAttribute(attr, String(id))
        const rule = rules.find((item) => element.matches(item.match)) ?? null
        const href = element.getAttribute('href')
        const region = regionOf(element)
        const base = `${region}|${rule?.kind ?? element.tagName.toLowerCase()}|${href ?? ''}`
        const ordinal = seen.get(base) ?? 0
        seen.set(base, ordinal + 1)
        return {
          id,
          signature: `${base}|${ordinal}`,
          kind: rule?.kind ?? null,
          effect: rule?.effect ?? null,
          nested: rule?.nested ?? false,
          label: labelOf(element),
          tag: element.tagName.toLowerCase(),
          href,
          target: element.getAttribute('target'),
          rel: element.getAttribute('rel'),
          popoverTarget: element.getAttribute('popovertarget'),
          region,
        }
      }) as Control[]
    },
    { selector: INTERACTIVE, rules, scope, attr: nested ? NESTED_ATTR : TOP_ATTR },
  )
}

function locate(page: Page, control: Control, nested: boolean): Locator {
  return page.locator(`[${nested ? NESTED_ATTR : TOP_ATTR}="${control.id}"]`)
}

async function activate(target: Locator): Promise<void> {
  await target.click({ timeout: 10_000 })
}

async function isFocused(target: Locator): Promise<boolean> {
  return target.evaluate((element) => element === document.activeElement).catch(() => false)
}

const statusCache = new Map<string, number>()

async function statusOf(request: APIRequestContext, path: string): Promise<number> {
  const cached = statusCache.get(path)
  if (cached !== undefined) return cached
  const response = await request
    .get(path, { maxRedirects: 5 })
    .catch((error: unknown) => {
      if (!/ECONNRESET|ECONNREFUSED|socket hang up/.test(String(error))) throw error
      return request.get(path, { maxRedirects: 5 })
    })
  statusCache.set(path, response.status())
  return response.status()
}

async function stableUrl(page: Page): Promise<URL> {
  await page.waitForLoadState('load', { timeout: NAVIGATION_MS }).catch(() => undefined)
  let last = page.url()
  let since = Date.now()
  const deadline = Date.now() + 4000
  while (Date.now() < deadline && Date.now() - since < 600) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    if (page.url() !== last) {
      last = page.url()
      since = Date.now()
    }
  }
  return new URL(last)
}

async function showsNotFound(page: Page): Promise<boolean> {
  return (await page.locator('[data-cw-not-found]').count()) > 0
}

async function assertNotMissing(page: Page, request: APIRequestContext, href: string): Promise<void> {
  const url = new URL(href, page.url())
  const status = await statusOf(request, `${url.pathname}${url.search}`)
  if (status >= 400) fail(`${url.pathname} responde ${status}`)
  if ((await page.locator('[data-cw-not-found]').count()) > 0) fail(`${url.pathname} muestra la vista 404`)
}

type EffectArgs = {
  page: Page
  context: BrowserContext
  control: Control
  target: Locator
  url: string
  lang: Lang
}

type Effect = (args: EffectArgs) => Promise<string>

const SAMPLES: Record<string, string> = {
  email: 'auditoria@example.org',
  tel: '3001234567',
  password: 'clave-de-prueba-123',
  url: 'https://example.org',
}

const CLIPBOARD_SENTINEL = 'cw-auditoria-portapapeles'

type CwActivationHolder = {
  __cwActivation?: { href: string | null; prevented: boolean } | null
  __cwActivationListener?: (event: MouseEvent) => void
}

async function popupFrom(context: BrowserContext, target: Locator): Promise<Page> {
  const [popup] = await Promise.all([context.waitForEvent('page', { timeout: NAVIGATION_MS }), activate(target)])
  await popup.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_MS })
  return popup
}

function relTokens(rel: string | null): string[] {
  return (rel ?? '').toLowerCase().split(/\s+/).filter(Boolean)
}

const EFFECTS: Record<EffectName, Effect> = {
  async delegated({ target }) {
    await target.click({ trial: true, timeout: 5000 })
    return 'activable; su efecto lo verifica "volver arriba"'
  },

  async skipLink({ page, target }) {
    await target.focus()
    await page.keyboard.press('Enter')
    const focus = await settle(() => page.evaluate(() => document.activeElement?.id ?? ''), (id) => id === 'main')
    if (!focus.ok) fail(`el foco quedó en "${focus.value || 'body'}" y no en main`)
    return 'el foco pasa a main'
  },

  async langSwitch({ page, context, target, lang, control }) {
    const other: Lang = lang === 'es' ? 'en' : 'es'
    const from = new URL(page.url())
    const expected = from.pathname.replace(/^\/(es|en)(?=\/|$)/, `/${other}`)
    if (control.href !== expected) fail(`apunta a ${control.href} y debería conservar la ruta: ${expected}`)
    const fromNotFound = await showsNotFound(page)
    await activate(target)
    const landed = await settle(async () => new URL(page.url()).pathname, (path) => path === expected, NAVIGATION_MS)
    if (!landed.ok) fail(`lleva a ${landed.value} y no a ${expected}`)
    const htmlLang = await settle(() => page.locator('html').getAttribute('lang'), (value) => value === other)
    if (!htmlLang.ok) fail(`la página quedó con lang="${htmlLang.value}"`)
    if (fromNotFound) {
      if (!(await showsNotFound(page))) fail(`${expected} debería seguir mostrando el 404 en el otro idioma`)
      return `cambia a ${expected} (el 404 en el otro idioma)`
    }
    await assertNotMissing(page, context.request, expected)
    return `cambia a ${expected}`
  },

  async theme({ page, target }) {
    const read = () =>
      page.evaluate(() => ({
        theme: document.documentElement.getAttribute('data-theme'),
        stored: localStorage.getItem('cw-theme'),
      }))
    const before = await read()
    const pressedBefore = await target.getAttribute('aria-pressed')
    await activate(target)
    const after = await settle(read, (value) => value.theme !== before.theme)
    if (!after.ok) fail(`data-theme no cambió (sigue en ${before.theme})`)
    if (after.value.stored !== after.value.theme) fail(`la preferencia guardada es ${after.value.stored}, no ${after.value.theme}`)
    const pressedAfter = await target.getAttribute('aria-pressed')
    if (pressedAfter === pressedBefore) fail(`aria-pressed no cambió (${pressedBefore})`)
    await activate(target)
    const restored = await settle(read, (value) => value.theme === before.theme)
    if (!restored.ok) fail('el segundo clic no devuelve el tema anterior')
    return `${before.theme} → ${after.value.theme} → ${before.theme}`
  },

  async dialog({ page, target }) {
    const openDialogs = () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('dialog[open], [role=dialog]')].filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden'
          }).length,
      )
    const before = await openDialogs()
    await activate(target)
    const opened = await settle(openDialogs, (count) => count > before)
    if (!opened.ok) fail('no abre ningún diálogo')
    const focusInside = await settle(
      () => page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open], [role=dialog]'))),
      (inside) => inside,
      3000,
    )
    if (!focusInside.ok) fail('abre el diálogo, pero el foco no entra en él')
    await page.keyboard.press('Escape')
    const closed = await settle(openDialogs, (count) => count === before)
    if (!closed.ok) fail('Esc no cierra el diálogo')
    const back = await settle(() => isFocused(target), (focused) => focused, 3000)
    if (!back.ok) fail('al cerrar, el foco no vuelve al control')
    return 'abre el diálogo y Esc lo cierra devolviendo el foco'
  },

  async popover({ page, target, control }) {
    const id = control.popoverTarget
    if (!id) fail('no declara popovertarget')
    const isOpen = () => page.evaluate((popoverId) => document.getElementById(popoverId)?.matches(':popover-open') ?? false, id)
    await activate(target)
    const opened = await settle(isOpen, (open) => open)
    if (!opened.ok) fail(`no abre #${id}`)
    const focusInside = await settle(
      () => page.evaluate((popoverId) => Boolean(document.getElementById(popoverId)?.contains(document.activeElement)), id),
      (inside) => inside,
      3000,
    )
    if (!focusInside.ok) fail(`abre #${id}, pero el foco no entra`)
    await page.keyboard.press('Escape')
    const closed = await settle(isOpen, (open) => !open)
    if (!closed.ok) fail('Esc no cierra el popover')
    const back = await settle(() => isFocused(target), (focused) => focused, 3000)
    if (!back.ok) fail('al cerrar, el foco no vuelve al botón')
    return `abre #${id} y Esc lo cierra devolviendo el foco`
  },

  async closePopover({ page, target }) {
    const openCount = () => page.evaluate(() => document.querySelectorAll(':popover-open').length)
    const before = await openCount()
    if (before === 0) fail('no hay un popover abierto que cerrar')
    await activate(target)
    const closed = await settle(openCount, (count) => count < before)
    if (!closed.ok) fail('no cierra el popover')
    return 'cierra el popover'
  },

  async carouselStep({ page, target }) {
    const current = () => page.locator('[data-cw-slide][data-current]').first().getAttribute('data-cw-slide')
    const before = await current()
    await activate(target)
    const after = await settle(current, (value) => value !== before)
    if (!after.ok) fail(`la diapositiva actual sigue en ${before}`)
    return `diapositiva ${before} → ${after.value}`
  },

  async filter({ page, target }) {
    const chips = page.locator('[data-cw-projects] [data-cw-filter]')
    const all = page.locator('[data-cw-projects] [data-cw-filter=""]')
    const pressed = async (locator: Locator) => (await locator.getAttribute('aria-pressed')) === 'true'
    const isAll = (await target.getAttribute('data-cw-filter')) === ''
    if (await pressed(target)) {
      const other = isAll ? chips.last() : all
      await activate(other)
      const moved = await settle(() => pressed(other), (value) => value)
      if (!moved.ok) fail('no se pudo preparar otro filtro para probar este')
    }
    await activate(target)
    const selected = await settle(() => pressed(target), (value) => value)
    if (!selected.ok) fail('no queda presionado')
    const active = await chips.evaluateAll((elements) => elements.filter((element) => element.getAttribute('aria-pressed') === 'true').length)
    if (active !== 1) fail(`quedan ${active} filtros presionados`)
    const slides = await page.locator('[data-cw-slide]').count()
    if (slides === 0) fail('el filtro deja el carrusel vacío')
    const status = await settle(async () => ((await page.locator('[data-cw-carousel-status]').textContent()) ?? '').trim(), (text) => text !== '', 2000)
    if (!status.ok) fail('el filtro no anuncia el resultado')
    if (!isAll) await activate(all)
    return `${slides} proyectos; anuncia "${status.value.slice(0, 40)}"`
  },

  async copy({ page, target }) {
    await page.evaluate((sentinel) => navigator.clipboard.writeText(sentinel), CLIPBOARD_SENTINEL)
    await activate(target)
    const copied = await settle(
      () => page.evaluate(() => navigator.clipboard.readText()),
      (text) => text !== CLIPBOARD_SENTINEL && text.trim() !== '',
    )
    if (!copied.ok) fail('no escribe nada en el portapapeles')
    return `copia ${copied.value.length} caracteres`
  },

  async keyboardRegion({ page, target }) {
    await target.focus()
    if (!(await isFocused(target))) fail('no recibe el foco')
    const read = () =>
      target.evaluate((element) => ({
        horizontal: element.scrollWidth > element.clientWidth + 1,
        vertical: element.scrollHeight > element.clientHeight + 1,
        left: element.scrollLeft,
        top: element.scrollTop,
        current: element.querySelector('[data-current]')?.getAttribute('data-cw-slide') ?? null,
      }))
    const before = await read()
    if (!before.horizontal && !before.vertical) return 'recibe foco (su contenido cabe completo)'
    await page.keyboard.press(before.horizontal ? 'ArrowRight' : 'ArrowDown')
    const moved = await settle(read, (value) => value.left !== before.left || value.top !== before.top || value.current !== before.current)
    if (!moved.ok) fail('con el foco dentro, las flechas no lo desplazan')
    await target.evaluate((element) => element.scrollTo({ left: 0, top: 0, behavior: 'instant' }))
    return 'recibe foco y se desplaza con las flechas'
  },

  async textInput({ target }) {
    const type = (await target.getAttribute('type')) ?? 'text'
    const maxLength = await target.evaluate((element) => (element as HTMLInputElement).maxLength)
    const sample = SAMPLES[type] ?? 'Prueba de auditoría'
    const value = maxLength > 0 ? sample.slice(0, maxLength) : sample
    await target.fill(value, { timeout: 5000 })
    const got = await target.inputValue()
    if (got !== value) fail(`escribí "${value}" y quedó "${got}"`)
    await target.fill('')
    return 'acepta texto'
  },

  async checkbox({ target }) {
    const before = await target.isChecked()
    await activate(target)
    const after = await settle(() => target.isChecked(), (value) => value !== before, 2000)
    if (!after.ok) fail('el clic no cambia la casilla')
    await activate(target)
    return before ? 'se desmarca y se vuelve a marcar' : 'se marca y se desmarca'
  },

  async radio({ page, target }) {
    const name = await target.getAttribute('name')
    const group = page.locator(`input[type=radio][name="${name}"]`)
    const original = await group.evaluateAll((elements) => elements.findIndex((element) => (element as HTMLInputElement).checked))
    if (await target.isChecked()) {
      const other = (await group.count()) > 1 ? group.nth(original === 0 ? 1 : 0) : null
      if (!other) return 'única opción del grupo, ya elegida'
      await activate(other)
    }
    await activate(target)
    const chosen = await settle(() => target.isChecked(), (value) => value, 2000)
    if (!chosen.ok) fail('el clic no la elige')
    if (original >= 0) await activate(group.nth(original))
    return 'queda elegida'
  },

  async submitEmpty({ page, target, control }) {
    const before = page.url()
    await activate(target)
    const state = await settle(
      () =>
        page.evaluate((id) => {
          const form = document.querySelector(`[data-cw-audit="${id}"]`)?.closest('form')
          const active = document.activeElement
          return {
            inForm: Boolean(form && active && form.contains(active)),
            invalid: Boolean(active?.matches(':invalid') || active?.getAttribute('aria-invalid') === 'true'),
          }
        }, control.id),
      (value) => value.inForm && value.invalid,
    )
    if (!state.ok) fail('enviar vacío no señala ningún campo inválido ni le da el foco')
    if (!samePage(page.url(), before)) fail(`enviar vacío sacó de la página (${page.url()})`)
    return 'enviar vacío señala el primer campo inválido'
  },

  async pressedToggle({ target }) {
    const before = await target.getAttribute('aria-pressed')
    await activate(target)
    const after = await settle(() => target.getAttribute('aria-pressed'), (value) => value !== before, 2000)
    if (!after.ok) fail(`aria-pressed sigue en ${before}`)
    await activate(target)
    return `aria-pressed ${before} → ${after.value}`
  },

  async expandedToggle({ target }) {
    const before = await target.getAttribute('aria-expanded')
    await activate(target)
    const after = await settle(() => target.getAttribute('aria-expanded'), (value) => value !== before, 2000)
    if (!after.ok) fail(`aria-expanded sigue en ${before}`)
    await activate(target)
    return `aria-expanded ${before} → ${after.value}`
  },

  async hash({ page, target, control }) {
    const href = control.href ?? '#'
    const id = decodeURIComponent(href.slice(1))
    if (!(await page.evaluate((targetId) => Boolean(document.getElementById(targetId)), id))) fail(`el destino ${href} no existe`)
    await activate(target)
    const view = await settle(
      () =>
        page.evaluate((targetId) => {
          const destination = document.getElementById(targetId)!.getBoundingClientRect()
          const header = document.getElementById('header')?.getBoundingClientRect()
          const headerBottom = header && getComputedStyle(document.getElementById('header')!).position !== 'static' ? Math.max(0, header.bottom) : 0
          return {
            hash: decodeURIComponent(location.hash.slice(1)),
            top: Math.round(destination.top),
            bottom: Math.round(destination.bottom),
            headerBottom: Math.round(headerBottom),
            height: window.innerHeight,
          }
        }, id),
      (value) => value.hash === id && value.top >= value.headerBottom - 1 && value.top < value.height,
    )
    if (view.value.hash !== id) fail(`la URL no cambia a ${href}`)
    if (!view.ok) fail(`el destino queda en y=${view.value.top} con el header hasta y=${view.value.headerBottom}`)
    return `lleva a ${href}`
  },

  async mailto({ page, target, control }) {
    const href = control.href ?? ''
    if (!/^mailto:[^@\s?]+@[^@\s?]+\.[a-z]{2,}(\?.*)?$/i.test(href)) fail(`mailto mal formado: ${href}`)
    await page.evaluate(() => {
      const holder = window as unknown as CwActivationHolder
      holder.__cwActivation = null
      holder.__cwActivationListener = (event: MouseEvent) => {
        const anchor = (event.target as Element | null)?.closest('a')
        holder.__cwActivation = { href: anchor?.getAttribute('href') ?? null, prevented: event.defaultPrevented }
        event.preventDefault()
      }
      window.addEventListener('click', holder.__cwActivationListener)
    })
    const activation = await activate(target)
      .then(() => page.evaluate(() => (window as unknown as CwActivationHolder).__cwActivation ?? null))
      .finally(() =>
        page.evaluate(() => {
          const holder = window as unknown as CwActivationHolder
          if (holder.__cwActivationListener) window.removeEventListener('click', holder.__cwActivationListener)
        }),
      )
    if (!activation || activation.href !== href) fail('el clic no llega al enlace de correo')
    if (activation.prevented) fail('algo cancela el clic en el enlace de correo')
    return `abre ${href.split('?')[0]}`
  },

  async newTabInternal({ page, context, target, control }) {
    if (!relTokens(control.rel).includes('noopener')) fail(`target="_blank" sin rel="noopener" (${control.rel ?? 'sin rel'})`)
    const popup = await popupFrom(context, target)
    try {
      const expected = new URL(control.href ?? '/', page.url())
      const landed = new URL(popup.url())
      if (landed.pathname !== expected.pathname) fail(`la pestaña nueva abre ${landed.pathname} y no ${expected.pathname}`)
      await assertNotMissing(popup, context.request, expected.pathname)
      return `abre ${expected.pathname} en otra pestaña`
    } finally {
      await popup.close()
    }
  },

  async navigate({ page, context, target, control }) {
    const start = new URL(page.url())
    const destination = new URL(control.href ?? '/', start)
    if (destination.pathname === start.pathname && destination.search === start.search) {
      if ((await target.getAttribute('aria-current')) === 'page') return 'marca la página actual (aria-current="page")'
      const from = await scrollToEnd(page)
      await activate(target)
      const top = await settle(() => page.evaluate(() => window.scrollY), (y) => y <= 4, 3000)
      if (!top.ok) fail(`enlace a la misma página sin aria-current que no sube al inicio (${from} → ${top.value})`)
      return 'vuelve al inicio de la misma página'
    }
    await activate(target)
    const landed = await settle(
      async () => new URL(page.url()),
      (url) => url.pathname === destination.pathname && url.search === destination.search,
      NAVIGATION_MS,
    )
    if (!landed.ok) {
      if (landed.value.pathname === start.pathname) fail(`no sale de la página: ${destination.pathname} termina de vuelta en ${start.pathname}`)
      fail(`lleva a ${landed.value.pathname} y no a ${destination.pathname}`)
    }
    const final = await stableUrl(page)
    if (final.pathname === start.pathname && final.search === start.search) {
      fail(`no sale de la página: ${destination.pathname} redirige de vuelta a ${start.pathname}`)
    }
    await assertNotMissing(page, context.request, final.href)
    return final.pathname === destination.pathname ? `navega a ${destination.pathname}` : `navega a ${destination.pathname}, que redirige a ${final.pathname}`
  },

  async external({ context, target, control }) {
    const href = control.href ?? ''
    if (control.target !== '_blank') fail('enlace externo sin target="_blank"')
    const rel = relTokens(control.rel)
    if (!rel.includes('noopener') || !rel.includes('noreferrer')) fail(`rel="${control.rel ?? ''}" debería incluir noopener y noreferrer`)
    const popup = await popupFrom(context, target)
    try {
      if (new URL(popup.url()).href !== new URL(href).href) fail(`la pestaña nueva abre ${popup.url()} y no ${href}`)
      return `abre ${new URL(href).host} en otra pestaña`
    } finally {
      await popup.close()
    }
  },
}

export function isLocalUrl(url: URL, baseURL: string): boolean {
  return url.origin === new URL(baseURL).origin || url.protocol === 'data:' || url.protocol === 'blob:'
}

export async function prepareContext(context: BrowserContext, baseURL: string): Promise<void> {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL })
  await context.route(
    (url) => !isLocalUrl(url, baseURL),
    (route) =>
      route.request().resourceType() === 'document'
        ? route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>sitio externo</title>' })
        : route.abort(),
  )
}

async function runEffect(args: EffectArgs): Promise<{ ok: boolean; detail: string; ms: number }> {
  const { control } = args
  const started = Date.now()
  if (!control.effect) {
    return { ok: false, detail: `control sin regla: agrega su efecto a CONTROL_RULES (<${control.tag}> "${control.label}")`, ms: 0 }
  }
  try {
    return { ok: true, detail: await EFFECTS[control.effect](args), ms: Date.now() - started }
  } catch (error) {
    return { ok: false, detail: describeError(error), ms: Date.now() - started }
  }
}

function signatures(controls: Control[]): string {
  return controls.map((control) => control.signature).join('\n')
}

async function fresh(page: Page, url: string, baseline: Control[]): Promise<Control[] | null> {
  await returnTo(page, url)
  await closeOverlays(page)
  let current = await inventory(page, null)
  if (signatures(current) === signatures(baseline)) return current
  await openPage(page, url)
  current = await inventory(page, null)
  return signatures(current) === signatures(baseline) ? current : null
}

export async function auditPage(page: Page, context: BrowserContext, path: string, lang: Lang): Promise<PageAudit> {
  await openPage(page, path)
  const url = page.url()
  const baseline = await inventory(page, null)
  const results: ControlResult[] = []
  const record = (control: Control, scope: string, outcome: { ok: boolean; detail: string; ms?: number }) =>
    results.push({ signature: control.signature, kind: control.kind, label: control.label, href: control.href, region: control.region, scope, ms: 0, ...outcome })

  let dirty = false
  for (const original of baseline) {
    if (dirty) await openPage(page, url)
    const current = await fresh(page, url, baseline)
    const control = current?.find((item) => item.signature === original.signature)
    if (!current || !control) {
      record(original, 'página', { ok: false, detail: 'el inventario cambia al recargar la página' })
      continue
    }
    const outcome = await runEffect({ page, context, control, target: locate(page, control, false), url, lang })
    record(control, 'página', outcome)
    dirty = !outcome.ok
    await closeOverlays(page)

    if (!control.nested || !control.popoverTarget) continue
    const scope = `#${cssEscape(control.popoverTarget)}`
    const open = async (): Promise<boolean> => {
      const refreshed = await fresh(page, url, baseline)
      const trigger = refreshed?.find((item) => item.signature === original.signature)
      if (!trigger) return false
      await activate(locate(page, trigger, false))
      return (await settle(() => page.evaluate((selector) => document.querySelector(selector)?.matches(':popover-open') ?? false, scope), (value) => value)).ok
    }
    if (!(await open())) {
      record(control, scope, { ok: false, detail: 'no se pudo abrir para revisar su contenido' })
      continue
    }
    const inner = await inventory(page, scope, true)
    await closeOverlays(page)
    for (const item of inner) {
      if (!(await open())) {
        record(item, scope, { ok: false, detail: 'no se pudo abrir para revisar este control' })
        continue
      }
      const again = (await inventory(page, scope, true)).find((candidate) => candidate.signature === item.signature)
      if (!again) {
        record(item, scope, { ok: false, detail: 'desaparece al reabrir el popover' })
        continue
      }
      const outcome = await runEffect({ page, context, control: again, target: locate(page, again, true), url, lang })
      record(again, scope, outcome)
      await closeOverlays(page)
      if (!outcome.ok) await openPage(page, url)
    }
  }
  await returnTo(page, url)
  return { url, controls: results }
}

function cssEscape(value: string): string {
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1')
}

export function formatFindings(audit: PageAudit): string {
  return audit.controls
    .filter((control) => !control.ok)
    .map((control) => `[${control.region}] ${control.kind ?? 'sin regla'} "${control.label}"${control.href ? ` (${control.href})` : ''}: ${control.detail}`)
    .join('\n')
}
