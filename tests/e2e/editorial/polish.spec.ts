import { expect, test } from '@playwright/test'

test('los CTA de los casos caben en su columna a 320 y 375 px', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium')
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
  for (const lang of ['es', 'en']) for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(`/${lang}/portfolio/12`)
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '')
    const errors = await page.locator('[class*="heroActions"] > a').evaluateAll(links => links.filter(link => {
      const box = link.getBoundingClientRect(); const parent = link.parentElement!.getBoundingClientRect()
      return box.width > parent.width + 1 || box.height < 44
    }).map(link => link.textContent))
    expect(errors, `${lang} ${width}`).toEqual([])
  }
})

test('el scroll mueve el progreso y el movimiento reducido conserva la lectura', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium')
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
  for (const route of ['/es/synergos', '/es/synergos/arquitectura']) {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(route)
    const progress = page.locator('[data-cw-scroll-progress]')
    if (await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))) {
      const before = await progress.evaluate(element => getComputedStyle(element).transform)
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2))
      await expect.poll(() => progress.evaluate(element => getComputedStyle(element).transform)).not.toBe(before)
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(progress).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})
