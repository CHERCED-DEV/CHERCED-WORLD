import { test, type Locator, type Page, type TestInfo } from '@playwright/test'
import {
  INTEGRATED,
  LANGS,
  SOON,
  attachShot,
  blockHeavy,
  card,
  consent,
  expect,
  fakeSpeech,
  fakeWorkers,
  layoutReport,
  onlyIn,
  open,
  openDemo,
  pageOverflow,
  prepareDemo,
  settle,
  type CardId,
  type Lang,
} from './support'

test.describe.configure({ timeout: 180_000 })

type Size = { width: number; height: number }

const MOBILE: Size[] = [
  { width: 320, height: 640 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
]

const DESKTOP: Size[] = [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
]

function sizesFor(project: string): Size[] {
  if (project === 'mobile-chromium') return MOBILE
  if (project === 'no-js') return [...MOBILE, ...DESKTOP]
  return DESKTOP
}

const ALL_CARDS: CardId[] = [...INTEGRATED, ...SOON]

const H3 =
  'H3 sin arreglar: el título de cada tema (`.themeTitle`, `flex: none`) no se encoge y empuja la raya `.themeLine` (min-width 1,5rem) fuera de la pantalla: la página mide 342 px a 320 (ES y EN) y 395 px a 375 y 390 (EN). Se activa al aplicar x5-h3-titulo-del-tema.patch'

const H5 =
  'H5 sin arreglar: en A3, a 320 px «Llenar con un ejemplo» no parte su texto (`white-space: nowrap` del botón) y se sale 27 px de la tarjeta, y «Usar este nombre» (`size="sm"`) mide 36 px de alto. Se activa al aplicar x5-h5-botones-a3.patch'

const H4 =
  'H4 sin arreglar: «Cerrar la demo» y, en inglés, «Clear what the lab saved» usan `size="sm"` y miden 36 px de alto en el móvil. Se activa al aplicar x5-h4-shell-44px.patch'

async function openDisclosures(page: Page, id: CardId): Promise<void> {
  for (const part of ['how', 'code']) {
    const details = card(page, id).locator(`[data-cw-lab-part="${part}"]`)
    if ((await details.count()) > 0 && (await details.getAttribute('open')) === null) await details.locator('summary').click()
  }
}

function javaScriptOn(testInfo: TestInfo): boolean {
  return testInfo.project.use.javaScriptEnabled !== false
}

async function measureCards(page: Page, testInfo: TestInfo, ids: CardId[], size: Size, label: string): Promise<string[]> {
  const problems: string[] = []
  for (const id of ids) {
    const item = card(page, id)
    const box = await item.boundingBox()
    const found: string[] = []
    if (box && (box.x < -1 || box.x + box.width > size.width + 1)) found.push(`la tarjeta va de ${Math.round(box.x)} a ${Math.round(box.x + box.width)} px en ${size.width} px`)
    const report = await layoutReport(item)
    found.push(
      ...report.escapes.map((entry) => `se sale de la tarjeta: ${entry}`),
      ...report.cut.map((entry) => `texto cortado: ${entry}`),
      ...report.overlaps.map((entry) => `controles encimados: ${entry}`),
    )
    if (found.length > 0) {
      problems.push(...found.map((entry) => `${size.width} px · ${label} · ${id}: ${entry}`))
      await attachShot(testInfo, `${label}-${id}-${size.width}px.png`, item)
    }
  }
  return problems
}

async function measurePage(page: Page, testInfo: TestInfo, size: Size, label: string): Promise<string[]> {
  const overflow = await pageOverflow(page)
  const problems: string[] = []
  if (Math.max(overflow.scroll, overflow.body) > size.width) problems.push(`scroll horizontal de la página: ${Math.max(overflow.scroll, overflow.body)} px en ${size.width} px`)
  if (overflow.inner !== size.width) problems.push(`el viewport quedó en ${overflow.inner} px en vez de ${size.width} px`)
  if (problems.length > 0) await attachShot(testInfo, `${label}-pagina-${size.width}px.png`, page)
  return problems.map((entry) => `${size.width} px · ${label} · ${entry}`)
}

test.describe('T763 · cada demo abierta, de 320 a 2560 px: sin texto cortado, sin salirse de su tarjeta ni controles encimados', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    for (const id of INTEGRATED) {
      test(`${id} abierta en /${lang}/ai-lab: nada se sale de la tarjeta, ningún texto queda cortado y ningún control se monta sobre otro`, async ({ page, context }, testInfo) => {
        const sizes = sizesFor(testInfo.project.name)
        test.fixme(id === 'A3' && lang === 'es' && testInfo.project.name === 'mobile-chromium', H5)
        await page.setViewportSize(sizes[0]!)
        await blockHeavy(context)
        await fakeWorkers(page)
        await fakeSpeech(page)
        await open(page, lang)
        const { views } = await prepareDemo(page, id, lang)
        await openDisclosures(page, id)
        const problems: string[] = []
        for (const size of sizes) {
          await page.setViewportSize(size)
          for (const view of views) {
            await view.show()
            await settle(page)
            problems.push(...(await measureCards(page, testInfo, [id], size, `${lang} ${view.name}`)))
          }
        }
        expect(problems).toEqual([])
      })
    }
  }
})

