import { readFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page, type Request } from '@playwright/test'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import { labExperiment } from '@/content/ailab/catalog'
import { validateSkillMd } from '@/lib/ailab/skill/generate'

test.describe.configure({ timeout: 120_000 })

const HEAVY = /huggingface\.co|hf\.co|cdn\.jsdelivr\.net|\.wasm(\?|$)|\.onnx(\?|$)|\.safetensors(\?|$)|pyodide/i

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function open(page: Page, lang: 'es' | 'en' = 'es'): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/ai-lab`)
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

function card(page: Page, id: string): Locator {
  return page.locator(`[data-cw-lab-card="${id}"]`)
}

async function tryDemo(page: Page, id: string): Promise<Locator> {
  const item = card(page, id)
  await item.locator('[data-cw-lab-open]').click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  const stage = item.locator('[data-cw-lab-stage]')
  await expect(stage).toBeVisible()
  await expect(stage.locator('[data-cw-lab-loading]')).toHaveCount(0, { timeout: 30_000 })
  await expect(stage.locator('[data-cw-lab-failed]')).toHaveCount(0)
  return stage
}

async function blockingViolations(page: Page, selector: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

function watch(page: Page): Request[] {
  const seen: Request[] = []
  page.on('request', (request) => seen.push(request))
  return seen
}

function carrying(requests: Request[], text: string): string[] {
  const needle = text.toLowerCase()
  return requests
    .filter((request) => {
      const url = decodeURIComponent(request.url()).toLowerCase()
      const body = (request.postData() ?? '').toLowerCase()
      return url.includes(needle) || body.includes(needle)
    })
    .map((request) => request.url())
}

async function noOverflow(page: Page): Promise<void> {
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(widths.scroll).toBeLessThanOrEqual(widths.client)
}

test.describe('A2 · Anatomía de un plugin (US3 escenario 1, FR-352)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('el árbol se recorre con teclado: flechas, Inicio, Fin y Enter, y cada archivo se explica', async ({ page }) => {
    const heavy = watch(page)
    await open(page)
    const stage = await tryDemo(page, 'A2')
    const tree = stage.getByRole('tree', { name: es['ailab.a2.tree'] })
    await expect(tree).toBeVisible()
    const item = (path: string) => tree.locator(`[data-cw-plugin-path="panaderia${path ? `/${path}` : ''}"]`)
    const panel = stage.locator('[data-cw-plugin-file]')

    await expect(item('')).toHaveAttribute('tabindex', '0')
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1)
    await expect(panel).toHaveAttribute('data-cw-plugin-file', '.claude-plugin/plugin.json')
    await expect(item('.claude-plugin/plugin.json')).toHaveAttribute('aria-selected', 'true')

    await item('').focus()
    await page.keyboard.press('End')
    await expect(item('servers/recetas.mjs')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(panel).toHaveAttribute('data-cw-plugin-file', 'servers/recetas.mjs')
    await expect(item('servers/recetas.mjs')).toHaveAttribute('aria-selected', 'true')
    await expect(item('.claude-plugin/plugin.json')).toHaveAttribute('aria-selected', 'false')
    await expect(panel.getByRole('heading', { level: 5 })).toHaveText('recetas.mjs')
    await expect(panel.locator('[data-cw-plugin-what]')).toContainText('JSON-RPC')
    await expect(panel.locator('[data-cw-plugin-trade]')).toContainText(es['ailab.a2.trade'])
    await expect(panel.locator('[data-cw-code] code')).toContainText("name: 'escalar_receta'")
    await expect(stage.locator('[data-cw-plugin-status]')).toHaveText(es['ailab.a2.opened'].replace('{file}', 'recetas.mjs'))

    await page.keyboard.press('ArrowLeft')
    await expect(item('servers')).toBeFocused()
    await expect(item('servers')).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(item('servers')).toHaveAttribute('aria-expanded', 'false')
    await expect(item('servers/recetas.mjs')).toHaveCount(0)
    await page.keyboard.press('ArrowRight')
    await expect(item('servers')).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(item('servers/recetas.mjs')).toBeFocused()

    await page.keyboard.press('Home')
    await expect(item('')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(item('skills')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await expect(item('skills/escalar-receta/SKILL.md')).toBeFocused()
    await page.keyboard.press(' ')
    await expect(panel).toHaveAttribute('data-cw-plugin-file', 'skills/escalar-receta/SKILL.md')
    await expect(panel.locator('[data-cw-code] code')).toContainText('name: escalar-receta')

    await page.keyboard.press('h')
    await expect(item('commands/hidratacion.md')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(item('commands/hidratacion.md')).not.toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(item('commands/hidratacion.md')).toBeFocused()

    await tree.getByText('.mcp.json', { exact: true }).click()
    await expect(panel).toHaveAttribute('data-cw-plugin-file', '.mcp.json')
    await expect(item('.mcp.json')).toBeFocused()
    await tree.getByText('hooks/', { exact: true }).click()
    await expect(item('hooks')).toHaveAttribute('aria-expanded', 'false')

    await expect(stage.locator('[data-cw-plugin-next]')).toHaveAttribute('href', '#lab-a3')
    expect(await blockingViolations(page, '[data-cw-lab-card="A2"]')).toEqual([])
    await noOverflow(page)
    expect(heavy.filter((request) => HEAVY.test(request.url())).map((request) => request.url())).toEqual([])
  })

  test('en inglés el plugin es otro, con sus propios archivos', async ({ page }) => {
    await open(page, 'en')
    const stage = await tryDemo(page, 'A2')
    const tree = stage.getByRole('tree', { name: en['ailab.a2.tree'] })
    await expect(tree.locator('[data-cw-plugin-path="bakery/skills/scale-recipe/SKILL.md"]')).toBeVisible()
    await tree.getByText('hydration.md', { exact: true }).click()
    await expect(stage.locator('[data-cw-plugin-file]')).toHaveAttribute('data-cw-plugin-file', 'commands/hydration.md')
    await expect(stage.locator('[data-cw-plugin-what]')).toContainText('$ARGUMENTS')
  })
})

test.describe('A3 · Crea tu skill (US3 escenarios 2 y 3, FR-353)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('dice qué corregir por campo, sugiere un nombre y descarga un SKILL.md válido sin enviar nada', async ({ page }) => {
    const requests = watch(page)
    await open(page)
    const stage = await tryDemo(page, 'A3')
    const field = (name: string) => stage.locator(`[data-cw-skill-field="${name}"]`)
    const download = stage.locator('[data-cw-skill-download]')

    await download.click()
    await expect(field('name')).toBeFocused()
    await expect(stage.locator('[data-cw-skill-status]')).toHaveText(es['ailab.a3.invalid'])
    for (const name of ['name', 'description', 'steps']) await expect(field(name)).toHaveAttribute('aria-invalid', 'true')
    await expect(stage.getByText(es['ailab.a3.error.name.required'])).toBeVisible()
    await expect(stage.getByText(es['ailab.a3.error.description.required'])).toBeVisible()
    await expect(stage.getByText(es['ailab.a3.error.steps.required'])).toBeVisible()
    const describedBy = await field('name').getAttribute('aria-describedby')
    expect(describedBy).toMatch(/-error/)
    await expect(page.locator(`[id="${describedBy!.split(' ').at(-1)}"]`)).toHaveText(es['ailab.a3.error.name.required'])

    await field('name').fill('Revisar Recetas')
    await expect(stage.getByText(es['ailab.a3.error.name.format'])).toBeVisible()
    await expect(stage.locator('[data-cw-skill-suggest]')).toContainText('revisar-recetas')
    await stage.locator('[data-cw-skill-use-suggestion]').click()
    await expect(field('name')).toHaveValue('revisar-recetas')
    await expect(field('name')).not.toHaveAttribute('aria-invalid', 'true')

    const description = 'Revisa que una receta declare sus alérgenos: "siempre". Úsala al editar recetas.'
    await field('description').fill(description)
    await field('steps').fill('1. Lee la receta\n- Busca la sección de alérgenos\n\nDi qué falta')
    await expect(stage.locator('[data-cw-skill-valid]')).toHaveAttribute('data-cw-skill-valid', 'true')
    await expect(stage.locator('[data-cw-skill-markdown]')).toContainText('name: revisar-recetas')

    const pending = page.waitForEvent('download')
    await download.click()
    const file = await pending
    expect(file.suggestedFilename()).toBe('SKILL.md')
    const text = await readFile((await file.path())!, 'utf8')
    expect(validateSkillMd(text)).toEqual({ ok: true, name: 'revisar-recetas', description, errors: {} })
    expect(text).toContain('1. Lee la receta\n2. Busca la sección de alérgenos\n3. Di qué falta\n')
    await expect(stage.locator('[data-cw-skill-status]')).toHaveText(es['ailab.a3.downloaded'].replace('{name}', 'revisar-recetas'))

    await field('description').fill('<b>negrilla</b>')
    await download.click()
    await expect(stage.getByText(es['ailab.a3.error.description.markup'])).toBeVisible()
    await expect(field('description')).toBeFocused()

    expect(carrying(requests, 'alérgenos: "siempre"')).toEqual([])
    expect(carrying(requests, 'revisar-recetas')).toEqual([])
    expect(await blockingViolations(page, '[data-cw-lab-card="A3"]')).toEqual([])
    await noOverflow(page)
  })

  test('"Llenar con un ejemplo" deja el formulario listo para descargar, en inglés también', async ({ page }) => {
    await open(page, 'en')
    const stage = await tryDemo(page, 'A3')
    await stage.locator('[data-cw-skill-example]').click()
    await expect(stage.locator('[data-cw-skill-field="name"]')).toHaveValue(en['ailab.a3.example.name'])
    await expect(stage.locator('[data-cw-skill-valid]')).toHaveText(en['ailab.a3.valid'])
    await expect(stage.locator('[data-cw-skill-markdown]')).toContainText('## Steps')
    const pending = page.waitForEvent('download')
    await stage.locator('[data-cw-skill-download]').click()
    expect(validateSkillMd(await readFile((await (await pending).path())!, 'utf8')).ok).toBe(true)
  })
})

test.describe('A5 · Buscador con caja de cristal (US8 escenario 1, FR-357)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('cada resultado muestra fragmento, puntaje, fuente, enlace y por qué puntuó así, sin enviar la pregunta', async ({ page }) => {
    const requests = watch(page)
    await open(page)
    const stage = await tryDemo(page, 'A5')
    await expect(stage.locator('[data-cw-glassbox]')).toHaveAttribute('data-cw-glassbox', 'ready', { timeout: 30_000 })
    await expect(stage.locator('[data-cw-glass-status]')).toContainText('Índice listo')
    const since = requests.length

    const query = '¿cómo maneja Synergos las sagas?'
    await stage.getByRole('searchbox', { name: es['ailab.a5.label'] }).fill(query)
    const results = stage.locator('[data-cw-glass-result]')
    await expect(results.first()).toBeVisible()
    await expect(stage.locator('[data-cw-glass-status]')).toContainText(`«${query}»`)
    const first = results.first()
    await expect(first).toHaveAttribute('data-cw-glass-result', 'project:12')
    await expect(first.locator('[data-cw-glass-link]')).toHaveText('Synergos')
    await expect(first.locator('[data-cw-glass-link]')).toHaveAttribute('href', /^\/es\/portfolio\/12$/)
    await expect(first.locator('[data-cw-glass-score]')).toContainText('Puntaje')
    await expect(first.locator('[data-cw-glass-source]')).toContainText('Proyecto')
    await expect(first.locator('[data-cw-glass-fragment] mark').first()).toBeVisible()
    await expect(stage.locator('[data-cw-glass-token="synergos"]')).toBeVisible()

    await first.locator('[data-cw-glass-why] summary').click()
    await expect(first.locator('[data-cw-glass-term="synergos"]')).toContainText('el título (×4), tal cual')
    await expect(first.locator('[data-cw-glass-total]')).toContainText('Suma')
    const scores = await results.evaluateAll((nodes) => nodes.map((node) => Number(node.querySelector('[data-cw-glass-score]')?.getAttribute('data-cw-glass-score'))))
    expect(scores.length).toBeGreaterThan(2)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)

    await stage.locator('[data-cw-glass-example]').nth(2).click()
    await expect(stage.getByRole('searchbox')).toHaveValue(es['ailab.a5.example.three'])
    await expect(results.first().locator('[data-cw-glass-why] summary')).toBeVisible()
    await results.first().locator('[data-cw-glass-why] summary').click()
    await expect(results.first().locator('[data-cw-glass-why]')).toContainText('aproximada')

    await stage.getByRole('searchbox').fill('zzzzqqqq')
    await expect(stage.locator('[data-cw-glass-status]')).toHaveText(es['ailab.a5.empty'].replace('{query}', 'zzzzqqqq'))
    await expect(results).toHaveCount(0)

    await expect(stage.locator('[data-cw-glass-meaning]')).toHaveText(es['ailab.a5.meaning'])
    await expect(stage.getByRole('button', { name: /significado/i })).toHaveCount(0)
    expect(carrying(requests.slice(since), 'synergos')).toEqual([])
    expect(carrying(requests.slice(since), 'zzzzqqqq')).toEqual([])
    expect(requests.filter((request) => HEAVY.test(request.url())).map((request) => request.url())).toEqual([])
    expect(await blockingViolations(page, '[data-cw-lab-card="A5"]')).toEqual([])
    await noOverflow(page)
  })

  test('en inglés busca en el índice en inglés', async ({ page }) => {
    await open(page, 'en')
    const stage = await tryDemo(page, 'A5')
    await stage.locator('[data-cw-glass-example]').first().click()
    const first = stage.locator('[data-cw-glass-result]').first()
    await expect(first).toHaveAttribute('data-cw-glass-result', /^(architecture:synergos|project:12)$/)
    await expect(first.locator('[data-cw-glass-link]')).toHaveAttribute('href', /^\/en\//)
    const twelve = stage.locator('[data-cw-glass-result="project:12"]')
    await expect(twelve.locator('[data-cw-glass-link]')).toHaveAttribute('href', '/en/portfolio/12')
    await expect(twelve.locator('[data-cw-glass-source]')).toContainText('Project')
  })
})

test.describe('movimiento reducido', () => {
  onlyIn('desktop-chromium')

  test('las demos de X2 no animan nada con movimiento reducido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    const stage = await tryDemo(page, 'A2')
    const durations = await stage.evaluate((root) =>
      [...root.querySelectorAll('*')]
        .map((node) => getComputedStyle(node))
        .flatMap((style) => [style.transitionDuration, style.animationDuration])
        .filter((value) => value.split(',').some((part) => Number.parseFloat(part) > 0.001)),
    )
    expect(durations).toEqual([])
  })
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('A2, A3 y A5 se leen con su recorrido y sus decisiones, y A5 enlaza su código real', async ({ page }) => {
    await page.goto('/es/ai-lab')
    for (const id of ['A2', 'A3', 'A5']) {
      const item = card(page, id)
      await expect(item.locator('[data-cw-lab-noscript]')).toBeVisible()
      await item.locator('[data-cw-lab-part="how"] summary').click()
      await expect(item.locator('[data-cw-lab-flow] li')).toHaveCount(3)
      await expect(item.locator('[data-cw-adr]')).toHaveCount(labExperiment(id as 'A2').adrCards.length)
    }
    const a5 = card(page, 'A5')
    await a5.locator('[data-cw-lab-part="code"] summary').click()
    await expect(a5.locator('[data-cw-lab-code] code')).toContainText('const explained = terms.flatMap')
    await expect(a5.locator('[data-cw-lab-repo]')).toHaveAttribute('href', 'https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/lib/ailab/search/glassbox.ts')
  })
})
