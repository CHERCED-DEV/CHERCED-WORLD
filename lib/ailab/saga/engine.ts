export const SAGA_SERVICES = ['flight', 'hotel', 'car'] as const

export type SagaService = (typeof SAGA_SERVICES)[number]

export const SAGA_PIVOT = 'payment'

export const SAGA_STEPS = [...SAGA_SERVICES, SAGA_PIVOT] as const

export type SagaStep = (typeof SAGA_STEPS)[number]

export type SagaFailure = SagaStep | null

export const SAGA_FAILURES: readonly SagaFailure[] = [null, ...SAGA_STEPS]

export type SagaKind = 'booking' | 'hold' | 'charge'

export const SAGA_KIND: Readonly<Record<SagaStep, SagaKind>> = {
  flight: 'booking',
  hotel: 'hold',
  car: 'hold',
  payment: 'charge',
}

export const SAGA_REFS: Readonly<Record<SagaStep, string>> = {
  flight: 'VU-7Q2K',
  hotel: 'HT-3105',
  car: 'AU-88C',
  payment: 'PG-5521',
}

export type SagaCompensation = 'cancel' | 'release'

export type SagaOutcome = 'completed' | 'compensated'

export type SagaEvent =
  | { type: 'start' }
  | { type: 'request'; step: SagaStep }
  | { type: 'done'; step: SagaStep; kind: SagaKind; ref: string }
  | { type: 'fail'; step: SagaStep }
  | { type: 'compensate'; step: SagaService; action: SagaCompensation; ref: string }
  | { type: 'confirm'; step: SagaService; ref: string }
  | { type: 'end'; outcome: SagaOutcome }

export type SagaRun = { failAt: SagaFailure; events: readonly SagaEvent[]; outcome: SagaOutcome }

export type SagaStepStatus = 'pending' | 'running' | 'booked' | 'held' | 'charged' | 'failed' | 'cancelled' | 'released'

export type SagaPhase = 'idle' | 'forward' | 'compensating' | SagaOutcome

export type SagaSnapshot = {
  phase: SagaPhase
  steps: Record<SagaStep, SagaStepStatus>
  released: number
  cancelled: number
}

type Completed = { step: SagaService; kind: 'booking' | 'hold'; ref: string }

export function isSagaFailure(value: unknown): value is SagaFailure {
  return value === null || (typeof value === 'string' && (SAGA_STEPS as readonly string[]).includes(value))
}

export function compensationFor(kind: Completed['kind']): SagaCompensation {
  return kind === 'booking' ? 'cancel' : 'release'
}

function compensate(done: readonly Completed[]): SagaEvent[] {
  return [...done].reverse().map(({ step, kind, ref }) => ({
    type: 'compensate',
    step,
    action: compensationFor(kind),
    ref,
  }))
}

export function runSaga(failAt: SagaFailure): SagaRun {
  if (!isSagaFailure(failAt)) throw new TypeError(`runSaga: paso desconocido "${String(failAt)}"`)
  const events: SagaEvent[] = [{ type: 'start' }]
  const done: Completed[] = []
  for (const step of SAGA_SERVICES) {
    events.push({ type: 'request', step })
    if (step === failAt) {
      events.push({ type: 'fail', step }, ...compensate(done), { type: 'end', outcome: 'compensated' })
      return { failAt, events, outcome: 'compensated' }
    }
    const kind = SAGA_KIND[step] as Completed['kind']
    events.push({ type: 'done', step, kind, ref: SAGA_REFS[step] })
    done.push({ step, kind, ref: SAGA_REFS[step] })
  }
  events.push({ type: 'request', step: SAGA_PIVOT })
  if (failAt === SAGA_PIVOT) {
    events.push({ type: 'fail', step: SAGA_PIVOT }, ...compensate(done), { type: 'end', outcome: 'compensated' })
    return { failAt, events, outcome: 'compensated' }
  }
  events.push({ type: 'done', step: SAGA_PIVOT, kind: 'charge', ref: SAGA_REFS[SAGA_PIVOT] })
  for (const item of done) if (item.kind === 'hold') events.push({ type: 'confirm', step: item.step, ref: item.ref })
  events.push({ type: 'end', outcome: 'completed' })
  return { failAt, events, outcome: 'completed' }
}

const DONE_STATUS: Readonly<Record<SagaKind, SagaStepStatus>> = { booking: 'booked', hold: 'held', charge: 'charged' }

function initialSteps(): Record<SagaStep, SagaStepStatus> {
  return { flight: 'pending', hotel: 'pending', car: 'pending', payment: 'pending' }
}

export function snapshot(events: readonly SagaEvent[]): SagaSnapshot {
  const state: SagaSnapshot = { phase: 'idle', steps: initialSteps(), released: 0, cancelled: 0 }
  for (const event of events) {
    switch (event.type) {
      case 'start':
        state.phase = 'forward'
        break
      case 'request':
        state.steps[event.step] = 'running'
        break
      case 'done':
        state.steps[event.step] = DONE_STATUS[event.kind]
        break
      case 'fail':
        state.steps[event.step] = 'failed'
        state.phase = 'compensating'
        break
      case 'compensate':
        state.steps[event.step] = event.action === 'cancel' ? 'cancelled' : 'released'
        if (event.action === 'cancel') state.cancelled += 1
        else state.released += 1
        break
      case 'confirm':
        state.steps[event.step] = 'booked'
        break
      case 'end':
        state.phase = event.outcome
        break
    }
  }
  return state
}

export function snapshotAt(run: SagaRun, cursor: number): SagaSnapshot {
  return snapshot(run.events.slice(0, Math.max(0, Math.min(cursor, run.events.length))))
}

export function messageKey(event: SagaEvent): string {
  switch (event.type) {
    case 'start':
      return 'start'
    case 'request':
    case 'done':
    case 'fail':
    case 'confirm':
      return `${event.type}.${event.step}`
    case 'compensate':
      return `${event.action}.${event.step}`
    case 'end':
      return `end.${event.outcome}`
  }
}

export function messageVars(event: SagaEvent): Record<string, string> {
  return 'ref' in event ? { ref: event.ref } : {}
}
