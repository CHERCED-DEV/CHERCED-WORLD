const { chromium, webkit } = require('playwright')
const BASE = process.argv[2]
if (!BASE) throw new Error('Uso: node <script> <url-de-la-vista-previa>')
;(async () => {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
    await page.goto(BASE + '/es/synergos', { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(2000)
    const svg = await page.evaluate(() => {
      const path = [...document.querySelectorAll('path')].find((p) => p.getAnimations().some((a) => a.timeline && a.timeline.constructor.name === 'ViewTimeline'))
      const a = path.getAnimations().find((x) => x.timeline.constructor.name === 'ViewTimeline')
      const src = a.timeline.source
      const chain = []
      for (let n = path.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n)
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') chain.push(`${n.tagName.toLowerCase()}.${String(n.className.baseVal ?? n.className).split(' ')[0]}:${cs.overflowX}/${cs.overflowY}`)
      }
      const top = path.closest('svg').getBoundingClientRect().top + scrollY
      return { source: src === document.scrollingElement ? 'raíz' : `${src.tagName.toLowerCase()}.${String(src.className).split(' ')[0]}`, chain, top }
    })
    const reads = []
    for (const f of [1.0, 0.6, 0.2, -0.2]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, svg.top - 812 * f))
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      reads.push(await page.evaluate(() => {
        const path = [...document.querySelectorAll('path')].find((p) => p.getAnimations().some((a) => a.timeline && a.timeline.constructor.name === 'ViewTimeline'))
        const a = path.getAnimations().find((x) => x.timeline.constructor.name === 'ViewTimeline')
        return Number(a.effect.getComputedTiming().progress.toFixed(2))
      }))
    }
    console.log(`${name} /es/synergos 375: fuente de la línea de tiempo con nombre = ${svg.source}; ancestros con overflow = ${JSON.stringify(svg.chain)}; progreso del primer trazo al bajar = ${JSON.stringify(reads)}`)
    await browser.close()
  }
})()
