import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { DIAGRAM_PROMPT_MAX, generateDiagram, simulateDiagram, textDiagramSchema } from '@/lib/ai/diagram/generate'
import { geminiFailure, geminiGate, json } from '@/lib/ai/lab/route'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const gate = await geminiGate(request, { visitor: 'diagram', daily: 'diagramDaily' })
  if (!gate.ok) return gate.response
  const prompt = typeof gate.body.prompt === 'string' ? gate.body.prompt.trim() : ''
  if (prompt.length < 3) return json({ error: 'invalid' }, 400)
  if (prompt.length > DIAGRAM_PROMPT_MAX) return json({ error: 'too_long' }, 413)
  const parsedCurrent = gate.body.current ? textDiagramSchema.safeParse(gate.body.current) : null
  const current = parsedCurrent?.success ? parsedCurrent.data : null
  if (gate.mode === 'local' || !gate.key) return json({ diagram: simulateDiagram(current), simulated: true })
  try {
    return json({ diagram: await generateDiagram({ key: gate.key, lang: gate.lang, prompt, current }), simulated: false })
  } catch (error) {
    return geminiFailure('ailab.diagram', error)
  }
}
