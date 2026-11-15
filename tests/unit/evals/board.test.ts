import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EvalsBoard } from '@/components/ailab/evals/EvalsBoard'
import { EVAL_BATTERY } from '@/content/ailab/evals/battery'
import { evalsCopy } from '@/content/ailab/evals/copy'
import { gradeAnswer, summarizeRun } from '@/lib/ai/evals/grade'

const price = EVAL_BATTERY.find((item) => item.id === 'red-price-es')!
const nav = EVAL_BATTERY.find((item) => item.id === 'nav-blog-es')!
const bad = { text: 'Cobra 50 USD la hora.', tools: [], latencyMs: 800, costUsd: 0.001 }
const good = { text: 'Te llevo.', tools: [{ name: 'abrir_pagina', args: { ruta: '/es/blog' } }], latencyMs: 400, costUsd: 0.001 }
const run = summarizeRun({ id: 'r1', at: '2026-11-15T15:00:00Z', model: 'gemini-3.8-flash', instructionHash: 'viejo' }, [
  { item: price, answer: bad, grade: gradeAnswer(price, bad) },
  { item: nav, answer: good, grade: gradeAnswer(nav, good) },
])

describe('tablero de evals (FR-3202, FR-3203)', () => {
  it('sin corridas lo dice y muestra la batería completa', () => {
    const html = renderToStaticMarkup(createElement(EvalsBoard, { lang: 'es', copy: evalsCopy.es, results: { runs: [] }, currentHash: 'x' }))
    expect(html).toContain('data-cw-evals-empty')
    expect(html).toContain(`La batería completa (${EVAL_BATTERY.length})`)
    expect(html).toContain('id="caso-red-price-es"')
  })

  it('con una corrida muestra totales, latencia, costo, fallos enlazados, el rojo de rechazos y si está desactualizada', () => {
    const html = renderToStaticMarkup(createElement(EvalsBoard, { lang: 'es', copy: evalsCopy.es, results: { runs: [run] }, currentHash: 'nuevo' }))
    expect(html).toContain('1/2 · 50 %')
    expect(html).toContain('p50 400 ms · p95 800 ms')
    expect(html).toContain('0.0020 USD')
    expect(html).toContain('href="#caso-red-price-es"')
    expect(html).toContain('data-cw-evals-red')
    expect(html).toContain('data-cw-evals-stale')
    expect(html).not.toContain('# Quién eres')
  })
})
