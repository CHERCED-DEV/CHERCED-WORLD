import { afterEach, describe, expect, it } from 'vitest'
import { MAX_CHUNK_CHARS, extractPost, readPost, stopSpeech, type ReadableNode } from '@/lib/ailab/voice/tts'
import { VOICES, fakeSpeech } from './speech-fake'

type FakeNode = ReadableNode & { childNodes: FakeNode[] }

function text(value: string): FakeNode {
  return { nodeType: 3, nodeName: '#text', nodeValue: value, childNodes: [] }
}

function el(tag: string, attrs: Record<string, string> = {}, ...children: Array<FakeNode | string>): FakeNode {
  return {
    nodeType: 1,
    nodeName: tag === 'svg' || tag === 'path' ? tag : tag.toUpperCase(),
    nodeValue: null,
    childNodes: children.map((child) => (typeof child === 'string' ? text(child) : child)),
    getAttribute: (name) => (Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name]! : null),
  }
}

function post(): FakeNode {
  return el(
    'div',
    { 'data-cw-post-body': '' },
    el('p', {}, 'Este post cuenta cómo ', el('a', { href: '#' }, 'Synergos'), ' maneja una saga con ', el('code', {}, 'compensate()'), '.'),
    el('h2', { id: 'pasos' }, el('a', { href: '#pasos' }, 'Los pasos')),
    el('p', {}, 'Primero se reserva el vuelo.'),
    el('img', { alt: '', src: '/decorativa.png' }),
    el(
      'div',
      { 'data-cw-code': 'typescript' },
      el('div', {}, el('span', {}, 'ts'), el('button', {}, 'Copiar')),
      el('pre', { tabindex: '0' }, el('code', {}, 'const saga = start()\nsaga.compensate()')),
    ),
    el('pre', {}, el('code', {}, 'npm run verify')),
    el('figure', {}, el('img', { alt: 'Diagrama de la saga con tres pasos', src: '/saga.svg' }), el('figcaption', {}, 'La compensación va en orden inverso.')),
    el('img', { alt: 'Separador', role: 'presentation', src: '/linea.png' }),
    el('span', { 'aria-hidden': 'true' }, '→'),
    el(
      'aside',
      { 'data-cw-callout': 'decision' },
      el('p', {}, el('svg', { 'aria-hidden': 'true' }, el('path', {})), el('span', {}, 'Decisión')),
      el('div', {}, el('p', {}, 'Compensar en orden inverso.')),
    ),
    el('h3', { id: 'ingles' }, 'En inglés'),
    el('blockquote', { lang: 'en' }, el('p', {}, 'Undo what was done.')),
    el('ul', {}, el('li', {}, 'Vuelo'), el('li', {}, 'Hotel', el('br'), 'y auto')),
    el('nav', {}, 'Índice'),
    el('p', { hidden: '' }, 'oculto'),
    el('p', { 'data-cw-listen-skip': '' }, 'no leer'),
  )
}

afterEach(() => stopSpeech())

