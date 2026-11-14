import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { funDictionary } from '@/components/fun/dictionary'
import {
  countsAsInteraction,
  fitsView,
  followTarget,
  GUIDE_START,
  guideTarget,
  inAiLab,
  meReply,
  nextGuide,
  pickGuideLine,
  pickMeLine,
  runToward,
  standNear,
  type FunPhase,
  type Guide,
  type GuideEvent,
  type Interaction,
} from '@/components/fun/logic'
import { FUN_GUIDE_AFTER, FUN_GUIDE_GRACE_MS, FUN_GUIDE_LINES, FUN_GUIDE_TAP_MS, FUN_ME_GO_AT, FUN_ME_LINES, FUN_RUN_SPEED } from '@/content/fun'
import en from '@/content/i18n/en/fun.json'
import es from '@/content/i18n/es/fun.json'

const ROOT = process.cwd()

const source = (...parts: string[]) => readFileSync(join(ROOT, ...parts), 'utf8')

const VIEW = { width: 1280, height: 800 }

const SIZE = { width: 78, height: 99 }

const BOUNDS = { top: 84, margin: 4 }

function touch(phase: FunPhase = 'awake', inLab = false, blocked = false): GuideEvent {
  return { type: 'interaction', phase, inLab, blocked }
}

function play(events: GuideEvent[], start: Guide = GUIDE_START) {
  let guide = start
  const actions: (string | null)[] = []
  for (const event of events) {
    const outcome = nextGuide(guide, event)
    guide = outcome.guide
    actions.push(outcome.action)
  }
  return { guide, actions }
}

const times = (count: number, event: GuideEvent) => Array.from({ length: count }, () => event)

const click: Interaction = { kind: 'pointer', trusted: true, own: false }

const key = (name: string, extra: Partial<Extract<Interaction, { kind: 'key' }>> = {}): Interaction => ({
  kind: 'key',
  trusted: true,
  own: false,
  key: name,
  repeat: false,
  typing: false,
  ...extra,
})

describe('019 guía: contador de interacciones', () => {
  it('a la sexta interacción sale corriendo, no antes', () => {
    expect(FUN_GUIDE_AFTER).toBe(6)
    const before = play(times(5, touch()))
    expect(before.actions).toEqual([null, null, null, null, null])
    expect(before.guide).toEqual({ status: 'counting', count: 5 })
    const sixth = nextGuide(before.guide, touch())
    expect(sixth.action).toBe('run')
    expect(sixth.guide.status).toBe('running')
  })

  it('cuentan clics, toques y teclas reales', () => {
    expect(countsAsInteraction(click)).toBe(true)
    expect(countsAsInteraction(key('x'))).toBe(true)
    expect(countsAsInteraction(key('Tab'))).toBe(true)
    expect(countsAsInteraction(key('Enter'))).toBe(true)
  })

  it('no cuentan el propio huevo, los eventos sintéticos, Esc, las modificadoras, la tecla sostenida ni escribir', () => {
    expect(countsAsInteraction({ ...click, own: true })).toBe(false)
    expect(countsAsInteraction({ ...click, trusted: false })).toBe(false)
    expect(countsAsInteraction(key('x', { own: true }))).toBe(false)
    expect(countsAsInteraction(key('x', { trusted: false }))).toBe(false)
    for (const name of ['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock']) expect(countsAsInteraction(key(name)), name).toBe(false)
    expect(countsAsInteraction(key('x', { repeat: true }))).toBe(false)
    expect(countsAsInteraction(key('a', { typing: true }))).toBe(false)
  })

  it('quieto o yéndose no cuenta; al soltarlo sigue desde donde iba', () => {
    const sulking = play([...times(3, touch()), ...times(4, touch('sulking')), touch('leaving')])
    expect(sulking.guide).toEqual({ status: 'counting', count: 3 })
    const freed = play(times(3, touch()), sulking.guide)
    expect(freed.actions).toEqual([null, null, 'run'])
  })

  it('con trabajo a medias, un diálogo abierto o sin enlace ni dock a la vista, espera a la siguiente', () => {
    const held = play([...times(5, touch()), touch('awake', false, true), touch('awake', false, true)])
    expect(held.actions.slice(-2)).toEqual([null, null])
    expect(held.guide).toEqual({ status: 'counting', count: FUN_GUIDE_AFTER })
    expect(nextGuide(held.guide, touch()).action).toBe('run')
  })
})

