const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')
const { chromium, webkit } = require('playwright')

const FILE = path.resolve(__dirname, '../prototipo/hacia-donde-voy.html')
const URL0 = pathToFileURL(FILE).href
const OUT = path.resolve(__dirname, '../../../../test-results/013/prototipo')
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  { name: '375', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '1440', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
]

function audit() {
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
  }
  let minFont = Infinity
  let minFontWhere = ''
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!own) continue
    let size = parseFloat(getComputedStyle(el).fontSize)
    if (el instanceof SVGElement && el.getScreenCTM) size *= el.getScreenCTM().a
    if (size < minFont) { minFont = size; minFontWhere = `${el.tagName}:${el.textContent.trim().slice(0, 24)}` }
  }
  let minTarget = Infinity
  for (const a of document.querySelectorAll('a, button')) {
    if (!visible(a)) continue
    const r = a.getBoundingClientRect()
    minTarget = Math.min(minTarget, r.height)
  }
  const sda = document.getAnimations().filter((a) => a.timeline && a.timeline.constructor.name !== 'DocumentTimeline')
  const byTimeline = {}
  for (const a of sda) {
    const k = `${a.animationName}:${a.timeline.constructor.name}`
    byTimeline[k] = (byTimeline[k] || 0) + 1
  }
  return {
    minFont: Math.round(minFont * 10) / 10,
    minFontWhere,
    minTarget: Math.round(minTarget),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    sda: sda.length,
    byTimeline,
    supports: CSS.supports('animation-timeline: view()') && CSS.supports('animation-range: entry 0% cover 50%'),
    timelineScope: CSS.supports('timeline-scope: --a'),
  }
}

async function scrollTo(page, y) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.waitForTimeout(80)
}

async function mapScroll(page, coverFraction) {
  return page.evaluate((f) => {
    const svg = [...document.querySelectorAll('.map svg')].find((s) => getComputedStyle(s).display !== 'none')
    const r = svg.getBoundingClientRect()
    const absTop = r.top + scrollY
    const start = absTop - innerHeight
    return Math.round(start + f * (innerHeight + r.height))
  }, coverFraction)
}

async function traceState(page) {
  return page.evaluate(() => {
    const svg = [...document.querySelectorAll('.map svg')].find((s) => getComputedStyle(s).display !== 'none')
    const traces = [...svg.querySelectorAll('.trace')].map((p) => {
      const cs = getComputedStyle(p)
      return cs.display === 'none' ? 'off' : Number(parseFloat(cs.strokeDashoffset).toFixed(2))
    })
    const rings = [...svg.querySelectorAll('.ring')].map((p) => Number(parseFloat(getComputedStyle(p).opacity).toFixed(2)))
    const cards = [...document.querySelectorAll('.card')].map((c) => {
      const t = getComputedStyle(c, '::before').transform
      const m = t.match(/matrix\(([^,]+)/)
      return m ? Number(parseFloat(m[1]).toFixed(2)) : t
    })
    return { traces, rings, cards }
  })
}

async function progressAccuracy(page) {
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  let worst = 0
  const samples = []
  for (let i = 0; i <= 20; i++) {
    await scrollTo(page, Math.round((max * i) / 20))
    const s = await page.evaluate(() => {
      const bar = document.querySelector('[data-proto-progress]')
      const cs = getComputedStyle(bar)
      if (cs.display === 'none') return null
      const m = cs.transform.match(/matrix\(([^,]+)/)
      const css = m ? parseFloat(m[1]) : cs.transform === 'none' ? 1 : NaN
      const box = document.querySelector('.scene-body').getBoundingClientRect()
      const offset = document.querySelector('.header').getBoundingClientRect().bottom
      const distance = box.height - innerHeight + offset
      const expected = distance <= 0 ? (box.top + box.height <= innerHeight ? 1 : 0) : Math.min(1, Math.max(0, (offset - box.top) / distance))
      return { css, expected }
    })
    if (!s) return null
    samples.push(s)
    worst = Math.max(worst, Math.abs(s.css - s.expected))
  }
  return { worst: Number(worst.toFixed(4)), samples: samples.length }
}

async function cls(page) {
  await page.evaluate(() => {
    window.__cls = 0
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  })
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  for (let i = 0; i <= 30; i++) await scrollTo(page, Math.round((max * i) / 30))
  return page.evaluate(() => Number(window.__cls.toFixed(4)))
}

async function perfRun(context, url) {
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForTimeout(400)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Performance.enable')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const pick = (m, n) => (m.metrics.find((x) => x.name === n) || { value: 0 }).value
  const before = await cdp.send('Performance.getMetrics')
  await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - innerHeight
    for (let i = 1; i <= 150; i++) {
      window.scrollTo(0, (max * i) / 150)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    }
  })
  const after = await cdp.send('Performance.getMetrics')
  const d = (n) => pick(after, n) - pick(before, n)
  await page.close()
  return {
    layouts: d('LayoutCount'),
    styles: d('RecalcStyleCount'),
    layoutMs: d('LayoutDuration') * 1000,
    styleMs: d('RecalcStyleDuration') * 1000,
    scriptMs: d('ScriptDuration') * 1000,
    taskMs: d('TaskDuration') * 1000,
  }
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }

