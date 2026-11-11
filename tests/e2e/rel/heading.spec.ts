import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { getSite } from '@/lib/content'

const heading = getSite().about.heading!

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

const literal = (text: string) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

async function open(page: Page, lang: 'es' | 'en' = 'es') {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/aboutMe`)
}

const scene = (page: Page) => page.locator('[data-cw-scene="heading"]')

test.describe('"Hacia dónde voy", cuarta escena de Sobre mí (R2.1, T960)', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: título, mapa de rumbos y cuatro tarjetas, también en el índice de escenas`, async ({ page }) => {
      await open(page, lang)
      await expect(scene(page).locator('#about-heading')).toHaveText(heading.title[lang])
      await expect(scene(page).getByRole('navigation', { name: lang === 'es' ? /Mapa de rumbos/ : /Map of directions/ })).toBeAttached()
      await expect(scene(page).locator('[data-cw-heading-route]')).toHaveText(heading.directions.map((direction) => literal(direction.title[lang])))
      await expect(scene(page).locator('[data-cw-heading-direction] h3')).toHaveText(heading.directions.map((direction) => direction.title[lang]))
      for (const direction of heading.directions) {
        await expect(scene(page).locator(`#heading-${direction.id}`)).toContainText(direction.text[lang].split(' ').slice(0, 4).join(' '))
      }
      const nav = page.getByRole('navigation', { name: lang === 'es' ? 'Escenas de Sobre mí' : 'About me scenes' })
      await expect(nav.getByRole('link').last()).toContainText(heading.title[lang])
    })
  }

  test('cada rumbo del mapa lleva a su tarjeta con el título a la vista', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    for (const direction of heading.directions) {
      await page.locator(`[data-cw-heading-route="${direction.id}"]`).click()
      await expect(page).toHaveURL(new RegExp(`#heading-${direction.id}$`))
      const title = page.locator(`#heading-${direction.id} h3`)
      await expect(title).toBeInViewport()
      await expect
        .poll(
          () =>
            title.evaluate((node) => {
              const box = node.getBoundingClientRect()
              const hit = document.elementFromPoint(box.left + 8, box.top + box.height / 2)
              return hit !== null && (hit === node || node.contains(hit))
            }),
          { message: direction.id },
        )
        .toBe(true)
    }
  })

  test('en celular el enlace de la escena queda activo y a la vista dentro del índice', async ({ page }) => {
    onlyIn('mobile-chromium')
    await open(page)
    await page.locator('#scene-heading').evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' }))
    const link = page.locator('[data-cw-scene-link="scene-heading"]')
    await expect(link).toHaveAttribute('aria-current', 'true')
    const list = page.locator('[data-cw-scene-nav] ol')
    await expect
      .poll(async () => {
        const item = (await link.boundingBox())!
        const box = (await list.boundingBox())!
        return item.x >= box.x - 1 && item.x + item.width <= box.x + box.width + 1
      })
      .toBe(true)
  })

  test('en celular no hay texto de menos de 12 px, los enlaces miden 44 px y nada desborda', async ({ page }) => {
    onlyIn('mobile-chromium')
    await open(page)
    await scene(page).scrollIntoViewIfNeeded()
    const report = await scene(page).evaluate((node) => {
      const small = [...node.querySelectorAll('*')].filter(
        (element) => [...element.childNodes].some((child) => child.nodeType === 3 && child.textContent!.trim()) && parseFloat(getComputedStyle(element).fontSize) < 12,
      ).length
      const short = [...node.querySelectorAll('a')].filter((anchor) => anchor.getBoundingClientRect().height < 44).length
      const justified = [...node.querySelectorAll('p')].filter((paragraph) => getComputedStyle(paragraph).textAlign === 'justify').length
      return { small, short, justified, overflow: document.documentElement.scrollWidth - window.innerWidth }
    })
    expect(report).toEqual({ small: 0, short: 0, justified: 0, overflow: 0 })
  })

  test('cumple WCAG 2.2 AA en claro y en oscuro', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    for (const scheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.addInitScript((value) => {
        try {
          localStorage.setItem('cw-theme', value)
        } catch {}
      }, scheme)
      await open(page)
      await scene(page).scrollIntoViewIfNeeded()
      const results = await new AxeBuilder({ page }).include('[data-cw-scene="heading"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(results.violations.map((violation) => `${scheme}: ${violation.id}`)).toEqual([])
    }
  })

  test('sin JavaScript se lee completa y los rumbos son anclas', async ({ page }) => {
    onlyIn('no-js')
    await page.goto('/es/aboutMe')
    await expect(scene(page).locator('[data-cw-heading-direction]')).toHaveCount(heading.directions.length)
    for (const item of await scene(page).locator('[data-cw-heading-direction]').all()) await expect(item).toBeVisible()
    await page.locator(`[data-cw-heading-route="${heading.directions[2]!.id}"]`).click()
    await expect(page).toHaveURL(new RegExp(`#heading-${heading.directions[2]!.id}$`))
    await expect(page.locator(`#heading-${heading.directions[2]!.id}`)).toBeInViewport()
  })
})
