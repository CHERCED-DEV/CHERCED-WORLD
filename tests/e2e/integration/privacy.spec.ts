import { expect, test, type APIRequestContext } from '@playwright/test'
import { publicEmail } from '@/content/site'
import { getProjects, postIds } from '@/lib/content'
import { LANGS, pendingFile, skipIntro } from './support/pages'
import { confidentialityFindings, mentionsEmployer, personalData, pngSize, quantities } from './support/scan'

const PROJECTS = getProjects()
const SENSITIVE_CASES = ['15']
const EMAILS = [publicEmail()?.toLowerCase() ?? ''].filter(Boolean)
const READ_TOOLS = ['search_portfolio', 'get_project', 'list_projects', 'get_experience', 'get_skills', 'list_posts', 'get_cv']
const V1_TOOLS = [...READ_TOOLS, 'set_preferences']
const OPTIONAL_TOOLS = ['draft_contact_message']

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'escaneo de respuestas: no depende del dispositivo')
})

function skipIfPending(file: string, owner: string): void {
  const pending = pendingFile(file, owner)
  test.skip(Boolean(pending), pending ?? '')
}

test.describe('reacciones: la respuesta pública solo trae contadores (FR-482, SC-410)', () => {
  test.beforeEach(() => skipIfPending('app/api/reactions/[postId]/route.ts', 'P5 (T477)'))

  for (const id of postIds()) {
    test(`GET /api/reactions/${id}`, async ({ request }) => {
      const response = await request.get(`/api/reactions/${id}`)
      expect(response.status()).toBe(200)
      const headers = response.headers()
      expect(headers['set-cookie'], 'no deja cookies').toBeUndefined()
      expect(headers['cache-control'] ?? '').toMatch(/public/)
      expect(headers['cache-control'] ?? '').toMatch(/max-age=30\b/)
      const text = await response.text()
      expect(personalData(text), 'sin datos personales').toEqual([])
      const body = JSON.parse(text) as Record<string, unknown>
      expect(Object.keys(body).sort(), 'solo clap, idea y fire (data-model §3)').toEqual(['clap', 'fire', 'idea'])
      for (const [kind, count] of Object.entries(body)) {
        expect(Number.isInteger(count) && (count as number) >= 0, `${kind} es un entero ≥ 0`).toBe(true)
      }
    })
  }

  test('un post que no existe responde 404 sin datos', async ({ request }) => {
    const response = await request.get('/api/reactions/no-existe')
    expect(response.status()).toBe(404)
    expect(personalData(await response.text())).toEqual([])
  })
})

test.describe('/llms.txt: solo información pública (FR-489a)', () => {
  test.beforeEach(() => skipIfPending('app/llms.txt/route.ts', 'P6 (T493)'))

  test('enlaza secciones, casos y posts en ES y EN, sin datos personales ni cifras del empleador', async ({ request }) => {
    const response = await request.get('/llms.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type'] ?? '').toMatch(/^text\/(plain|markdown)/)
    const text = await response.text()
    expect(text.startsWith('# CHERCED-WORLD'), 'empieza con el título de contenido.md §25').toBe(true)
    for (const section of ['/aboutMe', '/services', '/contactMe']) {
      for (const lang of LANGS) expect(text, `${lang}${section}`).toContain(`/${lang}${section})`)
    }
    for (const project of PROJECTS) expect(text, `caso ${project.id}`).toContain(`/en/portfolio/${project.id})`)
    for (const id of postIds()) expect(text, `post ${id}`).toContain(`/en/blog/${id})`)
    expect(personalData(text, EMAILS), 'sin datos personales').toEqual([])
    const employerLines = text.split('\n').filter(mentionsEmployer)
    expect(employerLines.flatMap(quantities), 'sin cantidades junto al empleador (FR-498)').toEqual([])
    const sensitive = text.split('\n').filter((line) => SENSITIVE_CASES.some((id) => line.includes(`/portfolio/${id})`)))
    expect(sensitive.flatMap((line) => quantities(line.replace(/\]\([^)]*\)/g, ']'))), 'Event bridge sin cantidades (FR-444)').toEqual([])
  })
})

