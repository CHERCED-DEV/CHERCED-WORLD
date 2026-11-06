import { describe, expect, it, vi } from 'vitest'
import { fold } from '@/lib/search/text'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { ask, loadAssistants } = await import('../l5/support/assistant')
const { getProject, getProjects, getSite } = await import('@/lib/content')
const { technologyName } = await import('@/content/technologies')
const { projectTitle } = await import('@/lib/content/project-title')

const assistants = await loadAssistants()

function expectCase(question: string, id: string, mentions: string[]) {
  const answer = ask(assistants, question)
  expect(answer.kind, question).toBe('answer')
  expect(answer.links[0]?.href, question).toBe(`/${answer.lang}/portfolio/${id}`)
  const text = fold(answer.text)
  for (const mention of mentions) expect(text, question).toContain(fold(mention))
  return answer
}

describe('B4: el asistente busca en contexto, decisiones, resultados y tarjetas ADR (FR-720)', () => {
  it('"¿Cómo maneja Synergos las sagas?" responde con la compensación y cita el caso 12', () => {
    const answer = expectCase('¿Cómo maneja Synergos las sagas?', '12', ['Synergos', 'Orquestadores de saga por vertical', 'compensación'])
    expect(answer.lang).toBe('es')
    expect(answer.text).toContain('La compensación es dato, no función')
    expect(answer.text).not.toContain('Tecnologías:')
  })

  it('también en inglés', () => {
    const answer = expectCase('How does Synergos handle sagas?', '12', ['Synergos', 'Saga orchestrators per vertical', 'compensation'])
    expect(answer.lang).toBe('en')
    expect(answer.text).toContain('Compensation is data, not a function')
  })

  it('cita literalmente el contenido del caso, sin inventar', () => {
    const synergos = getProject('12')!
    const answer = ask(assistants, '¿Cómo maneja Synergos las sagas?')
    expect(synergos.decisions!.es).toContain('Orquestadores de saga por vertical, con la compensación tratada como dato.')
    expect(answer.text).toContain('Orquestadores de saga por vertical, con la compensación tratada como dato.')
    const card = synergos.adrCards!.find((item) => item.decision.es.startsWith('La compensación'))!
    expect(answer.text).toContain(card.why.es)
    expect(answer.text).toContain(card.tradeoff.es)
  })

  it('responde decisiones de una tarjeta ADR: OpenTelemetry', () => {
    expectCase('¿Por qué Synergos no usa OpenTelemetry?', '12', ['Correlación propia, sin OpenTelemetry por ahora'])
    const answer = expectCase('Why no OpenTelemetry in Synergos?', '12', ['Own correlation ID, no OpenTelemetry for now'])
    expect(answer.text).not.toContain('Compensation')
  })

  it('responde cómo se cumplen las reglas de arquitectura', () => {
    expectCase('¿Cómo hace cumplir Synergos las reglas de arquitectura?', '12', ['tests que rompen el build', 'Reglas de arquitectura como tests'])
    expectCase('How does Synergos enforce its architecture rules?', '12', ['tests that break the build', 'Architecture rules as tests'])
  })

  it('del contexto pasa a la decisión que lo resuelve: Espacio de trabajo legal', () => {
    expectCase('¿Cómo evita el espacio de trabajo legal que la IA invente hechos?', '14', ['inventar hechos', 'frontera de confianza'])
    expectCase('How does the legal workspace keep the AI from inventing facts?', '14', ['inventing facts', 'trust boundary'])
  })

  it('responde por las decisiones del puente de eventos', () => {
    expectCase('¿Cómo desacopla el puente de eventos a productores y consumidores?', '15', ['Azure Service Bus', 'desacoplar a productores y consumidores'])
    expectCase('How does the event bridge decouple producers and consumers?', '15', ['Azure Service Bus', 'decoupling producers from consumers'])
  })

  it('encuentra el caso aunque la pregunta no lo nombre', () => {
    expectCase('¿Cómo manejas las sagas?', '12', ['compensación'])
    expectCase('How do you handle sagas?', '12', ['compensation'])
  })

  it('sigue dando el resumen y las tecnologías cuando la pregunta es general', () => {
    for (const question of ['háblame de Synergos', '¿Qué tecnologías usa Synergos?', 'Tell me about Synergos']) {
      const answer = ask(assistants, question)
      expect(answer.links[0]?.href, question).toMatch(/\/portfolio\/12$/)
      expect(answer.text, question).toMatch(/Tecnologías:|Technologies:/)
    }
  })

  it('no responde con un caso lo que no está en ningún caso', () => {
    expect(ask(assistants, '¿Cuál es tu comida favorita?').kind).toBe('unknown')
    expect(ask(assistants, 'Do you know Rust?').kind).toBe('unknown')
  })
})

