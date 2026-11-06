import { describe, expect, it } from 'vitest'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import {
  SAGA_FAILURES,
  SAGA_REFS,
  SAGA_STEPS,
  compensationFor,
  isSagaFailure,
  messageKey,
  messageVars,
  runSaga,
  snapshot,
  snapshotAt,
  type SagaEvent,
  type SagaFailure,
} from '@/lib/ailab/saga/engine'

function compact(events: readonly SagaEvent[]): string[] {
  return events.map((event) => {
    if (event.type === 'start') return 'start'
    if (event.type === 'end') return `end:${event.outcome}`
    if (event.type === 'compensate') return `${event.action}:${event.step}`
    return `${event.type}:${event.step}`
  })
}

describe('motor de saga (FR-354, T740)', () => {
  it('sin fallos: reserva vuelo, aparta hotel y auto, cobra y confirma los apartados', () => {
    const run = runSaga(null)
    expect(run.outcome).toBe('completed')
    expect(compact(run.events)).toEqual([
      'start',
      'request:flight',
      'done:flight',
      'request:hotel',
      'done:hotel',
      'request:car',
      'done:car',
      'request:payment',
      'done:payment',
      'confirm:hotel',
      'confirm:car',
      'end:completed',
    ])
    expect(run.events.filter((event) => event.type === 'done').map((event) => (event.type === 'done' ? event.kind : null))).toEqual([
      'booking',
      'hold',
      'hold',
      'charge',
    ])
    expect(snapshot(run.events)).toEqual({
      phase: 'completed',
      steps: { flight: 'booked', hotel: 'booked', car: 'booked', payment: 'charged' },
      released: 0,
      cancelled: 0,
    })
  })

  it('si cae la aerolínea, el primer paso, no hay nada que compensar', () => {
    const run = runSaga('flight')
    expect(compact(run.events)).toEqual(['start', 'request:flight', 'fail:flight', 'end:compensated'])
    expect(snapshot(run.events).steps).toEqual({ flight: 'failed', hotel: 'pending', car: 'pending', payment: 'pending' })
  })

  it('si cae el hotel, solo se cancela la reserva del vuelo', () => {
    const run = runSaga('hotel')
    expect(compact(run.events)).toEqual(['start', 'request:flight', 'done:flight', 'request:hotel', 'fail:hotel', 'cancel:flight', 'end:compensated'])
    expect(snapshot(run.events)).toMatchObject({ phase: 'compensated', cancelled: 1, released: 0 })
  })

  it('si cae la agencia de autos, se suelta el hotel y después se cancela el vuelo', () => {
    const run = runSaga('car')
    expect(compact(run.events)).toEqual([
      'start',
      'request:flight',
      'done:flight',
      'request:hotel',
      'done:hotel',
      'request:car',
      'fail:car',
      'release:hotel',
      'cancel:flight',
      'end:compensated',
    ])
    expect(snapshot(run.events).steps).toEqual({ flight: 'cancelled', hotel: 'released', car: 'failed', payment: 'pending' })
  })

  it('si cae la pasarela en mitad del cobro, compensa en orden inverso: auto, hotel y vuelo', () => {
    const run = runSaga('payment')
    expect(run.outcome).toBe('compensated')
    const compensations = run.events.filter((event) => event.type === 'compensate')
    expect(compact(compensations)).toEqual(['release:car', 'release:hotel', 'cancel:flight'])
    expect(compensations.map((event) => (event.type === 'compensate' ? event.ref : ''))).toEqual([SAGA_REFS.car, SAGA_REFS.hotel, SAGA_REFS.flight])
    expect(run.events.some((event) => event.type === 'done' && event.step === 'payment')).toBe(false)
    expect(run.events.some((event) => event.type === 'confirm')).toBe(false)
    expect(snapshot(run.events)).toEqual({
      phase: 'compensated',
      steps: { flight: 'cancelled', hotel: 'released', car: 'released', payment: 'failed' },
      released: 2,
      cancelled: 1,
    })
  })

  it('distingue la reserva confirmada del apartado: una se cancela y el otro se suelta', () => {
    expect(compensationFor('booking')).toBe('cancel')
    expect(compensationFor('hold')).toBe('release')
    for (const failAt of SAGA_FAILURES) {
      for (const event of runSaga(failAt).events) {
        if (event.type === 'compensate') expect(event.action, `${String(failAt)}: ${event.step}`).toBe(event.step === 'flight' ? 'cancel' : 'release')
      }
    }
  })

  it('compensa exactamente lo que quedó hecho antes del fallo, del último al primero', () => {
    for (const failAt of SAGA_STEPS) {
      const events = runSaga(failAt).events
      const failIndex = events.findIndex((event) => event.type === 'fail')
      const done = events
        .slice(0, failIndex)
        .flatMap((event) => (event.type === 'done' ? [event.step] : []))
        .reverse()
      const undone = events.slice(failIndex).flatMap((event) => (event.type === 'compensate' ? [event.step] : []))
      expect(undone, failAt).toEqual(done)
      expect(events.at(-1), failAt).toEqual({ type: 'end', outcome: 'compensated' })
    }
  })

  it('es determinista: el mismo fallo da siempre la misma traza', () => {
    for (const failAt of SAGA_FAILURES) expect(runSaga(failAt)).toEqual(runSaga(failAt))
  })

  it('rechaza un paso que no existe', () => {
    expect(isSagaFailure('hotel')).toBe(true)
    expect(isSagaFailure(null)).toBe(true)
    expect(isSagaFailure('tren')).toBe(false)
    expect(() => runSaga('tren' as SagaFailure)).toThrow(TypeError)
  })

  it('el diagrama avanza evento a evento y se puede volver al inicio', () => {
    const run = runSaga('payment')
    expect(snapshotAt(run, 0)).toMatchObject({ phase: 'idle', steps: { flight: 'pending', payment: 'pending' } })
    expect(snapshotAt(run, 2).steps.flight).toBe('running')
    expect(snapshotAt(run, 3).steps.flight).toBe('booked')
    expect(snapshotAt(run, 5).steps.hotel).toBe('held')
    expect(snapshotAt(run, 9)).toMatchObject({ phase: 'compensating', steps: { payment: 'failed', car: 'held' } })
    expect(snapshotAt(run, 10).steps.car).toBe('released')
    expect(snapshotAt(run, 99)).toEqual(snapshot(run.events))
    expect(snapshotAt(run, -3).phase).toBe('idle')
  })
})

