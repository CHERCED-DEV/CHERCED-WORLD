const path = require('path')
const fs = require('fs')
const { chromium, webkit } = require('playwright')

const BASE = process.argv[2]
if (!BASE) throw new Error('Uso: node probar-candidatos.js <url-de-la-vista-previa> [e1|c1|c2|c4|e5|all]')
const OUT = path.resolve(__dirname, '../../../../test-results/013/candidatos')
fs.mkdirSync(OUT, { recursive: true })
const ONLY = process.argv[3] || 'all'

const VP = {
  375: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  1440: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
}

const log = (...a) => console.log(a.join(' '))

async function open(browser, vp, url, motion = 'no-preference') {
  const context = await browser.newContext({ ...VP[vp], reducedMotion: motion, colorScheme: 'dark' })
  await context.addInitScript(() => { try { sessionStorage.setItem('cw-intro-seen', '1'); localStorage.setItem('cw-intro-seen', '1') } catch {} })
  const page = await context.newPage()
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(2500)
  return { context, page }
}

async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.waitForTimeout(60)
}

async function walk(page, step, fn) {
  let y = 0
  for (let i = 0; i < 200; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
    await settle(page)
    await fn(y)
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    if (y >= max) break
    y = Math.min(y + step, max)
  }
}

async function heights(browser) {
  log('\n# E1 altura real (recorrida paso a paso)')
  for (const vp of [375, 1440]) {
    for (const url of ['/es/aboutMe', '/es/synergos/arquitectura', '/es/synergos', '/es/blog/post6', '/es/services', '/es/portfolio/13']) {
      const { context, page } = await open(browser, vp, url)
      const before = await page.evaluate(() => document.documentElement.scrollHeight)
      await walk(page, 700, async () => {})
      const after = await page.evaluate(() => document.documentElement.scrollHeight)
      log(`  ${vp} ${url}: al cargar ${before} px, tras recorrerla ${after} px`)
      await context.close()
    }
  }
}

const C1_CSS = `
  body { timeline-scope: --p-who, --p-career, --p-knowledge, --p-heading; }
  [data-cw-scene="who"] { view-timeline: --p-who block; view-timeline-inset: var(--probe-inset) 0; }
  [data-cw-scene="career"] { view-timeline: --p-career block; view-timeline-inset: var(--probe-inset) 0; }
  [data-cw-scene="knowledge"] { view-timeline: --p-knowledge block; view-timeline-inset: var(--probe-inset) 0; }
  [data-cw-scene="heading"] { view-timeline: --p-heading block; view-timeline-inset: var(--probe-inset) 0; }
  .probe-c1 { position: fixed; left: 0; width: 4px; height: 4px; top: 0; pointer-events: none; animation: probe-c1 linear both; animation-range: exit-crossing 0% exit-crossing 100%; }
  #probe-who { animation-timeline: --p-who; } #probe-career { animation-timeline: --p-career; }
  #probe-knowledge { animation-timeline: --p-knowledge; } #probe-heading { animation-timeline: --p-heading; }
  @keyframes probe-c1 { from { scale: 0 1; } to { scale: 1 1; } }`

async function c1(browser, engineName) {
  log(`\n# E2 C1 en ${engineName}: view-timeline por escena + exit-crossing`)
  for (const vp of [375, 1440]) {
    for (const inset of ['auto', 'var(--probe-explicit)']) {
      const { context, page } = await open(browser, vp, '/es/aboutMe')
      const pad = await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop)
      await page.addStyleTag({ content: C1_CSS.replaceAll('var(--probe-inset)', inset) + `:root { --probe-explicit: ${pad}; }` })
      await page.evaluate(() => {
        for (const id of ['who', 'career', 'knowledge', 'heading']) {
          const d = document.createElement('div'); d.className = 'probe-c1'; d.id = `probe-${id}`; document.body.append(d)
        }
      })
      const scenes = await page.evaluate(() => [...document.querySelectorAll('[data-cw-scene]')].map((s) => s.getAttribute('data-cw-scene')))
      const errs = { pad: 0, zero: 0 }
      let lastFinal = null
      let samples = 0
      await walk(page, 300, async () => {
        const rows = await page.evaluate(() => {
          const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
          return ['who', 'career', 'knowledge', 'heading'].map((id) => {
            const scene = document.querySelector(`[data-cw-scene="${id}"]`)
            const probe = document.getElementById(`probe-${id}`)
            const anim = probe.getAnimations()[0]
            const r = scene.getBoundingClientRect()
            const p = anim ? anim.effect.getComputedTiming().progress : null
            const exp = (I) => Math.min(1, Math.max(0, (I - r.top) / r.height))
            const css = getComputedStyle(probe).scale
            return { id, p: p === null ? null : Number(p), css, expPad: exp(pad), expZero: exp(0) }
          })
        })
        samples++
        for (const r of rows) {
          if (r.p === null || Number.isNaN(r.p)) continue
          errs.pad = Math.max(errs.pad, Math.abs(r.p - r.expPad))
          errs.zero = Math.max(errs.zero, Math.abs(r.p - r.expZero))
        }
        lastFinal = rows
      })
      log(`  ${vp} inset=${inset} (scroll-padding-top=${pad}) escenas=${scenes.join(',')} muestras=${samples}`)
      log(`    error máx. frente a inset=scroll-padding: ${errs.pad.toFixed(3)} · frente a inset=0: ${errs.zero.toFixed(3)}`)
      log(`    al final de la página: ${lastFinal.map((r) => `${r.id}=${r.p === null ? 'sin animación' : r.p.toFixed(2)}`).join(' ')}`)
      await context.close()
    }
  }
}

