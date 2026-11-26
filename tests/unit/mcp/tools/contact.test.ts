import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { callTool, ORIGIN, textOf } from '../support/rpc'
import { portfolioSetup } from '../support/setup'

const { portfolioMcp } = await import('@/lib/mcp/servers/portafolio')
beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const { contactOutput } = await import('@/lib/mcp/servers/portafolio/tools/contact')
const { publicEmail } = await import('@/lib/search/build-index')
const { getSite } = await import('@/lib/content')

describe('get_contact_options (FR-4404)', () => {
  it('trae Contacto, el correo público, los perfiles públicos y los dos CV en PDF', async () => {
    for (const lang of ['es', 'en'] as const) {
      const result = await callTool(portfolioMcp, 'get_contact_options', { lang })
      const output = contactOutput.parse(result.structuredContent)
      expect(output.contact.url).toBe(`${ORIGIN}/${lang}/contactMe`)
      expect(output.contact.email).toBe(publicEmail(getSite()))
      expect(output.profiles.some((profile) => /linkedin\.com/.test(profile.url))).toBe(true)
      expect(output.profiles.every((profile) => profile.id !== 'email')).toBe(true)
      expect(output.cv.pdfs.map((pdf) => pdf.lang).sort()).toEqual(['en', 'es'])
      for (const pdf of output.cv.pdfs) {
        expect(pdf.url.startsWith(`${ORIGIN}/`)).toBe(true)
        expect(existsSync(join(process.cwd(), 'public', new URL(pdf.url).pathname)), pdf.url).toBe(true)
      }
      expect(output.sources[0]!.url).toBe(`${ORIGIN}/${lang}/contactMe`)
      expect(textOf(result)).toContain(output.contact.email!)
    }
  })
})