export type StyleRule = { id: string; rule: string }

export const STYLE_RULES_SOURCE = 'specs/001-evolutivo-cherced-world/content-inventory.md (D-03 y §10) y los posts de 2026'

export const styleRules: readonly StyleRule[] = [
  { id: 'E-01', rule: 'Primera persona y tono cercano del autor; en español, tuteo.' },
  { id: 'E-02', rule: 'Mismos hechos, cifras y fechas que la fuente. No se agrega ni se infiere nada.' },
  { id: 'E-03', rule: 'Toda cifra lleva de dónde sale o cuándo se contó (por ejemplo, «contados el 5 de noviembre de 2026»).' },
  { id: 'E-04', rule: 'Términos técnicos y nombres propios en inglés (React, Next.js, front-end, fitness function).' },
  { id: 'E-05', rule: 'Español neutro latinoamericano, con Colombia como referencia.' },
  { id: 'E-06', rule: 'Fechas como «13 de noviembre de 2026» en el texto; en listas cortas, «ene 2020» / «Jan 2020».' },
  { id: 'E-07', rule: 'Frases cortas y directas. Una idea por párrafo. Nada de relleno ni de superlativos de marketing («revolucionario», «increíble», «de clase mundial»).' },
  { id: 'E-08', rule: 'Cada decisión dice el porqué y lo que se sacrificó; para eso están los Callout de decisión, trade-off y lo que aprendí.' },
  { id: 'E-09', rule: 'Lo que todavía no existe se dice como visión o pendiente, nunca como hecho.' },
  { id: 'E-10', rule: 'Los bloques de código llevan el lenguaje y solo el fragmento que importa.' },
  { id: 'E-11', rule: 'Las imágenes llevan texto alternativo que dice lo que muestran; las decorativas, alt vacío.' },
  { id: 'E-12', rule: 'Títulos de sección que dicen la idea, no la categoría («Mutar el gate», no «Metodología»).' },
]

export function styleRulesText(): string {
  return styleRules.map((item) => `${item.id}: ${item.rule}`).join('\n')
}
