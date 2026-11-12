import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { funDictionary } from '@/components/fun/dictionary'
import {
  activity,
  approach,
  begLine,
  besideBox,
  bubbleAlign,
  canAnnounce,
  canCalm,
  clampToView,
  followTarget,
  levelFor,
  linePool,
  nearestBox,
  nextPhase,
  paceFor,
  pickLine,
  readWakes,
  recordWake,
  secondsLeft,
  settled,
  type FunStorage,
} from '@/components/fun/logic'
import { fillRuns, outlineRuns, OVERLAYS, PART_ORDER, PARTS, SPRITE_VIEWBOX, type Grid } from '@/components/fun/sprite'
import { shellLabels } from '@/components/shell/nav'
import { SiteFooter } from '@/components/shell/SiteFooter'
import { ToastProvider } from '@/components/ui/Toast'
import {
  FUN_ANNOUNCE_GAP_MS,
  FUN_BASE_LINES,
  FUN_BEG_LINE,
  FUN_CALM_AFTER_MS,
  FUN_HINT_LINE,
  FUN_LEVEL_LINES,
  FUN_POWER_AT_MS,
  FUN_STORAGE_KEY,
} from '@/content/fun'
import en from '@/content/i18n/en/fun.json'
import es from '@/content/i18n/es/fun.json'
import { site } from '@/content/site'
import { getDictionary } from '@/lib/i18n/server'

const ROOT = process.cwd()

const source = (file: string) => readFileSync(join(ROOT, 'components', 'fun', file), 'utf8')

function memoryStorage(initial: Record<string, string> = {}): FunStorage & { data: Record<string, string> } {
  const data = { ...initial }
  return { data, getItem: (key) => data[key] ?? null, setItem: (key, value) => void (data[key] = value) }
}

const brokenStorage: FunStorage = {
  getItem: () => {
    throw new Error('bloqueado')
  },
  setItem: () => {
    throw new Error('bloqueado')
  },
}

function sequence(values: number[]): () => number {
  let index = 0
  return () => values[index++ % values.length]!
}

describe('No tocar: textos en ES y EN', () => {
  it('ES y EN tienen las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
  })

  it('el botón y el regaño dicen lo que pidió el autor', () => {
    expect(es['fun.button']).toBe('Cuidado, no tocar')
    expect(es['fun.warned']).toBe('Oh no, te lo dije, no tocar. Ahora hazte responsable.')
    expect(en['fun.button']).toBe('Careful, do not touch')
  })

  it('cada frase que el muñeco puede decir existe en los dos idiomas', () => {
    const lines = [...FUN_BASE_LINES, ...FUN_LEVEL_LINES, FUN_HINT_LINE, FUN_BEG_LINE]
    for (const lang of ['es', 'en'] as const) {
      const dict = funDictionary(lang)
      for (const line of lines) expect(dict[`fun.line.${line}`], `${lang} fun.line.${line}`).toBeTruthy()
    }
  })

  it('en inglés no queda ninguna frase en español', () => {
    const dict = funDictionary('en')
    for (const [key, value] of Object.entries(dict)) expect(value, key).not.toBe(es[key as keyof typeof es])
  })
})

