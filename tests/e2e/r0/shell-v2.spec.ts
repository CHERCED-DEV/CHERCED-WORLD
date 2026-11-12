import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PAGES = [
  '/es',
  '/es/aboutMe',
  '/es/services',
  '/es/portfolio',
  '/es/portfolio/1',
  '/es/blog',
  '/es/blog/post1',
  '/es/blog/catalog',
  '/es/contactMe',
  '/es/privacy',
  '/es/inbox',
  '/es/esta-ruta-no-existe',
  '/en',
  '/en/portfolio/1',
  '/en/blog/post1',
]

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
}

async function scrollToEnd(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
        return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      }),
    )
    .toBe(true)
}

const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY))

test.describe('D-01: "Volver arriba" sube de verdad', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const path of PAGES) {
    test(`desde el final de ${path}`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(path)
      await scrollToEnd(page)
      expect(await scrollY(page)).toBeGreaterThan(0)

      await page.locator('[data-cw-back-to-top]').click()
      await expect.poll(() => scrollY(page), { timeout: 5000 }).toBe(0)
      await expect(page.locator('#main')).toBeFocused()
      expect(new URL(page.url()).hash).toBe('')
    })
  }

  test('con movimiento reducido sube sin animación', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipIntro(page)
    await page.goto('/es/portfolio')
    await scrollToEnd(page)
    await page.locator('[data-cw-back-to-top]').click()
    await expect.poll(() => scrollY(page), { timeout: 300 }).toBe(0)
    await expect(page.locator('#main')).toBeFocused()
  })

  test('con teclado: Enter sube y el siguiente Tab entra al contenido', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    await scrollToEnd(page)
    await page.locator('[data-cw-back-to-top]').focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => scrollY(page)).toBe(0)
    await expect(page.locator('#main')).toBeFocused()
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.querySelector('#main')?.contains(document.activeElement))).toBe(true)
  })
})

test.describe('D-01 sin JavaScript', () => {
  onlyIn('no-js')

  test('el enlace sigue llevando arriba del todo', async ({ page }) => {
    await page.goto('/es/portfolio')
    await scrollToEnd(page)
    await page.locator('[data-cw-back-to-top]').click()
    await expect.poll(() => scrollY(page)).toBe(0)
  })
})

test.describe('buzón público (E-01)', () => {
  test('el endpoint solo expone el número de no leídos, con caché de 30 s', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una sola vez')
    const response = await request.get('/api/inbox-count')
    expect(response.status()).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(Object.keys(body)).toEqual(['unread'])
    expect(Number.isInteger(body.unread)).toBe(true)
    expect(response.headers()['cache-control']).toMatch(/s-maxage=30\b/)
  })

  test.describe('en el header', () => {
    onlyIn('desktop-chromium', 'mobile-chromium')

    test('muestra el número y lleva al panel (A-1101 de la 011)', async ({ page }) => {
      await page.route('**/api/inbox-count', (route) => route.fulfill({ json: { unread: 3 } }))
      await skipIntro(page)
      await page.goto('/es/aboutMe')
      const mailbox = page.locator('header [data-cw-mailbox]')
      await expect(mailbox).toBeVisible()
      await expect(mailbox).toHaveAttribute('href', '/es/inbox')
      await expect(mailbox.locator('[data-cw-mailbox-badge]')).toHaveText('3')
      await expect(mailbox).toHaveAccessibleName('Buzón, 3 mensajes sin leer')
      await expect(page.locator('header a[href*="/inbox"]'), 'el buzón es el único acceso al panel').toHaveCount(1)
      await mailbox.click()
      await page.waitForURL('**/es/inbox')
    })

    test('sin mensajes no muestra número', async ({ page }) => {
      await page.route('**/api/inbox-count', (route) => route.fulfill({ json: { unread: 0 } }))
      await skipIntro(page)
      await page.goto('/en/services')
      const mailbox = page.locator('header [data-cw-mailbox]')
      await expect(mailbox).toHaveAccessibleName('Inbox')
      await expect(mailbox).toHaveAttribute('href', '/en/inbox')
      await expect(mailbox.locator('[data-cw-mailbox-badge]')).toHaveCount(0)
    })

    test('consulta cada 60 s y solo con la pestaña visible', async ({ page }) => {
      let calls = 0
      await page.route('**/api/inbox-count', (route) => {
        calls += 1
        return route.fulfill({ json: { unread: calls } })
      })
      await page.clock.install()
      await skipIntro(page)
      await page.goto('/es/aboutMe')
      const badge = page.locator('header [data-cw-mailbox-badge]')
      await expect(badge).toHaveText('1')

      await page.clock.fastForward(60_000)
      await expect(badge).toHaveText('2')

      const setVisibility = (state: 'hidden' | 'visible') =>
        page.evaluate((value) => {
          Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value })
          document.dispatchEvent(new Event('visibilitychange'))
        }, state)

      await setVisibility('hidden')
      await page.clock.fastForward(180_000)
      await page.waitForTimeout(200)
      expect(calls).toBe(2)

      await setVisibility('visible')
      await expect(badge).toHaveText('3')
    })
  })

  test('sin JS el buzón es un enlace a Contacto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-js', 'solo sin JS')
    await page.goto('/es/aboutMe')
    const mailbox = page.locator('header [data-cw-mailbox]')
    await expect(mailbox).toBeVisible()
    await expect(mailbox).toHaveAttribute('href', '/es/inbox')
    await expect(mailbox.locator('[data-cw-mailbox-badge]')).toHaveCount(0)
  })
})

