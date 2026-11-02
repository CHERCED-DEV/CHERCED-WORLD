import { randomInt } from 'node:crypto'
import { expect, test, type Browser, type BrowserContext, type BrowserContextOptions, type Page } from '@playwright/test'

export const MIN_FILL_MS = 3000

export const AUTHOR_PUBLIC_EMAILS = ['chernandezcediel@gmail.com']

export function onlyIn(...projects: string[]): void {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

export function uniqueIp(): string {
  return `198.18.${randomInt(0, 255)}.${randomInt(1, 255)}`
}

export function uniqueToken(): string {
  return `${Date.now().toString(36)}${randomInt(0, 36 ** 4).toString(36)}`
}

export async function useIp(page: Page, ip = uniqueIp()): Promise<string> {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ip })
  return ip
}

export async function newVisitor(
  browser: Browser,
  baseURL: string,
  options: BrowserContextOptions = {},
): Promise<{ context: BrowserContext; page: Page; ip: string }> {
  const ip = uniqueIp()
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
    ...options,
    extraHTTPHeaders: { 'x-forwarded-for': ip, ...options.extraHTTPHeaders },
  })
  return { context, page: await context.newPage(), ip }
}

export async function openContact(page: Page, options: { js?: boolean } = {}): Promise<number> {
  const loadedAt = Date.now()
  await page.goto('/es/contactMe')
  if (options.js !== false) await expect(page.locator('[data-cw-contact-form]')).toHaveAttribute('novalidate', '')
  return loadedAt
}

export type ContactValues = { name: string; email: string; phone?: string; message: string; consent?: boolean }

export async function fillContact(page: Page, values: ContactValues): Promise<void> {
  const form = page.locator('[data-cw-contact-form]')
  await form.getByLabel('Tu nombre').fill(values.name)
  await form.getByLabel('Tu correo').fill(values.email)
  if (values.phone !== undefined) await form.getByLabel('Teléfono (opcional)').fill(values.phone)
  await form.getByLabel('Tu mensaje').fill(values.message)
  if (values.consent !== false) await form.getByRole('checkbox').check()
}

export async function waitMinimumFill(page: Page, loadedAt: number): Promise<void> {
  const wait = MIN_FILL_MS + 300 - (Date.now() - loadedAt)
  if (wait > 0) await page.waitForTimeout(wait)
}

export async function sendContact(page: Page, values: ContactValues): Promise<void> {
  const loadedAt = await openContact(page)
  await fillContact(page, values)
  await waitMinimumFill(page, loadedAt)
  await page.locator('[data-cw-contact-form]').getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Gracias por escribirme' }).first()).toBeVisible()
}

export async function captureActionResponses(page: Page, path: string): Promise<string[]> {
  const bodies: string[] = []
  await page.route(`**${path}`, async (route) => {
    const request = route.request()
    if (request.method() !== 'POST' || !request.headers()['next-action']) return route.fallback()
    const response = await route.fetch()
    const body = await response.text()
    bodies.push(body)
    return route.fulfill({ response, body })
  })
  return bodies
}

export async function hideTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

export async function showTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    delete (document as unknown as { visibilityState?: unknown }).visibilityState
    document.dispatchEvent(new Event('visibilitychange'))
  })
}