describe('No tocar: frases', () => {
  it('en el nivel 1 dice las 8 frases base; con memoria suma las de nivel', () => {
    expect(linePool(1)).toEqual([...FUN_BASE_LINES])
    expect(linePool(2)).toEqual([...FUN_BASE_LINES, ...FUN_LEVEL_LINES])
    expect(linePool(9)).toEqual(linePool(3))
  })

  it('nunca repite la frase anterior', () => {
    for (const previous of [...FUN_BASE_LINES]) {
      for (const random of [0, 0.25, 0.5, 0.99]) {
        expect(pickLine({ level: 1, elapsedMs: 1_000, previous, random: () => random })).not.toBe(previous)
      }
    }
  })

  it('antes del minuto no da la pista ni ruega solo', () => {
    const random = sequence([0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99])
    let previous: number | null = null
    for (let i = 0; i < 50; i++) {
      previous = pickLine({ level: 3, elapsedMs: FUN_CALM_AFTER_MS - 1, previous, random })
      expect([FUN_HINT_LINE, FUN_BEG_LINE]).not.toContain(previous)
    }
  })

  it('pasado el minuto, una de cada dos frases es la pista del botón', () => {
    const random = sequence([0.2, 0.6])
    const said: number[] = []
    let previous: number | null = 3
    for (let i = 0; i < 6; i++) {
      previous = pickLine({ level: 1, elapsedMs: FUN_CALM_AFTER_MS, previous, random })
      said.push(previous)
    }
    expect(said.filter((_, index) => index % 2 === 0)).toEqual([FUN_HINT_LINE, FUN_HINT_LINE, FUN_HINT_LINE])
    expect(said.filter((_, index) => index % 2 === 1)).not.toContain(FUN_HINT_LINE)
  })

  it('el primer ruego es el "minutico más"; los demás cuentan los segundos', () => {
    expect(begLine(0, 10_000)).toEqual({ key: 'line', line: FUN_BEG_LINE })
    expect(begLine(1, 10_000)).toEqual({ key: 'beg', seconds: 50 })
    expect(begLine(2, FUN_CALM_AFTER_MS - 200)).toEqual({ key: 'beg', seconds: 1 })
  })

  it('la región aria-live espera entre frases automáticas', () => {
    expect(canAnnounce(0, null)).toBe(true)
    expect(canAnnounce(FUN_ANNOUNCE_GAP_MS - 1, 0)).toBe(false)
    expect(canAnnounce(FUN_ANNOUNCE_GAP_MS, 0)).toBe(true)
    expect(FUN_ANNOUNCE_GAP_MS).toBeGreaterThanOrEqual(5_000)
  })

  it('el nivel aparece en la frase de nivel', () => {
    const dict = funDictionary('es')
    expect(dict['fun.line.12']!.replace('{level}', '2')).toBe('Nivel 2 de cansonería desbloqueado.')
  })
})

describe('No tocar: temporizador para calmarlo', () => {
  it('se calma pasado 1 o 2 minutos, y se pone cansón a mitad de camino', () => {
    expect(FUN_CALM_AFTER_MS).toBeGreaterThanOrEqual(60_000)
    expect(FUN_CALM_AFTER_MS).toBeLessThanOrEqual(120_000)
    expect(FUN_POWER_AT_MS).toBeLessThan(FUN_CALM_AFTER_MS)
  })

  it('antes del minuto, el botón no lo despide: ruega', () => {
    expect(nextPhase('awake', { type: 'press', elapsedMs: 0 })).toEqual({ phase: 'awake', reply: 'beg' })
    expect(nextPhase('awake', { type: 'press', elapsedMs: FUN_CALM_AFTER_MS - 1 })).toEqual({ phase: 'awake', reply: 'beg' })
    expect(nextPhase('sulking', { type: 'press', elapsedMs: 5_000 })).toEqual({ phase: 'sulking', reply: 'beg' })
  })

  it('pasado el minuto, volver a encontrar el botón lo despide, quieto o no', () => {
    expect(nextPhase('awake', { type: 'press', elapsedMs: FUN_CALM_AFTER_MS })).toEqual({ phase: 'leaving', reply: 'bye' })
    expect(nextPhase('sulking', { type: 'press', elapsedMs: 90_000 })).toEqual({ phase: 'leaving', reply: 'bye' })
    expect(canCalm(FUN_CALM_AFTER_MS)).toBe(true)
    expect(secondsLeft(0)).toBe(FUN_CALM_AFTER_MS / 1000)
    expect(secondsLeft(FUN_CALM_AFTER_MS + 5_000)).toBe(0)
  })

  it('Esc lo deja quieto al instante (WCAG 2.2.2); "Quieto" alterna', () => {
    expect(nextPhase('awake', { type: 'escape' })).toEqual({ phase: 'sulking', reply: 'sulk' })
    expect(nextPhase('sulking', { type: 'escape' })).toEqual({ phase: 'sulking', reply: null })
    expect(nextPhase('awake', { type: 'toggle' })).toEqual({ phase: 'sulking', reply: 'sulk' })
    expect(nextPhase('sulking', { type: 'toggle' })).toEqual({ phase: 'awake', reply: 'free' })
  })

  it('cuando se va, ya no responde a nada', () => {
    for (const event of [{ type: 'escape' }, { type: 'toggle' }, { type: 'press', elapsedMs: 0 }] as const) {
      expect(nextPhase('leaving', event)).toEqual({ phase: 'leaving', reply: null })
    }
  })
})

describe('No tocar: movimiento reducido y pausa', () => {
  it('con movimiento reducido no persigue ni pica, pero habla', () => {
    expect(activity('awake', true)).toEqual({ chase: false, pokes: false, lines: true, animate: false })
  })

  it('quieto no se mueve, no pica, no habla solo y no anima', () => {
    expect(activity('sulking', false)).toEqual({ chase: false, pokes: false, lines: false, animate: false })
    expect(activity('sulking', true)).toEqual({ chase: false, pokes: false, lines: false, animate: false })
  })

  it('despierto y sin preferencia, persigue y pica', () => {
    expect(activity('awake', false)).toEqual({ chase: true, pokes: true, lines: true, animate: true })
    expect(activity('leaving', false)).toMatchObject({ chase: false, pokes: false, lines: false })
  })
})