describe('019 guía: una vez por despertar', () => {
  it('después de llegar ya no vuelve a salir', () => {
    const trip = play([...times(6, touch()), { type: 'arrived' }, ...times(12, touch())])
    expect(trip.actions[5]).toBe('run')
    expect(trip.actions[6]).toBe('celebrate')
    expect(trip.actions.slice(7).every((action) => action === null)).toBe(true)
    expect(trip.guide.status).toBe('done')
  })

  it('cada despertar arranca de cero', () => {
    expect(GUIDE_START).toEqual({ status: 'counting', count: 0 })
    expect(Object.isFrozen(GUIDE_START)).toBe(true)
  })

  it('"llegué" sin estar corriendo no hace nada', () => {
    expect(nextGuide(GUIDE_START, { type: 'arrived' })).toEqual({ guide: GUIDE_START, action: null })
  })
})

describe('019 guía: ya en el AI Lab', () => {
  it('reconoce el AI Lab en los dos idiomas y sus rutas internas', () => {
    expect(inAiLab('/es/ai-lab')).toBe(true)
    expect(inAiLab('/en/ai-lab/')).toBe(true)
    expect(inAiLab('/en/ai-lab/v1')).toBe(true)
    expect(inAiLab('/es/privacy')).toBe(false)
    expect(inAiLab('/es/ai-labs')).toBe(false)
    expect(inAiLab('/es/blog/ai-lab')).toBe(false)
    expect(inAiLab(null)).toBe(false)
  })

  it('si ya está en el AI Lab no corre: solo celebra, aunque la página esté ocupada', () => {
    const here = play(times(6, touch('awake', true, true)))
    expect(here.actions.at(-1)).toBe('celebrate')
    expect(here.guide.status).toBe('done')
    expect(play(times(6, touch('awake', true)), here.guide).actions.every((action) => action === null)).toBe(true)
  })
})

describe('019 guía: Esc y "Quieto"', () => {
  it('a mitad de carrera lo detienen y no lo vuelve a intentar en ese despertar', () => {
    const stopped = play([...times(6, touch()), { type: 'stop' }])
    expect(stopped.guide.status).toBe('done')
    expect(stopped.actions.at(-1)).toBeNull()
    const after = play([...times(8, touch()), { type: 'arrived' }], stopped.guide)
    expect(after.actions.every((action) => action === null)).toBe(true)
  })

  it('antes de la carrera, Esc no borra la cuenta: solo la pausa', () => {
    const paused = play([...times(4, touch()), { type: 'stop' }])
    expect(paused.guide).toEqual({ status: 'counting', count: 4 })
  })

  it('entre el "¡Ven!" y la navegación hay tiempo para Esc', () => {
    expect(FUN_GUIDE_GRACE_MS).toBeGreaterThanOrEqual(1_000)
    expect(FUN_GUIDE_TAP_MS).toBeLessThanOrEqual(FUN_GUIDE_GRACE_MS)
  })
})

describe('019 guía: a dónde va', () => {
  const link = { left: 600, top: 700, width: 48, height: 44 }
  const dock = { left: 1000, top: 18, width: 220, height: 44 }

  it('al enlace del pie si se ve entero; si no, al dock; si no ve ninguno, a ningún lado', () => {
    expect(guideTarget(link, dock, VIEW)).toEqual({ kind: 'link', box: link })
    expect(guideTarget({ ...link, top: 790 }, dock, VIEW)).toEqual({ kind: 'dock', box: dock })
    expect(guideTarget(null, dock, VIEW)).toEqual({ kind: 'dock', box: dock })
    expect(guideTarget({ ...link, top: -60 }, { ...dock, top: 900 }, VIEW)).toBeNull()
    expect(guideTarget({ ...link, width: 0 }, null, VIEW)).toBeNull()
  })

  it('solo cuenta lo que cabe entero en la pantalla', () => {
    expect(fitsView(link, VIEW)).toBe(true)
    expect(fitsView({ ...link, left: 1250 }, VIEW)).toBe(false)
    expect(fitsView(null, VIEW)).toBe(false)
  })

  it('se para al lado del enlace; encima del dock de abajo y debajo del de arriba', () => {
    const beside = standNear({ kind: 'link', box: link }, SIZE, VIEW, BOUNDS)
    expect(beside.x).toBeGreaterThanOrEqual(link.left + link.width)
    const bottomDock = { left: 40, top: 740, width: 300, height: 56 }
    const above = standNear({ kind: 'dock', box: bottomDock }, SIZE, { width: 375, height: 812 }, BOUNDS)
    expect(above.y + SIZE.height).toBeLessThanOrEqual(bottomDock.top)
    const below = standNear({ kind: 'dock', box: dock }, SIZE, VIEW, BOUNDS)
    expect(below.y).toBeGreaterThanOrEqual(dock.top + dock.height)
  })
})

