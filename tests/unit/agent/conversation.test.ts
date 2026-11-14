import { describe, expect, it } from 'vitest'
import { GLASSES_DOWN, isCrotch, mouthFor, MOUTH_NAMES } from '@/components/ailab/agent/avatar-sprite'
import { firstSentence, intentOf, simulatorGreeting, simulatorReply, wantsToNavigate } from '@/lib/ai/agent/simulator'
import { addTurn, appendChunk, closeTurns, lastAgentLine, TRANSCRIPT_MAX_TURNS, type Turn } from '@/lib/ai/agent/transcript'

describe('subtítulos (FR-1803)', () => {
  it('junta los pedazos de un mismo turno y abre otro cuando cambia quien habla', () => {
    let turns: Turn[] = []
    turns = appendChunk(turns, 'you', '¿Qué es', 1)
    turns = appendChunk(turns, 'you', 'Synergos?', 2)
    turns = appendChunk(turns, 'agent', 'Es la plataforma', 3)
    turns = appendChunk(turns, 'agent', ', una fábrica.', 4)
    expect(turns.map((turn) => [turn.who, turn.text, turn.done])).toEqual([
      ['you', '¿Qué es Synergos?', true],
      ['agent', 'Es la plataforma, una fábrica.', false],
    ])
    expect(lastAgentLine(turns)).toBe('Es la plataforma, una fábrica.')
    expect(closeTurns(turns).every((turn) => turn.done)).toBe(true)
    expect(appendChunk(turns, 'agent', '   ', 5)).toEqual(turns)
  })

  it('un mensaje escrito es un turno cerrado y la lista no crece sin límite', () => {
    let turns: Turn[] = []
    for (let id = 1; id <= TRANSCRIPT_MAX_TURNS + 5; id++) turns = addTurn(turns, id % 2 ? 'you' : 'agent', `mensaje ${id}`, id)
    expect(turns).toHaveLength(TRANSCRIPT_MAX_TURNS)
    expect(turns.at(-1)).toMatchObject({ text: `mensaje ${TRANSCRIPT_MAX_TURNS + 5}`, done: true })
  })
})

describe('simulador local (FR-1809)', () => {
  const hits = [
    { titulo: 'Synergos', ruta: '/es/synergos', tipo: 'page', texto: 'Una plataforma de 31 piezas. Tiene más de 6.600 tests.' },
    { titulo: 'Post 7', ruta: '/es/blog/post7', tipo: 'post', texto: 'Un gate que nunca falló.' },
  ]

  it('saluda diciendo que es el simulador', () => {
    expect(simulatorGreeting('es')).toMatch(/simulador/)
    expect(simulatorGreeting('en')).toMatch(/simulator/)
  })

  it('responde con el primer resultado y solo navega si se lo piden', () => {
    expect(simulatorReply('es', 'qué es synergos', hits)).toEqual({
      text: 'Encontré "Synergos" y 1 cosa más. Una plataforma de 31 piezas.',
      open: null,
    })
    expect(simulatorReply('es', 'llévame a synergos', hits).open).toBe('/es/synergos')
    expect(simulatorReply('en', 'take me to synergos', hits).text).toContain('Taking you to "Synergos"')
    expect(simulatorReply('es', 'nada', []).open).toBeNull()
    expect(simulatorReply('es', 'nada', []).text).toMatch(/Contacto/)
  })

  it('entiende las preguntas típicas antes de buscar', () => {
    const facts = {
      author: 'Camilo Hernández',
      about: 'Ingeniero de IA en Armenia. Hace muchas cosas.',
      services: { intro: '', items: [{ id: 'a', title: 'Arquitectura', description: '' }, { id: 'b', title: 'Frontend', description: '' }] },
      projects: [{ title: 'Synergos' }, { title: 'Despacho' }] as never,
      pages: { contact: { title: 'Contacto', url: '/es/contactMe' }, portfolio: { title: 'Portafolio', url: '/es/portfolio' } } as never,
    }
    expect(intentOf('¿Quién eres?')).toBe('identity')
    expect(intentOf('qué haces?')).toBe('work')
    expect(intentOf('lo mejor de esta web')).toBe('best')
    expect(intentOf('hola')).toBe('greeting')
    expect(intentOf('sagas')).toBe('search')
    expect(simulatorReply('es', '¿quién eres?', hits, facts).text).toMatch(/Mini Cherced.*IA/)
    expect(simulatorReply('es', 'qué haces', hits, facts).text).toBe('Ingeniero de IA en Armenia. Ofrece arquitectura y frontend.')
    expect(simulatorReply('es', 'llévame a contacto', hits, facts).open).toBe('/es/contactMe')
    expect(simulatorReply('es', 'muéstrame lo mejor', hits, facts).open).toBe('/es/synergos')
    expect(simulatorReply('es', 'proyectos', hits, facts).text).toContain('Synergos y Despacho')
  })

  it('reconoce pedidos de navegación en los dos idiomas', () => {
    expect(wantsToNavigate('es', 'muéstrame el blog')).toBe(true)
    expect(wantsToNavigate('es', 'show me the blog')).toBe(true)
    expect(wantsToNavigate('en', 'what is this')).toBe(false)
    expect(firstSentence('Uno. Dos.')).toBe('Uno.')
    expect(firstSentence('x'.repeat(300)).length).toBe(220)
  })
})

describe('boca del chibi (FR-1810)', () => {
  it('esquiva los clics, salvo uno en la entrepierna: ahí se baja las gafas', () => {
    expect(isCrotch(15, 41)).toBe(true)
    expect(isCrotch(16, 44)).toBe(true)
    expect(isCrotch(15, 20)).toBe(false)
    expect(isCrotch(4, 41)).toBe(false)
    expect(isCrotch(15, 46)).toBe(false)
    expect(GLASSES_DOWN.rows).toHaveLength(8)
    expect(GLASSES_DOWN.rows.join('')).toMatch(/w+kk/)
  })

  it('abre la boca según el nivel del audio', () => {
    expect(MOUTH_NAMES).toEqual(['closed', 'mid', 'open'])
    expect(mouthFor(0)).toBe('closed')
    expect(mouthFor(0.05)).toBe('mid')
    expect(mouthFor(0.3)).toBe('open')
  })
})
