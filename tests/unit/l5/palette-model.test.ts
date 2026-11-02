import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('./support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { getDictionary } = await import('@/lib/i18n/server')
const { tokenize } = await import('@/lib/search/text')
const model = await import('@/components/experience/palette-model')
const { CAPSULE_SHOTS, capsuleShotSrc } = await import('@/components/experience/capsule-shots')

const GENERIC = new Set(['the', 'my', 'and', 'with', 'system', 'website', 'web', 'world', 'club', 'shop', 'done', 'mi', 'el', 'la', 'de', 'y'])

async function setup(lang: 'es' | 'en', context = { theme: 'dark' as const, email: 'a@b.co', capsuleFound: false }) {
  const [index, labels] = await Promise.all([buildSearchIndex(lang), getDictionary(lang, 'experience')])
  const docs = model.toPaletteDocs(index.docs, model.buildActions(labels, context))
  return { index, labels, docs, searcher: model.createPaletteSearcher(docs) }
}

function shortQueries(title: string): string[] {
  const words = tokenize(title).filter((word) => !GENERIC.has(word))
  const candidates = (words.length > 0 ? words : tokenize(title)).flatMap((word) => [word.slice(0, 2), word.slice(0, 3)])
  return [...new Set(candidates.filter((query) => query.length > 0))]
}

describe('comando secreto', () => {
  it('reconoce 2023 y el commit legendario, con o sin tildes y letras de más', () => {
    for (const query of ['2023', ' 2023 ', 'enecimo intento', 'Enécimo intentooooo! vida mk', 'enésimo intento']) {
      expect(model.isCapsuleCommand(query), query).toBe(true)
    }
    for (const query of ['', '202', '20233', 'blog', 'intento', 'capsula']) {
      expect(model.isCapsuleCommand(query), query).toBe(false)
    }
  })

  it('devuelve una única opción secreta', async () => {
    const { docs, searcher } = await setup('es')
    const items = model.paletteResults('2023', docs, searcher, 'Abrir')
    expect(items).toEqual([{ id: 'secret:capsule', group: 'secret', title: 'Abrir', command: { type: 'capsule' } }])
  })
})

describe('acciones', () => {
  it('ofrece el tema contrario, idioma, asistente y copiar correo', async () => {
    const { labels } = await setup('es')
    const actions = model.buildActions(labels, { theme: 'dark', email: 'x@y.co', capsuleFound: false })
    expect(actions.map((action) => action.command.type)).toEqual(['theme', 'lang', 'assistant', 'copy-email'])
    expect(actions[0]?.command).toEqual({ type: 'theme', to: 'light' })
    const light = model.buildActions(labels, { theme: 'light', email: null, capsuleFound: true })
    expect(light.map((action) => action.command.type)).toEqual(['theme', 'lang', 'assistant', 'capsule'])
    expect(light[0]?.command).toEqual({ type: 'theme', to: 'dark' })
  })

  it('sin búsqueda muestra páginas y acciones; con búsqueda encuentra acciones por sinónimo', async () => {
    const { docs, searcher } = await setup('es')
    const empty = model.paletteResults('', docs, searcher, 's')
    expect(new Set(empty.map((item) => item.group))).toEqual(new Set(['pages', 'actions']))
    expect(model.paletteResults('theme', docs, searcher, 's')[0]?.command.type).toBe('theme')
    expect(model.paletteResults('correo', docs, searcher, 's').some((item) => item.command.type === 'copy-email')).toBe(true)
  })

  it('agrupa empezando por el grupo del mejor resultado', async () => {
    const { docs, searcher } = await setup('es')
    const items = model.paletteResults('blog', docs, searcher, 's')
    const groups = model.groupItems(items)
    expect(groups[0]?.items[0]?.id).toBe('page:blog')
    expect(groups.flatMap((group) => group.items)).toHaveLength(items.length)
  })
})

describe.each(['es', 'en'] as const)('SC-013: todo se alcanza con 5 pulsaciones o menos (%s)', (lang) => {
  it('cada página, proyecto y post queda primero con 3 letras, o segundo con 2', async () => {
    const { docs, searcher } = await setup(lang)
    const targets = docs.filter((doc) => ['pages', 'projects', 'posts'].includes(doc.item.group))
    const misses: string[] = []
    for (const target of targets) {
      const reachable = shortQueries(target.title).some((query) => {
        const ids = model.paletteResults(query, docs, searcher, 's').map((item) => item.id)
        const rank = ids.indexOf(target.id)
        return query.length === 3 ? rank === 0 : rank >= 0 && rank <= 1
      })
      if (!reachable) misses.push(target.title)
    }
    expect(misses).toEqual([])
  })
})

describe('manifiesto de la cápsula', () => {
  it('cubre las 8 rutas en ambos dispositivos con las dimensiones reales de cada WebP', () => {
    expect(CAPSULE_SHOTS.map((shot) => shot.route)).toEqual([
      '/',
      '/aboutMe',
      '/services',
      '/portfolio',
      '/portfolio/1',
      '/blog',
      '/blog/post1',
      '/contactMe',
    ])
    for (const shot of CAPSULE_SHOTS) {
      for (const device of ['desktop', 'mobile'] as const) {
        const buffer = readFileSync(join(process.cwd(), 'public', capsuleShotSrc(shot, device)))
        expect(buffer.toString('ascii', 8, 12)).toBe('WEBP')
        expect(buffer.toString('ascii', 12, 16)).toBe('VP8L')
        const bits = buffer.readUInt32LE(21)
        expect({ width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }, capsuleShotSrc(shot, device)).toEqual(
          shot.size[device],
        )
      }
    }
  })
})
