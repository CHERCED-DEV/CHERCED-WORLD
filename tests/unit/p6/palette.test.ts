import { describe, expect, it, vi } from 'vitest'
import type { PaletteExtension } from '@/components/experience/palette-model'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { getDictionary } = await import('@/lib/i18n/server')
const { getSite } = await import('@/lib/content')
const { uiLabels } = await import('@/components/experience/labels')
const model = await import('@/components/experience/palette-model')

const CV = 'https://www.linkedin.com/in/cherced/'

async function setup(lang: 'es' | 'en', extensions: PaletteExtension[] = []) {
  const [index, experience, common] = await Promise.all([
    buildSearchIndex(lang),
    getDictionary(lang, 'experience'),
    getDictionary(lang, 'common'),
  ])
  const labels = uiLabels(experience, common)
  const context = { theme: 'dark' as const, email: 'a@b.co', cv: CV, now: `/${lang}/now`, capsuleFound: false, extensions }
  const docs = model.toPaletteDocs(index.docs, model.buildCommands(labels, context), extensions)
  return { index, labels, docs, searcher: model.createPaletteSearcher(docs) }
}

function ids(query: string, ctx: Awaited<ReturnType<typeof setup>>) {
  return model.paletteResults(query, ctx.docs, ctx.searcher, 's')
}

describe.each(['es', 'en'] as const)('habilidades en la paleta (FR-450, SC-404) · %s', (lang) => {
  it('cada habilidad de los lóbulos es un doc que navega al ancla de su lóbulo', async () => {
    const ctx = await setup(lang)
    const lobes = getSite().about.skills.lobes ?? []
    const skills = ctx.docs.filter((doc) => doc.item.group === 'skills')
    expect(skills.length).toBe(new Set(lobes.flatMap((lobe) => lobe.skills)).size)
    for (const lobe of lobes) {
      for (const id of lobe.skills) {
        const doc = skills.find((item) => item.id === `skill:${id}`)
        expect(doc, id).toBeDefined()
        expect(doc?.item.command).toEqual({ type: 'navigate', href: `/${lang}/aboutMe#lobe-${lobe.id}` })
        const level = getSite().about.languages.find((language) => language.id === id)?.level?.[lang]
        expect(doc?.item.hint).toMatch(level ? new RegExp(`^.+ · ${level}$`) : lang === 'es' ? /^.+ · \d+ %$/ : /^.+ · \d+%$/)
      }
    }
  })

  for (const query of ['saga', 'Angular', 'Synergos']) {
    it(`"${query}" trae una habilidad o un proyecto entre los 3 primeros`, async () => {
      const top = ids(query, await setup(lang)).slice(0, 3)
      expect(top.some((item) => item.group === 'skills' || item.group === 'projects'), JSON.stringify(top)).toBe(true)
    })
  }

  it('"saga" y "Angular" muestran habilidades y proyectos a la vez', async () => {
    const ctx = await setup(lang)
    for (const query of ['saga', 'Angular']) {
      const groups = new Set(ids(query, ctx).map((item) => item.group))
      expect(groups.has('skills'), query).toBe(true)
      expect(groups.has('projects'), query).toBe(true)
    }
  })

  it('una página o una acción sigue ganando cuando el nombre coincide', async () => {
    const ctx = await setup(lang)
    expect(ids(lang === 'es' ? 'inglés' : 'spanish', ctx)[0]?.id).toBe('action:lang')
    expect(ids(lang === 'es' ? 'tema claro' : 'light theme', ctx)[0]?.id).toBe('action:theme')
    expect(ids(lang === 'es' ? 'copiar correo' : 'copy email', ctx)[0]?.id).toBe('action:copy-email')
    expect(ids('blog', ctx)[0]?.id).toBe('page:blog')
  })
})

