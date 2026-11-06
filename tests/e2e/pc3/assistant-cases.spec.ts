import { expect, test, type Page } from '@playwright/test'

const READY_TIMEOUT = 60_000

test.describe.configure({ timeout: 2 * READY_TIMEOUT + 30_000 })

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'solo en desktop-chromium')
})

const COPY = {
  es: { dialog: 'Pregúntale a mi portafolio', send: 'Preguntar' },
  en: { dialog: 'Ask my portfolio', send: 'Ask' },
} as const

async function ask(page: Page, lang: keyof typeof COPY, question: string) {
  await page.goto(`/${lang}/aboutMe`)
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: READY_TIMEOUT })
  await page.locator('[data-cw-assistant-button]').click()
  const dialog = page.getByRole('dialog', { name: COPY[lang].dialog })
  await expect(dialog).toBeVisible()
  await dialog.locator('[data-cw-assistant-input]').fill(question)
  await dialog.getByRole('button', { name: COPY[lang].send }).click()
  const answer = dialog.locator('[data-cw-answer-kind]').last()
  await expect(answer).toHaveAttribute('data-cw-answer-kind', 'answer', { timeout: READY_TIMEOUT })
  return answer
}

test('"¿Cómo maneja Synergos las sagas?" responde con la compensación y cita el caso', async ({ page }) => {
  const answer = await ask(page, 'es', '¿Cómo maneja Synergos las sagas?')
  await expect(answer).toContainText('Orquestadores de saga por vertical, con la compensación tratada como dato.')
  await expect(answer).toContainText('La compensación es dato, no función')
  await expect(answer.getByRole('link', { name: 'Synergos' })).toHaveAttribute('href', '/es/portfolio/12')
})

test('"How does Synergos handle sagas?" responde en inglés y cita el caso', async ({ page }) => {
  const answer = await ask(page, 'en', 'How does Synergos handle sagas?')
  await expect(answer).toHaveAttribute('lang', 'en')
  await expect(answer).toContainText('Saga orchestrators per vertical, with compensation treated as data.')
  await expect(answer.getByRole('link', { name: 'Synergos' })).toHaveAttribute('href', '/en/portfolio/12')
})

for (const width of [1280, 375]) {
  test(`el lóbulo "Idiomas y negocio" dice el nivel del inglés sin romper la fila (${width} px)`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/es/aboutMe#lobe-business')
    const row = page.locator('[data-cw-term-rows] [data-cw-brain-skill="en"]').filter({ visible: true }).first()
    await expect(row).toBeVisible({ timeout: READY_TIMEOUT })
    await expect(row).toContainText('INGLÉS')
    const level = row.locator('[data-cw-level-text]')
    await expect(level).toHaveText('B1, B2 en uso profesional frecuente')
    await expect(row).not.toContainText('65')
    const layout = await row.evaluate((element) => {
      const name = [...element.children].find((child) => child.textContent?.trim() === 'INGLÉS')!
      const range = document.createRange()
      range.selectNodeContents(name)
      return { overflow: element.scrollWidth - element.clientWidth, nameLines: range.getClientRects().length }
    })
    expect(layout.overflow).toBeLessThanOrEqual(1)
    expect(layout.nameLines).toBe(1)
    await row.screenshot({ path: testInfo.outputPath(`lobe-business-en-${width}.png`) })
  })
}

test('el inglés sale como nivel y las tecnologías con sus mayúsculas', async ({ page }) => {
  const languages = await ask(page, 'es', '¿Qué idiomas hablas?')
  await expect(languages).toContainText('inglés B1, B2 en uso profesional frecuente')
  await expect(languages).not.toContainText('%')
  const dialog = page.getByRole('dialog', { name: COPY.es.dialog })
  await dialog.locator('[data-cw-assistant-input]').fill('¿Qué tecnologías usa Synergos?')
  await dialog.getByRole('button', { name: COPY.es.send }).click()
  const stack = dialog.locator('[data-cw-answer-kind]').last()
  await expect(stack).toContainText('.NET 8, C#, ASP.NET Core')
  await expect(stack).toContainText('Nx')
})
