import type { Localized, Project } from '@/content/types'

export type CotejoCaseText = Pick<Project, 'title' | 'summary' | 'context' | 'role' | 'decisions' | 'result' | 'technologies' | 'links' | 'era' | 'highlights' | 'adrCards'>

export type CotejoCasePending = { id: string; what: Localized }

export const COTEJO_RESEARCH_HREF = 'https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/specs/014-gestor-de-specs/propuesta.md'

export const cotejoCase: CotejoCaseText = {
  title: { es: 'Cotejo: revisor de specs sin tokens', en: 'Cotejo: a spec reviewer with no tokens' },
  summary: {
    es: 'Un revisor de specs local y determinista que encuentra contradicciones, duplicados, términos vagos, referencias rotas y requisitos que el producto probablemente ya tiene, sin gastar tokens de LLM. Abierto y con licencia MIT.',
    en: 'A local, deterministic spec reviewer that finds contradictions, duplicates, vague terms, broken references and requirements the product probably already has, without spending LLM tokens. Open and MIT licensed.',
  },
  context: {
    es: 'Las specs de más de 10.000 líneas, muchas escritas o ampliadas por agentes, llegan a los equipos y nadie alcanza a revisarlas antes de estimar. Se repiten cinco fallas: contradicciones internas, requisitos que ya existen, duplicados, términos vagos y referencias rotas. El mejor LLM comercial detecta menos de la mitad de los defectos que marcan los expertos.',
    en: 'Specs of more than 10,000 lines, many of them written or extended by agents, reach teams and nobody manages to review them before estimating. Five failures keep repeating: internal contradictions, requirements that already exist, duplicates, vague terms and broken references. The best commercial LLM catches less than half of the defects experts flag.',
  },
  role: {
    es: 'Investigué el problema, medí un spike y construí el producto: el núcleo, las capas opcionales, la CLI, la GitHub Action, la skill de Claude Code, el servidor MCP y la demo del AI Lab.',
    en: 'I researched the problem, measured a spike and built the product: the core, the optional layers, the CLI, the GitHub Action, the Claude Code skill, the MCP server and the AI Lab demo.',
  },
  decisions: {
    es: 'Determinista primero: reglas sobre la frase con los números enmascarados y diccionarios como datos, en un núcleo puro que corre igual en Node, en CI y en un Web Worker. Los modelos pequeños, embeddings y NLI, solo proponen u ordenan candidatos. Ningún token de LLM en el camino crítico.',
    en: 'Deterministic first: rules over the sentence with its numbers masked and dictionaries as data, in a pure core that runs the same in Node, in CI and in a Web Worker. The small models, embeddings and NLI, only propose or rank candidates. No LLM tokens on the critical path.',
  },
  result: {
    es: 'En el corpus sintético, precisión y recall de 1,00 en las ocho familias deterministas, con 10.000 líneas en menos de 1 s; el resumen para agentes mide entre el 1,35 % y el 1,40 % de los tokens de la spec. En la demo, la muestra en español da 31 de 31 sin falsos positivos. Lo que no funcionó: BM25 sin un puente del español al código acierta poco, y el NLI casi no ve las contradicciones dichas con otras palabras.',
    en: 'On the synthetic corpus, precision and recall of 1.00 across the eight deterministic families, with 10,000 lines in under 1 s; the summary for agents is 1.35 % to 1.40 % of the spec’s tokens. In the demo, the Spanish sample gives 31 out of 31 with no false positives. What did not work: BM25 without a bridge from Spanish to code rarely hits, and NLI barely sees contradictions phrased in other words.',
  },
  technologies: ['TYPESCRIPT', 'NODE', 'WEB WORKERS', 'BM25 (MINISEARCH)', 'TRANSFORMERS.JS', 'ONNX RUNTIME', 'SARIF 2.1.0', 'GITHUB ACTIONS', 'MCP'],
  links: { live: null, github: 'https://github.com/CHERCED-DEV/cotejo', repos: [{ label: 'CHERCED-DEV/cotejo', href: 'https://github.com/CHERCED-DEV/cotejo' }] },
  era: '2026',
  highlights: [
    { es: 'Cero tokens de LLM en el camino crítico', en: 'Zero LLM tokens on the critical path' },
    { es: 'El mismo reporte, byte por byte, en Node, en CI y en el navegador', en: 'The same report, byte for byte, in Node, in CI and in the browser' },
    { es: 'Cada hallazgo trae su evidencia y cómo refutarlo', en: 'Every finding carries its evidence and how to refute it' },
  ],
  adrCards: [
    {
      decision: { es: 'Determinista primero; los modelos solo proponen u ordenan', en: 'Deterministic first; models only propose or rank' },
      why: {
        es: 'En el spike, las reglas sobre la frase enmascarada dieron 0 falsos positivos donde el coseno dio 354, y resolvieron lo que más duele en 0,23 s.',
        en: 'In the spike, rules over the masked sentence gave 0 false positives where cosine gave 354, and they solved what hurts most in 0.23 s.',
      },
      tradeoff: {
        es: 'Las contradicciones semánticas casi no se detectan; se presentan como una lista para revisar, nunca como veredicto.',
        en: 'Semantic contradictions are barely detected; they are shown as a list to review, never as a verdict.',
      },
    },
    {
      decision: { es: 'Lo que no funcionó: BM25 sin puente', en: 'What did not work: BM25 without a bridge' },
      why: {
        es: 'Una spec en español contra código en inglés casi no comparte palabras. Con un léxico genérico y el glosario de la spec, «posiblemente implementado» sube de 1 a 8 de 18 en la muestra de la demo.',
        en: 'A spec in Spanish against code in English barely shares words. With a generic lexicon and the spec’s glossary, “possibly implemented” rises from 1 to 8 out of 18 on the demo sample.',
      },
      tradeoff: {
        es: 'Es el hallazgo menos preciso de los cinco, así que nunca dice «ya existe»: da los tres archivos más probables con su puntaje.',
        en: 'It is the least precise of the five findings, so it never says “already exists”: it gives the three most likely files with their score.',
      },
    },
  ],
}

export const COTEJO_CASE_PENDING: readonly CotejoCasePending[] = [
  { id: 'P-4705', what: { es: 'Las cifras del corpus difícil que escribe el autor, reportadas aparte.', en: 'The figures for the hard corpus the author writes, reported separately.' } },
  { id: 'FR-4714', what: { es: 'Las cifras de PURE.', en: 'The PURE figures.' } },
  { id: 'SC-4704', what: { es: 'Las capas C2 y C3 medidas con los modelos reales.', en: 'Layers C2 and C3 measured with the real models.' } },
  { id: 'SC-4710', what: { es: 'El tiempo del autor buscando los defectos de la muestra, con y sin Cotejo.', en: 'The author’s time finding the sample’s defects, with and without Cotejo.' } },
]
