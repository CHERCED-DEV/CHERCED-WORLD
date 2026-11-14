import { describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { catalogText, evidenceCatalog, evidenceOf } = await import('@/lib/ai/match/catalog')
const { coverageOf, isMatchResult, MATCH_MAX_EVIDENCE, MATCH_MAX_REQUIREMENTS, MATCH_QUESTIONS, MATCH_TEXT_MAX } = await import('@/lib/ai/match/config')
const { MATCH_OUTPUT_SCHEMA, MatchOutputError, parseModelMatch, sanitizeMatch } = await import('@/lib/ai/match/sanitize')
const { meaningfulQuery, simulateMatch, splitRequirements, vacancyLanguage, vacancyRole } = await import('@/lib/ai/match/simulator')
const { prefilledMessage, preselectedInterest, ROLE_MAX } = await import('@/components/contact/preselect')

const index = await buildSearchIndex('es')
const indexEn = await buildSearchIndex('en')
const catalog = evidenceCatalog(index)

function output(requisitos: unknown[], extra: Record<string, unknown> = {}) {
  return { rol: 'Arquitecto', requisitos, preguntas: ['¿Uno?', '¿Dos?', '¿Tres?', '¿Cuatro?'], ...extra }
}

describe('catálogo de evidencia (029)', () => {
  it('trae los documentos públicos del índice y una entrada por cada decisión de los casos', () => {
    const ids = catalog.entries.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const doc of index.docs.filter((item) => !/\.pdf/i.test(item.url))) expect(ids).toContain(doc.id)
    const decisions = catalog.entries.filter((entry) => entry.kind === 'decision')
    expect(decisions).toHaveLength(index.facts.projects.reduce((total, project) => total + project.adrs.length, 0))
    expect(decisions[0]!.id).toMatch(/^decision:[\w-]+-1$/)
    const project = index.facts.projects.find((item) => item.adrs.length > 0)!
    expect(catalog.byId.get(`decision:${project.id}-1`)).toMatchObject({ url: project.url, title: `${project.title}: ${project.adrs[0]!.decision}` })
  })

  it('el texto para el modelo lleva cada id entre corchetes y recorta los textos largos', () => {
    const text = catalogText(catalog)
    expect(text.split('\n')).toHaveLength(catalog.entries.length)
    expect(text).toContain('[project:12] (project) Synergos — ')
    for (const entry of catalog.entries) expect(entry.text.length).toBeLessThanOrEqual(700)
  })

  it('evidenceOf solo reconoce ids que existen', () => {
    expect(evidenceOf(catalog, ' project:12 ')).toMatchObject({ id: 'project:12', kind: 'project' })
    expect(evidenceOf(catalog, 'project:999')).toBeNull()
  })
})

