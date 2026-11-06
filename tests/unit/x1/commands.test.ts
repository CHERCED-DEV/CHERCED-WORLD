import { describe, expect, it, vi } from 'vitest'
import { voiceCommands } from '@/content/ailab/voice-commands'
import { levenshtein, matchVoiceCommand, normalizeUtterance, phraseScore } from '@/lib/ailab/voice/commands'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { getDictionary } = await import('@/lib/i18n/server')
const { uiLabels } = await import('@/components/experience/labels')
const { pageDocs } = await import('@/lib/search/pages')
const model = await import('@/components/experience/palette-model')

function idOf(utterance: string): string | null {
  return matchVoiceCommand(utterance)?.command.id ?? null
}

describe('frases en español (T724, FR-351)', () => {
  it.each([
    ['llévame al blog', 'blog'],
    ['¡Llévame al blog, por favor!', 'blog'],
    ['Llevame al blog.', 'blog'],
    ['oye, abre el blog', 'blog'],
    ['cambia a tema claro', 'theme-light'],
    ['Cambia a tema claro.', 'theme-light'],
    ['pon el modo oscuro', 'theme-dark'],
    ['cambia a tema oscuro', 'theme-dark'],
    ['abre mi CV', 'cv'],
    ['Abre mi C.V.', 'cv'],
    ['muéstrame tus proyectos', 'portfolio'],
    ['llévame al inicio', 'home'],
    ['quiero contactarte', 'contact'],
    ['cambia a inglés', 'lang-en'],
    ['abre el laboratorio', 'ai-lab'],
    ['atajos de teclado', 'shortcuts'],
    ['política de privacidad', 'privacy'],
  ])('«%s» → %s', (utterance, expected) => {
    expect(idOf(utterance)).toBe(expected)
  })
})

describe('frases en inglés', () => {
  it.each([
    ['take me to the blog', 'blog'],
    ['Take me to the blog.', 'blog'],
    ['please open the blog', 'blog'],
    ['switch to light theme', 'theme-light'],
    ['Switch to dark mode!', 'theme-dark'],
    ['open my resume', 'cv'],
    ['show me your projects', 'portfolio'],
    ['take me home', 'home'],
    ['switch to Spanish', 'lang-es'],
    ['open the AI lab', 'ai-lab'],
    ['keyboard shortcuts', 'shortcuts'],
  ])('“%s” → %s', (utterance, expected) => {
    expect(idOf(utterance)).toBe(expected)
  })
})

describe('frases desconocidas o vacías (US5 escenario 2)', () => {
  it.each(['¿qué hora es?', 'pizza con piña', 'borra todo', 'rm -rf /', 'what is the weather like', 'Gracias.', '', '   ', 'por favor'])(
    '«%s» no corre nada',
    (utterance) => {
      expect(matchVoiceCommand(utterance)).toBeNull()
    },
  )

  it('tolera un error pequeño del reconocimiento, pero no uno grande', () => {
    expect(idOf('llévame al blo')).toBe('blog')
    expect(idOf('take me to the blogg')).toBe('blog')
    expect(idOf('llévame al bosque')).toBeNull()
  })
})

describe('el emparejador', () => {
  it('normaliza tildes, signos, mayúsculas y muletillas de los bordes', () => {
    expect(normalizeUtterance('¡¿LLÉVAME   al Blog?!')).toBe('llevame al blog')
    expect(normalizeUtterance('Oye, por favor, cambia a tema claro, por favor.')).toBe('cambia a tema claro')
    expect(normalizeUtterance('Abre mi C.V.')).toBe('abre mi cv')
    expect(normalizeUtterance('Hey')).toBe('')
  })

  it('la frase exacta puntúa 1 y una frase contenida, un poco menos', () => {
    expect(phraseScore('llévame al blog', 'llévame al blog')).toBe(1)
    const contained = phraseScore('ahora llévame al blog rápido', 'llévame al blog')
    expect(contained).toBeGreaterThan(0.9)
    expect(contained).toBeLessThan(1)
  })

  it('levenshtein cuenta inserciones, borrados y cambios', () => {
    expect(levenshtein('blog', 'blog')).toBe(0)
    expect(levenshtein('blog', 'blo')).toBe(1)
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('tema', 'teme')).toBe(1)
  })

  it('cada frase de la lista lleva a su propio comando, sin choques entre comandos', () => {
    for (const command of voiceCommands) {
      for (const lang of ['es', 'en'] as const) {
        for (const phrase of command.phrases[lang]) expect(idOf(phrase), `${lang}: ${phrase}`).toBe(command.id)
      }
    }
  })

  it('los ids y las etiquetas son únicos y cada comando trae frases y etiqueta en ES y EN', () => {
    expect(new Set(voiceCommands.map((command) => command.id)).size).toBe(voiceCommands.length)
    for (const command of voiceCommands) {
      expect(command.label.es.trim(), command.id).not.toBe('')
      expect(command.label.en.trim(), command.id).not.toBe('')
      expect(command.phrases.es.length, command.id).toBeGreaterThan(0)
      expect(command.phrases.en.length, command.id).toBeGreaterThan(0)
    }
  })
})

describe('solo comandos del registro de la paleta (principio III, FR-451)', () => {
  it.each(['es', 'en'] as const)('%s: cada comando de voz existe en la paleta del sitio', async (lang) => {
    const [experience, common] = await Promise.all([getDictionary(lang, 'experience'), getDictionary(lang, 'common')])
    const labels = uiLabels(experience, common)
    const commands = model.buildCommands(labels, {
      theme: 'dark',
      email: 'a@b.co',
      cv: '/cv.pdf',
      now: `/${lang}/now`,
      aiLab: `/${lang}/ai-lab`,
      capsuleFound: false,
    })
    const ids = new Set(model.toPaletteDocs(pageDocs(lang, common), commands).map((doc) => doc.item.id))
    for (const command of voiceCommands) expect(ids.has(command.command), command.command).toBe(true)
  })

  it('los comandos de tema llevan su destino, y los de idioma también', () => {
    const themes = voiceCommands.filter((command) => command.command === 'action:theme').map((command) => command.target)
    expect(themes).toEqual([{ theme: 'light' }, { theme: 'dark' }])
    const langs = voiceCommands.filter((command) => command.command === 'action:lang').map((command) => command.target)
    expect(langs).toEqual([{ lang: 'en' }, { lang: 'es' }])
  })
})