describe('bitácora de la saga (T741)', () => {
  it('cada evento de cada traza tiene su texto en ES y EN, con su referencia', () => {
    const seen = new Set<string>()
    for (const failAt of SAGA_FAILURES) {
      for (const event of runSaga(failAt).events) {
        const key = `ailab.r1.log.${messageKey(event)}`
        seen.add(key)
        for (const dict of [es, en] as Array<Record<string, string>>) {
          expect(dict[key], key).toBeTypeOf('string')
          const vars = messageVars(event)
          if (vars.ref) expect(dict[key], key).toContain('{ref}')
          else expect(dict[key], key).not.toContain('{ref}')
        }
      }
    }
    const declared = Object.keys(es).filter((key) => key.startsWith('ailab.r1.log.'))
    expect([...seen].sort()).toEqual(declared.sort())
  })

  it('las compensaciones dicen en el texto si cancelan una reserva o sueltan un apartado', () => {
    expect(es['ailab.r1.log.cancel.flight']).toMatch(/cancela la reserva/)
    expect(es['ailab.r1.log.release.hotel']).toMatch(/suelta el apartado/)
    expect(en['ailab.r1.log.cancel.flight']).toMatch(/cancels? the booking/i)
    expect(en['ailab.r1.log.release.car']).toMatch(/releases? the hold/i)
  })
})
