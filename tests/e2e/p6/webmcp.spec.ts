import { expect, test, type Page } from '@playwright/test'
import { onlyIn, skipIntro } from './support'

test.describe.configure({ timeout: 90_000 })

onlyIn('desktop-chromium')

type Probe = { name: string; description: string; aborted: boolean }

async function installFakeModelContext(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Tool = { name: string; description: string; execute: (input: unknown) => Promise<unknown> }
    const registered: Array<{ tool: Tool; signal?: AbortSignal }> = []
    const api = {
      registerTool(tool: Tool, options?: { signal?: AbortSignal }) {
        registered.push({ tool, signal: options?.signal })
      },
    }
    Object.defineProperty(document, 'modelContext', { value: api, configurable: true })
    Object.assign(window, {
      __cwProbe: () => registered.map(({ tool, signal }) => ({ name: tool.name, description: tool.description, aborted: Boolean(signal?.aborted) })),
      __cwRun: async (name: string, input: unknown) => {
        const live = registered.filter(({ tool, signal }) => tool.name === name && !signal?.aborted).pop()
        return live ? live.tool.execute(input) : null
      },
    })
  })
}

function probe(page: Page): Promise<Probe[]> {
  return page.evaluate(() => (window as unknown as { __cwProbe: () => Probe[] }).__cwProbe())
}

function run(page: Page, name: string, input: unknown): Promise<{ content: Array<{ text: string }>; isError?: boolean } | null> {
  return page.evaluate(
    ([tool, value]) => (window as unknown as { __cwRun: (n: string, i: unknown) => Promise<never> }).__cwRun(tool as string, value),
    [name, input] as const,
  )
}

async function live(page: Page): Promise<Probe[]> {
  return (await probe(page)).filter((tool) => !tool.aborted)
}

test.beforeEach(async ({ page }) => {
  await skipIntro(page)
})

test('con WebMCP, la página registra las ocho herramientas en su idioma y set_preferences cambia la vista', async ({ page }) => {
  await installFakeModelContext(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/es/portfolio')
  await expect.poll(async () => (await live(page)).length, { timeout: 30_000 }).toBe(8)
  const tools = await live(page)
  expect(tools.find((tool) => tool.name === 'get_cv')?.description).toBe('Devuelve el enlace al CV oficial, publicado en LinkedIn.')

  const search = await run(page, 'search_portfolio', { query: 'sagas', limit: 3 })
  const results = JSON.parse(search?.content[0]?.text ?? '{}') as { results: Array<{ title: string; url: string }> }
  expect(results.results.length).toBeGreaterThan(0)
  for (const result of results.results) expect(result.url).toMatch(/^http:\/\/localhost:\d+\/es\//)

  const theme = await run(page, 'set_preferences', { theme: 'light' })
  expect(theme?.isError).toBeUndefined()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await run(page, 'set_preferences', { language: 'en' })
  await page.waitForURL('**/en/portfolio')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect
    .poll(async () => (await live(page)).find((tool) => tool.name === 'get_cv')?.description, { timeout: 30_000 })
    .toBe('Returns the link to the official CV, published on LinkedIn.')
  expect(await live(page)).toHaveLength(8)
  expect(await page.evaluate(() => localStorage.getItem('cw-theme'))).toBe('light')
})

test('sin WebMCP no se registra nada y no hay errores en consola (SC-414)', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/es')
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
  await page.waitForTimeout(1000)
  expect(await page.evaluate(() => 'modelContext' in document || 'modelContext' in navigator)).toBe(false)
  expect(errors).toEqual([])
})