describe('modo de comandos > (FR-451, SC-403)', () => {
  it('">" solo lista comandos, en el orden de la spec', async () => {
    const ctx = await setup('es')
    const items = ids('>', ctx)
    expect(items.every((item) => item.group === 'commands')).toBe(true)
    expect(items.map((item) => item.id)).toEqual([
      'action:cv',
      'action:copy-email',
      'action:theme',
      'action:lang',
      'action:assistant',
      'action:shortcuts',
      'action:now',
    ])
    expect(ids('  >  ', ctx).map((item) => item.id)).toEqual(items.map((item) => item.id))
  })

  it('">cv" deja el CV de LinkedIn primero: 4 teclas con Enter', async () => {
    for (const lang of ['es', 'en'] as const) {
      const ctx = await setup(lang)
      for (const query of ['>cv', '> cv', '>CV']) {
        const [first] = ids(query, ctx)
        expect(first?.id, `${lang} ${query}`).toBe('action:cv')
        expect(first?.command).toEqual({ type: 'open', href: CV })
        expect(first?.title).toBe(lang === 'es' ? 'Ver mi CV en LinkedIn' : 'See my CV on LinkedIn')
      }
      expect(ids('cv', ctx)[0]?.id).toBe('action:cv')
    }
  })

  it('encuentra cada comando por sus palabras clave en ambos idiomas', async () => {
    const ctx = await setup('es')
    const first = (query: string) => ids(query, ctx)[0]?.id
    expect(first('>hoja de vida')).toBe('action:cv')
    expect(first('>resume')).toBe('action:cv')
    expect(first('>atajos')).toBe('action:shortcuts')
    expect(first('>keyboard')).toBe('action:shortcuts')
    expect(first('>tema')).toBe('action:theme')
    expect(first('>idioma')).toBe('action:lang')
    expect(first('>asistente')).toBe('action:assistant')
    expect(first('>correo')).toBe('action:copy-email')
    expect(first('>ahora')).toBe('action:now')
  })

  it('no mezcla páginas, proyectos ni habilidades, y sin coincidencias queda vacío', async () => {
    const ctx = await setup('es')
    expect(ids('>angular', ctx)).toEqual([])
    expect(ids('>blog', ctx).every((item) => item.group === 'commands')).toBe(true)
    expect(ids('>zzzz', ctx)).toEqual([])
  })

  it('el comando de /now solo aparece en modo de comandos', async () => {
    const ctx = await setup('es')
    expect(ids('', ctx).some((item) => item.id === 'action:now')).toBe(false)
    expect(ids('ahora', ctx).some((item) => item.id === 'action:now')).toBe(false)
    expect(ids('ahora', ctx)[0]?.id).toBe('page:now')
  })

  it('los comandos de tema, idioma y CV declaran la capacidad que reflejan (FR-489b)', async () => {
    const ctx = await setup('es')
    const byId = (id: string) => ctx.docs.find((doc) => doc.id === id)?.item
    expect(byId('action:cv')?.capability).toBe('get_cv')
    expect(byId('action:theme')?.capability).toBe('set_preferences')
    expect(byId('action:lang')?.capability).toBe('set_preferences')
    expect(byId('action:theme')?.shortcut).toBe('t')
    expect(byId('action:shortcuts')?.shortcut).toBe('?')
  })

  it('sin perfil no hay comando de CV', async () => {
    const [experience, common] = await Promise.all([getDictionary('es', 'experience'), getDictionary('es', 'common')])
    const commands = model.buildCommands(uiLabels(experience, common), {
      theme: 'light',
      email: null,
      cv: null,
      now: null,
      capsuleFound: true,
    })
    expect(commands.map((item) => item.id)).toEqual(['action:theme', 'action:lang', 'action:assistant', 'action:shortcuts', 'action:capsule'])
  })
})

describe('punto de extensión para la 003 y la 005', () => {
  it('un comando registrado aparece con su etiqueta y se quita al darlo de baja', async () => {
    const run = vi.fn()
    const remove = model.registerPaletteCommand({ id: 'ai-lab', labelKey: 'palette.action.aiLab', keywords: 'ai lab laboratorio', run })
    try {
      const ctx = await setup('es', model.paletteExtensions())
      const found = ids('>laboratorio', ctx)[0]
      expect(found).toMatchObject({ id: 'extension:ai-lab', title: 'Abrir el AI Lab', command: { type: 'extension', id: 'ai-lab' } })
      model.findPaletteExtension('ai-lab')?.run()
      expect(run).toHaveBeenCalledOnce()
    } finally {
      remove()
    }
    expect(model.paletteExtensions()).toEqual([])
    expect(model.findPaletteExtension('ai-lab')).toBeNull()
  })

  it('sin etiqueta conocida no aparece, y una baja vieja no borra un registro nuevo', async () => {
    const first = model.registerPaletteCommand({ id: 'listen', labelKey: 'palette.action.listen', keywords: 'escuchar listen', run: () => {} })
    const second = model.registerPaletteCommand({ id: 'listen', labelKey: 'palette.action.listen', keywords: 'escuchar listen', run: () => {} })
    first()
    expect(model.paletteExtensions()).toHaveLength(1)
    second()
    const ghost = model.registerPaletteCommand({ id: 'ghost', labelKey: 'palette.action.nope', keywords: 'ghost', run: () => {} })
    try {
      const ctx = await setup('es', model.paletteExtensions())
      expect(ids('>', ctx).some((item) => item.id === 'extension:ghost')).toBe(false)
    } finally {
      ghost()
    }
  })
})
