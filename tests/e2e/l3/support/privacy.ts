import type { APIResponse, BrowserContext } from '@playwright/test'
import { AUTHOR_PUBLIC_EMAILS } from './helpers'

export type Finding = { url: string; kind: 'dato de visitante' | 'correo' | 'marca privada' | 'estado'; detail: string }

export type ScanReport = { urls: number; responses: number; findings: Finding[] }

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

const PRIVATE_MARKERS = ['data-cw-count', 'data-cw-panel', 'data-cw-message', 'data-cw-comments=']

const EXTRA_PAGES = [
  '/es/blog/catalog',
  '/en/blog/catalog',
  '/es/no-existe',
  '/en/portfolio/999',
  '/es/inbox',
  '/es/inbox/comments',
  '/es/inbox/settings',
  '/es/inbox/setup',
  '/en/inbox',
]

const EXTRA_RESOURCES = [
  '/sitemap.xml',
  '/robots.txt',
  '/api/search-index/es',
  '/api/search-index/en',
  '/api/admin/updates',
  '/api/admin/updates?since=2000-01-01T00:00:00.000Z',
  '/api/contactMe',
  '/api/blog/comments/post1',
  '/api/sockets',
  '/api/customCMS',
  '/api/projects',
]

const CRAWL = ['/es', '/es/blog', '/es/blog/post1', '/en/blog/post1', '/es/contactMe', '/es/privacy', '/es/portfolio/1', '/es/inbox']

const TEXTUAL = /html|x-component|json|xml|text\/plain|javascript/

const STRUCTURED = /html|x-component|json|xml|text\/plain/

export function inspectBody(url: string, contentType: string, body: string, secrets: readonly string[], findings: Finding[]): void {
  for (const secret of secrets) {
    if (body.includes(secret)) findings.push({ url, kind: 'dato de visitante', detail: secret })
  }
  if (STRUCTURED.test(contentType)) {
    for (const [match] of body.matchAll(EMAIL)) {
      if (!AUTHOR_PUBLIC_EMAILS.includes(match.toLowerCase())) findings.push({ url, kind: 'correo', detail: match })
    }
  }
  if (/html|x-component/.test(contentType)) {
    for (const marker of PRIVATE_MARKERS) {
      if (body.includes(marker)) findings.push({ url, kind: 'marca privada', detail: marker })
    }
  }
}

async function bodyOf(response: APIResponse): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

export async function publicPaths(context: BrowserContext): Promise<string[]> {
  const sitemap = await (await context.request.get('/sitemap.xml')).text()
  const fromSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc ?? '/').pathname)
  return [...new Set([...fromSitemap, ...EXTRA_PAGES])]
}

export async function scanPublicSurface(context: BrowserContext, secrets: readonly string[]): Promise<ScanReport> {
  const findings: Finding[] = []
  let responses = 0
  const paths = await publicPaths(context)

  for (const path of paths) {
    for (const headers of [{}, { RSC: '1' }] as Array<Record<string, string>>) {
      const response = await context.request.get(path, { headers })
      responses += 1
      if (response.status() >= 500) findings.push({ url: path, kind: 'estado', detail: String(response.status()) })
      inspectBody(`${path}${'RSC' in headers ? ' (RSC)' : ''}`, response.headers()['content-type'] ?? '', await bodyOf(response), secrets, findings)
    }
  }

  for (const path of EXTRA_RESOURCES) {
    for (const method of ['get', 'post'] as const) {
      if (method === 'post' && !path.startsWith('/api/')) continue
      const response = await context.request[method](path)
      responses += 1
      if (response.status() >= 500) findings.push({ url: path, kind: 'estado', detail: String(response.status()) })
      inspectBody(`${method.toUpperCase()} ${path}`, response.headers()['content-type'] ?? '', await bodyOf(response), secrets, findings)
    }
  }

  const page = await context.newPage()
  const pending: Array<Promise<void>> = []
  page.on('response', (response) => {
    const contentType = response.headers()['content-type'] ?? ''
    if (!TEXTUAL.test(contentType)) return
    pending.push(
      response
        .text()
        .then((body) => {
          responses += 1
          inspectBody(`navegador ${response.url()}`, contentType, body, secrets, findings)
        })
        .catch(() => {}),
    )
  })
  for (const path of CRAWL) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  await page.keyboard.press('Control+k')
  await page.waitForLoadState('networkidle')
  await Promise.all(pending)
  await page.close()

  return { urls: paths.length + EXTRA_RESOURCES.length, responses, findings }
}
