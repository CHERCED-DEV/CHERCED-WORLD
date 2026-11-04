import { test, type BrowserContext, type Page } from '@playwright/test'

export function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

export async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

export const STUB_HTML =
  '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Sitio embebido</title></head>' +
  '<body style="margin:0;font:16px system-ui;background:#fff;color:#000"><main><h1 id="stub">Sitio de prueba</h1></main></body></html>'

export type ExternalLog = { urls: string[] }

export async function stubExternalSites(context: BrowserContext, mode: 'ok' | 'hang' = 'ok'): Promise<ExternalLog> {
  const log: ExternalLog = { urls: [] }
  await context.route(/^https:\/\/(?!localhost)/, async (route) => {
    log.urls.push(route.request().url())
    if (mode === 'hang') return
    await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: STUB_HTML })
  })
  return log
}

export function hostOf(url: string): string {
  return new URL(url).host
}