describe('No tocar: memoria local', () => {
  it('cuenta las veces que lo despertaron y sube de nivel hasta 3', () => {
    const storage = memoryStorage()
    expect(recordWake(storage)).toBe(1)
    expect(recordWake(storage)).toBe(2)
    expect(storage.data[FUN_STORAGE_KEY]).toBe('2')
    expect([1, 2, 3, 4, 50].map(levelFor)).toEqual([1, 2, 3, 3, 3])
    expect(levelFor(0)).toBe(1)
    expect(levelFor(Number.NaN)).toBe(1)
  })

  it('sin almacenamiento o con almacenamiento bloqueado, sigue funcionando', () => {
    expect(readWakes(null)).toBe(0)
    expect(recordWake(null)).toBe(1)
    expect(readWakes(brokenStorage)).toBe(0)
    expect(recordWake(brokenStorage)).toBe(1)
    expect(readWakes(memoryStorage({ [FUN_STORAGE_KEY]: 'basura' }))).toBe(0)
    expect(readWakes(memoryStorage({ [FUN_STORAGE_KEY]: '-4' }))).toBe(0)
  })

  it('con más nivel habla y pica más seguido; en modo cansón máximo, más todavía', () => {
    expect(paceFor(3, false).lineMs).toBeLessThan(paceFor(1, false).lineMs)
    expect(paceFor(3, false).pokeMs).toBeLessThan(paceFor(1, false).pokeMs)
    expect(paceFor(1, true).rate).toBeGreaterThan(paceFor(1, false).rate)
    for (const level of [1, 2, 3]) {
      expect(paceFor(level, true).lineMs).toBeGreaterThanOrEqual(4_000)
      expect(paceFor(level, true).pokeMs).toBeGreaterThanOrEqual(700)
    }
  })
})

describe('No tocar: seguir el puntero sin tapar', () => {
  const size = { width: 75, height: 99 }
  const view = { width: 400, height: 800 }

  it('se acerca al objetivo sin pasarse y llega', () => {
    let point = { x: 0, y: 0 }
    const goal = { x: 100, y: 50 }
    for (let i = 0; i < 120; i++) {
      const next = approach(point, goal, 16, 6)
      expect(next.x).toBeLessThanOrEqual(goal.x)
      point = next
    }
    expect(settled(point, goal)).toBe(true)
    expect(approach(point, goal, 10_000, 6).x).toBeLessThanOrEqual(goal.x)
  })

  it('no se sale de la pantalla', () => {
    expect(clampToView({ x: -50, y: -50 }, size, view, { top: 84, margin: 4 })).toEqual({ x: 4, y: 84 })
    expect(clampToView({ x: 900, y: 900 }, size, view, { top: 84, margin: 4 })).toEqual({ x: 321, y: 697 })
  })

  it('con el dedo se pone encima del toque; con el mouse, al lado', () => {
    const touch = followTarget({ x: 200, y: 400 }, size, true)
    expect(touch.y + size.height).toBeLessThan(400)
    const mouse = followTarget({ x: 200, y: 400 }, size, false)
    expect(mouse.x).toBeGreaterThan(200)
    expect(mouse.y).toBeGreaterThan(400)
  })

  it('con el teclado se para al lado del foco, no encima', () => {
    const right = besideBox({ left: 10, top: 100, width: 100, height: 40 }, size, view)
    expect(right.x).toBeGreaterThanOrEqual(110)
    const left = besideBox({ left: 300, top: 100, width: 90, height: 40 }, size, view)
    expect(left.x + size.width).toBeLessThanOrEqual(300)
  })

  it('pica el botón más cercano dentro del radio y no los invisibles', () => {
    const boxes = [
      { left: 0, top: 0, width: 20, height: 20 },
      { left: 100, top: 100, width: 0, height: 20 },
      { left: 120, top: 100, width: 30, height: 30 },
    ]
    expect(nearestBox({ x: 110, y: 110 }, boxes, 200)).toBe(2)
    expect(nearestBox({ x: 600, y: 600 }, boxes, 200)).toBeNull()
  })

  it('la burbuja se alinea para no salirse por los bordes', () => {
    expect(bubbleAlign(10, size, view)).toBe('start')
    expect(bubbleAlign(150, size, view)).toBe('center')
    expect(bubbleAlign(300, size, view)).toBe('end')
  })
})