describe('readPost: solo el cuerpo del post (T726, FR-359, 005 FR-531)', () => {
  it('lee títulos, párrafos, listas y el texto alternativo que dice algo; salta el código y lo decorativo', () => {
    const reading = extractPost(post(), { title: 'Sagas en Synergos', lang: 'es' })
    expect(reading.chunks.map((item) => [item.kind, item.text])).toEqual([
      ['heading', 'Sagas en Synergos'],
      ['text', 'Este post cuenta cómo Synergos maneja una saga con compensate().'],
      ['heading', 'Los pasos'],
      ['text', 'Primero se reserva el vuelo.'],
      ['image', 'Diagrama de la saga con tres pasos'],
      ['text', 'La compensación va en orden inverso.'],
      ['text', 'Decisión'],
      ['text', 'Compensar en orden inverso.'],
      ['heading', 'En inglés'],
      ['text', 'Undo what was done.'],
      ['text', 'Vuelo'],
      ['text', 'Hotel y auto'],
    ])
    expect(reading.skipped).toEqual({ code: 2, decorative: 2, hidden: 4 })
    expect(reading.sections).toBe(3)
    const corpus = reading.chunks.map((item) => item.text).join('\n')
    for (const absent of ['saga.compensate', 'npm run verify', 'Copiar', 'Separador', '→', 'Índice', 'oculto', 'no leer']) expect(corpus).not.toContain(absent)
  })

  it('cada fragmento sabe en qué sección va, y en qué idioma está', () => {
    const reading = extractPost(post(), { title: 'Sagas en Synergos', lang: 'es' })
    const of = (needle: string) => reading.chunks.find((item) => item.text === needle)!
    expect(of('Este post cuenta cómo Synergos maneja una saga con compensate().').heading).toBe('Sagas en Synergos')
    expect(of('Diagrama de la saga con tres pasos').heading).toBe('Los pasos')
    expect(of('Hotel y auto').heading).toBe('En inglés')
    expect(of('Undo what was done.').lang).toBe('en')
    expect(of('Vuelo').lang).toBe('es')
    expect(of('Primero se reserva el vuelo.').node?.nodeName).toBe('P')
  })

  it('sin título, lo de antes del primer encabezado no tiene sección', () => {
    const reading = extractPost(post())
    expect(reading.chunks[0]).toMatchObject({ kind: 'text', heading: null, lang: null })
    expect(reading.sections).toBe(2)
  })

  it('un párrafo largo se parte en frases que conservan su sección', () => {
    const long = Array.from({ length: 6 }, (_, index) => `La frase ${index + 1} explica un paso de la saga con bastante detalle para ocupar espacio.`).join(' ')
    const reading = extractPost(el('article', {}, el('h2', {}, 'Detalle'), el('p', {}, long)))
    const pieces = reading.chunks.filter((item) => item.kind === 'text')
    expect(pieces.length).toBeGreaterThan(1)
    for (const piece of pieces) {
      expect(piece.text.length).toBeLessThanOrEqual(MAX_CHUNK_CHARS)
      expect(piece.heading).toBe('Detalle')
    }
    expect(pieces.map((piece) => piece.text).join(' ')).toBe(long)
  })

  it('un SVG con role="img" se lee por su etiqueta; lo que el navegador no pinta se salta', () => {
    const invisible = { ...el('p', {}, 'No se ve'), checkVisibility: () => false }
    const reading = extractPost(el('div', {}, el('svg', { role: 'img', 'aria-label': 'Flujo de la saga' }, el('path', {})), invisible, el('p', {}, 'Sí se ve')))
    expect(reading.chunks.map((item) => [item.kind, item.text])).toEqual([
      ['image', 'Flujo de la saga'],
      ['text', 'Sí se ve'],
    ])
    expect(reading.skipped.hidden).toBe(1)
  })

  it('readPost lee esos fragmentos con la voz del idioma de la página y anuncia la sección', async () => {
    const fake = fakeSpeech()
    const headings: Array<string | null> = []
    const reader = readPost(post(), 'es', { env: fake.env, title: 'Sagas en Synergos', voice: VOICES.find((voice) => voice.voiceURI === 'paulina') })
    reader.subscribe((snapshot) => headings.push(snapshot.heading))
    expect(reader.snapshot).toMatchObject({ state: 'playing', heading: 'Sagas en Synergos', total: 12 })
    for (let index = 0; index < 12; index += 1) fake.end()
    await expect(reader.done).resolves.toMatchObject({ state: 'stopped', ended: 'finished' })
    expect(fake.spoken.map((item) => item.text)).toEqual(reader.chunks.map((item) => item.text))
    expect(fake.spoken.find((item) => item.text === 'Undo what was done.')?.voice).toBe('Samantha')
    expect(fake.spoken.find((item) => item.text === 'Vuelo')?.voice).toBe('Paulina')
    expect([...new Set(headings)]).toEqual(['Sagas en Synergos', 'Los pasos', 'En inglés'])
  })
})
