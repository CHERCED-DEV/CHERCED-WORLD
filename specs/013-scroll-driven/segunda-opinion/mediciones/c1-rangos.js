const { chromium, webkit } = require('playwright')
const BASE = process.argv[2]
if (!BASE) throw new Error('Uso: node <script> <url-de-la-vista-previa>')
const RANGES = ['exit-crossing 0% exit-crossing 100%', 'exit-crossing 0% contain 100%', 'contain 0% contain 100%']
;(async () => {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    for (const vp of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport: vp })
      await page.goto(BASE + '/es/aboutMe', { waitUntil: 'networkidle', timeout: 90000 })
      await page.waitForTimeout(2000)
      let css = 'body { timeline-scope: --q-heading, --q-knowledge; } [data-cw-scene="heading"] { view-timeline: --q-heading block; view-timeline-inset: auto 0; } [data-cw-scene="knowledge"] { view-timeline: --q-knowledge block; view-timeline-inset: auto 0; } @keyframes q { from { scale: 0 1 } to { scale: 1 1 } } .q { position: fixed; top: 0; left: 0; width: 2px; height: 2px; animation: q linear both; }'
      RANGES.forEach((r, i) => { css += ` #qh${i} { animation-timeline: --q-heading; animation-range: ${r}; } #qk${i} { animation-timeline: --q-knowledge; animation-range: ${r}; }` })
      await page.addStyleTag({ content: css })
      await page.evaluate((n) => { for (let i = 0; i < n; i++) for (const p of ['qh', 'qk']) { const d = document.createElement('div'); d.className = 'q'; d.id = p + i; document.body.append(d) } }, RANGES.length)
      let y = 0
      for (let i = 0; i < 200; i++) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
        const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
        if (y >= max) break
        y = Math.min(y + 500, max)
      }
      const r = await page.evaluate((n) => {
        const out = []
        const h = document.querySelector('[data-cw-scene="heading"]').getBoundingClientRect()
        for (let i = 0; i < n; i++) {
          const ph = document.getElementById('qh' + i).getAnimations()[0].effect.getComputedTiming().progress
          const pk = document.getElementById('qk' + i).getAnimations()[0].effect.getComputedTiming().progress
          out.push({ heading: Number(ph.toFixed(2)), knowledge: Number(pk.toFixed(2)) })
        }
        return { out, headingH: Math.round(h.height), headingBottomToViewportBottom: Math.round(innerHeight - h.bottom) }
      }, RANGES.length)
      console.log(`${name} ${vp.width}: escena final alto=${r.headingH}px, distancia de su borde inferior al fondo de la ventana=${r.headingBottomToViewportBottom}px`)
      RANGES.forEach((rg, i) => console.log(`   al final de la página con «${rg}»: heading=${r.out[i].heading} knowledge=${r.out[i].knowledge}`))
      await page.close()
    }
    await browser.close()
  }
})()
