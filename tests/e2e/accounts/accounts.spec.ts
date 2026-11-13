import { copyFile, mkdir, symlink } from 'node:fs/promises'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { startIsolatedServer } from '../l3/support/server'

const OWNER_PASSWORD = 'Solo-pruebas-cuentas-017-5531'

async function freshPage(browser: Browser, baseURL: string): Promise<Page> {
  const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
  return page
}

async function localSignIn(page: Page, name: string, email: string, next = '/es/account'): Promise<void> {
  await page.goto(`/es/account?next=${encodeURIComponent(next)}`)
  const form = page.locator('[data-cw-local-signin]')
  await form.getByLabel('Nombre').fill(name)
  await form.getByLabel('Correo de Gmail').fill(email)
  await form.getByRole('button', { name: 'Entrar como esta cuenta' }).click()
}

async function noHorizontalScroll(page: Page, label: string): Promise<void> {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label} a ${width}px`).toBe(true)
  }
  await page.setViewportSize({ width: 1280, height: 900 })
}

test('cuentas: ingreso, equipo con permisos, post invitado aprobado por el autor y comentario con cuenta (spec 017)', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop-chromium')
  test.setTimeout(420_000)
  const root = path.resolve(__dirname, '../../..')
  const sandbox = info.outputPath('accounts-isolated')
  await mkdir(sandbox, { recursive: true })
  for (const directory of ['.next', 'node_modules', 'public']) await symlink(path.join(root, directory), path.join(sandbox, directory), process.platform === 'win32' ? 'junction' : 'dir')
  await copyFile(path.join(root, 'package.json'), path.join(sandbox, 'package.json'))
  const server = await startIsolatedServer({ cwd: sandbox })

  try {
    const owner = await freshPage(browser, server.baseURL)
    await owner.goto('/es')
    await expect(owner.locator('[data-cw-account-link]'), 'FR-1701: botón visible para el visitante').toHaveAttribute('aria-label', 'Ingresar')
    await expect(owner.locator('[data-cw-account-link]')).toHaveAttribute('href', '/es/account')

    await owner.goto('/es/inbox')
    const setup = owner.locator('[data-cw-setup]')
    await expect(setup).toHaveAttribute('data-cw-hydrated', '')
    const [, code] = await server.waitForOutput(/Código de configuración inicial: ([A-Z0-9]{4}-[A-Z0-9]{4}) \(vence /)
    await setup.getByLabel('Código de configuración de un solo uso').fill(code!)
    await setup.getByLabel('Nueva contraseña', { exact: true }).fill(OWNER_PASSWORD)
    await setup.getByLabel('Repite la contraseña').fill(OWNER_PASSWORD)
    await setup.getByRole('button', { name: 'Crear contraseña' }).click()
    await expect(owner.locator('[data-cw-panel]')).toBeVisible()

    await owner.locator('[data-cw-panel-header]').getByRole('link', { name: 'Personas', exact: true }).click()
    await expect(owner.locator('[data-cw-signin-mode="local"]'), 'FR-1703: en local sin base el ingreso es simulado').toBeVisible()
    const grant = owner.locator('[data-cw-grant-form]')
    await expect(grant.getByLabel('Correo de Gmail')).toBeEditable()
    await grant.getByLabel('Correo de Gmail').fill('Ana.Invitada@example.com')
    await grant.getByLabel('Escribir posts (tú decides si se publican)').check()
    await grant.getByRole('button', { name: 'Guardar permisos' }).click()
    await expect(owner.locator('[data-cw-grant="ana.invitada@example.com"]')).toContainText('Escribir posts')
    await noHorizontalScroll(owner, 'Personas')

    const ana = await freshPage(browser, server.baseURL)
    await localSignIn(ana, 'Ana Invitada', 'ana.invitada@example.com')
    await expect(ana.locator('[data-cw-account-page="signed-in"]')).toBeVisible()
    await expect(ana.locator('[data-cw-account-link]'), 'FR-1701: con sesión dice Mi cuenta').toHaveAttribute('aria-label', 'Mi cuenta')
    await noHorizontalScroll(ana, 'Mi cuenta')
    await ana.locator('[data-cw-account-panel]').click()
    await expect(ana).toHaveURL(/\/es\/inbox\/blog$/)
    const tabs = ana.locator('[data-cw-panel-header] nav')
    await expect(tabs.getByRole('link'), 'FR-1707: el equipo ve solo sus pestañas').toHaveText(['Blog'])
    await ana.goto('/es/inbox')
    await expect(ana, 'FR-1707: sin permiso de mensajes vuelve a su pestaña').toHaveURL(/\/es\/inbox\/blog$/)
    await ana.goto('/es/inbox/people')
    await expect(ana).toHaveURL(/\/es\/inbox\/blog$/)

    await expect(ana.locator('[data-cw-guest-note]')).toBeVisible()
    await expect(ana.locator('[data-cw-publish]'), 'FR-1708: el invitado no publica').toHaveCount(0)
    await ana.getByRole('button', { name: 'Nuevo artículo' }).click()
    await ana.getByLabel('Título', { exact: true }).fill('Un post invitado de prueba 017')
    await ana.getByLabel('Descripción breve').fill('Resumen del invitado')
    await ana.getByRole('textbox', { name: 'Contenido', exact: true }).fill('## Idea\n\nTexto escrito por Ana 017')
    await ana.getByRole('button', { name: 'Enviar a revisión' }).click()
    await expect(ana.locator('[data-cw-blog-studio]').getByRole('status')).toHaveText('Enviado a revisión. El autor decide si se publica.')

    await owner.goto('/es/inbox/blog')
    const item = owner.locator('[data-cw-blog-studio] button').filter({ hasText: 'Un post invitado de prueba 017' })
    await expect(item.locator('[data-cw-draft-review]')).toHaveText('En revisión')
    await expect(item).toContainText('Ana Invitada')
    await item.click()
    await expect(owner.locator('[data-cw-draft-author]')).toContainText('Escrito por Ana Invitada')
    await owner.locator('[data-cw-publish]').click()
    await expect(owner.locator('[data-cw-blog-studio]').getByRole('status')).toContainText('Publicado en el blog.')
    await expect(item.locator('[data-cw-draft-review]'), 'publicar cierra la revisión').toHaveCount(0)
    const postHref = await owner.locator('[data-cw-published-link] a').getAttribute('href')
    expect(postHref).toMatch(/^\/es\/blog\/p-/)

    const luis = await freshPage(browser, server.baseURL)
    await luis.goto(postHref!)
    await expect(luis.getByText('Por Ana Invitada'), 'FR-1708: el post sale firmado por el invitado').toBeVisible()
    await expect(luis.locator('[data-cw-author-box]'), 'el recuadro del autor no se muestra en un post invitado').toHaveCount(0)

    await localSignIn(luis, 'Luis Lector', 'luis.lector@example.com', postHref!)
    await expect(luis).toHaveURL(postHref!)
    const dialog = luis.getByRole('dialog')
    await expect(async () => {
      await luis.locator('[data-cw-comment-open]').click()
      await expect(dialog).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 15_000 })
    const openedAt = Date.now()
    await expect(dialog.locator('[data-cw-comment-account]'), 'FR-1705: comenta con su cuenta').toHaveText('Comentas como Luis Lector, con tu cuenta de Google.')
    await expect(dialog.getByLabel('Tu nombre')).toHaveCount(0)
    await dialog.getByLabel('Tu comentario').fill('Comentario con cuenta 017')
    await dialog.getByRole('checkbox').check()
    await luis.waitForTimeout(Math.max(0, 3500 - (Date.now() - openedAt)))
    await dialog.getByRole('button', { name: 'Enviar' }).click()
    await expect(dialog.locator('[data-cw-comment-status="success"]')).toBeVisible({ timeout: 15_000 })

    await owner.goto('/es/inbox/comments')
    const comment = owner.locator('[data-cw-comment]').filter({ hasText: 'Comentario con cuenta 017' })
    await expect(comment).toContainText('Luis Lector')
    await expect(comment.locator('[data-cw-comment-account]')).toHaveText('Con cuenta de Google')

    await luis.goto('/es/account')
    await luis.locator('summary', { hasText: 'Borrar mi cuenta' }).click()
    await luis.locator('[data-cw-account-delete]').click()
    await expect(luis.locator('[data-cw-account-notice="ok"]'), 'FR-1704: borrar la cuenta').toHaveText('Tu cuenta y tus comentarios se borraron.')
    await owner.goto('/es/inbox/comments')
    await expect(owner.locator('[data-cw-comment]').filter({ hasText: 'Comentario con cuenta 017' }), 'sus comentarios se van con la cuenta').toHaveCount(0)

    await owner.goto('/es/inbox/people')
    const account = owner.locator('[data-cw-account="ana.invitada@example.com"]')
    await account.locator('[data-cw-action="block"]').click()
    await expect(account).toContainText('Bloqueada')
    await ana.goto('/es/inbox/blog')
    await expect(ana.locator('[data-cw-login]'), 'FR-1710: bloquear cierra sus sesiones').toBeVisible()

    await owner.setViewportSize({ width: 375, height: 844 })
    await owner.goto('/es/account')
    await owner.screenshot({ path: info.outputPath('account-mobile.png'), fullPage: true })
  } finally {
    await server.stop()
  }
})
