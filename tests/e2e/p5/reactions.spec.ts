import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { AUTHOR_PUBLIC_EMAILS, onlyIn, uniqueIp, useIp } from '../l3/support/helpers'

type Counts = { clap: number; idea: number; fire: number }

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

async function counts(request: APIRequestContext, postId: string): Promise<Counts> {
  const response = await request.get(`/api/reactions/${postId}`)
  expect(response.status()).toBe(200)
  return (await response.json()) as Counts
}

async function openPost(page: Page, path: string) {
  await page.goto(path)
  const group = page.locator('[data-cw-reactions]')
  await expect(group).toHaveAttribute('data-cw-reactions', 'ready')
  return group
}

function reactionButton(page: Page, kind: 'clap' | 'idea' | 'fire') {
  return page.locator(`[data-cw-reaction="${kind}"]`)
}

test.describe('reacciones con JavaScript (FR-482, US9)', () => {
  onlyIn('desktop-chromium')

  test('un clic suma y marca; un segundo clic quita; se recuerda al volver', async ({ page, request }) => {
    await useIp(page)
    const before = await counts(request, 'post2')
    await openPost(page, '/es/blog/post2')
    const clap = reactionButton(page, 'clap')
    await expect(clap).toHaveAttribute('aria-pressed', 'false')
    await expect(clap).toHaveAccessibleName(`Aplausos: ${before.clap}`)

    await clap.click()
    await expect(clap).toHaveAttribute('aria-pressed', 'true')
    await expect(clap).toHaveAccessibleName(`Aplausos: ${before.clap + 1}`)
    expect((await counts(request, 'post2')).clap).toBe(before.clap + 1)
    expect(await page.evaluate(() => localStorage.getItem('cw-reactions:post2'))).toBe('clap')

    await page.reload()
    await expect(page.locator('[data-cw-reactions]')).toHaveAttribute('data-cw-reactions', 'ready')
    await expect(reactionButton(page, 'clap')).toHaveAttribute('aria-pressed', 'true')

    await reactionButton(page, 'clap').click()
    await expect(reactionButton(page, 'clap')).toHaveAttribute('aria-pressed', 'false')
    await expect(reactionButton(page, 'clap')).toHaveAccessibleName(`Aplausos: ${before.clap}`)
    expect((await counts(request, 'post2')).clap).toBe(before.clap)
    expect(await page.evaluate(() => localStorage.getItem('cw-reactions:post2'))).toBeNull()
  })

  test('funciona con teclado y en inglés', async ({ page, request }) => {
    await useIp(page)
    const before = await counts(request, 'post3')
    await openPost(page, '/en/blog/post3')
    const idea = reactionButton(page, 'idea')
    await expect(idea).toHaveAccessibleName(`Gave me an idea: ${before.idea}`)
    await idea.focus()
    await page.keyboard.press('Enter')
    await expect(idea).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Space')
    await expect(idea).toHaveAttribute('aria-pressed', 'false')
    expect((await counts(request, 'post3')).idea).toBe(before.idea)
  })

  test('50 clics seguidos desde la misma IP no pasan del límite y avisan con amabilidad (SC-410)', async ({ page, request }) => {
    test.setTimeout(120_000)
    await useIp(page, uniqueIp())
    const before = await counts(request, 'post4')
    await openPost(page, '/es/blog/post4')
    const fire = reactionButton(page, 'fire')
    const answers: string[] = []
    await page.route('**/es/blog/post4', async (route) => {
      const sent = route.request()
      if (sent.method() !== 'POST' || !sent.headers()['next-action']) return route.fallback()
      const response = await route.fetch()
      const body = await response.text()
      answers.push(body)
      return route.fulfill({ response, body })
    })
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => localStorage.removeItem('cw-reactions:post4'))
      await expect(fire).toBeEnabled()
      await fire.click()
      await expect.poll(() => answers.length).toBe(i + 1)
    }
    await expect(fire).toBeEnabled()
    await expect(page.locator('[data-cw-reactions-notice="rateLimited"]')).toHaveText(
      'Reaccionaste varias veces seguidas. Intenta de nuevo en unos minutos.',
    )
    expect(answers.filter((body) => body.includes('{"ok":true'))).toHaveLength(10)
    expect(answers.filter((body) => body.includes('"error":"rate_limited"'))).toHaveLength(40)
    expect((await counts(request, 'post4')).fire).toBe(before.fire + 10)
  })

  test('la respuesta pública y la de la acción solo traen contadores, sin datos personales (SC-410)', async ({ page }) => {
    const ip = await useIp(page)
    const bodies: string[] = []
    await page.route('**/es/blog/post5', async (route) => {
      const request = route.request()
      if (request.method() !== 'POST' || !request.headers()['next-action']) return route.fallback()
      const response = await route.fetch()
      const body = await response.text()
      bodies.push(body)
      return route.fulfill({ response, body })
    })
    const publicBodies: string[] = []
    page.on('response', async (response) => {
      if (response.url().includes('/api/reactions/')) publicBodies.push(await response.text().catch(() => ''))
    })
    await openPost(page, '/es/blog/post5')
    await reactionButton(page, 'idea').click()
    await expect(reactionButton(page, 'idea')).toHaveAttribute('aria-pressed', 'true')
    await reactionButton(page, 'idea').click()
    await expect(reactionButton(page, 'idea')).toHaveAttribute('aria-pressed', 'false')

    expect(bodies).toHaveLength(2)
    for (const body of [...bodies, ...publicBodies]) {
      expect(body).not.toContain(ip)
      expect([...body.matchAll(EMAIL)].map(([match]) => match).filter((email) => !AUTHOR_PUBLIC_EMAILS.includes(email.toLowerCase()))).toEqual([])
      expect(body).not.toMatch(/[0-9a-f]{64}/)
    }
    const action = bodies.map((body) => /\{"ok":true,"data":\{"counts":(\{[^}]*\})\}\}/.exec(body)?.[1] ?? '')
    for (const json of action) expect(Object.keys(JSON.parse(json) as Counts).sort()).toEqual(['clap', 'fire', 'idea'])
    expect(publicBodies.length).toBeGreaterThan(0)
    for (const json of publicBodies) expect(Object.keys(JSON.parse(json) as Counts).sort()).toEqual(['clap', 'fire', 'idea'])
  })

  test('si la base no responde, los botones se deshabilitan con un aviso y el post se lee completo', async ({ page }) => {
    await page.route('**/api/reactions/post1', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' }))
    await page.goto('/es/blog/post1')
    const group = page.locator('[data-cw-reactions]')
    await expect(group).toHaveAttribute('data-cw-reactions', 'unavailable')
    await expect(page.locator('[data-cw-reactions-notice="unavailable"]')).toHaveText('Las reacciones no están disponibles en este momento.')
    for (const kind of ['clap', 'idea', 'fire'] as const) await expect(reactionButton(page, kind)).toBeDisabled()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-cw-comment-open]')).toBeEnabled()
  })
})

test.describe('reacciones sin JavaScript', () => {
  onlyIn('no-js')

  test('no se muestran, y el post y los comentarios se leen igual', async ({ page }) => {
    await page.goto('/es/blog/post1')
    await expect(page.locator('[data-cw-reactions]')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('#cw-comments')).toBeVisible()
  })
})