;(async () => {
  const report = []
  const log = (...a) => { const line = a.join(' '); report.push(line); console.log(line) }
  for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    for (const vp of VIEWPORTS) {
      for (const [mode, query, motion] of [
        ['css', '', 'no-preference'],
        ['en', '?lang=en', 'no-preference'],
        ['fallback', '?fallback', 'no-preference'],
        ['reduce', '', 'reduce'],
        ['js', '?progress=js', 'no-preference'],
      ]) {
        const context = await browser.newContext({ ...vp, reducedMotion: motion, colorScheme: 'dark' })
        const page = await context.newPage()
        await page.goto(URL0 + query)
        await page.waitForTimeout(300)
        const a = await page.evaluate(audit)
        log(`\n## ${engineName} ${vp.name} ${mode}`)
        log(`  supports=${a.supports} timelineScope=${a.timelineScope} sda=${a.sda} ${JSON.stringify(a.byTimeline)}`)
        log(`  minFont=${a.minFont}px (${a.minFontWhere}) minTarget=${a.minTarget}px overflowX=${a.overflowX}`)
        const states = {}
        for (const f of [0.1, 0.25, 0.35, 0.5]) {
          await scrollTo(page, await mapScroll(page, f))
          states[f] = await traceState(page)
          if (['css', 'fallback', 'reduce', 'en'].includes(mode) && (mode === 'css' || f === 0.35)) {
            await page.screenshot({ path: path.join(OUT, `${engineName}-${vp.name}-${mode}-cover${Math.round(f * 100)}.png`) })
          }
        }
        for (const [f, s] of Object.entries(states)) log(`  cover ${f}: traces=${JSON.stringify(s.traces)} rings=${JSON.stringify(s.rings)} cards=${JSON.stringify(s.cards)}`)
        if (mode === 'css' || mode === 'js') {
          const acc = await progressAccuracy(page)
          log(`  progress accuracy vs blog formula: ${JSON.stringify(acc)}`)
        }
        log(`  CLS during full scroll: ${await cls(page)}`)
        await context.close()
      }

      const trapContext = await browser.newContext({ ...vp, reducedMotion: 'reduce' })
      const trap = await trapContext.newPage()
      await trap.goto(URL0)
      await trap.addStyleTag({ content: `
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }
        #trap { position: fixed; left: 0; bottom: 0; width: 100px; height: 4px; background: red; transform-origin: 0 50%; animation: trapgrow linear both; animation-timeline: scroll(root block); }
        @keyframes trapgrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }` })
      await trap.evaluate(() => { const d = document.createElement('div'); d.id = 'trap'; document.body.append(d) })
      const max = await trap.evaluate(() => document.documentElement.scrollHeight - innerHeight)
      const reads = []
      for (const y of [0, Math.round(max / 2), max]) {
        await scrollTo(trap, y)
        reads.push(await trap.evaluate(() => {
          const t = getComputedStyle(document.getElementById('trap')).transform
          const m = t.match(/matrix\(([^,]+)/)
          return m ? Number(parseFloat(m[1]).toFixed(2)) : t
        }))
      }
      log(`\n## ${engineName} ${vp.name} TRAP (global reduce reset + ungated scroll-driven): scaleX at top/middle/bottom = ${JSON.stringify(reads)}`)
      await trapContext.close()

      if (engineName === 'chromium') {
        const ctx = await browser.newContext({ ...vp, colorScheme: 'dark' })
        const rows = {}
        for (const [mode, q] of [['none', '?progress=none'], ['css', '?progress=css'], ['js', '?progress=js'], ['fallback+js', '?fallback&progress=js']]) {
          const runs = []
          for (let i = 0; i < 5; i++) runs.push(await perfRun(ctx, URL0 + q))
          rows[mode] = Object.fromEntries(Object.keys(runs[0]).map((k) => [k, Math.round(median(runs.map((r) => r[k])) * 10) / 10]))
        }
        log(`\n## chromium ${vp.name} PERF (CPU 4x, 150 scroll steps, median of 5)`)
        for (const [m, r] of Object.entries(rows)) log(`  ${m.padEnd(12)} ${JSON.stringify(r)}`)
        await ctx.close()
      }
    }
    await browser.close()
  }
  fs.writeFileSync(path.join(OUT, 'report.txt'), report.join('\n'))
})()