test.describe('T763 · la página entera de /ai-lab, de 320 a 2560 px: sin scroll horizontal', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab con «Cómo funciona» y «El código» abiertos: sin scroll horizontal ni tarjetas que desborden`, async ({ page, context }, testInfo) => {
      const sizes = sizesFor(testInfo.project.name)
      test.fixme(testInfo.project.name !== 'desktop-chromium', H3)
      await page.setViewportSize(sizes[0]!)
      if (javaScriptOn(testInfo)) {
        await blockHeavy(context)
        await open(page, lang)
        for (const id of SOON) await openDemo(page, id)
      } else {
        await page.goto(`/${lang}/ai-lab`)
      }
      for (const id of ALL_CARDS) await openDisclosures(page, id)
      const problems: string[] = []
      for (const size of sizes) {
        await page.setViewportSize(size)
        await settle(page, { javaScript: javaScriptOn(testInfo) })
        problems.push(...(await measurePage(page, testInfo, size, lang)), ...(await measureCards(page, testInfo, ALL_CARDS, size, lang)))
      }
      expect(problems).toEqual([])
    })
  }

  test('con cada demo abierta a la vez, la página no gana scroll horizontal', async ({ page, context }, testInfo) => {
    test.skip(!javaScriptOn(testInfo), 'las demos necesitan JavaScript')
    test.fixme(testInfo.project.name === 'mobile-chromium', H3)
    const sizes = sizesFor(testInfo.project.name)
    await page.setViewportSize(sizes[0]!)
    await blockHeavy(context)
    await fakeWorkers(page)
    await fakeSpeech(page)
    await open(page, 'en')
    for (const id of INTEGRATED) await prepareDemo(page, id, 'en')
    for (const id of SOON) await openDemo(page, id)
    const problems: string[] = []
    for (const size of sizes) {
      await page.setViewportSize(size)
      await settle(page)
      problems.push(...(await measurePage(page, testInfo, size, 'en, todo abierto')))
    }
    expect(problems).toEqual([])
  })
})

async function smallTargets(scope: Locator, testInfo: TestInfo, name: string): Promise<string[]> {
  const report = await layoutReport(scope, { minTarget: 44 })
  if (report.small.length > 0) await attachShot(testInfo, `${name}-44px.png`, scope)
  return report.small.map((entry) => `${name}: ${entry}`)
}

test.describe('T763 · objetivos táctiles de 44 px en el móvil (FR-652 de la 006)', () => {
  onlyIn('mobile-chromium')

  for (const id of INTEGRATED) {
    test(`${id} abierta a 390 px: cada control de la demo mide al menos 44 px de alto`, async ({ page, context }, testInfo) => {
      test.fixme(id === 'A3', H5)
      await blockHeavy(context)
      await fakeWorkers(page)
      await fakeSpeech(page)
      await open(page, 'es')
      const { stage, views } = await prepareDemo(page, id, 'es')
      const small: string[] = []
      for (const view of views) {
        await view.show()
        await settle(page)
        small.push(...(await smallTargets(stage, testInfo, view.name)).filter((entry) => !entry.includes('data-cw-lab-close')))
      }
      expect(small).toEqual([])
    })
  }

  for (const lang of ['es', 'en'] as Lang[]) {
    test(`/${lang}/ai-lab a 390 px: «Probar», «Cerrar la demo», «Retirar el permiso», el diálogo y los accesos a los temas miden 44 px o más`, async ({ page, context }, testInfo) => {
      test.fixme(true, H4)
      await blockHeavy(context)
      await fakeWorkers(page)
      await open(page, lang)
      const small: string[] = []
      small.push(...(await smallTargets(page.locator('[data-cw-ailab]'), testInfo, 'página')))
      const v1 = card(page, 'V1')
      await v1.locator('[data-cw-lab-open]').click()
      await expect(consent(page)).toBeVisible()
      await consent(page).evaluate((node) => Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished)))
      small.push(...(await smallTargets(consent(page), testInfo, 'diálogo')))
      await consent(page).locator('[data-cw-lab-consent-accept]').click()
      await expect(v1.locator('[data-cw-lab-stage]')).toBeVisible()
      for (const selector of ['[data-cw-lab-close]', '[data-cw-lab-revoke]']) {
        const box = await v1.locator(selector).boundingBox()
        if (box && box.height < 43.5) small.push(`${selector}: ${Math.round(box.height)} px de alto`)
      }
      expect(small).toEqual([])
    })
  }
})
