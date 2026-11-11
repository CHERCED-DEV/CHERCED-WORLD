const path = require('path')
const fs = require('fs')
const { chromium, webkit } = require('playwright')

const BASE = process.argv[2]
if (!BASE) throw new Error('Uso: node medir-sitio.js <url-de-la-vista-previa>')
const OUT = path.resolve(__dirname, '../../../../test-results/013/sitio')
fs.mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['home', '/es'],
  ['synergos', '/es/synergos'],
  ['arquitectura', '/es/synergos/arquitectura'],
  ['post6', '/es/blog/post6'],
  ['services', '/es/services'],
  ['about', '/es/aboutMe'],
  ['case', '/es/portfolio/13'],
  ['blog', '/es/blog'],
]

const VIEWPORTS = [
  { name: '375', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '1440', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
]

function inventory() {
  const scrollDriven = document.getAnimations().filter((a) => a.timeline && a.timeline.constructor && a.timeline.constructor.name !== 'DocumentTimeline')
  const describe = (a) => {
    const t = a.effect && a.effect.target
    const kf = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []
    const props = new Set()
    for (const k of kf) for (const p of Object.keys(k)) if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p)
    const cls = t ? (t.getAttribute && t.getAttribute('class')) || '' : ''
    return {
      name: a.animationName || a.id || '',
      timeline: a.timeline.constructor.name,
      props: [...props].join(','),
      target: t ? `${t.tagName ? t.tagName.toLowerCase() : 'pseudo'}${a.effect.pseudoElement || ''}.${String(cls).split(' ')[0]}` : '',
    }
  }
  const counts = {}
  for (const a of scrollDriven) {
    const d = describe(a)
    const key = `${d.name}|${d.timeline}|${d.props}|${d.target}`
    counts[key] = (counts[key] || 0) + 1
  }
  const box = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), display: cs.display, zIndex: cs.zIndex, position: cs.position }
  }
  return {
    supports: {
      scroll: CSS.supports('animation-timeline: scroll()'),
      view: CSS.supports('animation-timeline: view()'),
      range: CSS.supports('animation-range: entry 0% cover 50%'),
      timelineScope: CSS.supports('timeline-scope: --a'),
      targetGroup: CSS.supports('scroll-target-group: auto'),
      trigger: CSS.supports('animation-trigger: none'),
      startViewTransition: typeof document.startViewTransition === 'function',
    },
    scrollDriven: scrollDriven.length,
    groups: counts,
    header: box('#header'),
    synergosBar: box('[data-cw-scroll-progress]'),
    blogBar: box('[data-cw-reading-progress]'),
    docHeight: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }
}

async function scrollMetrics(page, cdp) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  const before = await cdp.send('Performance.getMetrics')
  await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - innerHeight
    const steps = 120
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, (max * i) / steps)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    }
  })
  const after = await cdp.send('Performance.getMetrics')
  const pick = (m, n) => (m.metrics.find((x) => x.name === n) || { value: 0 }).value
  const delta = (n) => pick(after, n) - pick(before, n)
  return {
    LayoutCount: delta('LayoutCount'),
    RecalcStyleCount: delta('RecalcStyleCount'),
    LayoutMs: Math.round(delta('LayoutDuration') * 1000),
    RecalcStyleMs: Math.round(delta('RecalcStyleDuration') * 1000),
    ScriptMs: Math.round(delta('ScriptDuration') * 1000),
    TaskMs: Math.round(delta('TaskDuration') * 1000),
  }
}

;(async () => {
  const results = []
  for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    for (const vp of VIEWPORTS) {
      for (const motion of ['no-preference', 'reduce']) {
        const context = await browser.newContext({ ...vp, reducedMotion: motion, colorScheme: 'dark' })
        for (const [name, url] of PAGES) {
          if (motion === 'reduce' && !['synergos', 'post6', 'services', 'home'].includes(name)) continue
          const page = await context.newPage()
          try {
            await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 60000 })
          } catch (e) {
            results.push({ engineName, vp: vp.name, motion, name, error: String(e).slice(0, 120) })
            await page.close()
            continue
          }
          await page.waitForTimeout(2500)
          await page.evaluate(() => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * 0.4)))
          await page.waitForTimeout(600)
          const inv = await page.evaluate(inventory)
          const row = { engineName, vp: vp.name, motion, name, ...inv }
          if (motion === 'no-preference' && ['synergos', 'post6', 'arquitectura'].includes(name)) {
            await page.screenshot({ path: path.join(OUT, `${engineName}-${vp.name}-${name}-40.png`) })
            await page.screenshot({ path: path.join(OUT, `${engineName}-${vp.name}-${name}-top-clip.png`), clip: { x: 0, y: 0, width: vp.viewport.width, height: 90 } })
          }
          if (engineName === 'chromium' && motion === 'no-preference' && ['synergos', 'post6'].includes(name)) {
            const cdp = await context.newCDPSession(page)
            await cdp.send('Performance.enable')
            await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
            row.scroll4x = await scrollMetrics(page, cdp)
            await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
          }
          results.push(row)
          await page.close()
        }
        await context.close()
      }
    }
    await browser.close()
  }
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2))
  for (const r of results) {
    console.log(`\n## ${r.engineName} ${r.vp} ${r.motion} ${r.name}${r.error ? ' ERROR ' + r.error : ''}`)
    if (r.error) continue
    console.log(' supports', JSON.stringify(r.supports), 'sda', r.scrollDriven, 'overflowX', r.overflowX)
    for (const [k, v] of Object.entries(r.groups)) console.log('  ', v, 'x', k)
    if (r.synergosBar) console.log('  synergosBar', JSON.stringify(r.synergosBar), 'header', JSON.stringify(r.header))
    if (r.blogBar) console.log('  blogBar', JSON.stringify(r.blogBar), 'header', JSON.stringify(r.header))
    if (r.scroll4x) console.log('  scroll@4x', JSON.stringify(r.scroll4x))
  }
})()