describe('salida estructurada y guarda contra inventos (FR-2901, FR-2902)', () => {
  it('el esquema pide rol, requisitos con nivel y evidencia, y preguntas', () => {
    expect(MATCH_OUTPUT_SCHEMA.required).toEqual(['rol', 'requisitos', 'preguntas'])
    expect(MATCH_OUTPUT_SCHEMA.properties.requisitos.items.properties.nivel.enum).toEqual(['fuerte', 'parcial', 'sin_evidencia'])
  })

  it('descarta ids que no existen y baja a sin_evidencia lo que se queda sin pruebas, diga lo que diga el modelo', () => {
    const result = sanitizeMatch(
      parseModelMatch(
        output([
          { texto: 'React y Next.js', tipo: 'obligatorio', nivel: 'fuerte', evidencia: ['project:2', 'project:999', '[project:12]'], nota: 'Lo hizo.' },
          { texto: 'Kubernetes', tipo: 'obligatorio', nivel: 'fuerte', evidencia: ['proyecto-inventado'], nota: 'Inventado.' },
          { texto: 'Umbraco', tipo: 'deseable', nivel: 'sin_evidencia', evidencia: ['project:12'], nota: 'No.' },
        ]),
      ),
      catalog,
      'live',
      0.012,
    )
    expect(result.requirements.map((item) => [item.text, item.level, item.evidence.map((entry) => entry.id)])).toEqual([
      ['React y Next.js', 'fuerte', ['project:2', 'project:12']],
      ['Kubernetes', 'sin_evidencia', []],
      ['Umbraco', 'sin_evidencia', []],
    ])
    expect(result.dropped).toBe(2)
    expect(result.coverage).toEqual({ total: 3, covered: 1, required: 2, requiredCovered: 1 })
    expect(result.costUsd).toBe(0.012)
    expect(result.questions).toHaveLength(MATCH_QUESTIONS)
    expect(isMatchResult(result)).toBe(true)
  })

  it('quita duplicados, corrige tipos y niveles raros y respeta los topes', () => {
    const many = Array.from({ length: MATCH_MAX_REQUIREMENTS + 5 }, (_, position) => ({
      texto: `Requisito número ${position} ${'x'.repeat(400)}`,
      tipo: 'imprescindible',
      nivel: 'excelente',
      evidencia: ['project:2', 'project:12', 'project:13', 'project:15'],
      nota: 'n',
    }))
    const result = sanitizeMatch(
      parseModelMatch(output([{ texto: 'Requisito número 0 ' + 'x'.repeat(400), tipo: 'deseable', nivel: 'parcial', evidencia: [], nota: '' }, ...many])),
      catalog,
      'live',
    )
    expect(result.requirements).toHaveLength(MATCH_MAX_REQUIREMENTS)
    expect(result.requirements[0]).toMatchObject({ kind: 'deseable', level: 'sin_evidencia' })
    expect(result.requirements[1]).toMatchObject({ kind: 'obligatorio', level: 'sin_evidencia' })
    for (const item of result.requirements) {
      expect(item.text.length).toBeLessThanOrEqual(MATCH_TEXT_MAX)
      expect(item.evidence.length).toBeLessThanOrEqual(MATCH_MAX_EVIDENCE)
    }
  })

  it('el nivel no depende de mayúsculas ni tildes al detectar duplicados', () => {
    const result = sanitizeMatch(
      parseModelMatch(
        output([
          { texto: 'Integración continua', tipo: 'obligatorio', nivel: 'parcial', evidencia: ['project:2'], nota: '' },
          { texto: 'integracion   CONTINUA', tipo: 'obligatorio', nivel: 'fuerte', evidencia: ['project:2'], nota: '' },
        ]),
      ),
      catalog,
      'live',
    )
    expect(result.requirements).toHaveLength(1)
  })

  it('falla con un error propio si la respuesta no es JSON, no sigue el esquema o no trae requisitos', () => {
    expect(() => parseModelMatch('esto no es json')).toThrow(MatchOutputError)
    expect(() => parseModelMatch({ requisitos: 'no es lista' })).toThrow(MatchOutputError)
    expect(() => parseModelMatch(output([]))).toThrow(MatchOutputError)
    expect(() => sanitizeMatch(parseModelMatch(output([{ texto: '   ', evidencia: [] }])), catalog, 'live')).toThrow(MatchOutputError)
    expect(parseModelMatch(JSON.stringify(output([{ texto: 'Algo' }]))).requisitos[0]).toMatchObject({ tipo: 'obligatorio', nivel: 'sin_evidencia', evidencia: [] })
  })

  it('la cobertura cuenta requisitos y obligatorios con evidencia', () => {
    expect(
      coverageOf([
        { kind: 'obligatorio', level: 'fuerte' },
        { kind: 'obligatorio', level: 'sin_evidencia' },
        { kind: 'deseable', level: 'parcial' },
      ]),
    ).toEqual({ total: 3, covered: 2, required: 2, requiredCovered: 1 })
  })
})

const VACANCIES = [
  [
    'Desarrollador full stack senior',
    '',
    'Requisitos:',
    '- Experiencia con React, Next.js y TypeScript',
    '- APIs en .NET y C#',
    '- Bases de datos MongoDB',
    '- Pruebas con Playwright',
    '',
    'Deseable:',
    '- Docker',
  ].join('\n'),
  [
    'Arquitecto de soluciones',
    'Buscamos a alguien que diseñe arquitecturas orientadas a eventos en Azure. Debe tener experiencia con microservicios y sagas. Se valora inglés avanzado.',
  ].join('\n'),
  [
    'AI Engineer',
    '',
    'What you bring:',
    '* Shipping LLM agents and tool calling',
    '* Python and FastAPI',
    '* Evals and prompt engineering',
    '',
    'Nice to have:',
    '* Voice interfaces',
  ].join('\n'),
  ['Data Engineer', '1. Spark and Databricks pipelines', '2. Kubernetes in production', '3. Terraform', '4. SQL performance tuning'].join('\n'),
  [
    'Líder técnico de producto',
    '• Guiar equipos de desarrollo con especificaciones y ADRs',
    '• Automatizar entregas con integración continua',
    '• Mentoría de desarrolladores',
    '• CMS headless como Umbraco (deseable)',
  ].join('\n'),
]