type ToolRun = { name: string; description: string; schema: unknown; input: unknown; output: unknown; error: string | null }

test.describe('herramientas WebMCP: se listan, corren con su esquema y solo dan datos públicos (FR-487, FR-488, SC-414)', () => {
  test.beforeEach(() => skipIfPending('lib/agent/webmcp.ts', 'P6 (T490)'))

  for (const lang of LANGS) {
    test(`/${lang} con un modelContext de prueba`, async ({ page }) => {
      test.setTimeout(90_000)
      await skipIntro(page)
      await page.addInitScript(() => {
        type Registered = { name: string; description?: string; inputSchema?: unknown; execute: (input: unknown) => unknown }
        const tools: Registered[] = []
        const api = {
          registerTool(tool: Registered) {
            tools.push(tool)
          },
          provideContext(context: { tools?: Registered[] }) {
            tools.push(...(context.tools ?? []))
          },
          unregisterTool() {},
        }
        ;(window as unknown as { __cwTools: Registered[] }).__cwTools = tools
        Object.defineProperty(document, 'modelContext', { value: api, configurable: true })
      })
      await page.goto(`/${lang}`)
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { __cwTools: unknown[] }).__cwTools.length), { timeout: 30_000, message: 'el adaptador registra las herramientas' })
        .toBeGreaterThanOrEqual(V1_TOOLS.length)

      const runs = await page.evaluate(async (readTools) => {
        type Schema = { type?: string; properties?: Record<string, { type?: string; enum?: unknown[]; minimum?: number }>; required?: string[] }
        type Registered = { name: string; description?: string; inputSchema?: Schema; execute: (input: unknown) => unknown }
        const samples: Record<string, unknown> = { query: 'Synergos', id: '12', limit: 3, technology: 'Angular' }
        const inputFor = (schema: Schema | undefined) => {
          const input: Record<string, unknown> = {}
          for (const key of schema?.required ?? []) {
            const property = schema?.properties?.[key] ?? {}
            input[key] = samples[key] ?? property.enum?.[0] ?? (property.type === 'number' || property.type === 'integer' ? (property.minimum ?? 1) : property.type === 'boolean' ? true : 'Synergos')
          }
          return input
        }
        const tools = (window as unknown as { __cwTools: Registered[] }).__cwTools
        const out: ToolRun[] = []
        for (const tool of tools) {
          const inputs = tool.name === 'get_project' ? [{ id: '12' }, { id: '15' }] : [inputFor(tool.inputSchema)]
          for (const input of readTools.includes(tool.name) ? inputs : [null]) {
            let output: unknown = null
            let error: string | null = null
            if (input !== null) {
              try {
                output = JSON.parse(JSON.stringify(await tool.execute(input)))
              } catch (failure) {
                error = failure instanceof Error ? failure.message : String(failure)
              }
            }
            out.push({ name: tool.name, description: tool.description ?? '', schema: tool.inputSchema ?? null, input, output, error })
          }
        }
        return out
      }, READ_TOOLS)

      const names = [...new Set(runs.map((run) => run.name))].sort()
      expect(names.filter((name) => !OPTIONAL_TOOLS.includes(name)), 'las ocho herramientas de la v1').toEqual([...V1_TOOLS].sort())
      for (const run of runs) {
        expect(run.description.trim(), `${run.name} tiene descripción`).not.toBe('')
        expect((run.schema as { type?: string } | null)?.type, `${run.name} declara un JSON Schema de objeto`).toBe('object')
        if (run.input === null) continue
        expect(run.error, `${run.name}(${JSON.stringify(run.input)}) corre`).toBeNull()
        const text = JSON.stringify(run.output)
        expect(personalData(text, EMAILS), `${run.name}: sin datos personales`).toEqual([])
        expect(confidentialityFindings(run.output, SENSITIVE_CASES), `${run.name}: sin cifras del empleador ni de Event bridge`).toEqual([])
      }
      const cv = JSON.stringify(runs.find((run) => run.name === 'get_cv')?.output ?? '')
      expect(cv, 'get_cv da el enlace de LinkedIn (FR-420, FR-487)').toMatch(/linkedin\.com/)
      expect(cv, 'y el único PDF es el CV oficial del sitio (FR-701 de la 007)').toMatch(/\/cv\/Camilo_Hernandez_CV\.pdf/)
      expect(cv.replaceAll('/cv/Camilo_Hernandez_CV.pdf', '')).not.toMatch(/\.pdf\b/i)

      const tooLong = await page.evaluate(async () => {
        const tools = (window as unknown as { __cwTools: Array<{ name: string; execute: (input: unknown) => unknown }> }).__cwTools
        const search = tools.find((tool) => tool.name === 'search_portfolio')
        try {
          const result = (await search?.execute({ query: 'x'.repeat(101) })) as { isError?: boolean } | undefined
          return result?.isError === true ? 'rechazada' : 'aceptada'
        } catch {
          return 'rechazada'
        }
      })
      expect(tooLong, 'una consulta de 101 caracteres se rechaza con el esquema (FR-488)').toBe('rechazada')
    })
  }
})

