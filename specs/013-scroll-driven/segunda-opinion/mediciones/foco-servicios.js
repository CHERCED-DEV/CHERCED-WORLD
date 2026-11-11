const { chromium, webkit } = require('playwright')

const BASE = process.argv[2]
if (!BASE) throw new Error('Uso: node foco-servicios.js <url-de-la-vista-previa>')

;(async () => {
  for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    for (const motion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: engineName === 'chromium', hasTouch: true, deviceScaleFactor: 2, reducedMotion: motion })
      const page = await context.newPage()
      await page.goto(BASE + '/es/services', { waitUntil: 'networkidle', timeout: 60000 })
      await page.waitForTimeout(2500)
      const total = await page.evaluate(() => document.querySelectorAll('[data-cw-service-stack] a, [data-cw-service-stack] button').length)
      let checked = 0
      const obscured = []
      for (let i = 0; i < 160 && checked < total; i++) {
        await page.keyboard.press('Tab')
        await page.evaluate(() => new Promise((resolve) => {
          let last = scrollY
          let still = 0
          const started = performance.now()
          const tick = () => {
            still = scrollY === last ? still + 1 : 0
            last = scrollY
            if (still >= 8 || performance.now() - started > 2500) resolve()
            else requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }))
        await page.waitForTimeout(120)
        const r = await page.evaluate(() => {
          const el = document.activeElement
          if (!el || !el.closest('[data-cw-service-stack]')) return null
          const box = el.getBoundingClientRect()
          const points = [[0.5, 0.5], [0.15, 0.5], [0.85, 0.5]].map(([fx, fy]) => [box.left + box.width * fx, box.top + box.height * fy])
          const hidden = points.filter(([x, y]) => {
            if (y < 0 || y > innerHeight) return true
            const hit = document.elementFromPoint(x, y)
            return !(hit && (hit === el || el.contains(hit)))
          }).length
          const item = el.closest('li')
          const items = [...document.querySelectorAll('[data-cw-service-stack] > li')]
          const cy = box.top + box.height / 2
          const hit = cy >= 0 && cy <= innerHeight ? document.elementFromPoint(box.left + box.width / 2, cy) : null
          const coverItem = hit ? hit.closest('[data-cw-service-stack] > li') : null
          return {
            label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
            hidden, of: points.length, top: Math.round(box.top),
            card: items.indexOf(item), coveredBy: coverItem ? items.indexOf(coverItem) : hit ? hit.tagName + '.' + String(hit.className).slice(0, 20) : 'offscreen',
            stack: item ? item.getAttribute('data-cw-stack') : null,
          }
        })
        if (!r) continue
        checked++
        if (r.hidden > 0) obscured.push(r)
      }
      console.log(`${engineName} motion=${motion}: focusables in stack=${total}, reached=${checked}, obscured=${obscured.length}`)
      for (const o of obscured) console.log('   ', JSON.stringify(o))
      await context.close()
    }
    await browser.close()
  }
})()
