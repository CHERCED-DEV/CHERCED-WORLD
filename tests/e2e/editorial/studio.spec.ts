import { mkdir, symlink, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { startIsolatedServer } from '../l3/support/server'

test('editor privado: entrar, escribir, guardar, recargar, exportar y proteger el contenido', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop-chromium')
  test.setTimeout(120_000)
  const root = path.resolve(__dirname, '../../..')
  const sandbox = info.outputPath('editorial-isolated')
  await mkdir(sandbox, { recursive: true })
  for (const directory of ['.next', 'node_modules', 'public']) await symlink(path.join(root, directory), path.join(sandbox, directory), process.platform === 'win32' ? 'junction' : 'dir')
  await copyFile(path.join(root, 'package.json'), path.join(sandbox, 'package.json'))
  const server = await startIsolatedServer({ cwd: sandbox })
  const context = await browser.newContext({ baseURL: server.baseURL, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
  try {
    await page.goto('/es')
    await expect(page.locator('[data-cw-mailbox]')).toHaveAttribute('href', '/es/inbox')
    await page.locator('[data-cw-mailbox]').click()
    const setup = page.locator('[data-cw-setup]')
    await expect(setup).toHaveAttribute('data-cw-hydrated', '')
    const [, code] = await server.waitForOutput(/Código de configuración inicial: ([A-Z0-9]{4}-[A-Z0-9]{4}) \(vence /)
    await setup.getByLabel('Código de configuración de un solo uso').fill(code!)
    await setup.getByLabel('Nueva contraseña', { exact: true }).fill('Solo-pruebas-editorial-8392')
    await setup.getByLabel('Repite la contraseña').fill('Solo-pruebas-editorial-8392')
    await setup.getByRole('button', { name: 'Crear contraseña' }).click()
    await expect(page.locator('[data-cw-panel]')).toBeVisible()
    await page.locator('[data-cw-panel-header]').getByRole('link', { name: 'Blog', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Taller del blog' })).toBeVisible()
    await page.getByRole('button', { name: 'Nuevo artículo' }).click()
    await page.getByLabel('Título', { exact: true }).fill('Borrador privado de prueba 011')
    await page.getByLabel('Descripción breve').fill('Resumen privado')
    await page.getByLabel('Contenido', { exact: true }).fill('## Mi idea\n\nTexto privado 011\n\n<script>window.editorialUnsafe = true</script>')
    await page.getByRole('button', { name: 'Vista previa', exact: true }).click()
    await expect(page.getByRole('article')).toContainText('<script>')
    expect(await page.evaluate(() => 'editorialUnsafe' in window)).toBe(false)
    await page.getByRole('button', { name: 'Guardar borrador' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Borrador guardado' })).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Borrador privado de prueba 011')
    await expect(page.getByRole('textbox', { name: 'Contenido', exact: true })).toHaveValue(/Texto privado 011/)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exportar para revisión' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/borrador-.*-es\.md$/)
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `panel ${width}`).toBe(true)
    }
    await page.screenshot({ path: info.outputPath('blog-studio-desktop.png'), fullPage: true })
    await page.setViewportSize({ width: 375, height: 844 })
    await page.screenshot({ path: info.outputPath('blog-studio-mobile.png'), fullPage: true })
    const visitor = await browser.newContext({ baseURL: server.baseURL })
    try {
      const anonymous = await visitor.newPage()
      await anonymous.goto('/es/inbox/blog')
      await expect(anonymous.locator('[data-cw-login]')).toBeVisible()
      expect(await anonymous.content()).not.toContain('Texto privado 011')
      expect(await (await anonymous.request.get('/es/blog')).text()).not.toContain('Borrador privado de prueba 011')
    } finally { await visitor.close() }
    await page.goto('/en/inbox/blog')
    await expect(page.getByRole('heading', { name: 'Blog studio' })).toBeVisible()
  } finally { await context.close(); await server.stop() }
})