const OG_ROUTES: ReadonlyArray<{ section: string; file: string; owner: string }> = [
  { section: '', file: 'app/[lang]/now/page.tsx', owner: 'P1 (T420, el home pasa ogImageFile)' },
  { section: '/aboutMe', file: 'app/[lang]/aboutMe/opengraph-image.tsx', owner: 'P2 (T438)' },
  { section: '/services', file: 'app/[lang]/services/opengraph-image.tsx', owner: 'P3 (T451)' },
  { section: '/portfolio', file: 'app/[lang]/portfolio/opengraph-image.tsx', owner: 'P4 (T463)' },
  { section: '/contactMe', file: 'app/[lang]/contactMe/opengraph-image.tsx', owner: 'P5 (T481)' },
  { section: '/now', file: 'app/[lang]/now/opengraph-image.tsx', owner: 'P1 (T423)' },
  ...PROJECTS.map((project) => ({ section: `/portfolio/${project.id}`, file: 'app/[lang]/portfolio/[id]/opengraph-image.tsx', owner: 'P4 (T463)' })),
]

function metaContent(html: string, property: string): string | null {
  const tag = [...html.matchAll(/<meta\s[^>]*>/g)].map((match) => match[0]).find((item) => item.includes(`property="${property}"`))
  const content = tag?.match(/content="([^"]*)"/)?.[1]
  return content === undefined ? null : content.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'")
}

async function ogOf(request: APIRequestContext, path: string): Promise<{ image: string; alt: string }> {
  const response = await request.get(path)
  expect(response.status(), `${path} responde`).toBe(200)
  const html = await response.text()
  return { image: metaContent(html, 'og:image') ?? '', alt: metaContent(html, 'og:image:alt') ?? '' }
}

test.describe('imágenes OG propias en cada sección y cada caso, en ES y EN (FR-471, SC-408)', () => {
  for (const lang of LANGS) {
    for (const { section, file, owner } of OG_ROUTES) {
      const path = `/${lang}${section}`
      test(`${path}`, async ({ request }) => {
        skipIfPending(file, owner)
        const { image, alt } = await ogOf(request, path)
        const url = new URL(image, 'http://localhost')
        expect(url.pathname, `og:image de ${path} sale de su opengraph-image`).toMatch(new RegExp(`^${path.replaceAll('/', '\\/')}\\/opengraph-image(\\/[\\w-]+)?$`))
        expect(alt.trim(), 'og:image:alt').not.toBe('')
        expect(personalData(alt, EMAILS)).toEqual([])
        if (mentionsEmployer(alt) || SENSITIVE_CASES.some((id) => section === `/portfolio/${id}`)) expect(quantities(alt), `alt de ${path}`).toEqual([])
        const png = await request.get(url.pathname + url.search)
        expect(png.status(), `${url.pathname} responde`).toBe(200)
        expect(png.headers()['content-type']).toBe('image/png')
        expect(pngSize(await png.body()), 'PNG de 1200 × 630').toEqual({ width: 1200, height: 630 })
      })
    }
  }
})