describe('019 guía: corre a velocidad constante', () => {
  it('avanza lo que le da la velocidad y no se pasa', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 900, y: 0 }
    expect(runToward(from, to, 100, FUN_RUN_SPEED)).toEqual({ x: 90, y: 0 })
    expect(runToward({ x: 895, y: 0 }, to, 16, FUN_RUN_SPEED)).toEqual(to)
    expect(runToward(to, to, 16, FUN_RUN_SPEED)).toEqual(to)
  })

  it('un cuadro largo no lo teletransporta', () => {
    expect(runToward({ x: 0, y: 0 }, { x: 0, y: 2_000 }, 5_000, FUN_RUN_SPEED).y).toBe(FUN_RUN_SPEED / 10)
  })
})

describe('019 guía: frases en ES y EN', () => {
  it('las tres frases del autor, la del arranque y la de "ya estás aquí" existen en los dos idiomas', () => {
    expect(es['fun.guide.line.1']).toBe('Mira nada más, qué bonito.')
    expect(es['fun.guide.line.2']).toBe('Qué bien hecho, mira todo esto.')
    expect(es['fun.guide.line.3']).toBe('Aquí es donde debes estar, el resto de la página vale madres.')
    for (const name of ['fun.guide.go', 'fun.guide.here', 'fun.guide.line.1', 'fun.guide.line.2', 'fun.guide.line.3'] as const) {
      expect(en[name], name).not.toBe(es[name])
    }
    for (const lang of ['es', 'en'] as const) {
      const dict = funDictionary(lang)
      for (const line of FUN_GUIDE_LINES) expect(dict[`fun.guide.line.${line}`], `${lang} ${line}`).toBeTruthy()
      expect(dict['fun.guide.go']).toBeTruthy()
      expect(dict['fun.guide.here']).toBeTruthy()
    }
  })

  it('elige una de las tres frases al llegar', () => {
    expect(pickGuideLine(() => 0)).toBe(1)
    expect(pickGuideLine(() => 0.5)).toBe(2)
    expect(pickGuideLine(() => 0.999)).toBe(3)
    expect(pickGuideLine(() => 1)).toBe(3)
  })
})