describe('No tocar: el sprite', () => {
  const grids: [string, Grid][] = [...PART_ORDER.map((name) => [name, PARTS[name]] as [string, Grid]), ...Object.entries(OVERLAYS)]

  it('cada cuadrícula es rectangular y solo usa colores conocidos', () => {
    for (const [name, grid] of grids) {
      const width = grid.rows[0]!.length
      for (const row of grid.rows) {
        expect(row.length, name).toBe(width)
        expect(row, name).toMatch(/^[.hfsSkgGtwbm]+$/)
      }
    }
  })

  it('todo cabe en el viewBox, con contorno incluido', () => {
    const { x, y, width, height } = SPRITE_VIEWBOX
    for (const [name, grid] of grids) {
      for (const run of [...fillRuns(grid), ...outlineRuns(grid)]) {
        expect(run.x, name).toBeGreaterThanOrEqual(x)
        expect(run.y, name).toBeGreaterThanOrEqual(y)
        expect(run.x + run.w, name).toBeLessThanOrEqual(x + width)
        expect(run.y + 1, name).toBeLessThanOrEqual(y + height)
      }
    }
  })

  it('el contorno rodea la figura sin pisarla', () => {
    for (const [name, grid] of grids) {
      const cells = new Set(fillRuns(grid).flatMap((run) => Array.from({ length: run.w }, (_, i) => `${run.x + i}:${run.y}`)))
      for (const run of outlineRuns(grid)) for (let i = 0; i < run.w; i++) expect(cells.has(`${run.x + i}:${run.y}`), name).toBe(false)
    }
  })

  it('las bocas de puchero y de grito tapan la sonrisa entera', () => {
    const smile = PARTS.head
    for (const overlay of [OVERLAYS.pout, OVERLAYS.yell]) {
      overlay.rows.forEach((row, dy) => {
        const headRow = smile.rows[overlay.y - smile.y + dy]!
        for (let i = 0; i < row.length; i++) {
          const headCell = headRow[overlay.x - smile.x + i]
          if (headCell === 'm' || headCell === 'w') expect(row[i]).not.toBe('.')
        }
      })
    }
  })

  it('lleva gafas de escudo verdes, barba y camiseta negra, como el retrato', () => {
    const head = PARTS.head.rows.join('')
    expect(head).toContain('g')
    expect(head).toContain('b')
    expect(PARTS.torso.rows.join('')).toContain('t')
  })
})

describe('No tocar: liviano, sin JS no aparece, y solo finge', () => {
  it('el botón carga el muñeco con import dinámico, nunca estático', () => {
    const button = source('NoTocarButton.tsx')
    expect(button).toContain("import('./Buddy')")
    expect(button).not.toMatch(/^import \{[^}]*\} from '\.\/Buddy'/m)
    expect(button).toMatch(/^import type \{ BuddyProps \} from '\.\/Buddy'/m)
    expect(button).toContain("'cw-js-only'")
  })

  it('el muñeco no dispara clics, no navega, no envía ni roba el foco', () => {
    for (const file of ['Buddy.tsx', 'BuddySprite.tsx', 'logic.ts']) {
      const code = source(file)
      expect(code, file).not.toMatch(/\.click\(|dispatchEvent|requestSubmit|\.submit\(|\.focus\(|location\.|history\.|router\./)
    }
  })

  it('la capa no recibe el puntero; solo el botón "Quieto"', () => {
    const styles = source('Buddy.module.scss')
    expect(styles).toMatch(/\.layer \{[^}]*pointer-events: none/)
    expect(styles).toMatch(/\.calm \{[^}]*pointer-events: auto/)
  })

  it.each(['es', 'en'] as const)('%s: el footer monta el botón debajo del tío Bob', async (lang) => {
    const labels = shellLabels(await getDictionary(lang, 'common'))
    const Provider = ToastProvider as (props: { closeLabel: string; children?: ReactNode }) => ReactElement
    const html = renderToStaticMarkup(createElement(Provider, { closeLabel: 'x' }, createElement(SiteFooter, { lang, socials: site.socials, labels })))
    const egg = html.indexOf('data-cw-footer-egg')
    const button = html.indexOf('data-cw-no-tocar')
    expect(egg).toBeGreaterThan(-1)
    expect(button).toBeGreaterThan(egg)
    expect(html).toContain(`<span>${funDictionary(lang)['fun.button']}</span>`)
    expect(html).not.toContain('data-cw-fun=')
  })
})