type VtRecord = { ends: number[]; pseudos: string[] }

async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const records: VtRecord[] = []
    ;(window as unknown as { __cwVt: VtRecord[] }).__cwVt = records
    const original = document.startViewTransition?.bind(document)
    if (!original) return
    document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
      const transition = original(arg)
      const record: VtRecord = { ends: [], pseudos: [] }
      records.push(record)
      transition.ready
        .then(() => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null
            if (!effect?.pseudoElement?.startsWith('::view-transition')) continue
            record.pseudos.push(effect.pseudoElement)
            record.ends.push(Number(effect.getComputedTiming().endTime ?? 0))
          }
        })
        .catch(() => {})
      return transition
    }) as typeof document.startViewTransition
  })
}

test.describe('transiciones entre páginas', () => {
  onlyIn('desktop-chromium')

  test('navegar anima la página nueva en 350 ms o menos, con el header quieto', async ({ page }) => {
    await recordViewTransitions(page)
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    await page.locator('header nav').getByRole('link', { name: 'Servicios' }).click()
    await page.waitForURL('**/es/services')
    const first = () => page.evaluate(() => (window as unknown as { __cwVt: VtRecord[] }).__cwVt[0] ?? null)
    await expect.poll(async () => (await first())?.pseudos.length ?? 0).toBeGreaterThan(0)
    const record = await first()
    expect(record?.pseudos.some((pseudo) => pseudo.startsWith('::view-transition-new'))).toBe(true)
    expect(record?.pseudos.some((pseudo) => /::view-transition-(old|new)\(root\)/.test(pseudo))).toBe(false)
    expect(Math.max(...(record?.ends ?? [0]))).toBeLessThanOrEqual(350)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('con movimiento reducido no hay animación de página', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await recordViewTransitions(page)
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    await page.locator('header nav').getByRole('link', { name: 'Portafolio' }).click()
    await page.waitForURL('**/es/portfolio')
    await page.waitForTimeout(400)
    const records = await page.evaluate(() => (window as unknown as { __cwVt: VtRecord[] }).__cwVt)
    for (const record of records) expect(Math.max(0, ...record.ends)).toBe(0)
  })
})

test.describe('cristal v2', () => {
  test('el reflejo sigue al puntero en escritorio, con un único listener y variables CSS', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'puntero fino')
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.setAttribute('data-cw-light', '')
      probe.id = 'cw-light-probe'
      probe.style.cssText = 'position:fixed;left:100px;top:200px;width:300px;height:200px;z-index:9999'
      document.body.append(probe)
    })
    await page.mouse.move(150, 260)
    await page.mouse.move(160, 270)
    const probe = page.locator('#cw-light-probe')
    await expect.poll(() => probe.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--cw-mx'))).toBe('60px')
    await expect.poll(() => probe.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--cw-my'))).toBe('70px')
  })

  for (const scenario of ['reduce', 'touch'] as const) {
    test(`el reflejo queda fijo con ${scenario === 'reduce' ? 'movimiento reducido' : 'pantalla táctil'}`, async ({ page }, testInfo) => {
      const project = scenario === 'reduce' ? 'desktop-chromium' : 'mobile-chromium'
      test.skip(testInfo.project.name !== project, `solo en ${project}`)
      if (scenario === 'reduce') await page.emulateMedia({ reducedMotion: 'reduce' })
      await skipIntro(page)
      await page.goto('/es/aboutMe')
      await page.evaluate(() => {
        const probe = document.createElement('div')
        probe.setAttribute('data-cw-light', '')
        probe.id = 'cw-light-probe'
        probe.style.cssText = 'position:fixed;left:40px;top:200px;width:300px;height:200px;z-index:9999'
        document.body.append(probe)
      })
      await page.mouse.move(80, 260)
      await page.mouse.move(90, 270)
      await page.waitForTimeout(150)
      expect(await page.locator('#cw-light-probe').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--cw-mx'))).toBe('')
    })
  }

  test('Reveal: lo pendiente se ve completo con movimiento reducido', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una sola vez')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    const opacity = await page.evaluate(() => {
      const el = document.createElement('div')
      el.setAttribute('data-cw-reveal', 'pending')
      el.textContent = 'x'
      document.body.append(el)
      return getComputedStyle(el).opacity
    })
    expect(opacity).toBe('1')
  })

  test.describe('header y footer', () => {
    onlyIn('desktop-chromium', 'mobile-chromium')

    test('los grafismos son decorativos y no capturan el puntero', async ({ page }) => {
      await skipIntro(page)
      await page.goto('/es/services')
      const graphics = page.locator('header [data-cw-graphic], footer [data-cw-graphic]')
      expect(await graphics.count()).toBeGreaterThanOrEqual(4)
      for (const graphic of await graphics.all()) {
        await expect(graphic).toHaveAttribute('aria-hidden', 'true')
        expect(await graphic.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')
      }
    })

    for (const scheme of ['dark', 'light'] as const) {
      test(`el home no tiene violaciones críticas ni serias en tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.route('**/api/inbox-count', (route) => route.fulfill({ json: { unread: 12 } }))
        await skipIntro(page)
        await page.goto('/es')
        await expect(page.locator('[data-cw-mailbox-badge]')).toHaveText('12')
        const results = await new AxeBuilder({ page }).include('header').include('footer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  })
})

