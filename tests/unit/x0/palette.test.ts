import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { getDictionary } = await import('@/lib/i18n/server')
const { uiLabels } = await import('@/components/experience/labels')
const model = await import('@/components/experience/palette-model')

async function setup(lang: 'es' | 'en', aiLab: string | null = `/${lang}/ai-lab`) {
  const [index, experience, common] = await Promise.all([buildSearchIndex(lang), getDictionary(lang, 'experience'), getDictionary(lang, 'common')])
  const labels = uiLabels(experience, common)
  const commands = model.buildCommands(labels, { theme: 'dark', email: 'a@b.co', cv: null, now: `/${lang}/now`, aiLab, capsuleFound: false })
  const docs = model.toPaletteDocs(index.docs, commands)
  return { commands, docs, searcher: model.createPaletteSearcher(docs) }
}

function results(query: string, ctx: Awaited<ReturnType<typeof setup>>) {
  return model.paletteResults(query, ctx.docs, ctx.searcher, 's')
}

let release: Array<() => void> = []

afterEach(() => {
  for (const undo of release) undo()
  release = []
})

describe('"Abrir el AI Lab" en la paleta (A-703, FR-301)', () => {
  it.each([
    ['es', 'Abrir el AI Lab'],
    ['en', 'Open the AI Lab'],
  ] as const)('%s: es una página del registro que navega a /ai-lab', async (lang, title) => {
    const ctx = await setup(lang)
    const item = ctx.commands.find((command) => command.id === 'action:ai-lab')
    expect(item).toMatchObject({ group: 'pages', title, command: { type: 'navigate', href: `/${lang}/ai-lab` } })
  })

  it('aparece con la paleta vacía y al buscarlo, pero no cambia el modo de comandos >', async () => {
    const ctx = await setup('es')
    expect(results('', ctx).some((item) => item.id === 'action:ai-lab')).toBe(true)
    for (const query of ['laboratorio', 'ai lab', 'experimentos']) expect(results(query, ctx)[0]?.id, query).toBe('action:ai-lab')
    expect(results('>', ctx).some((item) => item.id === 'action:ai-lab')).toBe(false)
    expect(results('blog', ctx)[0]?.id).toBe('page:blog')
  })

  it('sin la ruta en el contexto no aparece (así lo arman las pruebas de P6)', async () => {
    const ctx = await setup('es', null)
    expect(ctx.commands.some((command) => command.id === 'action:ai-lab')).toBe(false)
  })
})

describe('runPaletteCommand(id) para V4 (A-703, FR-351)', () => {
  it('sin corredor montado no hace nada y responde false', () => {
    expect(model.runPaletteCommand('page:blog')).toBe(false)
    expect(model.findPaletteCommand('page:blog')).toBeNull()
  })

  it('ejecuta el comando del registro con ese id y responde true', async () => {
    const ctx = await setup('es')
    const run = vi.fn()
    release.push(model.registerPaletteRunner({ items: () => ctx.docs.map((doc) => doc.item), run }))
    expect(model.runPaletteCommand('action:ai-lab')).toBe(true)
    expect(model.runPaletteCommand('page:blog')).toBe(true)
    expect(model.runPaletteCommand('action:theme')).toBe(true)
    expect(run.mock.calls.map(([item]) => item.id)).toEqual(['action:ai-lab', 'page:blog', 'action:theme'])
    expect(model.findPaletteCommand('page:portfolio')?.command).toEqual({ type: 'navigate', href: '/es/portfolio' })
    expect(model.runPaletteCommand('rm -rf /')).toBe(false)
    expect(run).toHaveBeenCalledTimes(3)
  })

  it('una baja vieja no borra un corredor nuevo', () => {
    const first = model.registerPaletteRunner({ items: () => [], run: () => {} })
    const second = model.registerPaletteRunner({
      items: () => [{ id: 'page:home', group: 'pages', title: 'Inicio', command: { type: 'navigate', href: '/es' } }],
      run: () => {},
    })
    release.push(second)
    first()
    expect(model.runPaletteCommand('page:home')).toBe(true)
  })

  it('executePaletteCommand es el único switch: cada tipo llama su efecto', () => {
    const calls: string[] = []
    const effects: Parameters<typeof model.executePaletteCommand>[1] = {
      close: () => calls.push('close'),
      navigate: (href) => calls.push(`navigate ${href}`),
      setTheme: (to) => calls.push(`theme ${to}`),
      switchLang: () => calls.push('lang'),
      open: (href) => calls.push(`open ${href}`),
      download: (href, filename) => calls.push(`download ${href} ${filename}`),
      shortcuts: () => calls.push('shortcuts'),
      assistant: () => calls.push('assistant'),
      copyEmail: () => calls.push('copy'),
      capsule: () => calls.push('capsule'),
    }
    const extension = vi.fn()
    release.push(model.registerPaletteCommand({ id: 'lab', labelKey: 'palette.action.aiLab', keywords: 'lab', run: extension }))
    for (const command of [
      { type: 'navigate', href: '/es/ai-lab' },
      { type: 'theme', to: 'light' },
      { type: 'lang' },
      { type: 'open', href: 'https://example.com' },
      { type: 'download', href: '/cv/Camilo_Hernandez_CV.pdf', filename: 'Camilo_Hernandez_CV.pdf' },
      { type: 'shortcuts' },
      { type: 'assistant' },
      { type: 'copy-email' },
      { type: 'capsule' },
      { type: 'extension', id: 'lab' },
    ] as const) {
      model.executePaletteCommand(command, effects)
    }
    expect(calls).toEqual([
      'close',
      'navigate /es/ai-lab',
      'theme light',
      'close',
      'close',
      'lang',
      'close',
      'open https://example.com',
      'close',
      'download /cv/Camilo_Hernandez_CV.pdf Camilo_Hernandez_CV.pdf',
      'shortcuts',
      'assistant',
      'close',
      'copy',
      'capsule',
      'close',
    ])
    expect(extension).toHaveBeenCalledOnce()
  })
})
