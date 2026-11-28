import type { GateRun, MergedFinding, SpecBreve } from '@/lib/ai/gates/schema'

export const SPEC: SpecBreve = {
  title: 'Formulario de contacto con adjuntos',
  problem: 'Las personas que escriben al estudio no pueden mandar archivos con su mensaje.',
  includes: ['Un formulario con nombre, correo, mensaje y adjuntos.', 'Un aviso por correo al estudio.'],
  excludes: ['Chat en vivo.'],
  requirements: [
    { id: 'R-1', text: 'El formulario acepta hasta 3 adjuntos de 5 MB o menos cada uno, en PDF, PNG o JPG.' },
    { id: 'R-2', text: 'Al enviar, el estudio recibe un correo con el mensaje y los adjuntos.' },
  ],
  criteria: [
    { id: 'C-1', covers: ['R-1'], given: 'un adjunto de 6 MB', when: 'la persona lo envía', then: 'el formulario lo rechaza y dice que el máximo es 5 MB' },
    { id: 'C-2', covers: ['R-2'], given: 'un mensaje válido con un adjunto', when: 'la persona lo envía', then: 'el estudio recibe un correo con el mensaje y el adjunto' },
  ],
  questions: [{ id: 'Q-1', question: '¿Cuánto tiempo se guardan los adjuntos?', byDefault: 'Se borran a los 30 días.' }],
}

export function finding(overrides: Partial<MergedFinding> = {}): MergedFinding {
  return {
    id: 'H-1',
    criterion: 'verificable',
    gravity: 'importante',
    where: 'C-2',
    problem: 'No dice cuánto tarda el correo.',
    fix: 'Agrega el tiempo máximo.',
    confidence: 0.8,
    origin: 'revisor',
    rules: [],
    reporters: [{ seat: 'claude', provider: 'claude', gravity: 'importante', confidence: 0.8, problem: 'No dice cuánto tarda el correo.', fix: 'Agrega el tiempo máximo.' }],
    seenByBoth: false,
    verification: null,
    carried: false,
    ...overrides,
  }
}

export function run(overrides: Partial<GateRun> = {}): GateRun {
  return {
    schemaVersion: 1,
    id: '2026-11-28T12-00-00-000Z',
    at: '2026-11-28T12:00:00.000Z',
    mode: 'vivo',
    simulated: false,
    rubricVersion: '046-v1',
    request: { text: 'Quiero un formulario de contacto con adjuntos.', lang: 'es', source: 'propio', exampleId: null },
    writer: { seat: 'gemini', provider: 'gemini' },
    rounds: [{ round: 1, spec: SPEC, draft: null, findings: [finding()], reviewed: true, reviewers: ['claude'], changed: null, comment: null }],
    steps: [
      {
        kind: 'redactar',
        round: 1,
        provider: 'gemini',
        seat: 'gemini',
        model: 'gemini-3.8-flash',
        attempts: [],
        inputTokens: 1800,
        outputTokens: 1500,
        latencyMs: 4000,
        costUsd: 0.007,
        status: 'ok',
        count: 2,
        ids: [],
        reason: null,
      },
    ],
    notes: [],
    recommendation: 'con-reservas',
    stop: 'dos-rondas',
    totalUsd: 0.007,
    totalCop: 23,
    capUsd: 0.05,
    copRate: { value: 3297, date: '2026-11-11' },
    pricesCheckedAt: { gemini: '2026-11-27', claude: '2026-11-27', openai: '2026-11-27' },
    seal: null,
    ...overrides,
  }
}