describe('simulador local con 5 vacantes inventadas (FR-2906)', () => {
  it('da la misma cobertura dos veces y no inventa ni un id', () => {
    for (const vacancy of VACANCIES) {
      const lang = vacancyLanguage(vacancy)
      const source = lang === 'en' ? indexEn : index
      const ids = new Set(source.docs.map((doc) => doc.id))
      const first = simulateMatch(vacancy, source)
      const second = simulateMatch(vacancy, source)
      expect(second).toEqual(first)
      expect(first.mode).toBe('local')
      expect(first.costUsd).toBe(0)
      expect(first.requirements.length, vacancy).toBeGreaterThanOrEqual(3)
      expect(first.questions.length).toBeLessThanOrEqual(MATCH_QUESTIONS)
      for (const item of first.requirements) {
        for (const entry of item.evidence) expect(ids.has(entry.id), entry.id).toBe(true)
        if (item.level === 'sin_evidencia') expect(item.evidence).toEqual([])
        else expect(item.evidence.length).toBeGreaterThan(0)
      }
    }
  })

  it('separa obligatorios y deseables por sección y por palabra clave', () => {
    expect(splitRequirements(VACANCIES[0]!).map((item) => [item.text, item.kind])).toEqual([
      ['Experiencia con React, Next.js y TypeScript', 'obligatorio'],
      ['APIs en .NET y C#', 'obligatorio'],
      ['Bases de datos MongoDB', 'obligatorio'],
      ['Pruebas con Playwright', 'obligatorio'],
    ])
    expect(splitRequirements(VACANCIES[2]!).at(-1)).toEqual({ text: 'Voice interfaces', kind: 'deseable' })
    expect(splitRequirements(VACANCIES[4]!).at(-1)?.kind).toBe('deseable')
    expect(splitRequirements(VACANCIES[1]!).some((item) => item.kind === 'deseable')).toBe(true)
  })

  it('detecta idioma y cargo, y quita palabras genéricas antes de buscar', () => {
    expect(vacancyLanguage(VACANCIES[2]!)).toBe('en')
    expect(vacancyLanguage(VACANCIES[0]!)).toBe('es')
    expect(vacancyRole(VACANCIES[3]!)).toBe('Data Engineer')
    expect(meaningfulQuery('Experiencia con Kubernetes en producción')).toBe('Kubernetes')
    expect(meaningfulQuery('5+ years building production apps with TypeScript')).toBe('TypeScript')
  })

  it('lo que no aparece en el sitio queda sin evidencia', () => {
    const result = simulateMatch(VACANCIES[3]!, indexEn)
    expect(result.requirements.find((item) => item.text === 'Kubernetes in production')?.level).toBe('sin_evidencia')
  })
})

describe('Contacto con el mensaje escrito (029)', () => {
  it('arma el mensaje con el cargo limpio y en el idioma de la página', () => {
    expect(prefilledMessage('es', `Arquitecto <b>senior</b>${String.fromCharCode(0)}`)).toBe(
      'Hola, Camilo. Vi el análisis de tu perfil para el rol de Arquitecto b senior /b y me gustaría conversar contigo.',
    )
    expect(prefilledMessage('en', '  AI   Engineer ')).toContain('the AI Engineer role')
    expect(prefilledMessage('es', 'x'.repeat(300))!.match(/x+/)![0]).toHaveLength(ROLE_MAX)
    expect(prefilledMessage('es', '   ')).toBeNull()
    expect(prefilledMessage('es', ['a', 'b'])).toBeNull()
    expect(prefilledMessage('es', undefined)).toBeNull()
    expect(preselectedInterest('otro-servicio')).toBeNull()
  })
})
