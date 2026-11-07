import { expect, test } from '@playwright/test'
import commonEn from '@/content/i18n/en/common.json'
import { getProjects, postIds } from '@/lib/content'
import { onlyIn } from './support'

onlyIn('desktop-chromium')

test('/llms.txt es texto estático, sin redirigir a un idioma, con la estructura de §25 (FR-489a)', async ({ request }) => {
  const response = await request.get('/llms.txt', { maxRedirects: 0 })
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('text/plain; charset=utf-8')
  expect(response.headers()['set-cookie']).toBeUndefined()
  const text = await response.text()
  expect(text.split('\n').slice(0, 3)).toEqual(['# CHERCED-WORLD', '', `> ${commonEn['meta.description']}`])
  expect(text.match(/^## .+$/gm)).toEqual(['## About', '## CV', '## Services', '## Case studies', '## Blog', '## Contact'])
  for (const lang of ['es', 'en']) expect(text).toMatch(new RegExp(`\\(https?://[^/)]+/cv/camilo-hernandez-cv-${lang}\\.pdf\\)`))
  for (const project of getProjects()) expect(text).toContain(`/en/portfolio/${project.id}): `)
  for (const id of postIds()) expect(text).toContain(`/en/blog/${id}): `)
  for (const lang of ['es', 'en']) for (const path of ['aboutMe', 'services', 'contactMe']) expect(text).toContain(`/${lang}/${path})`)
  expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
})