const C2_CSS = `
  [class*="slideMedia"] { animation: probe-c2 linear both; animation-timeline: view(inline); animation-range: cover 0% cover 100%; }
  @keyframes probe-c2 { 0%, 100% { opacity: 0.55; scale: 0.92; } 35%, 65% { opacity: 1; scale: 1; } }`

async function c2(browser, engineName) {
  log(`\n# E3 C2 en ${engineName}: view(inline) en la imagen del carrusel, 375`)
  const { context, page } = await open(browser, 375, '/es/portfolio')
  await page.addStyleTag({ content: C2_CSS })
  await page.evaluate(() => {
    const track = [...document.querySelectorAll('*')].find((el) => /x/.test(getComputedStyle(el).scrollSnapType) && el.scrollWidth > el.clientWidth)
    if (track) track.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  await settle(page)
  const info = await page.evaluate(() => {
    const track = [...document.querySelectorAll('*')].find((el) => /x/.test(getComputedStyle(el).scrollSnapType) && el.scrollWidth > el.clientWidth)
    if (!track) return { error: 'sin pista con snap x' }
    track.setAttribute('data-probe-track', '')
    const media = [...document.querySelectorAll('[class*="slideMedia"]')]
    const first = media[0]
    const chain = []
    for (let n = first && first.parentElement; n && n !== track; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') chain.push(`${String(n.className).split(' ')[0].replace(/^_?[A-Za-z0-9-]{6}_/, '')}:${cs.overflowX}/${cs.overflowY}`)
    }
    const slide = track.children[0].getBoundingClientRect()
    const t = track.getBoundingClientRect()
    const anims = media.map((m) => m.getAnimations().find((a) => a.timeline && a.timeline.constructor.name === 'ViewTimeline'))
    const sources = anims.map((a) => (a ? (a.timeline.source === track ? 'track' : a.timeline.source ? a.timeline.source.tagName : 'none') : 'sin animación'))
    return { media: media.length, slideW: Math.round(slide.width), trackW: Math.round(t.width), firstLeft: Math.round(slide.left - t.left), overflowChain: chain, sources: [...new Set(sources)] }
  })
  log('  ', JSON.stringify(info))
  const read = () => page.evaluate(() => {
    const track = document.querySelector('[data-probe-track]')
    const t = track.getBoundingClientRect()
    return [...document.querySelectorAll('[class*="slideMedia"]')].slice(0, 3).map((m) => {
      const a = m.getAnimations().find((x) => x.timeline && x.timeline.constructor.name === 'ViewTimeline')
      const r = m.getBoundingClientRect()
      return { visible: Math.round(Math.max(0, Math.min(r.right, t.right) - Math.max(r.left, t.left))), p: a ? Number(a.effect.getComputedTiming().progress.toFixed(2)) : null, opacity: getComputedStyle(m).opacity, scale: getComputedStyle(m).scale }
    })
  })
  const slideW = info.slideW || 375
  for (const [label, x] of [['en reposo', 0], ['a media pasada', Math.round(slideW / 2)], ['en la siguiente', slideW]]) {
    await page.evaluate((x) => { const tr = document.querySelector('[data-probe-track]'); tr.style.scrollSnapType = 'none'; tr.scrollTo({ left: x, behavior: 'instant' }) }, x)
    await settle(page)
    log(`   ${label} (scrollLeft=${x}):`, JSON.stringify(await read()))
    if (label === 'a media pasada') {
      const box = await page.evaluate(() => { const r = document.querySelector('[data-probe-track]').getBoundingClientRect(); return { y: Math.max(0, r.top), h: Math.min(r.height, innerHeight) } })
      if (box.h > 0 && box.y < 812) await page.screenshot({ path: path.join(OUT, `${engineName}-375-c2-media-pasada.png`), clip: { x: 0, y: box.y, width: 375, height: Math.min(box.h, 812 - box.y) } })
    }
  }
  await context.close()
}

const C4_CSS = `
  [data-cw-heading-map] > ol::before { transform-origin: 50% 0; animation: probe-c4y linear both; animation-timeline: view(); animation-range: entry 20% cover 45%; }
  [data-cw-heading-map] > ol > li::before { transform-origin: 0 50%; animation: probe-c4x linear both; animation-timeline: view(); animation-range: entry 20% cover 45%; }
  @keyframes probe-c4y { from { scale: 1 0; } to { scale: 1 1; } }
  @keyframes probe-c4x { from { scale: 0 1; } to { scale: 1 1; } }`

async function c4(browser, engineName) {
  log(`\n# E4 C4 en ${engineName}: columna y conectores de la ruta`)
  for (const vp of [375, 1440]) {
    const { context, page } = await open(browser, vp, '/es/aboutMe')
    await walk(page, 700, async () => {})
    await page.addStyleTag({ content: C4_CSS })
    const top = await page.evaluate(() => document.querySelector('[data-cw-heading-map]').getBoundingClientRect().top + scrollY)
    for (const f of [0.95, 0.75, 0.55, 0.35]) {
      await page.evaluate(({ top, f }) => window.scrollTo({ top: top - innerHeight * f, behavior: 'instant' }), { top, f })
      await settle(page)
      const s = await page.evaluate(() => {
        const ol = document.querySelector('[data-cw-heading-map] > ol')
        const spine = ol.getAnimations({ subtree: true }).filter((a) => a.effect.pseudoElement === '::before')
        return spine.map((a) => Number(a.effect.getComputedTiming().progress.toFixed(2)))
      })
      log(`  ${vp} mapa a ${Math.round(f * 100)} % de la ventana: progreso [columna, conectores…] = ${JSON.stringify(s)}`)
      if (f === 0.55) await page.screenshot({ path: path.join(OUT, `${engineName}-${vp}-c4-55.png`) })
    }
    await context.close()
  }
}

async function fr650(browser, engineName) {
  log(`\n# E5 ¿FR-650 atrapa una scroll-driven sin guarda? (${engineName}, 375, reduce)`)
  const { context, page } = await open(browser, 375, '/es/aboutMe', 'reduce')
  await page.addStyleTag({ content: `#trap650 { position: fixed; left: 0; bottom: 0; width: 60px; height: 4px; background: red; transform-origin: 0 50%; animation: trap650 linear both; animation-timeline: scroll(root block); } @keyframes trap650 { from { transform: scaleX(0); } to { transform: scaleX(1); } }` })
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'trap650'; document.body.append(d) })
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }))
  await settle(page)
  const r = await page.evaluate(() => {
    const anims = document.getAnimations().filter((a) => a.timeline && a.timeline.constructor.name !== 'DocumentTimeline')
    return anims.map((a) => {
      const t = a.effect.getComputedTiming()
      const ad = t.activeDuration
      return { target: a.effect.target.id || a.effect.target.tagName, playState: a.playState, activeDuration: typeof ad === 'object' && ad !== null ? `${ad.constructor.name}(${ad.toString()})` : String(ad), countedByFR650: a.playState === 'running' && (ad ?? 0) !== 0 }
    })
  })
  log('  ', JSON.stringify(r))
  await context.close()
}

;(async () => {
  for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    if ((ONLY === 'all' || ONLY === 'e1') && engineName === 'chromium') await heights(browser)
    if (ONLY === 'all' || ONLY === 'c1') await c1(browser, engineName)
    if (ONLY === 'all' || ONLY === 'c2') await c2(browser, engineName)
    if (ONLY === 'all' || ONLY === 'c4') await c4(browser, engineName)
    if (ONLY === 'all' || ONLY === 'e5') await fr650(browser, engineName)
    await browser.close()
  }
})()
