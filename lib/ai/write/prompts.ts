import type { Locale } from '@/lib/i18n/config'

export const WRITE_TOOLS = ['spec', 'adr', 'commit'] as const

export type WriteTool = (typeof WRITE_TOOLS)[number]

export const WRITE_LIMITS: Record<WriteTool, number> = { spec: 2000, adr: 2000, commit: 20000 }

export function isWriteTool(value: unknown): value is WriteTool {
  return typeof value === 'string' && (WRITE_TOOLS as readonly string[]).includes(value)
}

const STYLE_SPEC = `Estilo de las specs de este repo (Spec Kit, en español claro y concreto):
# NNN — Título corto
Pedido del autor: la idea en sus palabras.
Estado: spec. No construida.
## Qué resuelve
Un párrafo.
## Requisitos
- **FR-NNN01** Un requisito verificable por línea.
## Preguntas abiertas
| ID | Pregunta | Por defecto |
|---|---|---|
| P-NNN01 | ... | ... |`

export function writeSystem(tool: WriteTool, lang: Locale): string {
  const language = lang === 'es' ? 'español' : 'inglés'
  if (tool === 'spec')
    return `Eres el asistente de Spec Kit de Camilo Hernández. A partir de una idea de una línea escribes tres archivos en Markdown, en ${language}: spec.md, plan.md y tasks.md, separados por un encabezado de nivel 1 con el nombre del archivo. Nada de relleno: requisitos verificables, plan con decisiones y riesgos, y tareas pequeñas numeradas T001, T002… con su archivo.\n\n${STYLE_SPEC}`
  if (tool === 'adr')
    return `Escribes un ADR (registro de decisión de arquitectura) en Markdown, en ${language}, con estas secciones en este orden: Contexto, Opciones consideradas (2 o 3, con pros y contras), Decisión, Por qué, Qué se sacrifica y Disparador de revisión (la condición concreta que haría cambiar la decisión). Corto, directo y sin inventar cifras.`
  return `Escribes un mensaje de commit para un diff, en ${language}: primera línea con el formato tipo(alcance): resumen en minúscula de máximo 72 caracteres; una línea en blanco; viñetas cortas con qué cambió y por qué. Después, separado por una línea "---", un haiku de 5, 7 y 5 sílabas sobre el cambio. Solo describe lo que está en el diff.`
}

export function simulateWrite(tool: WriteTool, input: string, lang: Locale): string {
  const short = input.replace(/\s+/g, ' ').trim().slice(0, 80)
  const note = lang === 'es' ? '> Simulador local: sin la clave de Gemini, esto es una plantilla.' : '> Local simulator: without the Gemini key, this is a template.'
  if (tool === 'spec') return `${note}\n\n# spec.md\n\n# 041 — ${short}\n\nEstado: spec. No construida.\n\n## Qué resuelve\n\n…\n\n# plan.md\n\n…\n\n# tasks.md\n\n- T001 …\n`
  if (tool === 'adr') return `${note}\n\n## Contexto\n\n${short}\n\n## Opciones consideradas\n\n…\n\n## Decisión\n\n…\n\n## Por qué\n\n…\n\n## Qué se sacrifica\n\n…\n\n## Disparador de revisión\n\n…\n`
  return `${note}\n\nfeat(lab): ${short.toLowerCase()}\n\n- …\n\n---\nun cambio pequeño\ntres archivos y un contrato\nel verde llegó\n`
}
