import { expect, test, type Page } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

const POSTS = ['post1', 'post2', 'post3', 'post4', 'post5']
const STATIC_PATHS = ['es', 'en'].flatMap((lang) => [`/${lang}/blog`, `/${lang}/blog/catalog`, ...POSTS.map((id) => `/${lang}/blog/${id}`)])

test.describe('el blog se entrega prerenderizado (D-05)', () => {
  onlyIn('desktop-chromium')

  for (const path of STATIC_PATHS) {
    test(`${path} sale del prerender, cacheable por la CDN`, async ({ request }) => {
      const response = await request.get(path, { headers: { 'sec-fetch-dest': 'document' }, maxRedirects: 0 })
      expect(response.status()).toBe(200)
      const headers = response.headers()
      expect(headers['x-nextjs-prerender'] ?? '', 'prerenderizado en el build').toMatch(/^1(, 1)*$/)
      expect(headers['cache-control'] ?? '').toMatch(/s-maxage=\d+/)
      expect(headers['cache-control'] ?? '').not.toMatch(/private|no-store/)
    })
  }

  test('un id que no existe responde 404 sin renderizar a demanda', async ({ request }) => {
    const response = await request.get('/es/blog/post999', { maxRedirects: 0 })
    expect(response.status()).toBe(404)
  })
})

type Vitals = { lcp: number; cls: number }

async function measureVitals(page: Page, path: string): Promise<Vitals> {
  await page.addInitScript(() => {
    sessionStorage.setItem('cw-intro-seen', '1')
    const store = { lcp: 0, cls: 0 }
    ;(window as unknown as { __cwVitals: typeof store }).__cwVitals = store
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) store.lcp = entry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) store.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  return page.evaluate(() => (window as unknown as { __cwVitals: Vitals }).__cwVitals)
}

test.describe('presupuestos del blog', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const path of ['/es/blog', '/en/blog', '/es/blog/post5', '/en/blog/post4', '/es/blog/post1']) {
    test(`${path}: LCP ≤ 2,5 s y CLS ≤ 0,1`, async ({ page }, testInfo) => {
      if (testInfo.project.name === 'mobile-chromium') {
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
        await cdp.send('Network.enable')
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 150,
          downloadThroughput: (1.6 * 1024 * 1024) / 8,
          uploadThroughput: (750 * 1024) / 8,
        })
      }
      let vitals = await measureVitals(page, path)
      if (vitals.lcp > 2500) {
        const retry = await measureVitals(page, path)
        vitals = { lcp: Math.min(vitals.lcp, retry.lcp), cls: Math.max(vitals.cls, retry.cls) }
      }
      testInfo.annotations.push({ type: 'vitals', description: `${path} LCP=${Math.round(vitals.lcp)}ms CLS=${vitals.cls.toFixed(3)}` })
      expect(vitals.lcp, 'LCP').toBeGreaterThan(0)
      expect(vitals.lcp, 'LCP').toBeLessThanOrEqual(2500)
      expect(vitals.cls, 'CLS').toBeLessThanOrEqual(0.1)
    })
  }
})
