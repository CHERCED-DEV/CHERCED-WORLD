import { expect, test } from '@playwright/test'
import { onlyIn, open, PAGES, scrollThrough, textHits } from './support'

test.describe('E1 y T1: cero texto justificado y sin guionado automático en ninguna página (010)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of ['es', 'en'] as const) {
    for (const { name, path } of PAGES) {
      test(`/${lang}${path} (${name})`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === 'no-js' && lang === 'en', 'sin JS basta con español: el CSS es el mismo')
        await open(page, `/${lang}${path}`)
        await scrollThrough(page)
        const justified = await textHits(page, 'justify')
        expect(justified.map((hit) => `${hit.where} "${hit.text}"`), 'texto justificado').toEqual([])
        const hyphenated = await textHits(page, 'hyphens')
        expect(hyphenated.map((hit) => `${hit.where} "${hit.text}"`), 'hyphens: auto').toEqual([])
      })
    }
  }
})