describe('019 guía: la única navegación del huevo', () => {
  it('Buddy, el sprite y la lógica siguen sin navegar; el guía navega solo al AI Lab y con el router', () => {
    for (const file of ['Buddy.tsx', 'BuddySprite.tsx', 'logic.ts']) {
      expect(source('components', 'fun', file), file).not.toMatch(/router\.|location\.|history\.|\.click\(|dispatchEvent|\.focus\(/)
    }
    const guide = source('components', 'fun', 'guide.ts')
    expect(guide.match(/router\.\w+\(/g)).toEqual(['router.push('])
    expect(guide).toContain('router.push(`/${lang}/ai-lab`)')
    expect(guide).not.toMatch(/location\.|history\.|\.click\(|dispatchEvent|requestSubmit|\.submit\(|\.focus\(/)
  })

  it('los rayos dorados van solo en el enlace "AI Lab" del pie y respetan el movimiento reducido', () => {
    const footer = source('components', 'shell', 'SiteFooter.tsx')
    expect(footer.match(/styles\.aiLab/g)).toHaveLength(1)
    expect(footer).toMatch(/className=\{cx\(styles\.privacy, styles\.aiLab\)\} data-cw-footer-ai-lab=""/)
    const styles = source('components', 'shell', 'SiteFooter.module.scss')
    expect(styles).toMatch(/\.aiLab \{[^}]*color: var\(--cw-fg\);/)
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.aiLab::before,\s*\.aiLab::after \{\s*animation: none;/)
    const chibi = source('components', 'fun', 'Buddy.module.scss')
    expect(chibi).not.toMatch(/gold|#f5c443|#c98d00/i)
  })
})

describe('019 picarlo a él', () => {
  it('cada clic saca una frase, al tercero avisa y al cuarto sale corriendo', () => {
    expect(FUN_ME_GO_AT).toBe(4)
    expect([1, 2, 3, 4, 5].map((count) => meReply('awake', count, 'counting'))).toEqual(['line', 'line', 'tease', 'go', 'go'])
  })

  it('quieto dice que está castigado; yéndose ya no responde', () => {
    expect(meReply('sulking', 3, 'counting')).toBe('sulk')
    expect(meReply('sulking', 9, 'done')).toBe('sulk')
    expect(meReply('leaving', 4, 'counting')).toBeNull()
  })

  it('corriendo o después de llevarte, solo saca frases', () => {
    expect(meReply('awake', 4, 'running')).toBe('line')
    expect(meReply('awake', 3, 'done')).toBe('line')
    expect(meReply('awake', 12, 'done')).toBe('line')
  })

  it('el cuarto clic arranca la misma carrera, celebra en el AI Lab y espera si la página está ocupada', () => {
    const counted = play(times(3, touch())).guide
    expect(nextGuide(counted, { type: 'summon', inLab: false, blocked: false })).toEqual({ guide: { status: 'running', count: 3 }, action: 'run' })
    expect(nextGuide(GUIDE_START, { type: 'summon', inLab: true, blocked: true })).toEqual({ guide: { status: 'done', count: 0 }, action: 'celebrate' })
    expect(nextGuide(GUIDE_START, { type: 'summon', inLab: false, blocked: true })).toEqual({ guide: GUIDE_START, action: null })
  })

  it('sigue siendo una vez por despertar: si ya fue o va corriendo, no arranca otra vez', () => {
    const summon: GuideEvent = { type: 'summon', inLab: false, blocked: false }
    expect(nextGuide({ status: 'running', count: 6 }, summon).action).toBeNull()
    expect(nextGuide({ status: 'done', count: 6 }, summon).action).toBeNull()
    const pageFirst = play([...times(6, touch()), { type: 'arrived' }]).guide
    expect(nextGuide(pageFirst, summon).action).toBeNull()
  })

  it('nunca repite la frase anterior y puede decir las ocho', () => {
    expect(FUN_ME_LINES).toHaveLength(8)
    const seen = new Set<number>()
    let previous: number | null = null
    for (let index = 0; index < 400; index++) {
      const line = pickMeLine(previous, Math.random)
      expect(line).not.toBe(previous)
      seen.add(line)
      previous = line
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([...FUN_ME_LINES])
    expect(pickMeLine(1, () => 0)).toBe(2)
    expect(pickMeLine(null, () => 0.999)).toBe(8)
  })

  it('las frases existen en ES y EN, y en inglés no quedan en español', () => {
    expect(es['fun.me.tease']).toBe('Uno más y te llevo a donde está lo bueno.')
    for (const lang of ['es', 'en'] as const) {
      const dict = funDictionary(lang)
      for (const line of FUN_ME_LINES) expect(dict[`fun.me.${line}`], `${lang} ${line}`).toBeTruthy()
      expect(dict['fun.me.tease']).toBeTruthy()
      expect(dict['fun.me.sulk']).toBeTruthy()
    }
    for (const key of Object.keys(es).filter((name) => name.startsWith('fun.me.'))) {
      expect(en[key as keyof typeof en], key).not.toBe(es[key as keyof typeof es])
    }
  })

  it('solo los píxeles del muñeco reciben el clic; la capa sigue sin recibir el puntero', () => {
    const styles = source('components', 'fun', 'Buddy.module.scss')
    expect(styles).toMatch(/\.layer \{[^}]*pointer-events: none/)
    expect(styles).toMatch(/rect \{\s*pointer-events: visiblePainted;/)
    expect(styles).toMatch(/\.layer\[data-phase='leaving'\] \.sprite rect \{\s*pointer-events: none;/)
    expect(source('components', 'fun', 'Buddy.tsx')).toContain('data-cw-fun-figure="" onClick={pokeMe}')
  })
})

describe('019 picarlo: nunca queda debajo del puntero', () => {
  const view = { width: 1280, height: 800 }

  it('con el mouse se pasa al otro lado cuando no cabe a la derecha o abajo', () => {
    const middle = followTarget({ x: 600, y: 400 }, SIZE, false, view, BOUNDS)
    expect(middle).toEqual({ x: 618, y: 418 })
    const corner = followTarget({ x: 1250, y: 760 }, SIZE, false, view, BOUNDS)
    expect(corner.x + SIZE.width).toBeLessThan(1250)
    expect(corner.y + SIZE.height).toBeLessThan(760)
  })

  it('con el dedo se pone encima; si no cabe arriba, debajo', () => {
    const roomy = followTarget({ x: 200, y: 500 }, SIZE, true, view, BOUNDS)
    expect(roomy.y + SIZE.height).toBeLessThan(500)
    const top = followTarget({ x: 188, y: 159 }, SIZE, true, view, BOUNDS)
    expect(top.y).toBeGreaterThan(159)
  })

  it('sin la pantalla, se comporta como en la 015', () => {
    expect(followTarget({ x: 1250, y: 760 }, SIZE, false)).toEqual({ x: 1268, y: 778 })
    expect(followTarget({ x: 188, y: 50 }, SIZE, true).y).toBe(50 - SIZE.height - 28)
  })

  it('con movimiento reducido, en escritorio su esquina queda encima del botón del asistente', () => {
    expect(source('components', 'fun', 'Buddy.module.scss')).toMatch(
      /:root:has\(\[data-cw-assistant-button\]\)\) \.layer\[data-reduced\] \.actor:not\(\[data-at\]\) \{\s*bottom: calc\(var\(--cw-space-5\) \+ 52px/,
    )
  })
})