describe('B5: el asistente respeta las mayúsculas del catálogo (FR-721)', () => {
  it('Synergos sale con .NET 8, ASP.NET Core y Nx', () => {
    for (const question of ['¿Qué tecnologías usa Synergos?', 'Tell me about Synergos']) {
      const { text } = ask(assistants, question)
      expect(text).toContain('.NET 8')
      expect(text).toContain('ASP.NET Core')
      expect(text).toMatch(/\bNx\b/)
      expect(text).not.toMatch(/\.net 8|Asp\.net|\bNX\b/)
    }
  })

  it('la lista de tecnologías no rompe ningún nombre', () => {
    for (const question of ['¿Con qué tecnologías trabajas?', 'What technologies do you work with?']) {
      const { text } = ask(assistants, question)
      expect(text).toContain('.NET · ASP.NET Core')
      expect(text).toContain('GitHub Actions · CI/CD')
      expect(text).toContain('Claude Code')
      expect(text).not.toMatch(/\.net\b|Asp\.net|NX Monorepos|AS Code|FOR Frontend|Service BUS|Github|Ci\/cd|Grpc|Ngrx|Wcag/)
    }
  })

  it('cada proyecto muestra sus tecnologías con el nombre del catálogo', () => {
    for (const project of getProjects()) {
      const answer = assistants.es.answer(`háblame del proyecto ${projectTitle(project, 'es')}`)
      if (answer.intent !== 'project' || !answer.text.includes('Tecnologías:')) continue
      for (const tech of project.technologies.slice(0, 8)) expect(answer.text, project.id).toContain(technologyName(tech))
    }
  })

  it('las preguntas por tecnología usan el nombre del catálogo', () => {
    expect(ask(assistants, '¿Sabes ASP.NET Core?').text).toContain('ASP.NET Core')
    expect(ask(assistants, 'projects with claude code').text).toContain('Projects with Claude Code')
  })
})

describe('B11: el inglés se expresa como nivel (FR-722)', () => {
  it('el asistente dice el nivel, no un porcentaje', () => {
    const es = ask(assistants, '¿Qué idiomas hablas?')
    expect(es.text).toContain('inglés B1, B2 en uso profesional frecuente')
    expect(es.text).toContain('español e inglés')
    expect(es.text).not.toMatch(/%/)
    const en = ask(assistants, 'what languages do you speak')
    expect(en.text).toContain('English B1, B2 in regular professional use')
    expect(en.text).not.toMatch(/%/)
  })

  it('el nivel sale del contenido', () => {
    const english = getSite().about.languages.find((language) => language.id === 'en')!
    expect(english.level).toEqual({ es: 'B1, B2 en uso profesional frecuente', en: 'B1, B2 in regular professional use' })
  })
})

describe('B8: el asistente cuenta por familia del catálogo (FR-723)', () => {
  it('.NET incluye los proyectos con .NET 8 y ASP.NET Core', () => {
    for (const question of ['¿Sabes .NET?', 'proyectos con .net']) {
      const hrefs = ask(assistants, question).links.map((link) => link.href)
      expect(hrefs, question).toEqual(expect.arrayContaining(['/es/portfolio/12', '/es/portfolio/15']))
    }
  })

  it('Claude Code aparece en CHERCED-WORLD, Synergos, Director y líneas y Espacio de trabajo legal', () => {
    const { text } = ask(assistants, '¿Sabes Claude Code?')
    for (const title of ['CHERCED-WORLD 2026', 'Synergos', 'Director y líneas', 'Espacio de trabajo legal']) expect(text).toContain(title)
  })

  it('si una skill no está en la lista de un proyecto, busca en su texto', () => {
    const answer = ask(assistants, 'tienes experiencia con mongo db?')
    expect(answer.text).toContain('MongoDB')
    expect(answer.links.map((link) => link.href)).toContain('/es/portfolio/5')
  })
})
